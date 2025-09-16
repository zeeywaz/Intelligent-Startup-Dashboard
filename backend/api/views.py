from django.contrib.auth import get_user_model, authenticate, login, logout, update_session_auth_hash
from django.db import transaction, IntegrityError, DataError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q

import os
import mimetypes

from .serializers import ResourceSerializer
from .models import InvestorProfile, InvestorVerificationDoc, Role, UserRole, Resource

User = get_user_model()

# ----------------- helpers -----------------

ROLE_NAMES = {1: "Admin", 2: "Investor", 3: "Entrepreneur"}

def _link_role(user, role_id: int) -> None:
    role, _ = Role.objects.get_or_create(
        role_id=role_id,
        defaults={"role_name": ROLE_NAMES.get(role_id, f"Role{role_id}")},
    )
    UserRole.objects.get_or_create(auth_user=user, role=role)

def _roles_for(user):
    return list(
        UserRole.objects.select_related("role")
        .filter(auth_user=user)
        .values_list("role__role_name", flat=True)
    )

def _next_for_roles(roles):
    r = {str(x).lower() for x in roles}
    if "investor" in r:
        return "/investordashboard"
    if "admin" in r:
        return "/admindashboard"
    return "/userdashboard"

# ----------------- CSRF -----------------

@api_view(["GET"])
@ensure_csrf_cookie
def csrf(request):
    return Response({"csrfToken": get_token(request)}, status=200)

# ----------------- Auth -----------------

@api_view(["POST"])
@parser_classes([JSONParser])
def register(request):
    # ... your existing RegisterSerializer path if you use it
    return Response({"error": "register endpoint not wired in this snippet"}, status=501)

@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def investor_register(request):
    return Response({"error": "investor_register endpoint not wired in this snippet"}, status=501)

@api_view(["POST"])
@parser_classes([JSONParser])
def login_view(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    if not email or not password:
        return Response({"error": "Email and password required."}, status=400)

    try:
        user_obj = User.objects.get(email__iexact=email)
    except User.DoesNotExist:
        return Response({"error": "Invalid credentials."}, status=401)

    user = authenticate(request, username=user_obj.username, password=password)
    if user is None:
        return Response({"error": "Invalid credentials."}, status=401)

    login(request, user)
    roles = _roles_for(user)
    return Response(
        {"message": "Login successful",
         "user": {"id": user.id, "username": user.username, "email": user.email,
                  "firstName": user.first_name, "lastName": user.last_name},
         "roles": roles, "next": _next_for_roles(roles)}, status=200)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"}, status=200)

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)
    u = request.user
    roles = _roles_for(u)
    return Response(
        {"authenticated": True,
         "user": {"id": u.id, "username": u.username, "email": u.email,
                  "firstName": u.first_name, "lastName": u.last_name},
         "roles": roles, "next": _next_for_roles(roles)}, status=200)

# ----------------- Resources (paginated) -----------------

class ResourcePage(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

@api_view(["GET"])
def resources_list(request):
    """
    GET /api/resources?type=WAREHOUSE&q=term&page=1&limit=20
    Returns DRF pagination shape: {count, next, previous, results:[...]}
    """
    qs = Resource.objects.all()

    t = (request.GET.get("type") or "").upper().strip()
    if t:
        qs = qs.filter(type=t)

    q = (request.GET.get("q") or "").strip()
    if q:
        qs = qs.filter(
            Q(name__icontains=q) |
            Q(description__icontains=q) |
            Q(location__icontains=q)
        )

    paginator = ResourcePage()
    page = paginator.paginate_queryset(qs, request)
    ser = ResourceSerializer(page, many=True)
    return paginator.get_paginated_response(ser.data)

# ----------------- Root -----------------

def root_ok(_request):
    return JsonResponse({"status": "ok", "app": "IdeaForge API"})
