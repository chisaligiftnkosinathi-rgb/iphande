# iPhande VBA Admin Control Plan

**Status:** Planning document  
**Boundary:** No API integration or VBA automation is implemented by this plan.

## Purpose

The VBA workbook is an admin control layer for iPhande. It supports learning, operational visibility, manual administration, reporting, imports, and exports.

It does not replace the mobile app, backend API, replay system, or SQLite database.

## System Layers

```text
Mobile App = user-facing field tool
API = governed logic + replay + persistence
SQLite = operational database
Excel/VBA = admin dashboard + control room
```

## Current iPhande Workflow Map

The current content and replay workflow follows this operational chain:

```text
Business Owner
↓
Business Category
↓
Business Line
↓
Content Goal
↓
Generated Post
↓
Replay Events
↓
Timeline View
```

## Current Replay Contract

Generated content must remain lineage-visible. The governed generation chain is:

```text
prompt_context_built
template_selected
public_caption_composed
platform_format_applied
content_generated
```

This chain is the minimum explainability contract for generated communication.

## Future Workbook Sheet Direction

The admin workbook may grow toward this structure:

| Sheet | Purpose |
| --- | --- |
| `Dashboard` | Main admin control room |
| `BusinessOwners` | Business owner registry |
| `BusinessCategories` | Category reference data |
| `BusinessLines` | Business line reference data |
| `ContentPosts` | Generated and exported content posts |
| `ReplayEvents` | Replay lineage and event history |
| `APISyncLog` | API import/export and sync attempts |
| `Settings` | API URL, constants, and workbook configuration |

## Future Admin Capabilities

The workbook may eventually support:

- Add business owner
- View content posts
- View replay events
- Export records
- Import or sync from API
- Push selected admin data to API
- Generate reports

## Future API Direction

When integration begins, VBA should call the local API rather than writing directly to SQLite.

Expected local API base:

```text
http://127.0.0.1:8000
```

The API remains responsible for validation, persistence, replay lineage, and governed transaction boundaries.

## Manual Continuity Simulation Milestone

Validated the operational continuity chain manually inside Excel:

```text
BusinessOwners
↓
ContentPosts
↓
ReplayEvents
```

Verified:

- `OwnerID` preserves ownership continuity.
- `ParentEventID` preserves causal replay lineage.
- Workbook structure mirrors iPhande replay architecture.
- Excel/VBA can function as an operational admin memory layer without bypassing API governance.

The workbook now models:

```text
Business Owner
↓
Generated Content
↓
Replay Event Lineage
```

This confirms that Excel can support operational memory while the API remains the governed execution and persistence boundary.

## Dashboard Verification Milestone

Validated the workbook dashboard as a readable admin view over operational memory.

The `Dashboard` sheet now resolves:

```text
Selected OwnerID -> Business name
Selected ContentPostID -> Caption
Selected ContentPostID -> Replay event count
```

Verified output:

```text
Grace Funeral Services
Affordable funeral cover options for families.
4 replay events
```

Workbook flow now reads:

```text
BusinessOwners
↓
ContentPosts
↓
ReplayEvents
↓
Dashboard
```

Compatibility note:

- `XLOOKUP` returned `#NAME?` in this Excel environment.
- `VLOOKUP` with `IFERROR` is safer for older Excel environments.

## Governed Navigation Layer Milestone

Added `SystemNavigation` as a lightweight navigation contract for future admin movement.

Navigation records define:

```text
NavKey
Label
TargetSheet
TargetCell
Context
```

Initial navigation keys:

| NavKey | Label | TargetSheet | TargetCell | Context |
| --- | --- | --- | --- | --- |
| `NAV001` | Dashboard | Dashboard | B2 | Main Control |
| `NAV002` | Owners | BusinessOwners | A1 | Owner Registry |
| `NAV003` | Templates | BusinessTemplates | A1 | Template Registry |
| `NAV004` | Posts | ContentPosts | A1 | Generated Content |
| `NAV005` | Replay | ReplayEvents | A1 | Replay Timeline |

Dashboard navigation state:

```text
B2 = SelectedNavigationKey
B17 = resolved target sheet
B18 = resolved target cell
B19 = resolved navigation context
```

Verified:

```text
NAV001 -> Dashboard, B2, Main Control
NAV003 -> BusinessTemplates, A1, Template Registry
```

This keeps future buttons and macros aligned to a governed navigation contract instead of hardcoded sheet jumps.

## Manual Admin Action Log Milestone

Added `AdminActions` as a steward-visible manual audit trail.

Action records define:

```text
ActionID
ActionTimestamp
Actor
ActionType
SourceSheet
TargetSheet
TargetCell
RelatedOwnerID
RelatedContentPostID
RelatedReplayEventID
ActionNote
```

Initial action:

```text
ACT001 | 2026-05-24 | Steward | navigation_verified | Dashboard | BusinessTemplates | A1 | BO002 | | | Verified NAV003 resolves correctly
```

Dashboard latest-action state:

```text
B21 = LatestActionID
B22 = LatestActionType
B23 = LatestActionNote
```

Verified output:

```text
ACT001
navigation_verified
Verified NAV003 resolves correctly
```

This creates the governed chain:

```text
selected navigation
↓
resolved destination
↓
logged steward action
↓
visible latest action
```

## Controlled Action Intents Milestone

Added `ActionIntents` as a declared operation layer before executable VBA automation exists.

Intent records define:

```text
IntentID
IntentType
SourceContext
TargetContext
RequiresOwnerID
RequiresReplayReference
Status
```

Initial intents:

| IntentID | IntentType | SourceContext | TargetContext | RequiresOwnerID | RequiresReplayReference | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `INT001` | open_navigation | Dashboard | BusinessTemplates | FALSE | FALSE | approved |
| `INT002` | create_content_post | Dashboard | ContentPosts | TRUE | TRUE | planned |

Dashboard intent state:

```text
B25 = SelectedIntentID
B26 = resolved intent type
B27 = resolved intent status
```

Verified:

```text
INT001 -> open_navigation, approved
INT002 -> create_content_post, planned
```

The workbook now separates declared operational intent from future executable automation.

## Execution Readiness Milestone

Added `ExecutionReadiness` as a declarative safety gate between selected intent and future executable automation.

Readiness records define:

```text
ReadinessID
IntentID
OwnerRequiredSatisfied
ReplayRequiredSatisfied
NavigationResolved
Status
BlockReason
```

Initial readiness states:

| ReadinessID | IntentID | OwnerRequiredSatisfied | ReplayRequiredSatisfied | NavigationResolved | Status | BlockReason |
| --- | --- | --- | --- | --- | --- | --- |
| `RDY001` | INT001 | TRUE | TRUE | TRUE | ready | |
| `RDY002` | INT002 | FALSE | FALSE | TRUE | blocked | OwnerID and replay reference required before execution |

Dashboard readiness state:

```text
B29 = SelectedReadinessID
B30 = resolved readiness status
B31 = resolved block reason
```

Verified:

```text
RDY001 -> ready
RDY002 -> blocked, OwnerID and replay reference required before execution
```

This creates the governed chain:

```text
selected intent
↓
readiness check
↓
ready or blocked
↓
future macro allowed or denied
```

## Macro Command Registry Milestone

Added `MacroCommandRegistry` as a declared command catalogue before any VBA command code exists.

Command records define:

```text
CommandID
CommandName
LinkedIntentID
RequiresReadinessStatus
AllowedTargetSheet
CommandStatus
Notes
```

Initial commands:

| CommandID | CommandName | LinkedIntentID | RequiresReadinessStatus | AllowedTargetSheet | CommandStatus | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `CMD001` | GoToResolvedNavigation | INT001 | ready | any | planned | Opens the resolved navigation target only when readiness is ready |
| `CMD002` | CreateContentPostDraft | INT002 | ready | ContentPosts | blocked | Must not run until owner and replay reference are satisfied |

Dashboard command state:

```text
B33 = SelectedCommandID
B34 = resolved command name
B35 = resolved command status
```

Verified:

```text
CMD001 -> GoToResolvedNavigation, planned
CMD002 -> CreateContentPostDraft, blocked
```

Future VBA should execute declared commands from this registry, not hidden or arbitrary behavior.

## Command Execution Guardrail Milestone

Added a dashboard-level execution gate:

```text
A37 = CanExecuteCommand
B37 = TRUE or FALSE
```

Formula:

```text
=AND(OR(B35="planned",B35="approved"),B30="ready")
```

Verified:

```text
CMD001 + RDY001 -> TRUE
CMD002 + RDY002 -> FALSE
```

Future VBA must treat this as the command gate:

```text
CanExecuteCommand = TRUE -> macro may run
CanExecuteCommand = FALSE -> macro must refuse
```

## First Governed VBA Command Draft

Drafted the first bounded VBA command:

```text
CMD001 -> GoToResolvedNavigation
```

The command is intentionally limited to governed movement only.

Required behavior:

1. Read `Dashboard!B37`.
2. Refuse execution when `CanExecuteCommand` is `FALSE`.
3. Confirm the selected command is `CMD001`.
4. Read resolved target sheet and target cell from the dashboard.
5. Navigate only to the resolved target.
6. Append an `AdminActions` row.
7. Never mutate business data.

Exported module:

```text
tools\vba\exports\modGovernedNavigation.bas
```

Environment note:

Programmatic insertion into the workbook VBA project was blocked because Excel did not expose a usable `VBProject` object in this environment. The governed macro is preserved as an importable `.bas` module until the workbook VBA project can be edited interactively.

## Replay-Linked Execution Milestone

Extended `AdminActions` so executable workbook actions can form replayable chains instead of isolated log rows.

Added columns:

```text
ParentActionID
ExecutionSessionID
```

Verified executable action:

```text
ACT002
navigation_executed
Executed CMD001 navigation to Dashboard!B2
ExecutionSessionID = SES001
```

Execution continuity model:

```text
ExecutionSessionID = groups related steward actions
ParentActionID = links one action to the prior causal action
```

This prepares future workbook automation for:

- multi-step workflows
- governed drafts
- API synchronization
- replay reconstruction
- steward timelines

## Execution Session Registry Milestone

Added `ExecutionSessions` as the container for replay-linked steward actions.

Session records define:

```text
ExecutionSessionID
StartedAt
StartedBy
SessionPurpose
SessionStatus
ClosedAt
ClosureNote
```

Initial session:

```text
SES001 | 2026-05-24 | Steward | First governed navigation execution | open | |
```

Dashboard session state:

```text
B39 = CurrentExecutionSessionID
B40 = resolved session status
```

Verified:

```text
SES001 -> open
```

Execution sessions group related `AdminActions` rows so future workbook workflows can be replayed as sessions rather than disconnected actions.

## Execution Session Closure Milestone

Added session closure rules to `ExecutionSessions`.

Closure fields:

```text
ExpectedActionCount
ActualActionCount
CanCloseSession
```

For `SES001`:

```text
ExpectedActionCount = 1
ActualActionCount = COUNTIF(AdminActions!M:M,A2)
CanCloseSession = ActualActionCount >= ExpectedActionCount
```

Verified:

```text
ActualActionCount = 1
CanCloseSession = TRUE
```

Closed session:

```text
SessionStatus = closed
ClosedAt = 2026-05-24
ClosureNote = First governed navigation execution completed and logged
```

This seals the first executable replay session with an explicit completion rule.

## CMD002 Pre-Execution Contract

`CMD002` may not be implemented until the workbook can prove:

1. Selected `OwnerID` is present.
2. Selected `TemplateKey` resolves from `OwnerID`.
3. Draft `ContentPostID` can be reserved.
4. `ParentEventID` or replay reference exists.
5. `ExecutionSessionID` is open.
6. `CanExecuteCommand = TRUE`.
7. `AdminActions` can log both success and refusal.
8. Business data mutation is limited to draft creation only.

Required order:

```text
doctrine first
↓
checklist second
↓
formulas third
↓
only then VBA
```

## CMD002 Readiness Overview Milestone

Added a dashboard readiness overview for the `CMD002ReadinessChecklist`.

Dashboard fields:

```text
B43 = Total CMD002 Checks
B44 = Completed Checks
B45 = Blocked Checks
B46 = CMD002 Ready
```

Formula intent:

```text
CMD002 Ready = TRUE
only when all checks are completed and blocked checks equal 0
```

Verified current state:

```text
Total Checks = 8
Completed Checks = 0
Blocked Checks = 0
CMD002 Ready = FALSE
```

This exposes checklist state before any future content-creation macro is allowed.

## Draft Mutation Boundary Milestone

Added `DraftMutationBoundary` to define what business data mutation may eventually be allowed before implementation exists.

Boundary records define:

```text
BoundaryID
AllowedMutation
TargetTable
MutationScope
ReplayRequired
OwnerRequired
Status
```

Initial boundary:

```text
BND001 | create_draft_content_post | ContentPosts | insert_only | TRUE | TRUE | planned
```

Dashboard boundary state:

```text
B47 = SelectedBoundaryID
B48 = resolved allowed mutation
B49 = resolved mutation status
```

Verified:

```text
BND001
create_draft_content_post
planned
```

This defines the constitutional mutation limit before any future `CMD002` formulas or VBA are introduced.

## Replay Mutation Contract Milestone

Added `ReplayMutationContract` to bind allowed mutation boundaries to required replay continuity.

Contract records define:

```text
ContractID
MutationBoundaryID
RequiredReplayEventType
ReplayGenerationMode
ReplayStatus
Notes
```

Initial contract:

```text
RPC001 | BND001 | content_post_draft_created | append_only | planned | CMD002 must create replay continuity immediately after draft insertion
```

Doctrine:

```text
No business mutation may exist without replay continuity.
```

For `CMD002`, this means draft content creation must not be treated as complete unless replay continuity is appended in the same governed workflow.

## Draft Content Post Schema Milestone

Added `DraftContentPostSchema` to define the exact draft content fields `CMD002` may eventually create.

Schema fields:

| FieldName | Required | Source | MutationMode | ReplayLinked | Status |
| --- | --- | --- | --- | --- | --- |
| `ContentPostID` | TRUE | generated | insert_only | TRUE | planned |
| `OwnerID` | TRUE | Dashboard selected owner | insert_only | TRUE | planned |
| `TemplateKey` | TRUE | inherited from owner | insert_only | TRUE | planned |
| `PostStatus` | TRUE | default=draft | insert_only | TRUE | planned |
| `ParentEventID` | TRUE | replay continuity | insert_only | TRUE | planned |

This creates a schema boundary for `CMD002` before formulas or VBA behavior exist.

## Draft Replay Event Schema Milestone

Added `DraftReplayEventSchema` to define the replay-side fields `CMD002` must append when a draft content post is created.

Schema fields:

| ReplayField | Required | Source | AppendMode | LinkedContentField | Status |
| --- | --- | --- | --- | --- | --- |
| `ReplayEventID` | TRUE | generated | append_only | ParentEventID | planned |
| `EventType` | TRUE | fixed=content_post_draft_created | append_only | PostStatus | planned |
| `RelatedContentPostID` | TRUE | ContentPostID | append_only | ContentPostID | planned |
| `RelatedOwnerID` | TRUE | OwnerID | append_only | OwnerID | planned |
| `ExecutionSessionID` | TRUE | active session | append_only | ParentEventID | planned |

This creates the replay schema boundary before `CMD002` replay generation exists.

## CMD002 Atomicity Rule Milestone

Added `CMD002AtomicityRule` to define the transaction boundary doctrine for future draft creation.

Atomicity rule:

```text
ATM001 | CMD002 | TRUE | TRUE | abort_if_either_side_missing | planned
```

Meaning:

```text
Draft content post insert
+
Replay event append
=
one governed unit
```

The draft content post and replay event must succeed together, or neither should be considered valid.

This mirrors the broader iPhande replay doctrine:

```text
No persisted content output without replay lineage.
```

## CMD002 Failure Registry Milestone

Added `CMD002FailureRegistry` to define governed refusal and abort behavior before mutation automation exists.

Failure records define:

```text
FailureID
FailureCondition
DetectionSource
RequiredBehavior
SessionImpact
Status
```

Initial failures:

| FailureID | FailureCondition | DetectionSource | RequiredBehavior | SessionImpact | Status |
| --- | --- | --- | --- | --- | --- |
| `FAIL001` | Missing OwnerID | CMD002ReadinessChecklist | refuse_execution | keep_session_open | planned |
| `FAIL002` | Replay append failed | ReplayMutationContract | abort_mutation | mark_session_blocked | planned |
| `FAIL003` | Duplicate ContentPostID | DraftContentPostSchema | refuse_insert | log_failure_action | planned |

This prepares future `CMD002` automation to fail visibly and constitutionally instead of partially mutating workbook state.

## CMD002 Outcome Registry Milestone

Added `CMD002OutcomeRegistry` to define allowed post-execution outcomes before mutation automation exists.

Outcome records define:

```text
OutcomeID
OutcomeType
RequiresReplay
RequiresAdminAction
RequiresSessionClosure
ResultingSessionState
Status
```

Initial outcomes:

| OutcomeID | OutcomeType | RequiresReplay | RequiresAdminAction | RequiresSessionClosure | ResultingSessionState | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `OUT001` | success | TRUE | TRUE | TRUE | closed | planned |
| `OUT002` | refused_execution | FALSE | TRUE | FALSE | open | planned |
| `OUT003` | aborted_atomicity_failure | TRUE | TRUE | FALSE | blocked | planned |

This defines what workbook state is constitutionally allowed to become after future `CMD002` execution.

## CMD002 Resolved Draft Context Milestone

Added a formula-only dashboard observation layer for future `CMD002` draft creation.

Dashboard fields:

```text
B52 = ResolvedOwnerID
B53 = ResolvedTemplateKey
B54 = ProposedContentPostID
B55 = ProposedReplayEventID
B56 = ActiveExecutionSessionID
```

Verified current output:

```text
ResolvedOwnerID = BO002
ResolvedTemplateKey = real_estate
ProposedContentPostID = CPT002
ProposedReplayEventID = REV005
ActiveExecutionSessionID = No open session
```

No rows are inserted by this layer. It is resolution only, not mutation.

## CMD002 Session Opening Rule Milestone

Added `CMD002SessionOpenRule` to declare that draft creation must occur inside an open governed execution session.

Rule fields:

```text
RuleID
CommandID
RequiresOpenSession
CanCreateNewSession
NewSessionPurpose
Status
```

Initial rule:

```text
SOR001 | CMD002 | TRUE | TRUE | Draft content post creation with replay continuity | planned
```

Dashboard session-opening state:

```text
B57 = CMD002CanStartSession
B58 = ProposedNewSessionID
```

Verified:

```text
CMD002CanStartSession = TRUE
ProposedNewSessionID = SES002
```

No session row is inserted by this layer. It only proves that `CMD002` knows it must open a new governed session before draft mutation.

## Replay Link Resolution Milestone

Added `ReplayLinkResolution` as a lightweight resolution table for proposed CMD002 replay linkage before replay append occurs.

Resolution fields:

```text
ResolutionID
ExecutionSessionID
ProposedContentPostID
ProposedReplayEventID
ReplayLinkStatus
Notes
```

Initial resolution:

```text
RLR001 | SES002 | CPT002 | REV005 | linked_pending_append | Replay linkage prepared but not yet appended
```

Checklist update:

```text
ParentEventID or replay reference exists -> completed
```

Verified dashboard readiness:

```text
Total Checks = 8
Completed Checks = 7
Blocked Checks = 0
CMD002 Ready = FALSE
```

CMD002 remains correctly not ready because command-level guardrail readiness has not yet been elevated.

## CMD002 Executable Readiness Milestone

Elevated CMD002 to executable readiness at the governance and formula level only.

Updated governance rows:

```text
RDY002 -> ready
CMD002 -> planned
```

Dashboard selections:

```text
B33 = CMD002
B29 = RDY002
```

Verified dashboard state:

```text
CommandName = CreateContentPostDraft
ReadinessStatus = ready
CommandStatus = planned
CanExecuteCommand = TRUE
Total Checks = 8
Completed Checks = 8
Blocked Checks = 0
CMD002 Ready = TRUE
```

No draft content post or replay event rows were inserted by this milestone. This proves readiness only.

## CMD002 Dry Run Preview Milestone

Added a dashboard-only dry-run preview for future CMD002 execution.

Preview fields:

```text
B61 = WouldCreateContentPostID
B62 = WouldAppendReplayEventID
B63 = WouldUseSessionID
B64 = WouldCreateEventType
B65 = AtomicityStatus
B66 = ExecutionMode
```

Verified preview:

```text
WouldCreateContentPostID = CPT002
WouldAppendReplayEventID = REV005
WouldUseSessionID = SES002
WouldCreateEventType = content_post_draft_created
AtomicityStatus = atomicity_ready
ExecutionMode = dry_run_only
```

No insert, append, mutation, replay write, or VBA behavior was introduced. This is a truthful execution preview only.

## Steward Console Visibility Milestone

Added `StewardConsole` as a human-readable operational truth surface.

Purpose:

```text
clarity
visibility
operator understanding
```

The console exposes existing governed state without adding execution power.

Sections:

```text
System Status
Operational Context
Constitutional State
Replay Continuity
Execution Safety
```

Verified visible state:

```text
Current Session = SES002
Can Execute = TRUE
CMD002 Ready = TRUE
Dry Run Mode = dry_run_only
Selected Owner = BO002
Resolved Template = real_estate
```

No VBA, mutation, replay append, or new command behavior was introduced by this layer.

## Steward Alerts Visibility Milestone

Added `StewardAlerts` to surface governance risk visibly before execution occurs.

Alert records define:

```text
AlertID
AlertType
Severity
Condition
CurrentState
RecommendedAction
Status
```

Initial active alerts:

| AlertID | AlertType | Severity | CurrentState | RecommendedAction |
| --- | --- | --- | --- | --- |
| `ALT001` | open_execution_session | medium | SES002 open | either execute or close session |
| `ALT002` | dry_run_mode_active | low | dry_run_only | implementation still constitutionally blocked |
| `ALT003` | replay_append_missing | high | pending | do not allow mutation without replay continuity |

`StewardConsole` now shows:

```text
ActiveAlertCount = 3
HighestSeverity = high
```

This layer adds visible stewardship only. It grants no new execution power.

## Steward Decision Log Milestone

Added `StewardDecisionLog` to capture why a steward chooses to proceed, pause, abort, or defer.

Decision records define:

```text
DecisionID
ExecutionSessionID
DecisionType
RelatedAlertID
DecisionReason
DecidedBy
DecisionTimestamp
Outcome
```

Initial decision:

```text
DEC001 | SES002 | defer_execution | ALT003 | Replay append continuity not yet implemented | Steward | 2026-05-24 | CMD002 deferred
```

`StewardConsole` now shows:

```text
LatestDecisionID = DEC001
LatestDecisionType = defer_execution
LatestDecisionReason = Replay append continuity not yet implemented
LatestDecisionOutcome = CMD002 deferred
```

This adds human governance continuity without granting new execution power.

## Steward Review Queue Milestone

Added `StewardReviewQueue` to surface unresolved governance items requiring steward review.

Review records define:

```text
QueueID
RelatedSessionID
RelatedCommandID
QueueType
Priority
Reason
RecommendedNextStep
Status
```

Initial review item:

```text
QUE001 | SES002 | CMD002 | replay_continuity_review | high | Replay append implementation not yet constitutionally verified | review replay append implementation before enabling mutation VBA | open
```

`StewardConsole` now shows:

```text
OpenReviewQueueCount = 1
HighestPriorityReview = high
LatestReviewReason = Replay append implementation not yet constitutionally verified
RecommendedNextStep = review replay append implementation before enabling mutation VBA
```

This keeps unresolved governance work visible before implementation proceeds.

## Connection Settings Milestone

Added API connection settings to the `Settings` sheet before any API-calling VBA exists.

Settings now include:

```text
Environment = local
ApiBaseUrl = http://127.0.0.1:8000/api/v1
GenerateContentEndpoint = /content-posts/generate
RequestTimeoutSeconds = 30
AuthMode = none
LastApiStatus =
LastSyncAt =
ConnectionStatus = not_verified
```

`StewardConsole` now surfaces:

```text
Environment
ApiBaseUrl
GenerateContentEndpoint
ConnectionStatus
LastApiStatus
LastSyncAt
```

No HTTP calls are made by this milestone. It creates the connection configuration boundary before integration code exists.

## Governance Rules

1. Do not write directly from VBA into SQLite.
2. Do not bypass replay lineage for generated or governed actions.
3. Do not place VBA tools inside `api` or `mobile`.
4. Do not turn Excel into the source of truth.
5. Use Excel as an operator panel, reporting layer, and learning system.

## Next Safe Step

Study the existing iPhande workflows and refine the workbook sheet design before adding VBA code or API calls.
