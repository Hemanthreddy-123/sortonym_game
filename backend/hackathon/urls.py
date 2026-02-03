from .views import ApiForgotPasswordView, ApiLoginView, ApiLogoutView, ApiMeView, ApiOtpRequestView, ApiOtpVerifyView, ApiRegisterView, HealthView, ApiGameStartView, ApiGameSubmitView, ApiLeaderboardView
from django.urls import path

urlpatterns = [
    path('', HealthView.as_view(), name='health'),
    path('api/login', ApiLoginView.as_view(), name='api_login'),
    path('api/register', ApiRegisterView.as_view(), name='api_register'),
    path('api/forgot-password', ApiForgotPasswordView.as_view(), name='api_forgot_password'),
    path('api/otp/request', ApiOtpRequestView.as_view(), name='api_otp_request'),
    path('api/otp/verify', ApiOtpVerifyView.as_view(), name='api_otp_verify'),
    path('api/home', ApiMeView.as_view(), name='api_home'),
    path('api/logout', ApiLogoutView.as_view(), name='api_logout'),
    path('api/game/start', ApiGameStartView.as_view(), name='api_game_start'),
    path('api/game/submit', ApiGameSubmitView.as_view(), name='api_game_submit'),
    path('api/leaderboard', ApiLeaderboardView.as_view(), name='api_leaderboard'),
]
