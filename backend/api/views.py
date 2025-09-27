# backend/api/views.py
from django.contrib.auth import get_user_model, authenticate, login, logout, update_session_auth_hash
from django.http import JsonResponse
from django.db.models import Q
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.middleware.csrf import get_token

from rest_framework import viewsets, filters, status
from rest_framework.decorators import (
    api_view, permission_classes, authentication_classes, parser_classes
)
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Resource, Competitor, BusinessIdea, InvestorProfile
from .serializers import (
    ResourceSerializer,
    CompetitorSerializer,
    BusinessIdeaReadSerializer,
    InvestorSerializer,
)
from django.shortcuts import get_object_or_404

from rest_framework import permissions


from .serializers import (
    ResourceSerializer,
    ProfileSerializer,
    PasswordChangeSerializer,
    BusinessCategorySerializer,
    CompetitorSerializer,
    RegisterSerializer,
    InvestorRegisterSerializer,
    IdeaCreateSerializer,
    BusinessIdeaReadSerializer,
)
from .models import (
    InvestorProfile,
    Role,
    UserRole,
    Resource,
    BusinessCategory,
    Competitor,
    BusinessIdea,
)

from . import ml_runtime

User = get_user_model()

# ----------------- CSRF -----------------
from django.middleware.csrf import get_token
from django.views.decorators.csrf import ensure_csrf_cookie

@api_view(["GET"])
@permission_classes([AllowAny])
@ensure_csrf_cookie
def csrf(request):
    return Response({"csrftoken": get_token(request)}, status=200)


# ----------------- Auth -----------------
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
    return Response({
        "message": "Registration successful",
        "user": {"id": user.id, "username": user.username, "email": user.email,
                 "firstName": user.first_name, "lastName": user.last_name},
        "next": "/chatbot",
    }, status=201)

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
    return Response({
        "message": "Registration successful",
        "user": {"id": user.id, "username": user.username, "email": user.email,
                 "firstName": user.first_name, "lastName": user.last_name},
        "next": "/investordashboard",
    }, status=201)

# views.py
from django.contrib.auth import authenticate, login, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

User = get_user_model()

@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except Exception:
        return JsonResponse({"detail": "Invalid JSON"}, status=400)

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"detail": "Email and password are required"}, status=400)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)

    user = authenticate(request, username=user.username, password=password)
    if user is not None:
        login(request, user)
        return JsonResponse({"detail": "Login successful"})
    else:
        return JsonResponse({"detail": "Invalid credentials"}, status=401)


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
    return Response({
        "authenticated": True,
        "user": {"id": u.id, "username": u.username, "email": u.email,
                 "firstName": u.first_name, "lastName": u.last_name},
        "roles": roles, "next": next_path
    }, status=200)

# ----------------- Profile -----------------
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
@permission_classes([permissions.IsAuthenticated])
def resources_list(request):
    location = request.query_params.get("location")
    qs = Resource.objects.all()
    if location:
        qs = qs.filter(location__iexact=location)
    serializer = ResourceSerializer(qs, many=True)
    return Response(serializer.data)

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

# ----------------- Account deletion -----------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_account(request):
    user = request.user
    user.delete()
    return Response(status=204)

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



from .serializers import InvestorSerializer

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def mystartup_data(request, idea_id):
    idea = get_object_or_404(BusinessIdea, pk=idea_id, user_id=request.user.id)

    # location-based resources
    resources = Resource.objects.filter(location__iexact=idea.location)

    # competitors in same category
    competitors = Competitor.objects.filter(category_id=idea.category_id)

    # all investors (you can later filter by category/location if needed)
    investors = InvestorProfile.objects.all()

    return Response({
        "idea": BusinessIdeaReadSerializer(idea).data,
        "resources": ResourceSerializer(resources, many=True).data,
        "competitors": CompetitorSerializer(competitors, many=True).data,
        "investors": InvestorSerializer(investors, many=True).data,
    })



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import ChatMessage
from .serializers import ChatMessageSerializer

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def chat_history(request):
    chats = ChatMessage.objects.filter(user=request.user).order_by("created_at")
    serializer = ChatMessageSerializer(chats, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def chat_message(request):
    message = request.data.get("message")
    response = request.data.get("response")  # coming from frontend/AI

    if not message:
        return Response({"error": "Message required"}, status=status.HTTP_400_BAD_REQUEST)

    chat_msg = ChatMessage.objects.create(
        user=request.user, message=message, response=response or ""
    )
    serializer = ChatMessageSerializer(chat_msg)
    return Response(serializer.data, status=status.HTTP_201_CREATED)



# backend/api/views.py
from rest_framework import generics, permissions
from .models import ChatMessage
from .serializers import ChatMessageSerializer

class ChatMessageListCreateView(generics.ListCreateAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatMessage.objects.filter(user=self.request.user).order_by("created_at")
