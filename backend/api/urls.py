# backend/api/urls.py
from django.urls import path
from .views import register
from .views import login_view
from .views import logout_view  

urlpatterns = [
    path("register/", register, name="api-register"),
    path("login/", login_view, name="login"),
    path("logout/", logout_view, name="logout"),
]
