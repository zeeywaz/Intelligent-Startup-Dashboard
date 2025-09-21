from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    InvestorProfile,
    BusinessCategory,
    Competitor,
    Resource,
)

User = get_user_model()

# =========================
# Registration
# =========================
class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName  = serializers.CharField(max_length=150)
    username  = serializers.CharField(max_length=150)
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        first = attrs.get("firstName", "").strip()
        last  = attrs.get("lastName", "").strip()
        uname = attrs.get("username", "").strip()
        email = (attrs.get("email") or "").strip().lower()
        pwd   = attrs.get("password")

        if not uname:
            raise serializers.ValidationError({"username": "Username is required."})
        if not email:
            raise serializers.ValidationError({"email": "Email is required."})

        if User.objects.filter(username__iexact=uname).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({"email": "Email already registered."})

        try:
            password_validation.validate_password(pwd)
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})

        attrs["firstName"] = first
        attrs["lastName"]  = last
        attrs["username"]  = uname
        attrs["email"]     = email
        return attrs

    def create(self, validated):
        return User.objects.create_user(
            username   = validated["username"],
            email      = validated["email"],
            password   = validated["password"],
            first_name = validated["firstName"],
            last_name  = validated["lastName"],
        )


class InvestorRegisterSerializer(RegisterSerializer):
    company = serializers.CharField(required=False, allow_blank=True)
    phone   = serializers.CharField(required=False, allow_blank=True)
    role    = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated):
        company = (validated.pop("company", "") or "").strip()
        phone   = (validated.pop("phone", "") or "").strip()
        role    = (validated.pop("role", "") or "").strip()
        user = super().create(validated)
        InvestorProfile.objects.create(user=user, company=company, phone=phone, role=role)
        return user


# =========================
# Profile
# =========================
class ProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name", max_length=150, required=True)
    lastName  = serializers.CharField(source="last_name",  max_length=150, required=True)
    email     = serializers.EmailField(required=True)
    username  = serializers.CharField(max_length=150, required=True)

    class Meta:
        model  = User
        fields = ("firstName", "lastName", "email", "username")

    def validate_email(self, value):
        user = self.instance
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already registered.")
        return email

    def validate_username(self, value):
        user = self.instance
        uname = value.strip()
        if User.objects.filter(username__iexact=uname).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already taken.")
        return uname


class PasswordChangeSerializer(serializers.Serializer):
    newPassword     = serializers.CharField(min_length=6)
    confirmPassword = serializers.CharField(min_length=6)

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        # Optional: enforce Django validators here too
        try:
            password_validation.validate_password(attrs["newPassword"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"newPassword": list(e.messages)})
        return attrs


# =========================
# Categories / Competitors
# =========================
class BusinessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = BusinessCategory
        fields = ["id", "name"]

class CompetitorSerializer(serializers.ModelSerializer):
    category = BusinessCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=BusinessCategory.objects.all(),
        write_only=True
    )

    class Meta:
        model  = Competitor
        fields = ["id", "name", "strength", "website", "description", "category", "category_id"]


# =========================
# Resources
# =========================
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Resource
        fields = ("resource_id", "type", "name", "location", "website", "description", "geo_data")



