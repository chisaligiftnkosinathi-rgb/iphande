# iPhande API Test Plan

## Manual Swagger Tests

### Health
- GET /health — Should return 200 OK

### Profiles
- POST /profiles — Create profile, expect 200 OK
- GET /profiles/{profile_id} — Retrieve profile, expect 200 OK
- GET /public/{slug} — Public profile, privacy respected
- PATCH /profiles/{profile_id}/location — Update location, expect 200 OK

### Business Lines
- GET /content-posts/business-lines — Returns all supported lines

### Content Posts
- POST /content-posts/generate — Generates post, returns valid JSON
- POST /content-posts — Create content post, expect 200 OK
- POST /content-posts/{content_post_id}/mark-shared — Mark as shared, expect 200 OK

### Opportunities
- POST /opportunities — Create opportunity, expect 200 OK
- GET /opportunities — List opportunities
- POST /opportunities/{opportunity_id}/timeline — Add timeline event
- GET /opportunities/{opportunity_id}/timeline — Get timeline

### Followups
- POST /followups — Create followup
- GET /followups/today — Get today’s followups
- PATCH /followups/{followup_id}/complete — Complete followup

### Reflections
- POST /reflections — Create reflection
- GET /reflections — List reflections

### Scripture Reflections
- POST /scripture-reflections — Create scripture reflection
- GET /scripture-reflections/daily/{owner_profile_id} — Get daily reflection

### Media
- POST /media — Create media
- GET /media — List media
- PATCH /media/{media_id} — Update media
- DELETE /media/{media_id} — Delete media

### Campaigns
- POST /campaigns — Create campaign
- GET /campaigns — List campaigns
- PATCH /campaigns/{campaign_id} — Update campaign
- DELETE /campaigns/{campaign_id} — Delete campaign

### Message Templates
- POST /message-templates — Create template
- GET /message-templates — List templates
- PATCH /message-templates/{template_id} — Update template
- DELETE /message-templates/{template_id} — Delete template
