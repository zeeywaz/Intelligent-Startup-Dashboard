from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "backend.api"
    label = "api"

    def ready(self):
        # Import once to register audit signal handlers
        from . import audit  # noqa: F401