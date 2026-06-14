# iPhande V1 Stewardship River Protocol

align:: Yes-Spirit lead.

This is a continuity protocol so stewardship survives context switches, fatigue, model changes, and future contributors.

## 1. Steward (Gift)

Purpose: Holds vision, boundaries, priorities, and approval authority.

Responsibilities:
- Defines the objective.
- Approves scope.
- Decides what enters V1.
- Decides what waits.
- Protects continuity.

The steward does not need to personally prove code correctness.

The steward protects direction.

## 2. ChatGPT (Technical Scribe / Architect)

Purpose: Maintains architectural continuity.

Responsibilities:
- Define the next step.
- Define guardrails.
- Define audit questions.
- Detect scope drift.
- Keep work aligned with protocol.
- Translate vision into executable work.

Output:
- Work orders.
- Audit plans.
- Patch sequencing.
- Governance notes.

ChatGPT does not assume repo truth.

ChatGPT operates from evidence.

## 3. GitHub Copilot (Terminal Operator)

Purpose: Observe reality.

Responsibilities:
- Run commands.
- Read files.
- Produce compiler output.
- Produce test output.
- Produce repo inventories.
- Produce logs.

Output:
- Raw evidence only.

Copilot does not:
- redesign architecture
- interpret business intent
- decide priorities

Copilot answers:

"What is?"

## 4. Gemini (Repo-Aware Implementer)

Purpose: Interpret verified reality and implement bounded change.

Responsibilities:
- Read observed evidence.
- Inspect actual files.
- Explain findings.
- Generate smallest safe patch.
- Apply patch when approved.

Output:
- File-level analysis.
- Patch proposals.
- Diffs.
- Refactor recommendations (when requested).

Gemini answers:

"Given what is, what is the smallest safe change?"

## End-to-End Loop

Every task must flow through these stages.

### Stage A - Intent

Steward -> ChatGPT

Example:

"Complete Identity Layer V1."

Result:
- objective defined
- scope defined
- success criteria defined

### Stage B - Observe

ChatGPT -> Copilot

Example:
- Scan identity files.
- Run compiler.
- Run tests.

Result:
- raw evidence
- no interpretation

### Stage C - Interpret

Copilot -> Gemini

Example:
- Here are the files.
- Here are the errors.

Result:
- findings
- risks
- root causes
- patch candidates

No code changes yet.

### Stage D - Review

Gemini -> ChatGPT -> Steward

Questions:
- Is this in scope?
- Is this the smallest patch?
- Does it preserve continuity?
- Does it create future debt?

Result:
- approved
- modified
- rejected

### Stage E - Patch

Steward approval -> Gemini

Gemini creates:
- exact files
- exact edits
- exact patch

No additional features.

No side quests.

### Stage F - Verify

Gemini -> Copilot

Copilot runs:

```powershell
npx tsc --noEmit
```

```powershell
pytest
```

or other verification commands.

Result:
- pass
- fail
- warnings

Reality decides.

### Stage G - Archive

ChatGPT + Steward

Capture:
- what changed
- why
- files touched
- evidence
- risks
- next step

Stored in docs.

This creates continuity.

## Golden Rule

No AI is allowed to skip a stage.

Not ChatGPT.
Not Gemini.
Not Copilot.

Only the Steward may stop the river at any point.

## Completion Loop

```text
Intent
  ↓
Observe
  ↓
Interpret
  ↓
Review
  ↓
Patch
  ↓
Verify
  ↓
Archive
  ↓
Next Intent
```

And the river begins again.

Months later, a contributor should still be able to see:
- why a decision was made
- who observed it
- who interpreted it
- who approved it
- how it was verified

This keeps the way iPhande is built consistent with the values inside the system.
