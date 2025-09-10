from rest_framework.routers import DefaultRouter
from .views import ItemViewSet

router = DefaultRouter()
router.register(r"items", ItemViewSet, basename="item")

urlpatterns = router.urls

from django.urls import path
from .views import create_user

urlpatterns = [
    path("users/", create_user, name="create_user"),
]
