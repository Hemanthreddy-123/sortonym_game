from django.db import models

class SortonymWord(models.Model):
    word = models.CharField(max_length=100, unique=True, db_index=True)
    synonyms = models.TextField(help_text="Comma-separated synonyms")
    antonyms = models.TextField(help_text="Comma-separated antonyms")

    class Meta:
        indexes = [
            models.Index(fields=['word'], name='sortonym_word_idx'),
        ]   

    def __str__(self):
        return self.word

class GameResult(models.Model):
    player_email = models.EmailField(db_index=True)
    player_name = models.CharField(max_length=255, null=True, blank=True)
    round_id = models.IntegerField(null=True)
    score = models.FloatField(default=0.0)
    total_correct = models.IntegerField(default=0)
    time_taken = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=['player_email', '-score'], name='game_email_score_idx'),
            models.Index(fields=['created_at'], name='game_created_idx'),
        ]

    def __str__(self):
        return f"{self.player_email} - {self.score}"

class Lobby(models.Model):
    code = models.CharField(max_length=10, unique=True, db_index=True)
    host_email = models.EmailField()
    host_name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, default='WAITING', db_index=True) # WAITING, STARTED, FINISHED
    settings = models.JSONField(default=dict)
    players_data = models.JSONField(default=list) # List of {'email': ..., 'name': ..., 'team': ...}
    results_data = models.JSONField(default=list) # List of game results
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['code'], name='lobby_code_idx'),
            models.Index(fields=['status'], name='lobby_status_idx'),
        ]

    def __str__(self):
        return f"Lobby {self.code} - {self.status}"
