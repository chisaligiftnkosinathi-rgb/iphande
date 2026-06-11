import uuid
from datetime import datetime

# Foundational Wisdom Archetypes across your core steward themes
CORE_WISDOM_POOL = {
    "love_community": [
        {"book": "Galatians", "chapter": 6, "verse": "2", "text": "Carry each other’s burdens, and in this way you will fulfill the law of Christ.", "prompt": "Which steward or partner in your ecosystem can you reach out to today to lift a operational burden?"},
        {"book": "1 John", "chapter": 3, "verse": "18", "text": "Dear children, let us not love with words or speech but with actions and in truth.", "prompt": "How can your business services manifest physical, practical care in your community today?"},
        {"book": "1 Corinthians", "chapter": 16, "verse": "14", "text": "Do everything in love.", "prompt": "Review your hardest client or team interaction today. How can you approach it with genuine care?"},
        {"book": "Hebrews", "chapter": 10, "verse": "24", "text": "And let us consider how we may spur one another on toward love and good deeds.", "prompt": "Identify a small business owner near you. Send them an encouraging word or share their profile link."}
    ],
    "faith_endurance": [
        {"book": "Galatians", "chapter": 6, "verse": "9", "text": "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.", "prompt": "Continuity outlasts immediate visibility. What long-term project must you keep building despite zero noise?"},
        {"book": "Hebrews", "chapter": 11, "verse": "1", "text": "Now faith is confidence in what we hope for and assurance about what we do not see.", "prompt": "What vision for your platform or business requires your absolute belief today before the numbers show up?"},
        {"book": "James", "chapter": 1, "verse": "3", "text": "Because you know that the testing of your faith produces perseverance.", "prompt": "Look at your current bottleneck. How is this testing shaping your long-term operational resilience?"},
        {"book": "Proverbs", "chapter": 16, "verse": "3", "text": "Commit to the Lord whatever you do, and he will establish your plans.", "prompt": "Hand over your primary revenue target for this quarter. Let your work flow from dedication, not desperation."}
    ],
    "confusion": [
        {"book": "James", "chapter": 1, "verse": "5", "text": "If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.", "prompt": "Stop the analysis paralysis. Write down the core question and ask for clear discernment before moving."},
        {"book": "Proverbs", "chapter": 3, "verse": "5-6", "text": "Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", "prompt": "Where are you overthinking or building complex theories? Strip it back to simple submission."},
        {"book": "Isaiah", "chapter": 30, "verse": "21", "text": "Your ears will hear a voice behind you, saying, 'This is the way; walk in it.'", "prompt": "Quiet the external dashboard noise. Sit in absolute silence for 5 minutes to hear your course correction."},
        {"book": "Psalm 119:105", "book_clean": "Psalms", "chapter": 119, "verse": "105", "text": "Your word is a lamp for my feet, a light on my path.", "prompt": "You do not need to see the 5-year roadmap today. Do you have enough clarity for the very next step?"}
    ],
    "comfort_peace": [
        {"book": "Philippians", "chapter": 4, "verse": "6-7", "text": "Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God.", "prompt": "Anxiety locks up strategic execution. What is the single biggest worry keeping you awake? Release it."},
        {"book": "John", "chapter": 14, "verse": "27", "text": "Peace I leave with you; my peace I give you. I do not give to you as the world gives.", "prompt": "The market cannot grant you peace, and market shifts cannot break it. Anchor down in this reality."},
        {"book": "Isaiah", "clock": "41", "chapter": 41, "verse": "10", "text": "So do not fear, for I am with you; do not be dismayed, for I am your God.", "prompt": "Even if a contract fails or a pipeline stalls, your security is absolute. Rest your mind tonight."},
        {"book": "Matthew", "chapter": 11, "verse": "28", "text": "Come to me, all you who are weary and burdened, and I will give you rest.", "prompt": "Burnout is not badge of honor for a steward. Log off, power down, and let your spirit recover."}
    ]
}

def generate_366_seed_manifest():
    """
    Programmatically scales up the core pools to generate exactly 366
    chronological daily records mapped perfectly across categories.
    """
    seeds = []
    categories = list(CORE_WISDOM_POOL.keys())

    for day in range(1, 367):
        # Evenly cycle categories and content sequences across all 366 slots
        category_key = categories[day % len(categories)]
        pool = CORE_WISDOM_POOL[category_key]
        verse_item = pool[day % len(pool)]

        seeds.append({
            "id": str(uuid.uuid4()),
            "day_of_year": day,
            "category_key": category_key,
            "book": verse_item.get("book_clean", verse_item["book"]),
            "chapter": verse_item["chapter"],
            "verse_locator": verse_item["verse"],
            "verse_text": verse_item["text"],
            "grace_reflection_prompt": verse_item["prompt"]
        })
    return seeds
