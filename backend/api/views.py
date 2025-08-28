from django.http import HttpResponse, JsonResponse

def home(request):
    return HttpResponse("Welcome to Intelligent Startup Dashboard API 🚀")

def dashboard_data(request):
    data = {
        "user": "Adam",
        "popular_niches": {
            "Food & Beverage": 24.3,
            "E-commerce": 14.6,
            "Tech Startups": 12.3,
            "Healthcare": 48.8,
        },
        "analytics": [
            {"month": "Jan", "businesses": 120},
            {"month": "Feb", "businesses": 150},
            {"month": "Mar", "businesses": 200},
        ]
    }
    return JsonResponse(data)
