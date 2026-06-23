/**
 * Layer 23 — The Corporate Artifact Stack
 * Maps the "Living Organism" artifacts into the Stewardship system.
 */

export type ArtifactCategory = "structural" | "truth";

export interface CorporateArtifact {
    key: string;
    label: string;
    category: ArtifactCategory;
    description: string;
    /** Historically: Clay Token -> Papyrus -> Ledger -> Database */
    evolutionaryStage: "primitive" | "formalized" | "digital" | "immutable";
}

export const CORPORATE_ARTIFACT_TREE: Record<string, CorporateArtifact> = {
    // The Structural Stack (The Legal Skeleton)
    constitution: {
        key: "constitution",
        label: "Memorandum of Incorporation",
        category: "structural",
        description: "The foundational DNA defining the purpose and limits of the entity.",
        evolutionaryStage: "formalized"
    },
    cap_table: {
        key: "cap_table",
        label: "Capitalization Table",
        category: "structural",
        description: "The ledger of ownership distribution.",
        evolutionaryStage: "immutable"
    },
    // The Truth & Accounting Stack (The Financial & Metric DNA)
    general_ledger: {
        key: "general_ledger",
        label: "General Ledger",
        category: "truth",
        description: "The definitive master record of all economic heartbeats.",
        evolutionaryStage: "immutable"
    }
};
