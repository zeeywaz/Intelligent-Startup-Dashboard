from django.conf import settings
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import os
from uuid import uuid4
from django.db.models import Q


# --- Investor verification ---

class InvestorProfile(models.Model):
    investor_id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="investor_profile"
    )
    investor_name = models.CharField(max_length=150, default="", blank=True)
    company_name = models.CharField(max_length=150, default="", blank=True)
    credit_score = models.IntegerField(default=0)
    verification_status = models.CharField(
        max_length=20,
        choices=[("approved", "Approved"), ("pending", "Pending"), ("rejected", "Rejected")],
        default="pending",
    )
    email_address = models.EmailField(default="", blank=True)
    phone = models.CharField(max_length=40, default="", blank=True)

    class Meta:
        db_table = "investor_details"
        managed = False


def investor_doc_path(_instance, filename):
    ext = os.path.splitext(filename)[1].lower()[:10]
    return f"investor_docs/{uuid4().hex}{ext}"


class InvestorVerificationDoc(models.Model):
    id = models.BigAutoField(primary_key=True)
    profile = models.ForeignKey(
        InvestorProfile, on_delete=models.CASCADE,
        db_column="profile_id", related_name="docs"
    )
    file = models.FileField(upload_to=investor_doc_path, max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "api_investorverificationdoc"
        managed = False


# --- Roles ---

class Role(models.Model):
    role_id = models.IntegerField(primary_key=True, db_column="role_id")
    role_name = models.CharField(max_length=50, db_column="role_name", unique=True)

    class Meta:
        db_table = "role"
        managed = False

    def __str__(self):
        return self.role_name


class UserRole(models.Model):
    user_role_id = models.AutoField(primary_key=True, db_column="user_role_id")
    auth_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="auth_user_id",
        related_name="user_roles",
    )
    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column="role_id",
        related_name="user_roles",
    )

    class Meta:
        db_table = "user_role"
        managed = False
        unique_together = (("auth_user", "role"),)


# --- Competitors / Categories ---

class BusinessCategory(models.Model):
    id = models.AutoField(primary_key=True, db_column="category_id")
    name = models.CharField(max_length=120)

    class Meta:
        db_table = "business_category"
        managed = False  # table already exists


class Competitor(models.Model):
    id = models.AutoField(primary_key=True, db_column="competitor_id")
    category = models.ForeignKey(
        BusinessCategory,
        models.DO_NOTHING,
        db_column="category_id",
        related_name="competitors",
    )
    name = models.CharField(max_length=160)
    strength = models.TextField(blank=True)
    website = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "competitor"


# --- Resources ---

class Resource(models.Model):
    resource_id = models.AutoField(primary_key=True, db_column="resource_id")
    category_id = models.IntegerField(db_column="category_id")
    name = models.CharField(max_length=255, db_column="name")
    description = models.TextField(blank=True, default="", db_column="description")
    website = models.CharField(max_length=255, blank=True, default="", db_column="website")
    location = models.CharField(max_length=255, blank=True, default="", db_column="location")
    geo_data = models.CharField(max_length=128, blank=True, default="", db_column="geo_data")  # "(lon,lat)"
    type = models.CharField(max_length=100, db_index=True, db_column="type")  # WAREHOUSE/...

    class Meta:
        db_table = "resource"
        managed = False
        ordering = ["name"]


# --- Ideas ---

class BusinessIdea(models.Model):
    idea_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_column="user_id")
    category = models.ForeignKey("BusinessCategory", on_delete=models.CASCADE, db_column="category_id")
    title = models.CharField(max_length=255)
    description = models.TextField()
    target_audience = models.TextField(blank=True, null=True)
    location = models.CharField(max_length=64)       # district_enum
    business_type = models.CharField(max_length=64)  # business_type_enum
    submission_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "business_idea"
        managed = False


class InvestorDetails(models.Model):
    investor_id = models.AutoField(primary_key=True)
    investor_name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    credit_score = models.IntegerField(blank=True, null=True)
    verification_status = models.CharField(max_length=64, default="pending")
    email_address = models.CharField(max_length=255, unique=True)
    phone = models.CharField(max_length=40)
    user = models.ForeignKey(
    settings.AUTH_USER_MODEL,
    on_delete=models.CASCADE,
    db_column="user_id",    # map to the NOT NULL user_id column in the DB
    related_name="investor_details",
)

    class Meta:
        db_table = "investor_details"
        managed = False


# --- Investor Interests (final) ---
class InvestorInterest(models.Model):
    id = models.AutoField(primary_key=True)
    investor = models.ForeignKey(
        "InvestorDetails",
        on_delete=models.CASCADE,
        db_column="investor_id",
        related_name="interests",
    )
    category = models.ForeignKey(
        "BusinessCategory",
        on_delete=models.CASCADE,
        db_column="category_id",
    )

    class Meta:
        db_table = "investor_interest"
        managed = False  # legacy table
        unique_together = (("investor", "category"),)

    def __str__(self):
        try:
            return f"Investor {self.investor.investor_id} -> Category {self.category.id}"
        except Exception:
            return f"InvestorInterest {getattr(self, 'id', '')}"

# --- Chat (minimal; matches serializer below) ---

class ChatMessage(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    message = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.user.username}: {self.message[:30]}"


# --- Bookmarks ---




class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()

    def is_valid(self):
        return timezone.now() <= self.valid_until

    class Meta:
        db_table = "email_otp"
    
    
# models.py  (Bookmark)
class Bookmark(models.Model):
    bookmark_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bookmarks"
    )

    # existing FKs
    investor = models.ForeignKey("InvestorProfile",null=True, blank=True,on_delete=models.CASCADE,related_name="investor_bookmarks")
    resource = models.ForeignKey("Resource",on_delete=models.CASCADE,null=True, blank=True)
    competitor = models.ForeignKey("Competitor",on_delete=models.CASCADE,null=True, blank=True,related_name="competitor_bookmarks")
    idea = models.ForeignKey("BusinessIdea",on_delete=models.CASCADE,null=True, blank=True,related_name="idea_bookmarks")
    created_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (
            ("user", "investor"),
            ("user", "resource"),
            ("user", "competitor"),
            ("user", "idea"),
        )
        db_table = "bookmark"

    def __str__(self):
        parts = []
        if self.investor:
            parts.append(f"investor {getattr(self.investor,'investor_name',self.investor)}")
        if self.resource:
            parts.append(f"resource {getattr(self.resource,'name',self.resource)}")
        if self.competitor:
            parts.append(f"competitor {getattr(self.competitor,'name',self.competitor)}")
        if self.idea:
            parts.append(f"idea {getattr(self.idea,'title',self.idea)}")
        return f"Bookmark {self.bookmark_id} — user {self.user.username}, " + ", ".join(parts)


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        INVESTOR_INTEREST = "investor_interest", "Investor Interest"
        NEW_RESOURCE = "new_resource", "New Resource"
        ANALYSIS_COMPLETE = "analysis_complete", "Analysis Complete"
        SYSTEM = "system", "System"

    notification_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=50,choices=NotificationType.choices,default=NotificationType.SYSTEM,)
    is_read = models.BooleanField(default=False)
    created_date = models.DateTimeField(auto_now_add=True)
    related_entity_type = models.CharField(max_length=50, null=True, blank=True)
    related_entity_id = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "notification"

    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    
from django.db import models
from django.utils import timezone

class AuditLog(models.Model):
    audit_id      = models.AutoField(primary_key=True)
    admin_id      = models.IntegerField()                     # store actor's auth_user.id
    action        = models.CharField(max_length=255)
    target_entity = models.CharField(max_length=50)
    target_id     = models.IntegerField()
    timestamp     = models.DateTimeField(db_column="timestamp", default=timezone.now)
    ip_address    = models.CharField(max_length=45, blank=True, null=True)

    class Meta:
        db_table = "audit_log"
        managed = False
    