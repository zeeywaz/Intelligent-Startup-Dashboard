from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import InvestorProfile
from .models import BusinessCategory, Competitor

from .models import InvestorProfile, Resource


User = get_user_model()

# -------- Registration (unchanged) --------
class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, attrs):
        if User.objects.filter(username__iexact=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return attrs

    def create(self, validated):
        user = User.objects.create_user(
            username=validated["username"],
            email=validated["email"].lower(),
            password=validated["password"],
            first_name=validated["firstName"],
            last_name=validated["lastName"],
        )
        return user


class InvestorRegisterSerializer(RegisterSerializer):
    company = serializers.CharField(required=False, allow_blank=True)
    phone = serializers.CharField(required=False, allow_blank=True)
    role = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated):
        company = validated.pop("company", "")
        phone = validated.pop("phone", "")
        role = validated.pop("role", "")
        user = super().create(validated)
        InvestorProfile.objects.create(user=user, company=company, phone=phone, role=role)
        return user


# --- Competitors / Categories ---

from .models import BusinessCategory, Competitor  # top already imports InvestorProfile; this extends it

class BusinessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessCategory
        fields = ["id", "name"]

class CompetitorSerializer(serializers.ModelSerializer):
    category = BusinessCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=BusinessCategory.objects.all(),
        write_only=True
    )

    class Meta:
        model = Competitor
        fields = ["id", "name", "strength", "website", "description", "category", "category_id"]


# -------- Profile update / view --------
class ProfileSerializer(serializers.ModelSerializer):
    # front-end uses these exact keys (see profile.jsx)
    firstName = serializers.CharField(source="first_name", max_length=150, required=True)
    lastName = serializers.CharField(source="last_name", max_length=150, required=True)
    email = serializers.EmailField(required=True)
    username = serializers.CharField(max_length=150, required=True)

    class Meta:
        model = User
        fields = ("firstName", "lastName", "email", "username")

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already taken.")
        return value


# -------- Password change --------
class PasswordChangeSerializer(serializers.Serializer):
    newPassword = serializers.CharField(min_length=6)
    confirmPassword = serializers.CharField(min_length=6)

    def validate(self, attrs):
        if attrs["newPassword"] != attrs["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return attrs


# -------- Resources (unchanged shape, now using resource_id field) --------
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ("resource_id", "type", "name", "location", "website", "description", "geo_data")

