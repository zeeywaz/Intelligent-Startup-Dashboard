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

from .serializers import InvestorRegisterSerializer, InvestorSerializer
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