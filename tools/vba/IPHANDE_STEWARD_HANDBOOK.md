# iPhande Steward Handbook

This handbook preserves the operating meaning of the iPhande VBA admin workbook.

It exists so a future steward can understand why the workbook is structured this way, what must never be violated, and how to continue the work without weakening replay continuity.

## 1. System Philosophy

The workbook is not a random Excel automation file. It is a governed operational control model for iPhande.

Its purpose is to make operational state visible, explainable, and reviewable before automation is allowed to act.

The workbook follows this posture:

```text
governance before power
continuity before automation
explainability before execution
```

## 2. Constitutional Boundaries

The workbook is a companion admin and learning tool. It does not replace the API, mobile app, or SQLite database.

Layer boundaries:

```text
api = governed logic, replay, persistence
mobile = user-facing interaction and replay visualization
tools/vba = admin control, learning, review, and operational visibility
```

The workbook must not write directly to SQLite. Future integration must go through the API.

## 3. Steward Responsibilities

A steward is responsible for preserving operational continuity.

The steward must ask:

```text
Is this action declared?
Is it ready?
Is it guardrailed?
Is it observable?
Is it replay-linked?
Can it be refused safely?
Can it be recovered later?
```

The steward should not add automation simply because it is possible.

## 4. Replay Continuity Doctrine

Replay continuity is sacred because it preserves operational causality.

Replay answers:

```text
what happened
in what order
because of what
linked to whom
```

The workbook must reject any state where a business record exists without replay continuity.

Doctrine:

```text
No business mutation may exist without replay continuity.
```

## 5. Session Governance

Executable actions belong inside execution sessions.

An execution session groups related steward actions so they can be reviewed as a coherent chain instead of disconnected rows.

Session anchors:

```text
ExecutionSessionID = groups related actions
ParentActionID = links one action to a prior action
CanCloseSession = proves completion conditions
```

Sessions should remain open when work is unresolved, blocked, or intentionally deferred.

## 6. Mutation Safety Rules

Mutation is more dangerous than navigation because it changes operational memory.

Before mutation is allowed, the workbook must define:

```text
allowed mutation
target table
mutation scope
required replay
required owner
failure behavior
allowed outcomes
```

For `CMD002`, mutation is limited to draft content creation only.

It may never:

```text
edit existing business rows
delete replay history
overwrite prior content
silently bypass replay
close a session without outcome permission
```

## 7. Failure And Refusal Doctrine

Refusal is not failure. Refusal is governance working.

The workbook must be able to refuse execution when:

```text
required identity is missing
readiness is incomplete
replay linkage is absent
atomicity cannot be preserved
duplicate IDs would be created
the selected command does not match the intended command
```

Failures and refusals should be visible through:

```text
AdminActions
StewardAlerts
StewardDecisionLog
StewardReviewQueue
```

## 8. Recovery Anchors

The workbook uses checkpoint documents so recovery does not depend on memory.

Current key recovery anchors:

```text
VBA_EXECUTION_REPLAY_SESSION_SEALED_2026-05-24.md
CMD002_EXECUTION_BOUNDARY_2026-05-24.md
CMD002_PRE_IMPLEMENTATION_STATE_SEALED_2026-05-24.md
```

Future implementation work must begin by reading the relevant recovery anchor.

## 9. Safe Operational Procedures

Before running executable VBA:

```text
1. Confirm the command is declared.
2. Confirm readiness is ready.
3. Confirm CanExecuteCommand is TRUE.
4. Confirm the execution session is open.
5. Confirm replay continuity is satisfied.
6. Confirm no high-priority review queue blocks the action.
7. Confirm the expected outcome is allowed.
```

If any of these fail, execution should be refused or deferred.

## 10. Future Implementation Review Process

Future implementation must be reviewed against sealed doctrine first.

The first question is not:

```text
Can we make the macro work?
```

The first question is:

```text
Does this implementation conform to the sealed boundary?
```

For `CMD002`, implementation may not proceed until the open review item is resolved:

```text
QUE001 = replay append implementation not yet constitutionally verified
```

The steward must preserve this posture:

```text
contracts first
schemas second
truth surfaces third
execution last
```
