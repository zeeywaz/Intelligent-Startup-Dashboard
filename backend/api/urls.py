from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, investor_views as inv
from . import investor_views as inv


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
    
    
    path("request-otp/", views.request_otp, name="request_otp"),
    path("verify-otp/", views.verify_otp_api),
    path("reset-password/", views.reset_password),
    path("register/request-otp/", views.register_request_otp, name="register_request_otp"),
    path("register/verify-otp/", views.register_verify_otp, name="register_verify_otp"),
    
    path("analytics/monthly-overview/", views.analytics_monthly_overview, name="analytics-monthly-overview"),
    path("competitor-ideas/", views.competitor_ideas, name="competitor-ideas"),
    
    
    path("admin/users/", views.admin_user_list, name="admin-user-list"),
    path("admin/users/<int:user_id>/delete/", views.admin_user_delete, name="admin-user-delete"),

    path("investor-register/", inv.investor_register,           name="investor-register"),   # JSON fallback
    path("register/investor/", inv.register_investor_details,   name="register-investor"),   # multipart -> writes investor_details
    path("register/investor/base/", inv.investor_register, name="investor-base-register"),
    path("register/investor/details/", inv.register_investor_details, name="register-investor-details"),
    
    # --- Admin: investor verification ---
    path("admin/investors/", inv.admin_investor_list, name="admin-investor-list"),
    path("admin/pending-investors/", inv.admin_pending_investors, name="admin-pending-investors"),
    path("admin/investor/<int:investor_id>/docs/", inv.admin_investor_docs, name="admin-investor-docs"),
    path("admin/investor/<int:investor_id>/approve/", inv.admin_approve_investor, name="admin-approve-investor"),
    path("admin/investor/<int:investor_id>/reject/", inv.admin_reject_investor, name="admin-reject-investor"),
    path("analytics/popular-businesses/", views.analytics_popular_businesses, name="analytics-popular-businesses"),

    
    path("resources/<int:pk>/", views.resource_detail_admin, name="api-resource-detail"),
    path("ideas/<int:pk>/", views.idea_detail_admin, name="api-idea-detail"),

]
