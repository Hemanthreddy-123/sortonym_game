import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import GameResult

print("Updating existing records...")
for g in GameResult.objects.all():
    if not g.player_name:
        if 'hemanth' in g.player_email.lower():
            g.player_name = 'Hemanth Reddy'
        elif '@' in g.player_email:
            g.player_name = g.player_email.split('@')[0].capitalize()
        else:
            g.player_name = f"Player {g.player_email}"
        g.save()
        print(f"Updated {g.player_email} to {g.player_name}")

print("Seeding more dummy data...")
if GameResult.objects.count() < 20: # Ensure enough data for leaderboard
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
            ("ProVocabulary", "provocabulary@example.com"),
            ("WordWizard", "wordwizard@example.com"),
            ("LetterLegend", "letterlegend@example.com"),
            ("SynonymSeeker", "synonymseeker@example.com"),
            ("AntonymAce", "antonymace@example.com"),
    ]
    for name, email in players:
        # Check if email exists to avoid dupes if re-running
        if not GameResult.objects.filter(player_email=email).exists():
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

print("Done.")
