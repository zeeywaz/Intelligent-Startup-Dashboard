from django.conf import settings
from django.db import models
import os
from uuid import uuid4

# --- Investor verification ---

class InvestorProfile(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_column="user_id",
        related_name="investor_profile",
    )
    company = models.CharField(max_length=120, default="", blank=True)
    phone = models.CharField(max_length=40, default="", blank=True)
    role = models.CharField(max_length=80, default="", blank=True)
    verify_type = models.CharField(max_length=40, default="", blank=True)

    class Meta:
        db_table = "api_investorprofile"
        managed = False


def investor_doc_path(instance, filename):
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

<<<<<<< HEAD
# --- Competitors / Categories (maps to existing Postgres tables) ---

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
    website = models.CharField(max_length=255, blank=True)  # change to URLField if you want
    description = models.TextField(blank=True)

    class Meta:
        db_table = "competitor"
=======

# --- Resources (matches table `resource`) ---

class Resource(models.Model):
    resource_id = models.AutoField(primary_key=True, db_column="resource_id")
    category_id = models.IntegerField(db_column="category_id")
    name = models.CharField(max_length=255, db_column="name")
    description = models.TextField(blank=True, default="", db_column="description")
    website = models.CharField(max_length=255, blank=True, default="", db_column="website")
    location = models.CharField(max_length=255, blank=True, default="", db_column="location")
    # DB type is `point`; we read it as text like "(lon,lat)"
    geo_data = models.CharField(max_length=128, blank=True, default="", db_column="geo_data")
    type = models.CharField(max_length=100, db_index=True, db_column="type")  # WAREHOUSE/...

    class Meta:
        db_table = "resource"   # ← actual populated table
>>>>>>> 518b9efcf52a9f71913b40bdc9887d09f48b172e
        managed = False
        ordering = ["name"]
