# Remembrance Archive Standard

This document outlines the governing standard for creating and maintaining permanent archives within the iPhande repository. 

A seed becomes legacy when it is preserved. Many experience moments; few preserve them. This standard ensures that significant events—births, family gatherings, testimonies, milestones, and breakthroughs—are preserved in a repeatable, structured manner.

## 1. Archive Structure

Every archive must follow a strict, hierarchical folder structure based on category, year, and specific event.

```text
archives/
└── [category]/
    └── [YYYY]/
        └── [YYYY-MM-DD-event-name]/
            ├── README.md
            ├── EVENT_METADATA.json
            ├── OBSERVATION_SCROLL.md
            └── photos/
```

### Supported Categories
- `family` (e.g., baby showers, weddings, reunions)
- `testimonies` (e.g., answered prayers, breakthroughs)
- `milestones` (e.g., graduations, specific achievements)
- `kingdom` (e.g., kingdom observations, prophetic moments)
- `axionyx` (e.g., AXIONYX milestones, iPhande releases)

## 2. Naming Conventions

### Folder Naming
- Event folders must be prefixed with the ISO 8601 date: `YYYY-MM-DD`.
- Words must be lowercase and separated by hyphens (kebab-case).
- Example: `2026-06-21-baby-shower`

### Photo Naming Rules
Photos must be renamed from their generic device names (e.g., `IMG-1234.jpg`) to meaningful, descriptive names.
- Format: `[event-name]-[description]-[sequence-number].[ext]`
- Example: `baby-shower-family-photo-01.jpg`
- Example: `baby-shower-group-photo-01.jpg`

## 3. Metadata Requirements (`EVENT_METADATA.json`)

Each archive must include a structured JSON file detailing the event's metadata. This enables future programmatic parsing and querying.

```json
{
  "event_type": "event_identifier",
  "event_date": "YYYY-MM-DD",
  "archive_category": "category_name",
  "title": "Human Readable Title",
  "tags": ["tag1", "tag2"],
  "photo_count": 0,
  "status": "archived"
}
```

## 4. Observation Scroll Requirements (`OBSERVATION_SCROLL.md`)

The Observation Scroll captures the *meaning* behind the event. Photos capture what things looked like; the Observation Scroll captures what things *meant*.

### Sections:
1. **Title & Date**: Context of the scroll.
2. **The Observation**: A narrative reflection on the event, principles witnessed, or truths revealed.
3. **Themes**: A bulleted list of core themes (e.g., Legacy, Promise, Stewardship).
4. **Reflection**: A concluding thought or meditation on the broader impact.

## 5. README (`README.md`)

The README serves as the entry point for the archive folder, summarizing its purpose and contents.

### Sections:
1. **Title**: Name of the Archive.
2. **Archive Date**: `YYYY-MM-DD`.
3. **Purpose**: Why this event was preserved.
4. **Associated Files**: A list of key files in the directory.

## 6. Git Commit Conventions

Commits adding new archives must follow a specific semantic format to maintain history clarity:

```text
feat(archive): preserve YYYY-MM-DD [event name] remembrance archive
```
*Example: `feat(archive): preserve 2026-06-21 baby shower remembrance archive`*

## 7. Preservation Principles

1. **Intentionality**: We do not just store files; we curate legacy.
2. **Context**: A photo without context is just an image. A photo with an Observation Scroll is a memory.
3. **Permanence**: Once archived, the record is permanent.
4. **Structure**: Order protects memory. Adherence to this standard ensures the archive remains accessible to future generations.
