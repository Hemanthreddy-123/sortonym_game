import os
import django
import random
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import GameResult

def seed_data():
    # Clear existing dummy data if needed, or just append. 
    # For now, let's just add new data if not enough exists.
    
    current_count = GameResult.objects.count()
    if current_count >= 10:
        print(f"Data already likely exists ({current_count} records). Skipping large seed.")
        players = []
    else:
        players = [
            ("WordMaster99", "wordmaster99@example.com"),
            ("LexiconKing", "lexiconking@example.com"),
            ("SyntaxSage", "syntaxsage@example.com"),
            ("VocabViper", "vocabviper@example.com"),
            ("GrammarGuru", "grammarguru@example.com"),
            ("SpellingBee", "spellingbee@example.com"),
            ("TextTitan", "texttitan@example.com"),
            ("VerbVirtuoso", "verbvirtuoso@example.com"),
            ("NounNinja", "nounninja@example.com"),
            ("AlphaBet", "alphabet@example.com"),
        ]

    for name, email in players:
        score = random.randint(700, 1200)
        time_taken = random.uniform(30.0, 90.0)
        total_correct = random.randint(8, 20)
        
        GameResult.objects.create(
            player_email=email,
            player_name=name,
            score=score,
            time_taken=time_taken,
            total_correct=total_correct
        )
        print(f"Created result for {name}")

if __name__ == "__main__":
    seed_data()
