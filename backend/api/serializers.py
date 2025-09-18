from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import InvestorProfile
from .models import BusinessCategory, Competitor
User = get_user_model()

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
