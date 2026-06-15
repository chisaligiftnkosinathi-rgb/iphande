# MEDIA UPLOAD ENGINE V1

## Purpose
To provide a stable, reliable media layer for iPhande V1, preventing the system from relying on loose, unverified URLs.

## The Doctrine
> Upload once ↓ Store safely ↓ Generate reliable public URL ↓ Render with fallback ↓ Reuse across profile, opportunities, ads, proof, PDFs

## Infrastructure
**Storage Provider:** Supabase Storage
**Database Layer:** Image URLs saved securely in the database.

## Supported Media Types
- Profile logos
- Opportunity images
- Advertisement images
- Proof-of-work photos
- Document/PDF images

## Strict Implementation Rules
1. **Limits:** Maximum 2 images per opportunity or advertisement.
2. **Formats:** Accept `.jpg`, `.png`, `.webp`.
3. **Optimization:** Compress images before upload on the client side if possible to save bandwidth and storage.
4. **Resilience:** Always show a graceful fallback placeholder if an image fails to load. The app must *never* crash because an image is missing.
5. **UI Consistency:** Use `resizeMode="cover"` and keep aspect ratios consistent across list views and detail cards.

## Future Evolution
A dedicated backend/media processing service may be added later, but Supabase Storage serves as the clean, stable foundation for V1.
