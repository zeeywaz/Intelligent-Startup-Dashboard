from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from backend.api.views import root_ok

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("backend.api.urls")),
    path("", root_ok),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
