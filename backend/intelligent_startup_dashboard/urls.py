from django.contrib import admin
from django.urls import path, include
from backend.api import urls as api_urls   # import the module (safer)
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_urls)),        # /api/...
]


if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)