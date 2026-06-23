import { ConstitutionRule } from '../constitution/TruthConstitution';

export type CouncilRole = 'GUARDIAN' | 'RESEARCHER' | 'AUDITOR' | 'STEWARD';

export interface CouncilMember {
    id: string;
    name: string;
    role: CouncilRole;
    trustLevel: number; // 0 to 1
    registeredAt: number;
}

export type ProposalStatus = 'DRAFT' | 'SIMULATED' | 'VOTING' | 'APPROVED' | 'REJECTED';

export interface ConstitutionProposal {
    id: string;
    description: string;
    proposedRules: ConstitutionRule[];
    submittedBy: string;
    timestamp: number;
    status: ProposalStatus;
}

export interface CouncilVote {
    memberId: string;
    proposalId: string;
    vote: 'YES' | 'NO';
    rationale: string;
    timestamp: number;
}

export interface ProposalEvaluation {
    proposalId: string;
    approved: boolean;
    riskScore: number;
    weightedVotes: number;
    simulationImpact: { acceptedDelta: number; rejectedDelta: number; stabilityScore: number; riskIncrease: boolean };
    evaluatedAt: number;
    reason: string;
    voteBreakdown: Array<{ member: string; vote: 'YES' | 'NO'; weight: number }>;
}
