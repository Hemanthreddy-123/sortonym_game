import os
import django
import sys

# Setup Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.models import SortonymWord

# Comprehensive word database with proper difficulty levels
words_data = [
    # Easy words (3-6 letters, 3 pairs needed)
    {
        "word": "Happy",
        "synonyms": "Joyful,Cheerful,Content,Delighted,Glad,Jolly",
        "antonyms": "Sad,Unhappy,Miserable,Depressed,Gloomy,Sorrowful"
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
    },
    {
        "word": "Hot",
        "synonyms": "Warm,Boiling,Scorching,Heated,Burning,Sizzling",
        "antonyms": "Cold,Cool,Freezing,Chilly,Icy,Frigid"
    },
    {
        "word": "Brave",
        "synonyms": "Courageous,Fearless,Valiant,Heroic,Bold,Daring",
        "antonyms": "Cowardly,Fearful,Timid,Afraid,Scared,Gutless"
    },
    {
        "word": "Light",
        "synonyms": "Bright,Luminous,Shining,Glowing,Radiant,Beaming",
        "antonyms": "Dark,Dim,Gloomy,Shadowy,Black,Obscure"
    },
    {
        "word": "Rich",
        "synonyms": "Wealthy,Prosperous,Affluent,Moneyed,Well-off,Opulent",
        "antonyms": "Poor,Penniless,Broke,Impoverished,Needy,Destitute"
    },
    {
        "word": "Strong",
        "synonyms": "Powerful,Mighty,Sturdy,Robust,Tough,Forceful",
        "antonyms": "Weak,Feeble,Frail,Delicate,Fragile,Powerless"
    },
    
    # Medium words (5-8 letters, 4 pairs needed)
    {
        "word": "Beautiful",
        "synonyms": "Attractive,Pretty,Gorgeous,Stunning,Lovely,Handsome",
        "antonyms": "Ugly,Unattractive,Plain,Homely,Grotesque,Hideous"
    },
    {
        "word": "Confident",
        "synonyms": "Assured,Certain,Self-assured,Bold,Secure,Positive",
        "antonyms": "Unsure,Insecure,Doubtful,Hesitant,Timid,Anxious"
    },
    {
        "word": "Creative",
        "synonyms": "Imaginative,Innovative,Artistic,Original,Inventive,Resourceful",
        "antonyms": "Unimaginative,Dull,Boring,Conventional,Unoriginal,Ordinary"
    },
    {
        "word": "Dangerous",
        "synonyms": "Hazardous,Risky,Unsafe,Perilous,Threatening,Treacherous",
        "antonyms": "Safe,Harmless,Secure,Protected,Stable,Risk-free"
    },
    {
        "word": "Expensive",
        "synonyms": "Costly,Pricey,Valuable,Precious,High-priced,Luxurious",
        "antonyms": "Cheap,Cheap,Inexpensive,Affordable,Budget,Economical"
    },
    {
        "word": "Generous",
        "synonyms": "Kind,Charitable,Giving,Benevolent,Liberous,Unselfish",
        "antonyms": "Selfish,Stingy,Miserly,Greedy,Mean,Inconsiderate"
    },
    {
        "word": "Popular",
        "synonyms": "Famous,Well-liked,Favored,Celebrated,Admired,Beloved",
        "antonyms": "Unpopular,Unknown,Obscure,Despised,Hated,Rejected"
    },
    {
        "word": "Powerful",
        "synonyms": "Strong,Mighty,Forceful,Influential,Dominant,Potent",
        "antonyms": "Powerless,Weak,Helpless,Ineffective,Impotent,Frail"
    },
    
    # Hard words (7-12 letters, 5 pairs needed)
    {
        "word": "Abundant",
        "synonyms": "Plentiful,Ample,Profuse,Abounding,Copious,Excessive",
        "antonyms": "Scarce,Rare,Insufficient,Limited,Lacking,Deficient"
    },
    {
        "word": "Ambiguous",
        "synonyms": "Unclear,Vague,Confusing,Obscure,Indefinite,Equivocal",
        "antonyms": "Clear,Definite,Specific,Explicit,Precise,Unambiguous"
    },
    {
        "word": "Controversial",
        "synonyms": "Debatable,Disputed,Contentious,Arguable,Questionable,Contested",
        "antonyms": "Uncontroversial,Accepted,Undisputed,Agreed,Unquestioned,Settled"
    },
    {
        "word": "Extraordinary",
        "synonyms": "Remarkable,Exceptional,Amazing,Incredible,Fantastic,Unusual",
        "antonyms": "Ordinary,Common,Normal,Average,Typical,Usual"
    },
    {
        "word": "Innovative",
        "synonyms": "Creative,Original,Inventive,Groundbreaking,Revolutionary,Fresh",
        "antonyms": "Traditional,Conventional,Unoriginal,Old-fashioned,Standard,Ordinary"
    },
    {
        "word": "Sophisticated",
        "synonyms": "Advanced,Complex,Refined,Elegant,Complicated,Developed",
        "antonyms": "Simple,Basic,Unsophisticated,Naive,Unrefined,Primitive"
    },
    {
        "word": "Traditional",
        "synonyms": "Conventional,Classic,Established,Customary,Standard,Heritage",
        "antonyms": "Modern,Contemporary,New,Innovative,Progressive,Unconventional"
    },
    {
        "word": "Overwhelming",
        "synonyms": "Overpowering,Devastating,Crushing,Overcoming,Staggering,Enormous",
        "antonyms": "Manageable,Controllable,Minor,Slight,Insignificant,Underwhelming"
    }
]

def seed_database():
    print("Starting comprehensive word seeding...")
    
    added_count = 0
    skipped_count = 0
    
    for entry in words_data:
        if not SortonymWord.objects.filter(word__iexact=entry["word"]).exists():
            SortonymWord.objects.create(
                word=entry["word"],
                synonyms=entry["synonyms"],
                antonyms=entry["antonyms"]
            )
            print(f"✅ Added word: {entry['word']}")
            added_count += 1
        else:
            print(f"⏭️  Skipped word: {entry['word']}")
            skipped_count += 1
    
    print(f"\n📊 Seeding completed!")
    print(f"   ✅ Added: {added_count} words")
    print(f"   ⏭️  Skipped: {skipped_count} words")
    print(f"   📚 Total words in database: {SortonymWord.objects.count()}")

if __name__ == "__main__":
    seed_database()
