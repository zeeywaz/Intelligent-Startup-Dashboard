
import random
from datetime import datetime, timedelta
from django.core.mail import send_mail
from .models import EmailOTP

def send_otp(user):
    code = f"{random.randint(100000, 999999)}"
    otp = EmailOTP.objects.create(
        user=user,
        code=code,
        valid_until=datetime.now() + timedelta(minutes=5)
    )
    send_mail(
        subject="Your OTP Code",
        message=f"Your OTP is {code}. It expires in 5 minutes.",
        from_email="yourgmail@gmail.com",
        recipient_list=[user.email],
        fail_silently=False,
    )
    return otp

def verify_otp(user, code):
    try:
        otp = EmailOTP.objects.filter(user=user, code=code).latest('created_at')
        return otp.is_valid()
    except EmailOTP.DoesNotExist:
        return False