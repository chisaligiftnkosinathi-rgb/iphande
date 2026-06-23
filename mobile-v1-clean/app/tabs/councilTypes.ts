// Layer 5 — Governance Council Types
// The type contracts for the decision-making system
// that modifies constitutions safely over time.

import { ConstitutionRule } from "./truthConstitutionV1";

// ─────────────────────────────────────────────────
// Council Members
// ─────────────────────────────────────────────────

export type CouncilRole = "GUARDIAN" | "RESEARCHER" | "AUDITOR" | "STEWARD";

export interface CouncilMember {
    id: string;
    name: string;
    role: CouncilRole;
    /** Trust level from 0 (untrusted) to 1 (fully trusted). Weights votes. */
    trustLevel: number;
    registeredAt: number;
}

// ─────────────────────────────────────────────────
// Constitution Proposals
// ─────────────────────────────────────────────────

export type ProposalStatus =
    | "DRAFT"
    | "SIMULATED"
    | "VOTING"
    | "APPROVED"
    | "REJECTED";

export interface ConstitutionProposal {
    id: string;
    description: string;
    /** The specific rules being proposed for addition */
    proposedRules: ConstitutionRule[];
    submittedBy: string;
    timestamp: number;
    status: ProposalStatus;
}

// ─────────────────────────────────────────────────
// Council Votes
// ─────────────────────────────────────────────────

export interface CouncilVote {
    memberId: string;
    proposalId: string;
    vote: "YES" | "NO";
    rationale: string;
    timestamp: number;
}

// ─────────────────────────────────────────────────
// Proposal Evaluation (Immutable Decision Record)
// ─────────────────────────────────────────────────

export interface ProposalEvaluation {
    proposalId: string;
    approved: boolean;
    riskScore: number;
    weightedVotes: number;
    simulationImpact: {
        acceptedDelta: number;
        rejectedDelta: number;
        stabilityScore: number;
        riskIncrease: boolean;
    };
    evaluatedAt: number;
    reason: string;
}
