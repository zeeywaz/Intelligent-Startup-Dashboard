

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class InvestorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="investor_profile")
    company = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    role = models.CharField(max_length=80, blank=True)
    verify_type = models.CharField(max_length=40, blank=True)  # ownership | financial

    def __str__(self):
        return f"InvestorProfile({self.user.username})"

class InvestorVerificationDoc(models.Model):
    profile = models.ForeignKey(InvestorProfile, on_delete=models.CASCADE, related_name="docs")
    file = models.FileField(upload_to="investor_docs/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Doc({self.profile.user.username}: {self.file.name})"
