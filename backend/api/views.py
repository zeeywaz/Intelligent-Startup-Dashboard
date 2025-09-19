from django.contrib.auth import get_user_model, authenticate, login, logout, update_session_auth_hash
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.db.models import Q

from rest_framework.decorators import api_view, parser_classes, permission_classes, authentication_classes
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, BasicAuthentication

from .serializers import (
    ResourceSerializer,
    ProfileSerializer,
    PasswordChangeSerializer,
    BusinessCategorySerializer,
    CompetitorSerializer,
    RegisterSerializer,
    InvestorRegisterSerializer,
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
from rest_framework.decorators import permission_classes  # already used later

@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def register(request):
    """
    Sign up a regular user, attach default 'User' role if present, and log them in.
    Expected JSON: { firstName, lastName, username, email, password }
    """
    ser = RegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response({"error": ser.errors}, status=400)

    user = ser.save()

    # optional: attach default role "User" if exists in your DB
    try:
        role = Role.objects.get(role_name__iexact="User")
        UserRole.objects.get_or_create(auth_user=user, role=role)
    except Role.DoesNotExist:
        pass

    # auto-login after registration (useful for your UX)
    login(request, user)

    return Response({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
        "next": "/chatbot",
    }, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([JSONParser, MultiPartParser, FormParser])
def investor_register(request):
    """
    Investor registration. Accepts same fields as RegisterSerializer, plus:
      company, phone, role (string)
    """
    ser = InvestorRegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response({"error": ser.errors}, status=400)

    user = ser.save()

    # optional: attach "Investor" role if present
    try:
        inv_role = Role.objects.get(role_name__iexact="Investor")
        UserRole.objects.get_or_create(auth_user=user, role=inv_role)
    except Role.DoesNotExist:
        pass

    login(request, user)

    return Response({
        "message": "Registration successful",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
        },
        "next": "/investordashboard",
    }, status=201)

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





from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from rest_framework.permissions import AllowAny
from rest_framework.decorators import authentication_classes, permission_classes

# keep session auth, but disable CSRF check for THIS endpoint only
class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # disable CSRF validation here

@csrf_exempt
@api_view(["POST"])
@authentication_classes([CsrfExemptSessionAuthentication, BasicAuthentication])
@permission_classes([AllowAny])
@parser_classes([JSONParser])
def classify_idea(request):
    text = (request.data.get("text") or "").strip()
    top_k = int(request.data.get("top_k") or 3)
    if not text:
        return Response({"error": "text is required"}, status=400)
    try:
        from .ml_predictor import predict
        out = predict(text, top_k=top_k, ensure_min_suggs=3)
        return Response({"input": text, **out}, status=200)
    except Exception as e:
        return Response({"error": f"{type(e).__name__}: {e}"}, status=500)


from rest_framework.permissions import IsAuthenticated

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    """
    Permanently delete the currently authenticated user.
    Uses DB FK ON DELETE CASCADE to clean related rows.
    Requires CSRF (do NOT exempt in production).
    """
    user = request.user
    # Optionally: you can do extra cleanup here before delete()
    user.delete()
    # After deletion, the session is invalid, but return 204 to the client.
    return Response(status=204)
