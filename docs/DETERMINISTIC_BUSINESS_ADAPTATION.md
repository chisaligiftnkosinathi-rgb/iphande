# DETERMINISTIC_BUSINESS_ADAPTATION.md

## What does deterministic mean?
Deterministic means iPhande adapts to the user’s selected business identity and never guesses, ranks, or randomizes business meaning. The platform always uses the saved business category and line for all adaptation and content guidance.

## Why is business identity saved once?
To ensure clarity, trust, and a simple onboarding experience. The user selects their business category and line once, and the app adapts everywhere based on that identity. No repeated questions, no guessing, no hidden logic.

## How do category rules work?
Each business category (sector) has a set of deterministic rules:
- Default call-to-action
- Default prompt
- Profile guidance
- Suggested tags
- Goal-specific prompts

These rules are defined in `business_content_rules.py` and are used by the backend to generate content and guide the user.

## Supported goal keys
- promote_today
- get_bookings
- share_price_list
- announce_availability
- follow_up_customers
- build_trust

## API output contract
Content generation returns:
```json
{
  "content": "Generated content text here",
  "business_category_key": "food_and_catering",
  "business_line": "Home Baker",
  "goal_key": "promote_today",
  "rules_used": "food_and_catering",
  "default_cta": "Place your order today.",
  "suggested_tags": ["food", "catering", "kasi_food"],
  "profile_guidance": [
    "Add your menu.",
    "Add your prices."
  ],
  "deterministic": true
}
```

## Mobile onboarding flow
1. User selects sector (business category)
2. User selects business line
3. User saves profile
4. App reuses saved identity everywhere

## Boundaries
- No random.choice
- No ranking
- No guessing
- No “best business” labels
- No fake intelligence
- No hidden scoring
- No trust scores
- No fake authority

## Why?
This approach ensures iPhande is African-first, transparent, and simple. It supports visibility, continuity, follow-up, discovery, and guided content for all businesses without bias or confusion.
