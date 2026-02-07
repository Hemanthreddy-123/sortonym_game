from django.db import models

class SortonymWord(models.Model):
    word = models.CharField(max_length=100, unique=True)
    synonyms = models.TextField(help_text="Comma-separated synonyms")
    antonyms = models.TextField(help_text="Comma-separated antonyms")

    def __str__(self):
        return self.word

class GameResult(models.Model):
    player_email = models.EmailField()
    round_id = models.IntegerField(null=True)
    score = models.FloatField(default=0.0)
    total_correct = models.IntegerField(default=0)
    time_taken = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.player_email} - {self.score}"
