from django.urls import path
from . import views

urlpatterns = [
    # auth / misc
    path("csrf/", views.csrf, name="csrf"),
    path("register/", views.register, name="register"),
    path("investor-register/", views.investor_register, name="investor_register"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("me/", views.me, name="me"),

    # profile
    path("profile/", views.profile_view, name="profile_view"),
    path("profile/change-password/", views.change_password, name="change_password"),

    # resources
    path("resources/", views.resources_list, name="resources_list"),
]
