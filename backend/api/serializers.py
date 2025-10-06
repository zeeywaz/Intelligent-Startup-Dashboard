from django.contrib.auth import get_user_model, password_validation
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    InvestorInterest,
    InvestorProfile,
    BusinessCategory,
    Competitor,
    Resource,
    BusinessIdea,
    ChatMessage, Notification, Bookmark
)
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import InvestorVerificationDoc, InvestorProfile, InvestorDetails

User = get_user_model()
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
    # Extra investor fields
    phone = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    verifyType = serializers.CharField(required=False, allow_blank=True)
    # Category ids from the UI (array)
    categories = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        write_only=True,
        required=False,
        allow_empty=True,
    )
    # Optional verification documents
    # (We don't validate here because files arrive via request.FILES in the view.)

    def create(self, validated):
        """
        1) Create auth user
        2) Create investor_details row (investor_name = "first last")
        3) Bulk insert investor_interest rows
        """
        categories = validated.pop("categories", [])
        phone = (validated.pop("phone", "") or "").strip()
        company_name = (validated.pop("company_name", "") or "").strip()

        first = (validated.get("firstName") or "").strip()
        last = (validated.get("lastName") or "").strip()
        full_name = " ".join(p for p in [first, last] if p).strip()

        user = super().create(validated)

        investor = InvestorDetails.objects.create(
            user=user,
            investor_name=full_name or user.username,
            company_name=company_name or None,
            email_address=user.email,
            phone=phone or "",
        )

        if categories:
            # Validate only existing categories; ignore bad ids quietly
            existing_ids = set(
                BusinessCategory.objects.filter(id__in=categories).values_list("id", flat=True)
            )
            interests = [
                InvestorInterest(investor_id=investor.investor_id, category_id=cid)
                for cid in existing_ids
            ]
            if interests:
                InvestorInterest.objects.bulk_create(interests, ignore_conflicts=True)

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


class IdeaCreateSerializer(serializers.Serializer):
    text = serializers.CharField()
    category = serializers.CharField()
    title = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    target_audience = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    business_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    def create(self, validated):
        req = self.context.get("request")
        user = getattr(req, "user", None)
        if not (user and user.is_authenticated):
            raise serializers.ValidationError(["Authentication required."])

        cat_name = (validated.get("category") or "").strip()
        if not cat_name:
            raise serializers.ValidationError({"category": ["This field is required."]})

        cat = BusinessCategory.objects.filter(name__iexact=cat_name).first()
        if not cat:
            cat = BusinessCategory.objects.create(name=cat_name)

        title = (validated.get("title") or validated.get("text") or "")[:255]
        description = validated.get("description") or validated.get("text") or ""

        idea = BusinessIdea.objects.create(
            user_id=user.id,
            category_id=cat.id,
            title=title,
            description=description,
            target_audience=validated.get("target_audience") or "",
            location=(validated.get("location") or None),
            business_type=(validated.get("business_type") or None),
        )
        return idea


# ---------- Investors ----------
# backend/api/serializers.py
from rest_framework import serializers
from .models import InvestorDetails  # <-- make sure this is imported

class InvestorSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorDetails
        fields = [
            "investor_id",
            "investor_name",
            "company_name",
            "email_address",
            "phone",
            "credit_score",
            "verification_status",
        ]

# ---------- Chat ----------
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = ["id", "user", "message", "response", "created_at"]
        read_only_fields = ["id", "user", "created_at"]


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        
        
        
# Import Bookmark, Notification,

class InvestorProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvestorProfile
        fields = [
            "investor_id",
            "investor_name",
            "company_name",
            "credit_score",
            "verification_status",
            "email_address",
            "phone"
        ]

class InvestorBookmarkSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.pk", read_only=True)
    investor_id = serializers.IntegerField(source="investor.pk", read_only=True)

    class Meta:
        model = Bookmark
        fields = ("bookmark_id", "user_id", "investor_id", "created_date")
        read_only_fields = fields

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        
        
        
# serializers.py
from django.contrib.auth import get_user_model
User = get_user_model()

class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]

class CompetitorIdeaSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = BusinessIdea
        fields = [
            "idea_id",
            "title",
            "description",
            "submission_date",
            "category_name",
            "user",
        ]

    def get_category_name(self, obj):
        try:
            return obj.category.name if obj.category else None
        except Exception:
            return None


class InvestorDocSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = InvestorVerificationDoc
        fields = ("id", "file_url", "uploaded_at")

    def get_file_url(self, obj):
        request = self.context.get("request")
        if not getattr(obj, "file", None):
            return None
        try:
            url = obj.file.url  # may raise if storage not configured
        except Exception:
            return None
        return request.build_absolute_uri(url) if request else url


class AdminInvestorSerializer(serializers.ModelSerializer):
    """
    Rich admin view of an InvestorDetails row including:
      - minimal auth-user info
      - attached verification docs (via InvestorProfile → InvestorVerificationDoc)
    """
    user = serializers.SerializerMethodField()
    docs = serializers.SerializerMethodField()

    class Meta:
        model = InvestorDetails
        fields = (
            "investor_id",
            "investor_name",
            "company_name",
            "email_address",
            "phone",
            "credit_score",
            "verification_status",
            "user",
            "docs",
        )

    def get_user(self, obj):
        u = getattr(obj, "user", None)
        if not u:
            return None
        return {
            "id": getattr(u, "id", None),
            "username": getattr(u, "username", ""),
            "first_name": getattr(u, "first_name", ""),
            "last_name": getattr(u, "last_name", ""),
            "email": getattr(u, "email", ""),
        }

    def get_docs(self, obj):
        # Docs are linked to InvestorProfile by user
        u = getattr(obj, "user", None)
        if not u:
            return []
        profile = InvestorProfile.objects.filter(user=u).first()
        if not profile:
            return []
        qs = InvestorVerificationDoc.objects.filter(profile=profile).order_by("uploaded_at")
        return InvestorDocSerializer(qs, many=True, context=self.context).data


# add near other serializers
class BusinessIdeaAdminSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    category_id = serializers.PrimaryKeyRelatedField(
        source="category",
        queryset=BusinessCategory.objects.all(),
        write_only=True,
        required=False,
    )
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = BusinessIdea
        fields = [
            "idea_id",
            "user",
            "category", "category_id",
            "title", "description",
            "target_audience", "location", "business_type",
            "submission_date",
        ]
        read_only_fields = ["idea_id", "user", "submission_date"]

    def get_category(self, obj):
        try:
            return obj.category.name if obj.category else None
        except Exception:
            return None
