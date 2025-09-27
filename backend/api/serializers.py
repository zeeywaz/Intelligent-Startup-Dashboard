# backend/api/serializers.py
from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    InvestorProfile,
    BusinessCategory,
    Competitor,
    Resource,
    BusinessIdea,
)

User = get_user_model()

# ---------- Registration ----------
class RegisterSerializer(serializers.Serializer):
    firstName = serializers.CharField(max_length=150)
    lastName  = serializers.CharField(max_length=150)
    username  = serializers.CharField(max_length=150)
    email     = serializers.EmailField()
    password  = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        uname = (attrs.get("username") or "").strip()
        email = (attrs.get("email") or "").strip().lower()
        pwd   = attrs.get("password") or ""

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

        attrs["username"] = uname
        attrs["email"]    = email
        return attrs

    def create(self, validated):
        return User.objects.create_user(
            username   = validated["username"],
            email      = validated["email"],
            password   = validated["password"],
            first_name = validated.get("firstName", "").strip(),
            last_name  = validated.get("lastName", "").strip(),
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

# ---------- Profile ----------
class ProfileSerializer(serializers.ModelSerializer):
    firstName = serializers.CharField(source="first_name")
    lastName  = serializers.CharField(source="last_name")

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
        try:
            password_validation.validate_password(attrs["newPassword"])
        except DjangoValidationError as e:
            raise serializers.ValidationError({"newPassword": list(e.messages)})
        return attrs

# ---------- Categories / Competitors ----------
class BusinessCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = BusinessCategory
        fields = ["id", "name"]

class CompetitorSerializer(serializers.ModelSerializer):
    category = BusinessCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=BusinessCategory.objects.all(),
        write_only=True,
    )

    class Meta:
        model  = Competitor
        fields = ["id", "name", "strength", "website", "description", "category", "category_id"]

# ---------- Resources ----------
class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Resource
        fields = ("resource_id", "type", "name", "location", "website", "description", "geo_data")

# ---------- Ideas ----------
class BusinessIdeaReadSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()

    class Meta:
        model = BusinessIdea
        fields = [
            "idea_id",
            "user_id",
            "category",          # string
            "title",
            "description",
            "target_audience",
            "location",
            "business_type",
            "submission_date",
        ]

    def get_category(self, obj):
        try:
            if hasattr(obj, "category") and obj.category:
                return obj.category.name
            cat = BusinessCategory.objects.filter(pk=obj.category_id).only("name").first()
            return cat.name if cat else None
        except Exception:
            return None


# backend/api/serializers.py  (idea parts)

from rest_framework import serializers
from .models import BusinessIdea, BusinessCategory

class IdeaCreateSerializer(serializers.Serializer):
    # payload from the chatbot
    text = serializers.CharField()
    category = serializers.CharField()  # e.g., "Retail", "Food", etc.
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    target_audience = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    business_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated):
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not (user and user.is_authenticated):
            # 400 with the array you saw earlier
            raise serializers.ValidationError(["Authentication required."])

        # upsert category by case-insensitive name
        cat_name = (validated.get("category") or "").strip()
        if not cat_name:
            raise serializers.ValidationError({"category": ["This field is required."]})

        cat = BusinessCategory.objects.filter(name__iexact=cat_name).first()
        if not cat:
            cat = BusinessCategory.objects.create(name=cat_name)

        title = (validated.get("title") or validated.get("text") or "")[:255]
        description = validated.get("description") or validated.get("text") or ""

        idea = BusinessIdea.objects.create(
            user_id=user.id,          # model uses integer user_id column
            category_id=cat.id,       # use .id (not category_id)
            title=title,
            description=description,
            target_audience=validated.get("target_audience") or "",
            location=(validated.get("location") or None),
            business_type=(validated.get("business_type") or None),
        )
        return idea


# add this
# add this
class InvestorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    firstName = serializers.CharField(source="user.first_name", read_only=True)
    lastName  = serializers.CharField(source="user.last_name", read_only=True)
    email     = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = InvestorProfile
        fields = [
            "id", "user_id", "firstName", "lastName", "email",
            "company", "phone", "role", "verify_type"
        ]


# backend/api/serializers.py
from rest_framework import serializers
from .models import ChatMessage

class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            "id", "user", "message", "response", "category", "location",
            "narrative", "suggestions", "risks", "roadmap", "kpis", "created_at"
        ]
        read_only_fields = ["id", "user", "created_at"]
