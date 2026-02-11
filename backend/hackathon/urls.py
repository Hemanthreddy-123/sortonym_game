from .views import (
    HealthView, ApiGameStartView, ApiGameSubmitView, 
    ApiLeaderboardView, ApiCertificateView,
    ApiLobbyCreateView, ApiLobbyJoinView, ApiLobbyStatusView, ApiLobbyUpdateView, ApiGetResultsView,
    ApiGameScoreView
)
from django.urls import path
from django.views.decorators.csrf import csrf_exempt

urlpatterns = [
    path('', HealthView.as_view(), name='health'),
    path('api/game/start', csrf_exempt(ApiGameStartView.as_view()), name='api_game_start'),
    path('api/game/submit', csrf_exempt(ApiGameSubmitView.as_view()), name='api_game_submit'),
    path('api/game/score', ApiGameScoreView.as_view(), name='api_game_score'),
    path('api/leaderboard', ApiLeaderboardView.as_view(), name='api_leaderboard'),
    path('api/certificate', ApiCertificateView.as_view(), name='api_certificate'),
    
    # Lobby API
    path('api/lobby/create', csrf_exempt(ApiLobbyCreateView.as_view()), name='api_lobby_create'),
    path('api/lobby/join', csrf_exempt(ApiLobbyJoinView.as_view()), name='api_lobby_join'),
    path('api/lobby/status', ApiLobbyStatusView.as_view(), name='api_lobby_status'),
    path('api/lobby/update', csrf_exempt(ApiLobbyUpdateView.as_view()), name='api_lobby_update'),
    path('api/get/results/<str:code>', ApiGetResultsView.as_view(), name='api_get_results'),
]
