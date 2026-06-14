# iPhande River Loop V1

**Status:** V1 architecture note  
**Scope:** Design boundary only; no new modules implemented here  
**Principle:** One river. Many instruments. One source of truth.

## Purpose

This note defines the iPhande V1 continuity river so the mobile app, Railway
API, Supabase, Steward Timeline, Replay Capture, and future VBA tools move as
one governed system instead of separate rooms.

The archive explains why the work exists. The river loop defines how V1 serves
real people.

## River Flow

```text
Business Home
↓
Continuity Inbox
↓
Steward Timeline
↓
Replay Capture
↓
Outcome / Testimony
↓
Next Loop
```

System roles:

```text
Mobile app
= field capture

Railway API
= river gate

Supabase
= continuity store

VBA tools
= admin / steward console

Timeline
= replay surface
```

Governed truth path:

```text
Android/Web
↓
Railway API
↓
Supabase

Excel VBA
↓
Railway API
↓
Supabase
```

VBA must not write directly to Supabase in V1. Direct database writes would
split the river and create multiple truth paths.

## Loop Definitions

### Business Home

Business Home is the steward's public and operational presence. It should show
who the business is, what continuity it carries, and what the next useful action
may be.

### Continuity Inbox

Continuity Inbox receives field signals: notes, media, requests, profile
updates, customer interactions, and other replay-worthy inputs.

### Steward Timeline

Steward Timeline makes the river visible. It shows what happened, when it
happened, what evidence exists, and what remains provisional.

### Replay Capture

Replay Capture turns an observed moment into a governed continuity event. It
must preserve memory, evidence, uncertainty, and stewardship context.

### Outcome / Testimony

Each loop should produce an outcome, testimony, decision, correction, or next
action. The system should not merely collect data; it should help continuity
move.

### Next Loop

Every outcome may become the beginning of the next loop. This keeps V1 alive,
practical, and service-oriented.

## API Role

The Railway API is the only V1 write gate.

Responsibilities:

- receive writes from Android/Web;
- receive approved future commands from VBA;
- validate input boundaries;
- create continuity events;
- expose read endpoints for replay surfaces;
- protect Supabase from direct client writes;
- keep `/health` independent from database availability;
- expose database reachability separately through `/db-health`.

## Supabase Role

Supabase is the V1 continuity store.

Responsibilities:

- store profiles;
- store continuity events;
- store replay-linked operational records;
- preserve relationships between field capture, timeline, and outcomes;
- remain behind the Railway API for V1 application writes.

Supabase may support auth and storage later, but V1 should not expand merely
because Supabase can do more.

## VBA Role

VBA tools are river instruments, not isolated Excel systems.

VBA Console V1 should observe the river before it controls the river.

Allowed V1 posture:

```text
Read mostly
Observe
Summarize
Support admin review
```

Not allowed by default:

```text
Direct Supabase writes
Independent truth records
Unapproved mutation commands
Parallel databases
```

Future VBA API endpoints may include:

```text
GET  /admin/vba/dashboard
GET  /admin/vba/continuity-events
GET  /admin/vba/profiles
POST /admin/vba/continuity-events
```

For V1, `POST` commands should remain unavailable or explicitly approved before
implementation.

## V1 Boundaries

V1 is limited to:

- Business Home;
- Continuity Inbox;
- Steward Timeline;
- Profile;
- Replay Capture.

V1 should not expand into:

- new database infrastructure;
- direct VBA database writes;
- AI expansion;
- economic continuity layer;
- books, albums, or archive growth as product blockers;
- additional modules before the core loop works on Android.

Every loop should produce a `continuity_event`.

## Next Implementation Checklist

1. Confirm Android uses Railway API and `/health` reports alive.
2. Confirm Business Home loads with the Railway API debug text.
3. Confirm Profile can create or retrieve a real business profile.
4. Confirm Continuity Inbox can create a field capture.
5. Confirm each capture creates or links to a `continuity_event`.
6. Confirm Steward Timeline reads replay data from the Railway API.
7. Add read-only VBA endpoints only after the mobile loop is stable.
8. Keep VBA writes disabled until a specific steward command is approved.

## Governing Sentence

```text
One river.
Many instruments.
One source of truth.
```
