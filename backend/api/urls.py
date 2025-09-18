<<<<<<< HEAD
from django.urls import path, include
from rest_framework.routers import DefaultRouter
=======
from django.urls import path
>>>>>>> 518b9efcf52a9f71913b40bdc9887d09f48b172e
from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("competitors", views.CompetitorViewSet, basename="competitor")

urlpatterns = [
    # auth / misc
    path("csrf/", views.csrf, name="csrf"),
    path("register/", views.register, name="register"),
    path("investor-register/", views.investor_register, name="investor_register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("me/", views.me, name="me"),

    # profile
<<<<<<< HEAD
    path("profile/", views.profile_update, name="profile_update"),
    path("profile/change-password/", views.change_password, name="change_password"),

    # competitors & categories
    path("", include(router.urls)),
=======
    path("profile/", views.profile_view, name="profile_view"),
    path("profile/change-password/", views.change_password, name="change_password"),

    # resources
    path("resources/", views.resources_list, name="resources_list"),
>>>>>>> 518b9efcf52a9f71913b40bdc9887d09f48b172e
]
