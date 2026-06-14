# PHASE 16Y-A: Repo Index and Knowledge Map (2026-05-28)

## Purpose
This document serves as the constitutional table of contents and navigational map for the entire repository. It defines the meaning, boundaries, and governance of each top-level folder, clarifies what is canonical, what is experimental, and what governs runtime behavior. It also encodes naming conventions, promotion rules, and the archive philosophy.

---

## Top-Level Folder Index

- **api/**
  - Source code for the FastAPI backend and all runtime system logic.
  - *Canonical, governs runtime.*

- **docs/**
  - Canonical documentation, operational governance, and promoted doctrine.
  - *Canonical, governs operational and doctrinal rules.*

- **experiment/**
  - Bounded surface for research, exploratory models, symbolic reflection, and non-canonical inquiry.
  - *Experimental, does not govern runtime or doctrine directly.*

- **media/**
  - Media assets, reference images, and supporting files for documentation and research.
  - *Canonical for referenced assets, not for governance.*

- **mobile/**
  - Source code and assets for the mobile application.
  - *Canonical, governs mobile runtime.*

- **tools/**
  - Utilities, scripts, and supporting tools for development and analysis.
  - *Canonical for tooling, not for governance.*

---

## What is Canonical?
- Any file or doctrine under **docs/** that is explicitly promoted and referenced as operational or doctrinal authority.
- Source code under **api/** and **mobile/** that is executed in production or referenced by system contracts.

## What is Experimental?
- All content under **experiment/**, including:
  - **research/**: Observed human patterns, empirical studies, and research artifacts.
  - **thought_experiments/**: Exploratory societal/systemic models and theoretical questions.
  - **spiritual_reflections/**: Symbolic, spiritual, and covenant reflections.
  - **drafts/**: Unresolved or unclassified work, drafts, and notes.
- Experimental content does not govern runtime or doctrine until explicitly promoted.

## What Governs Runtime?
- Only code and configuration under **api/** and **mobile/**.
- Only canonical doctrine under **docs/**.
- No file under **experiment/** or **media/** directly governs runtime.

## Where Do New Docs Belong?
- If canonical or operational: **docs/**
- If experimental, research, or exploratory: **experiment/**
- If media asset: **media/**
- If code or runtime logic: **api/** or **mobile/**

## Naming Conventions
- Canonical docs: `PHASE_<number>_<TITLE>_<YYYY-MM-DD>.md`
- Experiments: Descriptive, lower_snake_case or kebab-case.
- Scripts/tools: lower_snake_case or kebab-case.
- Media: Descriptive, with context in filename.

## Promotion Rules (experiment → docs)
- Promotion must be explicit, with rationale and reference in the canonical index.
- Experimental work is reviewed, refined, and only then moved to **docs/** as doctrine.
- No silent or implicit promotion.

## Archive Philosophy
- Preserve all experimental, research, and symbolic work for future review and learning.
- Never delete or overwrite canonical doctrine without explicit deprecation and archival.
- Maintain clear boundaries between canonical, experimental, and runtime surfaces.

---

## Summary
This knowledge map ensures that all contributors understand the structure, boundaries, and governance of the repository. It protects against structural ambiguity, enables safe exploration, and preserves the integrity of canonical doctrine and runtime authority.
