# backend/api/views.py
from django.contrib.auth import (
    get_user_model, authenticate, login, logout, update_session_auth_hash
)
from django.db import transaction, IntegrityError, DataError
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import status

import os
import mimetypes

from .serializers import RegisterSerializer
from .models import InvestorProfile, InvestorVerificationDoc, Role, UserRole

User = get_user_model()

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

ROLE_NAMES = {1: "Admin", 2: "Investor", 3: "Entrepreneur"}


def _link_role(user, role_id: int) -> None:
    """Ensure a (user, role_id) row exists in user_role; seed role name if absent."""
    role, _ = Role.objects.get_or_create(
        role_id=role_id,
        defaults={"role_name": ROLE_NAMES.get(role_id, f"Role{role_id}")},
    )
    UserRole.objects.get_or_create(auth_user=user, role=role)


def _roles_for(user):
    """Return list of role names."""
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


# --------------------------------------------------------------------------
# CSRF bootstrap
# --------------------------------------------------------------------------

@api_view(["GET"])
@ensure_csrf_cookie
def csrf(request):
    """Set/return csrftoken cookie so the frontend can POST with credentials."""
    return Response({"csrfToken": get_token(request)}, status=200)


# --------------------------------------------------------------------------
# Auth
# --------------------------------------------------------------------------

@api_view(["POST"])
@parser_classes([JSONParser])
def register(request):
    """
    Normal user signup.
    JSON: { firstName, lastName, username, email, password }
    """
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        user = ser.save()
        _link_role(user, 3)  # Entrepreneur
        login(request, user)

    roles = _roles_for(user)
    return Response(
        {
            "message": "Registered successfully",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            "roles": roles,
            "next": _next_for_roles(roles),
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@parser_classes([MultiPartParser, FormParser])
def investor_register(request):
    """
    Investor signup (multipart):
      firstName, lastName, username, email, password, verifyType, docs[]
    """
    payload = {
        k: (request.data.get(k, "") or "")
        for k in ["firstName", "lastName", "username", "email", "password"]
    }
    ser = RegisterSerializer(data=payload)
    if not ser.is_valid():
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

    verify_type = (request.data.get("verifyType") or "").strip().lower()
    files = request.FILES.getlist("docs")
    if not files:
        return Response({"error": "At least one document is required."}, status=400)

    # Validate file types by ext or mime
    allowed_ext = {".pdf", ".jpg", ".jpeg", ".png"}
    allowed_mime = {"application/pdf", "image/jpeg", "image/png"}
    bad = []
    for f in files:
        ext = (os.path.splitext(f.name)[1] or "").lower()
        mime, _ = mimetypes.guess_type(f.name)
        if ext not in allowed_ext and (mime not in allowed_mime):
            bad.append(f.name)
    if bad:
        return Response({"error": f"Unsupported file type(s): {', '.join(bad)}"}, status=400)

    try:
        with transaction.atomic():
            user = ser.save()
            _link_role(user, 2)  # Investor
            login(request, user)

            profile = InvestorProfile.objects.create(
                user=user,
                company="",
                phone="",
                role="",
                verify_type=verify_type if verify_type in ("ownership", "financial") else "",
            )
            for f in files:
                InvestorVerificationDoc.objects.create(profile=profile, file=f)

    except IntegrityError:
        return Response({"error": "Account already exists for this email/username."}, status=409)
    except DataError:
        return Response({"error": "One of the filenames was too long. Try a shorter name."}, status=400)
    except Exception as e:
        return Response({"error": f"Server error: {str(e)}"}, status=500)

    return Response(
        {
            "message": "Investor registered",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            "profile": {"id": profile.id, "verify_type": profile.verify_type},
            "next": "/investordashboard",
        },
        status=201,
    )


@api_view(["POST"])
@parser_classes([JSONParser])
def login_view(request):
    """Login via email + password; sets session."""
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
        {
            "message": "Login successful",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "firstName": user.first_name,
                "lastName": user.last_name,
            },
            "roles": roles,
            "next": _next_for_roles(roles),
        },
        status=200,
    )


@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"}, status=200)


@api_view(["GET"])
def me(request):
    """Return current session user + roles."""
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)

    u = request.user
    roles = _roles_for(u)
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
            "next": _next_for_roles(roles),
        },
        status=200,
    )


# --------------------------------------------------------------------------
# Profile edit + password change
# --------------------------------------------------------------------------

@api_view(["PATCH", "PUT"])
@parser_classes([JSONParser])
def profile_update(request):
    """
    Update basic profile fields.
    Accepts JSON any of: firstName, lastName, email, username
    """
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required."}, status=401)

    u = request.user
    data = request.data or {}

    first = data.get("firstName")
    last = data.get("lastName")
    email = data.get("email")
    username = data.get("username")

    if first is not None:
        u.first_name = str(first).strip()
    if last is not None:
        u.last_name = str(last).strip()
    if email is not None:
        u.email = str(email).strip().lower()
    if username is not None:
        u.username = str(username).strip()

    try:
        with transaction.atomic():
            u.save()
    except IntegrityError:
        return Response({"error": "Username or email already in use."}, status=409)

    return Response(
        {
            "message": "Profile updated",
            "user": {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "firstName": u.first_name,
                "lastName": u.last_name,
            },
        },
        status=200,
    )


@api_view(["POST"])
@parser_classes([JSONParser])
def change_password(request):
    """
    Change password.
    JSON: { newPassword1, newPassword2, currentPassword? }
    """
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required."}, status=401)

    p1 = (request.data.get("newPassword1") or request.data.get("new_password1") or "").strip()
    p2 = (request.data.get("newPassword2") or request.data.get("new_password2") or "").strip()
    cur = (request.data.get("currentPassword") or request.data.get("current_password") or "").strip()

    if p1 != p2:
        return Response({"error": "Passwords do not match."}, status=400)
    if len(p1) < 6:
        return Response({"error": "Password must be at least 6 characters."}, status=400)
    if cur and (not request.user.check_password(cur)):
        return Response({"error": "Current password is incorrect."}, status=400)

    u = request.user
    u.set_password(p1)
    u.save()
    update_session_auth_hash(request, u)  # keep the user logged in

    return Response({"message": "Password changed successfully."}, status=200)


# --------------------------------------------------------------------------
# Root
# --------------------------------------------------------------------------

def root_ok(_request):
    return JsonResponse({"status": "ok", "app": "IdeaForge API"})
