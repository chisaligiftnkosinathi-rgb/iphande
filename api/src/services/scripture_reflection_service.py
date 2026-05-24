from datetime import date

SCRIPTURE_MAP = {
    "many_rejections": {
        "reference": "Galatians 6:9",
        "text": "Let us not grow weary of doing good...",
        "note": "Your effort is not invisible. Continue with wisdom and peace."
    },
    "followup_pressure": {
        "reference": "Proverbs 16:3",
        "text": "Commit your work to the Lord...",
        "note": "Your follow-ups can be ordered, calm, and intentional."
    },
    "overwhelmed": {
        "reference": "Matthew 11:28",
        "text": "Come to me, all who labor...",
        "note": "You are allowed to pause, breathe, and continue with grace."
    },
    "slow_week": {
        "reference": "Zechariah 4:10",
        "text": "Do not despise these small beginnings...",
        "note": "Small steps still count when they are faithful."
    },
    "lost_opportunity": {
        "reference": "Isaiah 43:19",
        "text": "Behold, I am doing a new thing...",
        "note": "One closed door does not end the journey."
    },
    "new_opportunity": {
        "reference": "Colossians 3:23",
        "text": "Whatever you do, work heartily...",
        "note": "Steward this opportunity with excellence and humility."
    },
    "gratitude": {
        "reference": "1 Thessalonians 5:18",
        "text": "Give thanks in all circumstances...",
        "note": "Pause and recognize grace in today’s progress."
    },
    "courage": {
        "reference": "Joshua 1:9",
        "text": "Be strong and courageous...",
        "note": "You do not have to move in fear."
    },
}

def get_scripture_for_situation(situation_key: str):
    return SCRIPTURE_MAP.get(situation_key)
