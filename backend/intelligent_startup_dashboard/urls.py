from django.contrib import admin
from django.urls import path, include
from backend.api import urls as api_urls   # import the module (safer)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_urls)),        # /api/...
]
