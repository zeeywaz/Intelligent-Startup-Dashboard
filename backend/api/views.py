from __future__ import annotations
from . import ml_runtime
import json
import random
import uuid
from .utils import send_otp, verify_otp
from datetime import datetime, timedelta
from typing import Any

from django.contrib.auth import (
    authenticate,
    get_user_model,
    login,
    logout,
    update_session_auth_hash,
)
from django.db.models import Q, Count
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt

from rest_framework import viewsets, generics, status
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.decorators import (
    api_view,
    permission_classes,
    authentication_classes,
    parser_classes,
)
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import (
    InvestorProfile,
    Role,
    UserRole,
    Resource,
    BusinessCategory,
    Competitor,
    BusinessIdea,
    ChatMessage,
    Notification,
    Bookmark, 
    InvestorDetails
)
from .serializers import (
    ResourceSerializer,
    CompetitorSerializer,
    BusinessCategorySerializer,
    RegisterSerializer,
    InvestorRegisterSerializer,
    ProfileSerializer,
    PasswordChangeSerializer,
    IdeaCreateSerializer,
    BusinessIdeaReadSerializer,
    InvestorSerializer,
    ChatMessageSerializer,
    NotificationSerializer
)


from rest_framework import viewsets, generics, status, filters


User = get_user_model()


# --------------------- helpers ---------------------
def _int(request, name: str, default: int) -> int:
    try:
        return int(request.GET.get(name, default))
    except Exception:
        return default


# --------------------- CSRF ---------------------
@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    return Response({"csrftoken": get_token(request)}, status=200)


# --------------------- Auth ---------------------
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def register(request):
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response({"error": ser.errors}, status=400)
    user = ser.save()
    # attach default "User" role if present
    try:
        role = Role.objects.get(role_name__iexact="User")
        UserRole.objects.get_or_create(auth_user=user, role=role)
    except Role.DoesNotExist:
        pass
    login(request, user)
    return Response(
        {
            "message": "Registration successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            "next": "/userdashboard",
        },
        status=201,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def investor_register(request):
    ser = InvestorRegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response({"error": ser.errors}, status=400)
    user = ser.save()
    try:
        inv_role = Role.objects.get(role_name__iexact="Investor")
        UserRole.objects.get_or_create(auth_user=user, role=inv_role)
    except Role.DoesNotExist:
        pass
    login(request, user)
    return Response(
        {
            "message": "Registration successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            "next": "/investordashboard",
        },
        status=201,
    )


@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body or "{}")
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    email = (data.get("email") or "").strip()
    password = data.get("password") or ""
    if not email or not password:
        return JsonResponse({"detail": "Email and password are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    user = authenticate(request, username=user.username, password=password)
    if user is None:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    login(request, user)
    return JsonResponse({"detail": "Login successful"})


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

@csrf_exempt
@api_view(["POST"])
def logout_view(request):
    logout(request)
    response = JsonResponse({"success": True})
    response.delete_cookie("sessionid")
    return response

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)
    u = request.user
    roles = list(
        UserRole.objects.select_related("role")
        .filter(auth_user=u)
        .values_list("role__role_name", flat=True)
    )
    next_path = (
        "/investordashboard"
        if "Investor" in roles
        else "/admindashboard"
        if "Admin" in roles
        else "/userdashboard"
    )
    return Response(
        {
            "authenticated": True,
            "user": {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "firstName": u.first_name,
                "lastName": u.last_name,
            },
            "roles": roles,
            "next": next_path,
        },
        status=200,
    )


# --------------------- Profile ---------------------
@api_view(["GET", "PATCH"])
@parser_classes([JSONParser])
def profile_view(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required."}, status=401)
    if request.method == "GET":
        return Response(ProfileSerializer(instance=request.user).data, status=200)
    s = ProfileSerializer(instance=request.user, data=request.data, partial=True)
    if not s.is_valid():
        return Response({"error": s.errors}, status=400)
    s.save()
    return Response(s.data, status=200)


@api_view(["POST"])
@parser_classes([JSONParser])
def change_password(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required."}, status=401)
    s = PasswordChangeSerializer(data=request.data)
    if not s.is_valid():
        return Response({"error": s.errors}, status=400)
    user = request.user
    user.set_password(s.validated_data["newPassword"])
    user.save(update_fields=["password"])
    update_session_auth_hash(request, user)
    return Response({"message": "Password updated."}, status=200)


# --------------------- Categories / Competitors ---------------------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusinessCategory.objects.all().order_by("name")
    serializer_class = BusinessCategorySerializer
    permission_classes = [AllowAny]


class CompetitorViewSet(viewsets.ReadOnlyModelViewSet):
    """
    GET /api/competitors/?search=...&strength=low|medium|high
                          &category_id=...|&category=Name
                          &page=1&page_size=15 (or limit/offset)
                          &fallback=1 (default)
    Returns: {items, total, limit, offset, next_offset, fallback}
    """
    queryset = Competitor.objects.select_related("category").all()
    serializer_class = CompetitorSerializer
    permission_classes = [AllowAny]

    def list(self, request, *args, **kwargs):
        default_ps = _int(request, "page_size", 15)
        limit = _int(request, "limit", default_ps)
        page = max(_int(request, "page", 1), 1)
        offset = _int(request, "offset", (page - 1) * limit)

        search = (request.GET.get("search") or request.GET.get("q") or "").strip()
        strength = (request.GET.get("strength") or "").strip().lower()
        cat_id = request.GET.get("category_id")
        cat_name = (request.GET.get("category") or "").strip()
        do_fallback = request.GET.get("fallback", "1") != "0"

        base = self.get_queryset().order_by("id")

        if search:
            base = base.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if strength in {"low", "medium", "high"}:
            base = base.filter(strength__iexact=strength)

        if cat_id and str(cat_id).isdigit():
            cand = base.filter(category_id=int(cat_id))
        elif cat_name:
            cand = base.filter(category__name__iexact=cat_name)
        else:
            cand = base

        fallback_used = False
        if (cat_id or cat_name) and not cand.exists() and do_fallback:
            qs = base
            fallback_used = True
        else:
            qs = cand

        total = qs.count()
        rows = list(qs[offset : offset + limit])
        data = self.get_serializer(rows, many=True).data
        next_offset = offset + len(rows) if (offset + len(rows)) < total else None

        return Response(
            {
                "items": data,
                "total": total,
                "limit": limit,
                "offset": offset,
                "next_offset": next_offset,
                "fallback": fallback_used,
            },
            status=200,
        )


# --------------------- Resources ---------------------
@api_view(["GET"])
@permission_classes([AllowAny])
def resources_list(request):
    """
    GET /api/resources/?type=WAREHOUSE&page=1&page_size=20
                       &location=...&category_id=...&fallback=1
    Also supports: limit/offset instead of page/page_size
    Returns: {items, total, limit, offset, next_offset, fallback}
    """
    default_ps = _int(request, "page_size", 10)
    limit = _int(request, "limit", default_ps)
    page = max(_int(request, "page", 1), 1)
    offset = _int(request, "offset", (page - 1) * limit)

    location = (request.GET.get("location") or "").strip()
    category_id = request.GET.get("category_id")
    rtype = (request.GET.get("type") or "").strip()
    do_fallback = request.GET.get("fallback", "1") != "0"

    qs = Resource.objects.all().order_by("name")
    if category_id and str(category_id).isdigit():
        qs = qs.filter(category_id=int(category_id))
    if rtype:
        qs = qs.filter(type__iexact=rtype)

    fallback_used = False
    if location:
        loc_qs = qs.filter(location__iexact=location)
        if not loc_qs.exists() and do_fallback:
            fallback_used = True
        else:
            qs = loc_qs

    total = qs.count()
    rows = list(qs[offset : offset + limit])
    data = ResourceSerializer(rows, many=True).data
    next_offset = offset + len(rows) if (offset + len(rows)) < total else None

    return Response(
        {
            "items": data,
            "total": total,
            "limit": limit,
            "offset": offset,
            "next_offset": next_offset,
            "fallback": fallback_used,
        },
        status=200,
    )


# --------------------- Notifications (ViewSet for router) ---------------------
class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    /api/notifications/  -> list current user's notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Notification.objects.filter(user_id=self.request.user.id)
            .order_by("-created_date")
        )


# --------------------- Ideas ---------------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@authentication_classes([SessionAuthentication, BasicAuthentication])
@parser_classes([JSONParser])
def idea_create(request):
    ser = IdeaCreateSerializer(data=request.data, context={"request": request})
    if not ser.is_valid():
        return Response(ser.errors, status=400)
    idea = ser.save()
    return Response(BusinessIdeaReadSerializer(idea).data, status=201)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_ideas(request):
    qs = BusinessIdea.objects.filter(user_id=request.user.id).order_by("-submission_date")
    return Response(BusinessIdeaReadSerializer(qs, many=True).data, status=200)


# --------------------- MyStartup Bundle ---------------------
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def mystartup_data(request, idea_id: int):
    """
    Initial payload for My Startup page.
    Returns first pages for resources & competitors with meta + fallback flags.
    """
    idea = get_object_or_404(BusinessIdea, pk=idea_id, user_id=request.user.id)
    res_limit = _int(request, "res_limit", 8)
    comp_limit = _int(request, "comp_limit", 8)

    # Resources by idea.location (fallback to all)
    res_q = Resource.objects.all().order_by("name")
    res_fallback = False
    if idea.location:
        cand = res_q.filter(location__iexact=idea.location)
        if cand.exists():
            res_q = cand
        else:
            res_fallback = True
    res_total = res_q.count()
    res_items = list(res_q[:res_limit])

    # Competitors by idea.category (fallback to all)
    comp_q = Competitor.objects.select_related("category").all().order_by("id")
    comp_fallback = False
    if idea.category_id:
        cand = comp_q.filter(category_id=idea.category_id)
        if cand.exists():
            comp_q = cand
        else:
            comp_fallback = True
    comp_total = comp_q.count()
    comp_items = list(comp_q[:comp_limit])

    investors = InvestorDetails.objects.all()[:5]

   
    return Response(
        {
            "idea": BusinessIdeaReadSerializer(idea).data,
            "resources": ResourceSerializer(res_items, many=True).data,
            "resources_meta": {
                "total": res_total,
                "limit": res_limit,
                "offset": 0,
                "next_offset": res_limit if res_limit < res_total else None,
                "fallback": res_fallback,
            },
            "competitors": CompetitorSerializer(comp_items, many=True).data,
            "competitors_meta": {
                "total": comp_total,
                "limit": comp_limit,
                "offset": 0,
                "next_offset": comp_limit if comp_limit < comp_total else None,
                "fallback": comp_fallback,
            },
            "investors": InvestorSerializer(investors, many=True).data, 
            
            
        },
        status=200,
    )


# --------------------- Bookmarks (generic) ---------------------
def _ids_for(qs, field):
    return list(qs.exclude(**{f"{field}__isnull": True}).values_list(field, flat=True))


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bookmark_ids(request):
    """
    GET /api/bookmarks/ids/?kind=resource|competitor|investor
    If kind omitted: returns all three lists.
    """
    qs = Bookmark.objects.filter(user=request.user)
    kind = (request.GET.get("kind") or "").strip().lower()

    if kind in ("resource", "resources"):
        return Response({"kind": "resource", "ids": _ids_for(qs, "resource_id")})
    if kind in ("competitor", "competitors"):
        return Response({"kind": "competitor", "ids": _ids_for(qs, "competitor_id")})
    if kind in ("investor", "investors"):
        return Response({"kind": "investor", "ids": _ids_for(qs, "investor_id")})

    return Response(
        {
            "resource": _ids_for(qs, "resource_id"),
            "competitor": _ids_for(qs, "competitor_id"),
            "investor": _ids_for(qs, "investor_id"),
        }
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def bookmark_toggle(request):
    """
    POST /api/bookmarks/toggle/
    body: { "kind": "resource|competitor|investor", "id": <int> }
    """
    kind = (request.data.get("kind") or "").strip().lower()
    raw_id = request.data.get("id")

    try:
        obj_id = int(raw_id)
    except (TypeError, ValueError):
        return Response({"detail": "Valid id is required."}, status=status.HTTP_400_BAD_REQUEST)

    field_map = {"resource": "resource_id", "competitor": "competitor_id", "investor": "investor_id"}
    field = field_map.get(kind)
    if not field:
        return Response({"detail": "Invalid kind."}, status=status.HTTP_400_BAD_REQUEST)

    qs = Bookmark.objects.filter(user=request.user, **{field: obj_id})
    existing = qs.first()
    if existing:
        existing.delete()
        return Response({"ok": True, "bookmarked": False})
    else:
        # create exactly one targeted bookmark; avoid passing duplicate kwargs
        payload = {"user": request.user, "resource_id": None, "competitor_id": None, "investor_id": None}
        payload[field] = obj_id
        Bookmark.objects.create(**payload)
        return Response({"ok": True, "bookmarked": True})


# ---- Investor-specific bookmark endpoints (to satisfy urls.py) ----
class InvestorBookmarkListCreateView(generics.ListCreateAPIView):
    """
    GET: list current user's investor bookmarks
    POST: { "investor_id": <int> } -> create bookmark
    """
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        rows = (
            Bookmark.objects.filter(user=request.user)
            .exclude(investor_id__isnull=True)
            .values("bookmark_id", "investor_id", "created_date")
            .order_by("-created_date")
        )
        return Response(list(rows), status=200)

    @parser_classes([JSONParser])
    def create(self, request, *args, **kwargs):
        iid = request.data.get("investor_id")
        try:
            iid = int(iid)
        except (TypeError, ValueError):
            return Response({"detail": "investor_id must be an integer"}, status=400)
        exists = Bookmark.objects.filter(user=request.user, investor_id=iid).first()
        if exists:
            return Response({"detail": "Already bookmarked", "bookmark_id": exists.bookmark_id}, status=200)
        bm = Bookmark.objects.create(user=request.user, investor_id=iid, resource_id=None, competitor_id=None)
        return Response({"bookmark_id": bm.bookmark_id, "investor_id": iid}, status=201)


class InvestorBookmarkDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, bookmark_id: int, *args, **kwargs):
        bm = get_object_or_404(Bookmark, pk=bookmark_id, user=request.user)
        bm.delete()
        return Response(status=204)


# --------------------- Chat ---------------------
class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# --------------------- ML (dev stubs) ---------------------
# ----------------- ML -----------------
@api_view(["GET"])
@permission_classes([AllowAny])
def ml_info(request):
    status_obj = ml_runtime.status()
    code = 200 if status_obj.get("ready") or status_obj.get("error") is None else 500
    return Response(status_obj, status=code)

@api_view(["POST"])
@permission_classes([AllowAny])
@authentication_classes([])  # no session needed for classify
def ml_classify(request):
    payload = request.data or {}
    with_advice = bool(payload.get("with_advice", False))
    include_neighbors = bool(payload.get("include_neighbors", False))
    top_k = int(payload.get("top_k", 5))

    if "text" in payload and isinstance(payload["text"], str):
        t = payload["text"]
        preds = ml_runtime.predict([t])
        out = {"input": t, "predictions": preds}
        if with_advice:
            out["advice"] = ml_runtime.advise(t, top_k=top_k, include_neighbors=include_neighbors)
        return Response(out, status=200)

    if "texts" in payload and isinstance(payload["texts"], (list, tuple)):
        txts = [str(x) for x in payload["texts"]]
        preds = ml_runtime.predict(txts)
        out = {"inputs": txts, "predictions": preds}
        if with_advice:
            out["advice"] = [
                ml_runtime.advise(x, top_k=top_k, include_neighbors=include_neighbors) for x in txts
            ]
        return Response(out, status=200)

    return Response({"error": "text or texts is required"}, status=400)

# ----------------- Ideas (DEV: CSRF off) -----------------
# backend/api/views.py (ideas endpoints)

from rest_framework.decorators import api_view, permission_classes, authentication_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework import status

from .serializers import IdeaCreateSerializer, BusinessIdeaReadSerializer
from .models import BusinessIdea

@api_view(["POST"])
@permission_classes([IsAuthenticated])                     # require session login
@authentication_classes([SessionAuthentication, BasicAuthentication])
@parser_classes([JSONParser])
def idea_create(request):
    """
    Create a BusinessIdea for the logged-in user.
    Assumes frontend sends JSON and CSRF header (handled by api.js).
    """
    ser = IdeaCreateSerializer(
        data=request.data,
        context={"request": request},
    )
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    idea = ser.save()  # serializer uses request.user
    return Response(BusinessIdeaReadSerializer(idea).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_ideas(request):
    qs = BusinessIdea.objects.filter(user_id=request.user.id).order_by("-submission_date")
    return Response(BusinessIdeaReadSerializer(qs, many=True).data, status=200)


# --------------------- Analytics ---------------------
def _month_bounds(dt):
    """Return timezone-aware first/next month datetimes for dt's month."""
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    start = dt.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    # first of next month
    if start.month == 12:
        nxt = start.replace(year=start.year + 1, month=1)
    else:
        nxt = start.replace(month=start.month + 1)
    return start, nxt


def _label_month(dt):
    return dt.strftime("%b")  # Jan, Feb, ...


@api_view(["GET"])
@permission_classes([AllowAny])
def analytics_popular_categories(request):
    """
    Top-N (default 5) categories for the CURRENT MONTH across all ideas.
    Response: { month: "YYYY-MM", items: [{category_id, name, count}], total_ideas }
    """
    top_n = int(request.GET.get("top", 5) or 5)
    now = timezone.now()
    start, end = _month_bounds(now)

    qs = (
        BusinessIdea.objects.filter(submission_date__gte=start, submission_date__lt=end)
        .values("category_id", "category__name")
        .annotate(count=Count("idea_id"))
        .order_by("-count", "category__name")
    )
    rows = list(qs[:top_n])
    total = sum(r["count"] for r in rows)

    if not rows:
        qs_all = (
            BusinessIdea.objects.all()
            .values("category_id", "category__name")
            .annotate(count=Count("idea_id"))
            .order_by("-count", "category__name")
        )
        rows = list(qs_all[:top_n])
        total = sum(r["count"] for r in rows)

    out = {
        "month": now.strftime("%Y-%m"),
        "items": [
            {"category_id": r["category_id"], "name": r["category__name"], "count": r["count"]} for r in rows
        ],
        "total_ideas": total,
    }
    return Response(out, status=200)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_category_trend(request):
    """
    For the current user's latest idea's category, return a trend for N months
    comparing this year vs last year.
    """
    months = max(3, min(12, int(request.GET.get("months", 5) or 5)))

    # Determine category
    cat_id = request.GET.get("category_id")
    cat_name = (request.GET.get("category") or "").strip()
    category = None
    if cat_id and str(cat_id).isdigit():
        category = BusinessCategory.objects.filter(pk=int(cat_id)).first()
    elif cat_name:
        category = BusinessCategory.objects.filter(name__iexact=cat_name).first()
    else:
        latest_idea = (
            BusinessIdea.objects.filter(user_id=request.user.id).order_by("-submission_date").first()
        )
        if latest_idea:
            category = latest_idea.category

    if not category:
        return Response({"detail": "No category found for trend."}, status=404)

    now = timezone.now()
    anchors = []
    cur = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    for i in range(months - 1, -1, -1):
        y = cur.year
        m = cur.month - i
        while m <= 0:
            y -= 1
            m += 12
        anchors.append(datetime(y, m, 1, tzinfo=cur.tzinfo))

    points = []
    for anchor in anchors:
        this_start = anchor
        this_end = (anchor.replace(year=anchor.year + 1, month=1) if anchor.month == 12 else anchor.replace(month=anchor.month + 1))
        last_start = anchor.replace(year=anchor.year - 1)
        last_end = last_start.replace(year=last_start.year + 1, month=1) if last_start.month == 12 else last_start.replace(month=last_start.month + 1)

        this_count = BusinessIdea.objects.filter(
            category_id=category.pk, submission_date__gte=this_start, submission_date__lt=this_end
        ).count()
        last_count = BusinessIdea.objects.filter(
            category_id=category.pk, submission_date__gte=last_start, submission_date__lt=last_end
        ).count()

        points.append({"month": _label_month(anchor), "thisMonth": this_count, "lastMonth": last_count})

    return Response({"category_id": category.pk, "category": category.name, "points": points}, status=200)


@api_view(["POST"])
@permission_classes([AllowAny])  # dev helper only; tighten in prod
def analytics_seed(request):
    """
    Dev-only helper: seed a handful of categories + ideas if DB looks empty.
    """
    cat_names = ["Retail", "Food", "Services", "Education", "Tech", "Health"]
    created = {"categories": 0, "ideas": 0}

    # Ensure categories
    cats = []
    for nm in cat_names:
        c, was_new = BusinessCategory.objects.get_or_create(name=nm)
        if was_new:
            created["categories"] += 1
        cats.append(c)

    if BusinessIdea.objects.count() > 50:
        return Response({"ok": True, "skipped": True, "created": created}, status=200)

    users = list(User.objects.all()[:5])
    if not users:
        u = User.objects.create_user(username="demo", email="demo@example.com", password="demo12345")
        users = [u]

    now = timezone.now().replace(day=15, hour=12, minute=0, second=0, microsecond=0)
    for i in range(12):
        month_dt = now - timedelta(days=30 * i)
        start, end = _month_bounds(month_dt)
        for cat in cats:
            for _ in range(random.randint(0, 6)):
                u = random.choice(users)
                BusinessIdea.objects.create(
                    user_id=u.id,
                    category_id=cat.id,
                    title=f"{cat.name} idea {random.randint(1000, 9999)}",
                    description=f"Auto-seeded idea in {cat.name}",
                    target_audience="",
                    location=None,
                    business_type=None,
                    submission_date=start + timedelta(days=random.randint(0, 27)),
                )
                created["ideas"] += 1

    return Response({"ok": True, "created": created}, status=201)


# --------------------- OTP (dev stubs to satisfy urls) ---------------------
# ! Email OTP System
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def request_otp(request):
    email = request.data.get('email')
    if not email:
        return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        send_otp(user)
        return Response({"detail": "OTP sent."})
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def verify_otp_api(request):
    email = request.data.get('email')
    code = request.data.get('code')
    
    if not email or not code:
        return Response({"detail": "Email and code are required."}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
        if verify_otp(user, code):
            return Response({"detail": "OTP verified."})
        else:
            return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
def reset_password(request):
    email = request.data.get("email")
    code = request.data.get("code")
    new_password = request.data.get("new_password")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "User not found"}, status=404)

    if not verify_otp(user, code):
        return Response({"detail": "Invalid or expired OTP"}, status=400)

    user.set_password(new_password)
    user.save()
    return Response({"detail": "Password reset successful"})

# !!!!!!!!!!!!!!!!!!
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def register_request_otp(request):
    email = request.data.get('email')
    username = request.data.get('username')
    
    if not email:
        return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

    # Check if email is already registered (active users)
    if User.objects.filter(email=email, is_active=True).exists():
        return Response({"detail": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)

    # For inactive users (previous failed registrations), we'll reuse them
    try:
        user = User.objects.get(email=email, is_active=False)
        # Update username if provided and different
        if username and user.username != username:
            # Check if new username is available
            if User.objects.filter(username=username).exists():
                return Response({"detail": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)
            user.username = username
            user.save()
    except User.DoesNotExist:
        # Create temporary inactive user - ensure username is unique
        base_username = (username or email.split('@')[0])[:30]
        
        # Ensure the username is unique
        temp_username = base_username
        counter = 1
        while User.objects.filter(username=temp_username).exists():
            temp_username = f"{base_username}_{counter}"
            counter += 1
            if counter > 100:  # Safety limit
                temp_username = f"{base_username}_{uuid.uuid4().hex[:8]}"
                break
        
        user = User.objects.create(
            email=email,
            username=temp_username,
            is_active=False,
            first_name=request.data.get('first_name', ''),
            last_name=request.data.get('last_name', '')
        )

    send_otp(user)
    return Response({"detail": "OTP sent for registration."})


# ! ---------------- Register: verify OTP and finalize signup ----------------
@api_view(['POST'])
@authentication_classes([])
@permission_classes([])
def register_verify_otp(request):
    email = request.data.get('email')
    code = request.data.get('code')
    password = request.data.get('password')
    username = request.data.get('username')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')

    if not email or not code or not password:
        return Response(
            {"detail": "Email, code and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email, is_active=False)
    except User.DoesNotExist:
        return Response({"detail": "User not found or already active."}, status=status.HTTP_404_NOT_FOUND)

    if not verify_otp(user, code):
        return Response({"detail": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

    # Check username uniqueness ONLY at verification time
    if username and User.objects.filter(username=username).exclude(pk=user.pk).exists():
        return Response({"detail": "Username already taken."}, status=status.HTTP_400_BAD_REQUEST)

    # Now set the final user details and activate
    if username:
        user.username = username
    if first_name:
        user.first_name = first_name
    if last_name:
        user.last_name = last_name
        
    user.set_password(password)
    user.is_active = True
    user.save()

    return Response({"detail": "Registration complete."})



# backend/api/views.py
from rest_framework import viewsets, filters
from .serializers import InvestorSerializer

class InvestorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = InvestorDetails.objects.all().order_by("investor_name")
    serializer_class = InvestorSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["investor_name", "company_name", "email_address"]
    ordering_fields = ["investor_name", "company_name", "credit_score"]
    ordering = ["investor_name"]




@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_category_trend(request):
    """
    For the selected category, return N months of trend,
    comparing each month vs the immediately previous month.
    """
    months = max(3, min(12, int(request.GET.get("months", 5) or 5)))

    # figure out which category to chart (query param or latest idea)
    cat_id = request.GET.get("category_id")
    cat_name = (request.GET.get("category") or "").strip()
    if cat_id and str(cat_id).isdigit():
        category = BusinessCategory.objects.filter(pk=int(cat_id)).first()
    elif cat_name:
        category = BusinessCategory.objects.filter(name__iexact=cat_name).first()
    else:
        latest = BusinessIdea.objects.filter(user_id=request.user.id).order_by("-submission_date").first()
        category = latest.category if latest else None
    if not category:
        return Response({"detail": "No category found for trend."}, status=404)

    # build month anchors from oldest→newest
    now = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    anchors = []
    y, m = now.year, now.month
    for i in range(months - 1, -1, -1):
        yy, mm = y, m - i
        while mm <= 0:
            yy -= 1; mm += 12
        anchors.append(timezone.make_aware(datetime(yy, mm, 1)))

    points = []
    for anchor in anchors:
        # this month
        this_start = anchor
        this_end = (anchor.replace(year=anchor.year + 1, month=1)
                    if anchor.month == 12 else anchor.replace(month=anchor.month + 1))
        # previous month
        prev_end = this_start
        prev_start = (this_start.replace(year=this_start.year - 1, month=12)
                      if this_start.month == 1 else this_start.replace(month=this_start.month - 1))

        this_count = BusinessIdea.objects.filter(
            category_id=category.pk,
            submission_date__gte=this_start, submission_date__lt=this_end
        ).count()
        last_count = BusinessIdea.objects.filter(
            category_id=category.pk,
            submission_date__gte=prev_start, submission_date__lt=prev_end
        ).count()

        points.append({"month": anchor.strftime("%b"),
                       "thisMonth": this_count, "lastMonth": last_count})

    return Response({"category_id": category.pk, "category": category.name, "points": points}, status=200)


# views.py
from datetime import datetime
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import BusinessIdea

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def analytics_monthly_overview(request):
    """
    Line chart data for last N months (default 5):
      - thisMonth (BLUE): total ideas across all users/categories
      - lastMonth (GREEN): ideas created by the current user
    """
    months = max(3, min(12, int(request.GET.get("months", 5) or 5)))

    # month anchors oldest → newest (1st of each month, tz-aware)
    now = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    anchors = []
    y, m = now.year, now.month
    for i in range(months - 1, -1, -1):
        yy, mm = y, m - i
        while mm <= 0:
            yy -= 1; mm += 12
        anchors.append(timezone.make_aware(datetime(yy, mm, 1)))

    pts = []
    uid = request.user.id
    for start in anchors:
        end = (start.replace(year=start.year + 1, month=1)
               if start.month == 12 else start.replace(month=start.month + 1))

        all_cnt = BusinessIdea.objects.filter(
            submission_date__gte=start, submission_date__lt=end
        ).count()

        my_cnt = BusinessIdea.objects.filter(
            user_id=uid,
            submission_date__gte=start, submission_date__lt=end
        ).count()

        pts.append({
            "month": start.strftime("%b"),
            "thisMonth": all_cnt,   # BLUE
            "lastMonth": my_cnt,    # GREEN (my ideas)
        })

    return Response({"label": "My ideas", "points": pts}, status=200)



# views.py
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def bookmark_ids(request):
    qs = Bookmark.objects.filter(user=request.user)
    kind = (request.GET.get("kind") or "").strip().lower()

    if kind in ("resource", "resources"):
        return Response({"kind": "resource", "ids": _ids_for(qs, "resource_id")})
    if kind in ("competitor", "competitors"):
        return Response({"kind": "competitor", "ids": _ids_for(qs, "competitor_id")})
    if kind in ("investor", "investors"):
        return Response({"kind": "investor", "ids": _ids_for(qs, "investor_id")})
    # NEW
    if kind in ("idea", "ideas"):
        return Response({"kind": "idea", "ids": _ids_for(qs, "idea_id")})

    return Response({
        "resource":   _ids_for(qs, "resource_id"),
        "competitor": _ids_for(qs, "competitor_id"),
        "investor":   _ids_for(qs, "investor_id"),
        # NEW
        "idea":       _ids_for(qs, "idea_id"),
    })


# views.py
@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([JSONParser])
def bookmark_toggle(request):
    kind = (request.data.get("kind") or "").strip().lower()
    raw_id = request.data.get("id")
    try:
        obj_id = int(raw_id)
    except (TypeError, ValueError):
        return Response({"detail": "Valid id is required."}, status=400)

    # add idea mapping
    field_map = {
        "resource":   "resource_id",
        "competitor": "competitor_id",
        "investor":   "investor_id",
        "idea":       "idea_id",    # NEW
    }
    field = field_map.get(kind)
    if not field:
        return Response({"detail": "Invalid kind."}, status=400)

    qs = Bookmark.objects.filter(user=request.user, **{field: obj_id})
    existing = qs.first()
    if existing:
        existing.delete()
        return Response({"ok": True, "bookmarked": False})

    payload = {"user": request.user, "resource_id": None, "competitor_id": None, "investor_id": None, "idea_id": None}
    payload[field] = obj_id
    Bookmark.objects.create(**payload)
    return Response({"ok": True, "bookmarked": True})


# views.py
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import JSONParser
from django.db.models import Q
from .serializers import CompetitorIdeaSerializer

@api_view(["GET"])
@permission_classes([AllowAny])  # or IsAuthenticated if you want to hide from anon
def competitor_ideas(request):
    """
    GET /api/competitor-ideas/?search=...&category_id=...|&category=Name
                               &page=1&page_size=15 (or limit/offset)
    Returns: {items, total, limit, offset, next_offset}
    """
    default_ps = _int(request, "page_size", 15)
    limit  = _int(request, "limit", default_ps)
    page   = max(_int(request, "page", 1), 1)
    offset = _int(request, "offset", (page - 1) * limit)

    search   = (request.GET.get("search") or request.GET.get("q") or "").strip()
    cat_id   = request.GET.get("category_id")
    cat_name = (request.GET.get("category") or "").strip()

    qs = BusinessIdea.objects.select_related("category", "user").all().order_by("-submission_date")

    # optionally exclude current user's ideas from the "competitors" list
    if request.user.is_authenticated:
        qs = qs.exclude(user_id=request.user.id)

    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(description__icontains=search) |
            Q(user__username__icontains=search) |
            Q(user__first_name__icontains=search) |
            Q(user__last_name__icontains=search) |
            Q(category__name__icontains=search)
        )
    if cat_id and str(cat_id).isdigit():
        qs = qs.filter(category_id=int(cat_id))
    elif cat_name:
        qs = qs.filter(category__name__iexact=cat_name)

    total = qs.count()
    rows = list(qs[offset:offset+limit])
    data = CompetitorIdeaSerializer(rows, many=True).data
    next_offset = offset + len(rows) if (offset + len(rows)) < total else None

    return Response(
        {"items": data, "total": total, "limit": limit, "offset": offset, "next_offset": next_offset},
        status=200,
    )
