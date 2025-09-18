from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"competitors", views.CompetitorViewSet, basename="competitor")

urlpatterns = [
    path("csrf/", views.csrf),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("me/", views.me),
    path("profile/", views.profile_view),
    path("profile/change-password/", views.change_password),
    path("resources/", views.resources_list),
    path("", include(router.urls)),
]
