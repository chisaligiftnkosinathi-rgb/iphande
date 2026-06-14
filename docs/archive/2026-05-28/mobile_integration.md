# iPhande Mobile Integration

## Purpose

Guidance for integrating the React Native / Expo mobile app with the iPhande backend.

---

## Expo Structure

- `App.tsx` entry point
- Screens: profile, location, opportunities, replay timeline, media, reflections, campaigns, content generator

---

## Auth Flow

- Pending. Document when implemented.
- Current replay ownership uses a clearly marked demo-only identity source.

---

## API Base URL

- Local development: `http://127.0.0.1:8000/api/v1/`
- Phone testing: `http://YOUR_LAPTOP_LAN_IP:8000/api/v1/`
- Configure with `EXPO_PUBLIC_API_URL`.
- Use environment variables for production.

---

## Replay Screen Mapping

- Replay timeline: `GET /continuity-events/business/{business_owner_id}`
- Event detail: `GET /continuity-events/{event_id}`
- Entity replay: `GET /continuity-events/entity/{entity_id}`
- Causal graph: `GET /continuity-events/{event_id}/graph`

---

## Caching & Offline

- Use local storage for caching profiles, opportunities, and posts.
- Plan for offline-first posture after live replay validation.

---

## Image Upload

- Use multipart/form-data for media endpoints.
- Store only business-appropriate images.

---

## Share Behavior

- Use WhatsApp/Facebook share URLs from content generator.
- User reviews content before sharing.

---

## Error Handling

- Display backend error messages to user where appropriate.
- Handle 422/404/500 gracefully.
- Replay screens should show explicit retry actions when API calls fail.

---

## See Also

- `docs/api_contract.md`
- `docs/operating_docs.md`
