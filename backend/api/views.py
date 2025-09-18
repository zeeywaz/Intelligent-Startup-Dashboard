from django.contrib.auth import get_user_model, authenticate, login, logout, update_session_auth_hash
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db.models import Q

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny

from .serializers import (
    ResourceSerializer,
    ProfileSerializer,
    PasswordChangeSerializer,
    BusinessCategorySerializer,
    CompetitorSerializer,
)
from .models import (
    InvestorProfile,
    InvestorVerificationDoc,
    Role,
    UserRole,
    Resource,
    BusinessCategory,
    Competitor,
)

User = get_user_model()

# ----------------- CSRF -----------------
@api_view(["GET"])
@ensure_csrf_cookie
def csrf(request):
    return Response({"csrfToken": get_token(request)}, status=200)

# ----------------- Auth -----------------
@api_view(["POST"])
@parser_classes([JSONParser])
def register(request):
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
    roles = list(
        UserRole.objects.select_related("role")
        .filter(auth_user=user)
        .values_list("role__role_name", flat=True)
    )
    next_path = "/investordashboard" if "Investor" in roles else ("/admindashboard" if "Admin" in roles else "/userdashboard")
    return Response(
        {"message": "Login successful",
         "user": {"id": user.id, "username": user.username, "email": user.email,
                  "firstName": user.first_name, "lastName": user.last_name},
         "roles": roles, "next": next_path}, status=200)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out"}, status=200)

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
    next_path = "/investordashboard" if "Investor" in roles else ("/admindashboard" if "Admin" in roles else "/userdashboard")
    return Response(
        {"authenticated": True,
         "user": {"id": u.id, "username": u.username, "email": u.email,
                  "firstName": u.first_name, "lastName": u.last_name},
         "roles": roles, "next": next_path}, status=200)

# ----------------- Profile -----------------
@api_view(["GET", "PATCH"])
@parser_classes([JSONParser])
def profile_view(request):
    if not request.user.is_authenticated:
        return Response({"error": "Authentication required."}, status=401)

    if request.method == "GET":
        s = ProfileSerializer(instance=request.user)
        return Response(s.data, status=200)

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

    new_pw = s.validated_data["newPassword"]
    user = request.user
    user.set_password(new_pw)
    user.save(update_fields=["password"])
    update_session_auth_hash(request, user)
    return Response({"message": "Password updated."}, status=200)

# ----------------- Resources -----------------
class ResourcePage(PageNumberPagination):
    page_size = 20
    page_size_query_param = "limit"
    max_page_size = 100

@api_view(["GET"])
def resources_list(request):
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

# ----------------- Categories / Competitors -----------------
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusinessCategory.objects.all()
    serializer_class = BusinessCategorySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

class CompetitorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Competitor.objects.select_related("category").all()
    serializer_class = CompetitorSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description", "strength", "category__name"]
    ordering_fields = ["name"]
    ordering = ["name"]

    def get_queryset(self):
        qs = super().get_queryset()
        cat = self.request.query_params.get("category")
        if cat:
            if str(cat).isdigit():
                qs = qs.filter(category_id=int(cat))
            else:
                qs = qs.filter(category__name__icontains=cat)
        return qs

# ----------------- Root -----------------
def root_ok(_request):
    return JsonResponse({"status": "ok", "app": "IdeaForge API"})
