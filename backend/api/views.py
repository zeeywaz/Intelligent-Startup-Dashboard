from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import get_user_model, authenticate, login, logout
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse

from .serializers import RegisterSerializer, InvestorRegisterSerializer
from .models import InvestorProfile, InvestorVerificationDoc

User = get_user_model()

def root_ok(_):
    return JsonResponse({"status": "ok", "app": "IdeaForge API", "docs": "/api/"})

@api_view(["POST"])
@csrf_exempt
def register(request):
    ser = RegisterSerializer(data=request.data)
    if ser.is_valid():
        user = ser.save()
        return Response({"message": "Registered successfully.",
                         "user": {"id": user.id, "username": user.username, "email": user.email}}, status=201)
    return Response(ser.errors, status=400)

@api_view(["POST"])
@csrf_exempt
@parser_classes([MultiPartParser, FormParser, JSONParser])
def investor_register(request):
    """
    Accepts multipart/form-data with:
      firstName, lastName, username, email, password, birthday (opt), verifyType
      docs: file[] (max 3)
    """
    ser = InvestorRegisterSerializer(data=request.data)
    if not ser.is_valid():
        return Response(ser.errors, status=400)

    user = ser.save()
    # set verify type on profile
    verify_type = (request.data.get("verifyType") or "").strip().lower()
    try:
        profile = user.investor_profile
    except InvestorProfile.DoesNotExist:
        profile = InvestorProfile.objects.create(user=user)
    if verify_type in {"ownership", "financial"}:
        profile.verify_type = verify_type
        profile.save()

    # save uploaded docs (if any)
    for f in request.FILES.getlist("docs"):
        InvestorVerificationDoc.objects.create(profile=profile, file=f)

    return Response({
        "message": "Investor registered successfully.",
        "user": {"id": user.id, "username": user.username, "email": user.email},
        "docs": [d.file.url for d in profile.docs.all()],
    }, status=201)

@api_view(["POST"])
@csrf_exempt
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
    return Response({"message": "Login successful.",
                     "user": {"id": user.id, "username": user.username, "email": user.email}}, status=200)

@api_view(["POST"])
def logout_view(request):
    logout(request)
    return Response({"message": "Logged out."}, status=200)

@api_view(["GET"])
def me(request):
    if not request.user.is_authenticated:
        return Response({"authenticated": False}, status=200)
    u = request.user
    return Response({"authenticated": True, "user": {
        "id": u.id, "username": u.username, "email": u.email,
        "firstName": u.first_name, "lastName": u.last_name
    }}, status=200)
