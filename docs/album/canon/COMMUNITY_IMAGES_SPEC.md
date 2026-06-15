# Community Images Specification

## Purpose
Add image support to community features to make the platform feel alive, human, and grounded in reality.

## Schema Updates
**Opportunity:**
- `title`
- `description`
- `image_1`
- `image_2`
- `category`
- `location`
- `contact_method`
- `expiry_date`

**Advertisement:**
- `title`
- `description`
- `image_1`
- `image_2`
- `category`
- `location`
- `contact_method`
- `expiry_date`

## Implementation Rules
1. **Optional:** Images are never mandatory.
2. **Mobile Friendly:** Optimization for viewing and uploading on mobile devices.
3. **Fallback:** Always display a graceful fallback card/placeholder if no image is provided.
4. **Resilience:** The application must not crash if an image fails to load.
