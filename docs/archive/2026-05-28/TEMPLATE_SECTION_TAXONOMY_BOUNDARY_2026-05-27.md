# TEMPLATE_SECTION_TAXONOMY_BOUNDARY_2026-05-27

## Milestone Summary
To prevent semantic sprawl and duplicated governance in the Continuity Publishing System, the **Section Taxonomy Rules** have been established. This taxonomy categorizes all future document sections into strict semantic families, ensuring the weaving engine knows how to treat each block of data.

## The Semantic Families
1. `identity_section` (Who is speaking)
2. `disclosure_section` (What boundaries apply)
3. `pricing_section` (Value exchange)
4. `traceability_section` (Origin and process)
5. `reflection_section` (Steward's wisdom)
6. `evidence_section` (Proof of reality)
7. `continuity_section` (Replay linkage)
8. `interpretation_section` (Bounded human meaning)
9. `signature_section` (Human agreement)

## Architectural Significance
By typing sections semantically, the system prevents duplicate logic (e.g., creating separate pricing sections for plumbers and bakers). It also allows the backend engine to apply universal rules based on the section type, rather than the specific template.

## The Governing Rules
> Sections may be required by standards.
> Sections may not suppress disclosures.

An `identity_section` or `pricing_section` may be customized by a template, but a `disclosure_section` injected by the `ArchetypeStandardRegistry` is structurally immutable. A steward or custom template can never suppress the truth.

## Next Safe Move
With the taxonomy strictly defined, the system is protected against infinite section sprawl. The safest next step is to physically construct the `ArchetypeStandardRegistry` and `TemplateSectionRegistry` data arrays in the TypeScript mobile data layer, adhering entirely to these semantic families.

---
*“Let the record show: Semantic structure prevents compliance chaos.”*
