from django.views import View
from django.http import JsonResponse, HttpRequest
from .models import GameResult
from django.db.models import Max
import json

class ApiLeaderboardView(View):
    def get(self, request: HttpRequest) -> JsonResponse:
        # Get top 20 scores ordered by score descending
        top_scores = GameResult.objects.all().order_by('-score')[:20]
        
        # We might want to show distinct players, but for now showing all top scores is fine as per simple requirements.
        # If we wanted unique users, we'd group by email, but SQLite/Django grouping can be tricky with specific ordering requirements without Postgres's DISTINCT ON.
        # Let's verify if the user wants unique users or just top scores. Requirement doesn't specify.
        # I'll stick to top scores for now.
        
        data = []
        for res in top_scores:
            data.append({
                'player_email': res.player_email,
                'score': res.score,
                'total_correct': res.total_correct,
                'time_taken': res.time_taken,
                'date': res.created_at.strftime('%Y-%m-%d %H:%M')
            })
            
        return JsonResponse({'leaderboard': data})
