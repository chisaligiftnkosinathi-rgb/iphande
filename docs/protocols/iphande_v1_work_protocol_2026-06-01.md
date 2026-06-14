# iPhande V1 Work Protocol

align:: Yes-Spirit lead.

That is wise. Let us establish the working protocol before touching code.

## Roles

**You - Steward**
You decide direction, confirm boundaries, and approve changes.

**ChatGPT - Technical Scribe / Architect**
I define the sequence, guardrails, prompts, patch strategy, and truth checks.

**GitHub Copilot in VS Code - Terminal Operator**
Copilot runs PowerShell/CMD commands, gathers repo truth, compiler output, tree scans, and test results.

**Gemini in VS Code - Repo-Aware Implementer**
Gemini reads the actual files, proposes code patches, applies careful edits, and explains changes.

## Working Rule

No one patches assumptions.

Every action must follow this order:

1. **Observe** - Copilot runs commands and returns exact output.
2. **Interpret** - We read the evidence and identify the smallest truthful next step.
3. **Patch** - Gemini applies one bounded change only.
4. **Verify** - Copilot runs compiler/tests again.
5. **Archive** - We record what changed and why.

## Copilot First Assignment

```text
We are completing iPhande V1 using a governed work protocol.

Your role is Terminal Operator only.

Do not edit files.
Do not suggest large refactors.
Do not generate code yet.

Run commands from:

C:\Projects\iphande

Goal:
Establish repo truth for the Identity Layer.

Please run these commands and return the exact outputs.

1. Confirm current path:
cd C:\Projects\iphande
pwd

2. Show top-level folders:
dir

3. Find API Python files, excluding caches/venv:
Get-ChildItem -Recurse -File api | Where-Object {
  $_.FullName -notmatch '\\(__pycache__|\.venv|venv|node_modules)\\'
} | Select-Object FullName

4. Find mobile source files, excluding generated folders:
Get-ChildItem -Recurse -File mobile | Where-Object {
  $_.FullName -notmatch '\\(node_modules|\.expo|android|ios)\\'
} | Select-Object FullName

5. Search identity/backend terms:
Select-String -Path api\**\*.py,mobile\**\*.tsx,mobile\**\*.ts -Pattern "FastAPI","APIRouter","@app.get","sqlite","iphande.db","AuthContext","ProfileScreen","apiClient","demoIdentity","state_machine" -ErrorAction SilentlyContinue

Return exact terminal output only.
```

## Gemini Role After Observe

Gemini must not patch yet. Gemini will only inspect the returned evidence and map:

```text
Identity Layer audit only.
No code edits yet.

Based on the terminal output, identify:
1. running API entrypoint
2. auth/session files
3. profile save/load files
4. demo files that may leak into production
5. misplaced files
6. smallest safe patch sequence
```

This way Copilot gathers truth, Gemini interprets repo structure, and iPhande can move without confusion.
