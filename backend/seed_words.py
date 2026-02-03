import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import SortonymWord

words_data = [
    {
        "word": "Happy",
        "synonyms": "Joyful,Cheerful,Content,Delighted,Glad,Jolly",
        "antonyms": "Sad,Unhappy,Miserable,Depressed,Gloomy,Sorrowful"
    },
    {
        "word": "Brave",
        "synonyms": "Courageous,Fearless,Valiant,Heroic,Bold,Daring",
        "antonyms": "Cowardly,Fearful,Timid,Afraid,Scared,Gutless"
    },
    {
        "word": "Fast",
        "synonyms": "Quick,Rapid,Swift,Speedy,Hasty,Brisk",
        "antonyms": "Slow,Sluggish,Leisurely,Plodding,Crawling,Delayed"
    },
    {
        "word": "Big",
        "synonyms": "Large,Huge,Giant,Massive,Enormous,Colossal",
        "antonyms": "Small,Tiny,Little,Miniature,Petite,Microscopic"
    }
]

for entry in words_data:
    if not SortonymWord.objects.filter(word=entry["word"]).exists():
        SortonymWord.objects.create(
            word=entry["word"],
            synonyms=entry["synonyms"],
            antonyms=entry["antonyms"]
        )
        print(f"Added word: {entry['word']}")
    else:
        print(f"Skipped word: {entry['word']}")

print("Seed completed.")
