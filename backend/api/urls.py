# backend/api/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"competitors", views.CompetitorViewSet, basename="competitor")

urlpatterns = [
    # auth & profile
    path("csrf/", views.csrf, name="api-csrf"),
    path("register/", views.register, name="api-register"),
    path("register/investor/", views.investor_register, name="api-register-investor"),
    path("login/", views.login_view, name="api-login"),
    path("logout/", views.logout_view, name="api-logout"),
    path("me/", views.me, name="api-me"),
    path("profile/", views.profile_view, name="api-profile"),
    path("profile/change-password/", views.change_password, name="api-change-password"),
    path("account/", views.delete_account, name="api-delete-account"),

    # data
    path("", include(router.urls)),
    path("resources/", views.resources_list, name="api-resources"),

    # ML
    path("ml/info/", views.ml_info, name="api-ml-info"),
    path("ml/classify/", views.ml_classify, name="api-ml-classify"),

    # ideas
    path("ideas/", views.idea_create, name="api-ideas-create"),     # POST (dev: CSRF off)
    path("ideas/mine/", views.my_ideas, name="api-ideas-mine"),     # GET (auth)
]
