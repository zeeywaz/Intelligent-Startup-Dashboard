from django.urls import path   
from . import views           

urlpatterns = [
    path('', views.home, name='home'),  # home page endpoint
    path('dashboard/', views.dashboard_data, name='dashboard'),  # API endpoint
]
