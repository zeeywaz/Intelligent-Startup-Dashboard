# backend/api/investor_views.py
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes, parser_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from django.db import connection
# --- add with your other imports ---
import os
from django.shortcuts import get_object_or_404
from rest_framework.permissions import IsAuthenticated


from .serializers import InvestorRegisterSerializer, InvestorSerializer, AdminInvestorSerializer, InvestorDocSerializer
from .models import (
    Role, UserRole,
    InvestorDetails, InvestorInterest, BusinessCategory,
    InvestorProfile, InvestorVerificationDoc,
)

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def investor_register(request):
    """
    JSON fallback registration used by handleSimpleSubmit.
    Creates Django auth user, attaches role=Investor (2), seeds investor_details.
    """
    ser = InvestorRegisterSerializer(data=request.data)
    if ser.is_valid():
        ser.save()
        return Response(
            {"message": "Investor registered successfully", "investor": True, "next": "/investordashboard"},
            status=status.HTTP_201_CREATED,
        )
    return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


@csrf_exempt  # allow session-auth without requiring a CSRF header for this one step
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def register_investor_details(request):
    """
    Completes investor registration for the logged-in user:
      - ensures user_role (role_id=2)
      - upserts investor_details
      - inserts investor_interest rows (via raw SQL to avoid RETURNING "id" issues)
      - stores uploaded docs (api_investorprofile, api_investorverificationdoc)
    Called by InvestorSignup.jsx after OTP + login.
    """
    user = request.user
    phone = (request.POST.get("phone") or "").strip()
    company_name = (request.POST.get("company_name") or "").strip()
    verify_type = (request.POST.get("verifyType") or "").strip() or "ownership"
    # categories: repeated "categories" keys from FormData, or a single JSON string
    cat_ids_raw = request.POST.getlist("categories")
    docs = request.FILES.getlist("docs")

    # Normalize category ids to simple list of ints
    cat_ids = []
    for raw in cat_ids_raw:
        # If frontend sent a JSON string like "[1,2]" in a single field
        raw = (raw or "").strip()
        if raw.startswith("[") and raw.endswith("]"):
            try:
                import json
                parsed = json.loads(raw)
                for p in parsed:
                    try:
                        cat_ids.append(int(p))
                    except Exception:
                        pass
                continue
            except Exception:
                pass
        # CSV?
        if "," in raw:
            try:
                for p in raw.split(","):
                    p = p.strip()
                    if p:
                        cat_ids.append(int(p))
                continue
            except Exception:
                pass
        # single scalar
        try:
            if raw != "":
                cat_ids.append(int(raw))
        except Exception:
            pass

    with transaction.atomic():
        # 1) Ensure Investor role (role_id = 2) - normalized and legacy field
        try:
            role = Role.objects.filter(role_name__iexact="Investor").first() or Role.objects.filter(role_id=2).first()
            if role:
                UserRole.objects.get_or_create(auth_user=user, role=role)
                # also fill legacy column on auth_user if it exists
                if hasattr(user, "role_id"):
                    try:
                        user.role_id = getattr(role, "role_id", role.pk)
                        user.save(update_fields=["role_id"])
                    except Exception:
                        # non-fatal: continue
                        pass
        except Exception:
            pass

        # 2) Upsert investor_details
        investor_name = (f"{user.first_name} {user.last_name}").strip() or user.username
        investor, _ = InvestorDetails.objects.update_or_create(
            user=user,  # maps to db_column="auth_user_id"
            defaults={
                "investor_name": investor_name,
                "company_name": company_name or None,
                "email_address": user.email or "",
                "phone": phone or "",
                "credit_score": 0,
                "verification_status": "pending",
            },
        )

        # 3) Insert investor_interest rows using raw SQL to avoid ORM RETURNING id
        #    fetch existing category ids to skip already-present rows
        try:
            existing = set(InvestorInterest.objects.filter(investor=investor).values_list("category_id", flat=True))
        except Exception:
            existing = set()

        created_interests = []
        with connection.cursor() as cursor:
            for raw in cat_ids:
                try:
                    cid = int(raw)
                except Exception:
                    continue
                if cid in existing:
                    continue
                # ensure category exists
                if not BusinessCategory.objects.filter(pk=cid).exists():
                    continue
                # raw insert with ON CONFLICT DO NOTHING (Postgres) to avoid duplicate-key errors
                cursor.execute(
                    """
                    INSERT INTO investor_interest (investor_id, category_id)
                    VALUES (%s, %s)
                    ON CONFLICT (investor_id, category_id) DO NOTHING
                    """,
                    [investor.investor_id, cid],
                )
                created_interests.append(cid)

        # 4) Legacy verification tables (profile + docs)
        profile, _ = InvestorProfile.objects.get_or_create(
            user=user,
            defaults={"company": company_name or "", "phone": phone or "", "role": "Investor", "verify_type": verify_type},
        )
        # update profile fields if re-submitting
        try:
            InvestorProfile.objects.filter(pk=profile.pk).update(company=company_name, phone=phone, verify_type=verify_type)
        except Exception:
            pass

        for f in docs:
            try:
                InvestorVerificationDoc.objects.create(profile=profile, file=f)
            except Exception:
                # non-fatal: continue
                pass

    # Response (outside transaction block)
    try:
        inv_serialized = InvestorSerializer(investor).data
    except Exception:
        inv_serialized = None

    return Response(
        {"message": "Investor details saved.", "investor": inv_serialized, "created_interests": created_interests, "next": "/investordashboard"},
        status=status.HTTP_201_CREATED,
    )
    
def _is_admin_or_staff(user):
    return bool(getattr(user, "is_authenticated", False) and getattr(user, "is_staff", False))


# -----------------------
# Admin endpoints (staff)
# -----------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_pending_investors(request):
    """
    List investors whose verification_status is 'pending'.
    Includes a first_doc_url (if any) and doc_count for quick triage.
    """
    if not _is_admin_or_staff(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    out = []
    qs = InvestorDetails.objects.select_related("user").filter(verification_status__iexact="pending").order_by("-investor_id")
    for inv in qs:
        uid = getattr(inv, "user_id", None)
        first_doc_url = None
        doc_count = 0
        try:
            profile = InvestorProfile.objects.filter(user_id=uid).first() if uid else None
            if profile:
                docs_qs = InvestorVerificationDoc.objects.filter(profile=profile).order_by("uploaded_at")
                doc_count = docs_qs.count()
                if doc_count:
                    d = docs_qs.first()
                    if getattr(d, "file", None):
                        try:
                            first_doc_url = request.build_absolute_uri(d.file.url)
                        except Exception:
                            first_doc_url = None
        except Exception:
            first_doc_url = None
            doc_count = 0

        out.append({
            "investor_id": inv.investor_id,
            "investor_name": inv.investor_name,
            "company_name": inv.company_name,
            "email_address": inv.email_address,
            "phone": inv.phone,
            "credit_score": inv.credit_score,
            "verification_status": inv.verification_status,
            "user_id": uid,
            "doc_count": doc_count,
            "first_doc_url": first_doc_url,
        })

    return Response(out, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_investor_docs(request, investor_id: int):
    """
    Get all verification documents (file name + absolute URL) for a given investor_id.
    """
    if not _is_admin_or_staff(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    inv = get_object_or_404(InvestorDetails, pk=investor_id)
    uid = getattr(inv, "user_id", None)

    files = []
    try:
        profile = InvestorProfile.objects.filter(user_id=uid).first() if uid else None
        if profile:
            docs_qs = InvestorVerificationDoc.objects.filter(profile=profile).order_by("uploaded_at")
            for d in docs_qs:
                try:
                    url = request.build_absolute_uri(d.file.url) if getattr(d, "file", None) else None
                except Exception:
                    url = None
                files.append({
                    "id": getattr(d, "id", None),
                    "file_name": (os.path.basename(d.file.name) if getattr(d, "file", None) else ""),
                    "url": url,
                    "uploaded_at": getattr(d, "uploaded_at", None),
                })
    except Exception:
        files = []

    return Response(files, status=status.HTTP_200_OK)


from rest_framework.parsers import JSONParser

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def admin_approve_investor(request, investor_id: int):
    """
    Approve an investor. Optionally accept 'credit_score' in the body.
    Example body: { "credit_score": 720 }
    """
    if not _is_admin_or_staff(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    inv = get_object_or_404(InvestorDetails, pk=investor_id)

    # Optional credit score
    score = request.data.get("credit_score", None)
    fields_to_update = ["verification_status"]
    if score is not None:
        try:
            score = int(score)
        except (TypeError, ValueError):
            return Response({"detail": "credit_score must be an integer"}, status=status.HTTP_400_BAD_REQUEST)
        # clamp to a sensible range
        score = max(0, min(850, score))
        inv.credit_score = score
        fields_to_update.append("credit_score")

    inv.verification_status = "approved"
    inv.save(update_fields=fields_to_update)

    data = AdminInvestorSerializer(inv, context={"request": request}).data
    return Response({"message": "Investor approved", "investor": data}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def admin_reject_investor(request, investor_id: int):
    """
    Remove a pending/failed investor:
      - deletes verification docs + profile
      - deletes investor_interest rows
      - deletes investor_details row
      - optionally deletes the auth user (delete_user=true, default)
    """
    if not _is_admin_or_staff(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    delete_user = bool(request.data.get("delete_user", True))
    inv = get_object_or_404(InvestorDetails, pk=investor_id)
    uid = getattr(inv, "user_id", None)

    with transaction.atomic():
        # 1) delete docs & profile
        try:
            profile = InvestorProfile.objects.filter(user_id=uid).first() if uid else None
            if profile:
                InvestorVerificationDoc.objects.filter(profile=profile).delete()
                profile.delete()
        except Exception:
            pass

        # 2) delete interests
        try:
            InvestorInterest.objects.filter(investor=inv).delete()
        except Exception:
            pass

        # 3) delete investor_details row
        inv.delete()

        # 4) optionally delete auth user
        if delete_user and uid:
            try:
                User.objects.filter(pk=uid).delete()
            except Exception:
                pass

    return Response({"message": "Investor rejected and removed", "investor_id": investor_id}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_investor_list(request):
    """
    Full admin list of investors (any status) with attached docs & user info.
    """
    if not _is_admin_or_staff(request.user):
        return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

    qs = InvestorDetails.objects.select_related("user").order_by("-investor_id")
    ser = AdminInvestorSerializer(qs, many=True, context={"request": request})
    return Response(ser.data, status=status.HTTP_200_OK)


from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import JSONParser
from rest_framework import status

from .models import InvestorDetails, InvestorInterest, BusinessIdea
from .serializers import BusinessIdeaReadSerializer, SaveInterestsSerializer
@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def investor_interests(request, investor_id: int):
    """
    GET  -> { category_ids: [...] }
    POST -> { category_ids: [1,2,3] }  (overwrite)
    Only the investor themself or staff may modify.
    """
    investor = get_object_or_404(InvestorDetails, pk=investor_id)

    inv_user = getattr(investor, "user", None)
    if request.method == "POST":
        if not (request.user.is_staff or (inv_user and inv_user.pk == request.user.pk)):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        ser = SaveInterestsSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            final_ids = ser.save(investor)
        except Exception:
            return Response({"detail": "Failed to save interests"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"success": True, "category_ids": final_ids}, status=status.HTTP_200_OK)

    ids = list(InvestorInterest.objects.filter(investor=investor).values_list("category_id", flat=True))
    return Response({"category_ids": ids}, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def investor_business_ideas(request, investor_id: int):
    """
    Business ideas whose category_id is in the investor's interests.
    Query: limit (default 100), offset (default 0)
    """
    investor = get_object_or_404(InvestorDetails, pk=investor_id)
    category_ids = list(InvestorInterest.objects.filter(investor=investor).values_list("category_id", flat=True))
    if not category_ids:
        return Response({"businessIdeas": []}, status=status.HTTP_200_OK)

    limit = max(1, min(500, int(request.GET.get("limit", 100))))
    offset = max(0, int(request.GET.get("offset", 0)))

    qs = (BusinessIdea.objects
          .select_related("category", "user")
          .filter(category_id__in=category_ids)
          .order_by("-submission_date"))
    total = qs.count()
    items = list(qs[offset: offset + limit])
    ser = BusinessIdeaReadSerializer(items, many=True, context={"request": request})
    return Response({"businessIdeas": ser.data, "meta": {"total": total, "limit": limit, "offset": offset}}, status=status.HTTP_200_OK)


# investor_views.py  (add somewhere near other investor endpoints)
from rest_framework.parsers import JSONParser

@api_view(["GET", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def my_investor_profile(request):
    """
    GET  -> return the current user's InvestorDetails (if exists)
    PATCH -> allow updates to a white-list of fields only (no credit_score or verification_status)
    """
    # find investor row for current auth user
    inv = InvestorDetails.objects.filter(user_id=request.user.id).first()
    if not inv:
        return Response({"detail": "Investor profile not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        return Response(InvestorSerializer(inv).data, status=status.HTTP_200_OK)

    # PATCH: whitelist of editable fields
    allowed = {"investor_name", "company_name", "phone", "email_address"}
    data = request.data or {}
    payload = {k: v for k, v in data.items() if k in allowed}

    if not payload:
        return Response({"detail": "No editable fields provided."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Use update to avoid unexpected side effects; then reload
        InvestorDetails.objects.filter(pk=inv.pk).update(**payload)
        inv = InvestorDetails.objects.filter(pk=inv.pk).first()
        return Response(InvestorSerializer(inv).data, status=status.HTTP_200_OK)
    except Exception as exc:
        import logging
        logger = logging.getLogger(__name__)
        logger.exception("my_investor_profile: failed to update investor for user=%s: %s", request.user.id, exc)
        return Response({"detail": "Failed to update investor details."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
