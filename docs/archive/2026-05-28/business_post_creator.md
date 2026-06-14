# iPhande Advanced Business Post Creator

## Goal
Upgrade the content creator so it generates business-deterministic posts designed to create real customer action, especially quote requests.

It must support:
- Facebook
- WhatsApp
- TikTok

It must remain deterministic, simple, and business-aware.

---

## Core Principle
The post must not just sound nice.
It must answer:
1. What is being offered?
2. Who is it for?
3. Why should they care now?
4. What should they do next?
5. How does this create a quote request?

---

## UX Language
Show users:
- "Create Business Post"
- or: "Create Lead Post"

---

## Required Inputs
- business_category_key
- business_line
- goal_key
- platform
- tone
- offer_details
- location
- contact_method

### Platform values:
- facebook
- whatsapp
- tiktok

### Goal values:
- promote_today
- get_bookings
- share_price_list
- announce_availability
- follow_up_customers
- build_trust
- request_quotes

---

## Post Structure
Every generated post should include:
- hook
- offer
- trust_builder
- call_to_action
- quote_request_prompt
- hashtags
- platform_notes

Example output JSON:
```
{
  "platform": "facebook",
  "business_category_key": "commission_based_sales",
  "business_line": "Funeral Cover Agent",
  "goal_key": "request_quotes",
  "hook": "Protect your family before the unexpected happens.",
  "offer": "I help families find funeral cover options that fit their needs and monthly budget.",
  "trust_builder": "Clear information, simple guidance, and respectful support.",
  "call_to_action": "Send me a message to request a quote.",
  "quote_request_prompt": "Tap Request Quote and I will contact you with options.",
  "caption": "Protect your family before the unexpected happens...\n\nI help families find funeral cover options that fit their needs and monthly budget.\n\nSend me a message to request a quote.",
  "hashtags": ["#FuneralCover", "#FamilyCover", "#SouthAfrica", "#iPhande"],
  "platform_notes": [
    "Use a clear family-focused image.",
    "Avoid making guaranteed approval claims.",
    "Keep the CTA simple."
  ],
  "deterministic": true
}
```

---

## Platform Rules

### Facebook
- 80–180 words
- clear CTA
- location-friendly
- include 3–6 hashtags
- good for “Request Quote”

### WhatsApp
- short and direct
- 30–80 words
- include phone/WhatsApp CTA
- no hashtag overload
- should feel personal

### TikTok
- create video idea
- opening 3-second hook
- short script
- caption
- CTA in video and caption
- hashtags

TikTok output should include:
```
{
  "video_hook": "...",
  "video_script": "...",
  "caption": "...",
  "cta": "...",
  "hashtags": []
}
```

---

## Business-Specific Deterministic Rules

Extend `src/data/business_content_rules.py` with platform-aware rules and lead-focused goals.

---

## Commission-Based Sales Rules
- Avoid guaranteed approval claims, fake income claims, fear manipulation, pressure selling, pretending to be official without proof
- Use safe language: “I can help explain options”, “Request a quote”, “Ask for more information”, “Compare what may suit your family”

---

## Backend Output Contract
Output must include:
- caption
- platform
- hook
- offer
- trust_builder
- call_to_action
- quote_request_prompt
- hashtags
- platform_notes
- business_category_key
- business_line
- goal_key
- rules_used
- deterministic (true)

---

## Event Emission
After successful content generation, emit continuity event:
- event_type = content_generated
- actor_type = business_owner
- related_entity_type = content_post
- related_entity_id = generated_content_id or fallback generated timestamp/id
- payload: platform, goal_key, business_line, caption_preview (first 120 chars)

---

## Mobile UX
- Heading: "Create Business Post"
- Platform selection: Facebook, WhatsApp, TikTok
- Goal selection: Get Quotes, Get Bookings, Promote Today, Build Trust
- After generation: show Generated Post, Copy, Share, Request Quote
- For TikTok: show Video Hook, Video Script, Caption

---

## Verification
- Backend: compile all related files
- Mobile: npx tsc --noEmit
- Manual test: generate post, confirm output structure, confirm continuity event

---

Content is for continuity, not just attention. Content that leads to quote requests.
