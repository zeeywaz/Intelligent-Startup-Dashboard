from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("competitors", views.CompetitorViewSet, basename="competitor")

urlpatterns = [
    # bootstrap / health
    path("", views.root_ok, name="root_ok"),
    path("csrf/", views.csrf, name="csrf"),

    # auth
    path("register/", views.register, name="register"),
    path("investor/register/", views.investor_register, name="investor_register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("me/", views.me, name="me"),

    # profile
    path("profile/", views.profile_update, name="profile_update"),
    path("profile/change-password/", views.change_password, name="change_password"),

    # competitors & categories
    path("", include(router.urls)),
]
