# iPhande Steward Console Guide

## Purpose

The `StewardConsole` is a read-only truth surface. It helps a steward understand the current workbook state before taking action.

It does not grant new power. It makes existing governance visible.

## How To Read The Console

### System Status

Shows the current session, selected command, readiness, execution mode, and whether execution is allowed.

Use this section to answer:

```text
What command is selected?
Is the session open or closed?
Is the workbook in dry-run mode?
Is execution currently guardrailed as allowed?
```

### Operational Context

Shows the selected owner, resolved template, proposed content post, proposed replay event, and active session.

Use this section to answer:

```text
Who is the action related to?
Which template is inherited?
What draft ID would be created?
What replay ID would be appended?
Which session would contain the action?
```

### Constitutional State

Shows whether mutation boundaries, replay contracts, atomicity rules, and related governance definitions exist.

Use this section to answer:

```text
What mutation is allowed?
Is replay required?
Is atomicity ready?
Are failure and outcome rules declared?
```

### Replay Continuity

Shows latest action, latest session, replay status, and append mode.

Use this section to answer:

```text
What was the last steward-visible action?
Which session is currently active?
Is replay append still pending?
Is replay append-only?
```

### Execution Safety

Shows alerts, blocked checks, open review items, and whether execution should remain deferred.

Use this section to answer:

```text
Are there active alerts?
Is any high-severity concern open?
Are review queue items unresolved?
Should implementation remain deferred?
```

## Key Fields

### CanExecuteCommand

`TRUE` means the command-level guardrail allows execution.

It does not mean implementation should proceed without review.

### CMD002 Ready

`TRUE` means readiness checks are satisfied.

It does not override alerts, review queue items, recovery anchors, or sealed doctrine.

### dry_run_only

`dry_run_only` means the workbook is previewing what would happen without inserting rows or appending replay.

This is an observation mode, not execution.

### HighestSeverity = high

`HighestSeverity = high` means a serious stewardship concern is active and must be reviewed before implementation.

High-severity alerts should block casual execution decisions.

### QUE001

`QUE001` blocks `CMD002` implementation until replay append behavior is constitutionally verified.

Current reason:

```text
Replay append implementation not yet constitutionally verified
```

Recommended next step:

```text
review replay append implementation before enabling mutation VBA
```

## Recovery Anchors

Read these before future implementation work:

```text
VBA_EXECUTION_REPLAY_SESSION_SEALED_2026-05-24.md
CMD002_EXECUTION_BOUNDARY_2026-05-24.md
CMD002_PRE_IMPLEMENTATION_STATE_SEALED_2026-05-24.md
IPHANDE_STEWARD_HANDBOOK.md
```

## Rule Before CMD002 Implementation

Before `CMD002` VBA is written, the steward must answer:

```text
Does this implementation conform to the sealed boundary?
```

If not, do not proceed.

The correct posture is:

```text
review first
implementation second
execution last
```
