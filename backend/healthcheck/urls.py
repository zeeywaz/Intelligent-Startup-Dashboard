from django.urls import path
from .views import db_health

urlpatterns = [
    path("health/db/", db_health),
]
