from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r"categories", views.CategoryViewSet, basename="category")
router.register(r"competitors", views.CompetitorViewSet, basename="competitor")
router.register(r"notifications", views.NotificationViewSet, basename="notification")
router.register(r"investors", views.InvestorViewSet, basename="investor")

urlpatterns = [
    # CSRF & Auth
    path("csrf/", views.csrf, name="api-csrf"),
    path("register/", views.register, name="api-register"),
    path("register/investor/", views.investor_register, name="api-register-investor"),
    path("login/", views.login_view, name="api-login"),
    path("logout/", views.logout_view, name="api-logout"),
    path("me/", views.me, name="api-me"),

    # Profile
    path("profile/", views.profile_view, name="api-profile"),
    path("profile/change-password/", views.change_password, name="api-change-password"),

    # Router (categories/competitors)
    path("", include(router.urls)),

    # Lists
    path("resources/", views.resources_list, name="api-resources"),

    # Ideas
    path("ideas/", views.idea_create, name="api-ideas-create"),    # POST
    path("ideas/mine/", views.my_ideas, name="api-ideas-mine"),    # GET

    # MyStartup bundle
    path("mystartup/<int:idea_id>/", views.mystartup_data, name="api-mystartup"),

    # Bookmarks
    path("bookmarks/investors/", views.InvestorBookmarkListCreateView.as_view(), name="investor-bookmark-list-create"),
    path("bookmarks/investors/<int:bookmark_id>/delete/", views.InvestorBookmarkDeleteView.as_view(), name="investor-bookmark-delete"),
    path("", include(router.urls)),
    path("bookmarks/ids/", views.bookmark_ids, name="bookmark-ids"),
    path("bookmarks/toggle/", views.bookmark_toggle, name="bookmark-toggle"),
    # Chat
    path("chat/message/", views.ChatMessageListCreateView.as_view(), name="chat-message"),
    path("chat/history/", views.ChatMessageListCreateView.as_view(), name="chat-history"),

    # ML
    path("ml/info/", views.ml_info, name="api-ml-info"),
    path("ml/classify/", views.ml_classify, name="api-ml-classify"),
    
    path("analytics/popular-categories/", views.analytics_popular_categories, name="analytics-popular"),
    path("analytics/category-trend/", views.analytics_category_trend, name="analytics-trend"),
    path("analytics/seed/", views.analytics_seed, name="analytics-seed"), 
    
    
    path("request-otp/", views.request_otp),
    path("verify-otp/", views.verify_otp_api),
    
    path("analytics/monthly-overview/", views.analytics_monthly_overview, name="analytics-monthly-overview"),

]
