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
    path("register/", views.register, name="api-register"),
    path("register/investor/", views.investor_register, name="api-register-investor"),
    
    path("account/", views.delete_account, name="api-delete-account"),


    
    path("ml/classify/", views.classify_idea, name="ml-classify"),


    path("", include(router.urls)),
]
