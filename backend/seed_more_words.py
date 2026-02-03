import os, django
import sys

# Add the project root to sys.path
sys.path.append(os.getcwd())

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from hackathon.models import SortonymWord

words_data = [
    ('Hot', 'Warm,Heated,Scorching,Burning,Boiling,Fiery', 'Cold,Chilly,Cool,Freezing,Icy,Frosty'),
    ('Cold', 'Chilly,Cool,Freezing,Icy,Frosty,Arctic', 'Hot,Warm,Heated,Boiling,Scorching,Burning'),
    ('Strong', 'Powerful,Sturdy,Tough,Solid,Mighty,Robust', 'Weak,Fragile,Feeble,Delicate,Soft,Frail'),
    ('Weak', 'Feeble,Frail,Fragile,Soft,Delicate,Powerless', 'Strong,Powerful,Sturdy,Tough,Robust,Mighty'),
    ('Rich', 'Wealthy,Affluent,Prosperous,Loaded,Opulent,Moneyed', 'Poor,Needy,Broke,Penniless,Destitute,Impoverished'),
    ('Poor', 'Needy,Broke,Penniless,Destitute,Impoverished,Underprivileged', 'Rich,Wealthy,Affluent,Prosperous,Opulent,Loaded'),
    ('Clean', 'Neat,Spotless,Tidy,Fresh,Pure,Hygienic', 'Dirty,Filthy,Messy,Grimy,Stained,Unclean'),
    ('Dirty', 'Filthy,Messy,Grimy,Stained,Soiled,Unclean', 'Clean,Neat,Spotless,Tidy,Pure,Hygienic'),
    ('Easy', 'Simple,Effortless,Comfortable,Smooth,Straightforward,Light', 'Hard,Difficult,Tough,Complex,Challenging,Tricky'),
    ('Hard', 'Difficult,Tough,Complex,Challenging,Rigid,Severe', 'Easy,Simple,Soft,Effortless,Smooth,Light'),
    ('Old', 'Aged,Ancient,Elderly,Antique,Senior,Outdated', 'Young,New,Fresh,Modern,Recent,Youthful'),
    ('Young', 'Youthful,Fresh,Junior,New,Immature,Tender', 'Old,Aged,Elderly,Ancient,Senior,Outdated'),
    ('Bright', 'Shiny,Luminous,Brilliant,Glowing,Vivid,Radiant', 'Dull,Dim,Dark,Faint,Gloomy,Blunt'),
    ('Dark', 'Dim,Gloomy,Shadowy,Black,Dusky,Obscure', 'Bright,Light,Shiny,Luminous,Radiant,Clear'),
    ('Love', 'Affection,Care,Adoration,Fondness,Devotion,Attachment', 'Hate,Dislike,Hatred,Aversion,Detest,Loathe'),
    ('Hate', 'Dislike,Hatred,Detest,Loathe,Aversion,Resentment', 'Love,Affection,Care,Adoration,Fondness,Devotion'),
    ('Begin', 'Start,Initiate,Commence,Launch,Open,Originate', 'End,Finish,Stop,Conclude,Terminate,Close'),
    ('End', 'Finish,Stop,Conclude,Terminate,Close,Complete', 'Begin,Start,Initiate,Commence,Launch,Open'),
    ('Win', 'Victory,Triumph,Succeed,Conquer,Prevail,Achieve', 'Lose,Fail,Defeat,Surrender,Forfeit,Miss'),
    ('Lose', 'Fail,Defeat,Miss,Forfeit,Surrender,Drop', 'Win,Victory,Triumph,Succeed,Conquer,Prevail'),
]

print("Starting seed process...")
added = 0
updated = 0

for word, syns, ants in words_data:
    obj, created = SortonymWord.objects.update_or_create(
        word=word,
        defaults={
            'synonyms': syns,
            'antonyms': ants
        }
    )
    if created:
        added += 1
    else:
        updated += 1

print(f"Process complete.")
print(f"Added: {added}")
print(f"Updated: {updated}")
print(f"Total Words in DB: {SortonymWord.objects.count()}")
