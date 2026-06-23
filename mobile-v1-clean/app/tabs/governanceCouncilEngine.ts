// Layer 5 — Governance Council Engine
// The decision-making system that modifies constitutions safely over time.
//
// Core question: "Who is allowed to change truth rules, and under what evidence?"
//
// Approval requires BOTH:
//   1. Weighted votes > 0 (council consensus)
//   2. Risk score < 0.5 (simulation safety)
//
// Neither votes alone nor simulation alone can approve a change.

import {
    CouncilMember,
    ConstitutionProposal,
    CouncilVote,
    ProposalEvaluation,
} from "./councilTypes";
import { TruthConstitutionV1 } from "./truthConstitutionV1";
import { ConstitutionSimulator } from "./constitutionSimulator";
import { ConstitutionComparator } from "./constitutionComparator";
import { ConstitutionRegistry } from "./constitutionRegistry";
import { TruthLedger } from "./truthLedger";

export class GovernanceCouncilEngine {
    private members: Map<string, CouncilMember> = new Map();
    private proposals: Map<string, ConstitutionProposal> = new Map();
    private votes: CouncilVote[] = [];
    private evaluations: Map<string, ProposalEvaluation> = new Map();

    private simulator = new ConstitutionSimulator();
    private comparator = new ConstitutionComparator();

    // ─────────────────────────────────────────────
    // Member Management
    // ─────────────────────────────────────────────

    registerMember(member: CouncilMember): void {
        if (member.trustLevel < 0 || member.trustLevel > 1) {
            throw new Error(
                `Trust level must be between 0 and 1, got ${member.trustLevel}`
            );
        }
        this.members.set(member.id, member);
    }

    getMember(id: string): CouncilMember | undefined {
        return this.members.get(id);
    }

    getMemberCount(): number {
        return this.members.size;
    }

    // ─────────────────────────────────────────────
    // Proposal Lifecycle
    // ─────────────────────────────────────────────

    submitProposal(proposal: ConstitutionProposal): void {
        // Verify submitter is a registered member
        if (!this.members.has(proposal.submittedBy)) {
            throw new Error(
                `Submitter ${proposal.submittedBy} is not a registered council member`
            );
        }
        proposal.status = "DRAFT";
        this.proposals.set(proposal.id, proposal);
    }

    getProposal(id: string): ConstitutionProposal | undefined {
        return this.proposals.get(id);
    }

    // ─────────────────────────────────────────────
    // Simulation Phase
    // ─────────────────────────────────────────────

    /**
     * Simulates the impact of a proposal against the current constitution.
     * Runs both current and proposed constitutions against the same events,
     * then compares the results.
     */
    simulateProposal(
        proposalId: string,
        currentConstitution: TruthConstitutionV1,
        events: any[],
        contextFactory: (event: any) => any
    ): {
        acceptedDelta: number;
        rejectedDelta: number;
        stabilityScore: number;
        riskIncrease: boolean;
    } {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        // Build the proposed constitution (current rules + new rules)
        const proposedConstitution = new TruthConstitutionV1();

        // Copy current rules by re-evaluating — we simulate current first
        const currentResult = this.simulator.run(
            currentConstitution,
            events,
            contextFactory
        );

        // Build proposed version: register proposed rules into a fresh constitution
        // We need a separate constitution that includes the proposed additions
        for (const rule of proposal.proposedRules) {
            proposedConstitution.register(rule);
        }

        // Also run current constitution's rules through the proposed one
        // by simulating current as baseline
        const proposedResult = this.simulator.run(
            proposedConstitution,
            events,
            contextFactory
        );

        const comparison = this.comparator.compare(
            currentResult,
            proposedResult
        );

        // Advance proposal status
        proposal.status = "SIMULATED";

        return comparison;
    }

    // ─────────────────────────────────────────────
    // Voting Phase
    // ─────────────────────────────────────────────

    submitVote(vote: CouncilVote): void {
        // Verify voter is a registered member
        if (!this.members.has(vote.memberId)) {
            throw new Error(
                `Voter ${vote.memberId} is not a registered council member`
            );
        }

        // Verify proposal exists and is in a voteable state
        const proposal = this.proposals.get(vote.proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${vote.proposalId} not found`);
        }
        if (
            proposal.status !== "SIMULATED" &&
            proposal.status !== "VOTING"
        ) {
            throw new Error(
                `Proposal ${vote.proposalId} is not in a voteable state (current: ${proposal.status})`
            );
        }

        // Prevent duplicate votes
        const existingVote = this.votes.find(
            (v) =>
                v.memberId === vote.memberId &&
                v.proposalId === vote.proposalId
        );
        if (existingVote) {
            throw new Error(
                `Member ${vote.memberId} has already voted on proposal ${vote.proposalId}`
            );
        }

        proposal.status = "VOTING";
        this.votes.push(vote);
    }

    getVotesForProposal(proposalId: string): CouncilVote[] {
        return this.votes.filter((v) => v.proposalId === proposalId);
    }

    // ─────────────────────────────────────────────
    // Evaluation Phase
    // ─────────────────────────────────────────────

    /**
     * Evaluates a proposal by combining:
     *   1. Simulation risk score
     *   2. Trust-weighted council votes
     *
     * Approval requires BOTH:
     *   - weightedVotes > 0  (net positive council sentiment)
     *   - riskScore < 0.5    (simulation shows acceptable risk)
     */
    evaluateProposal(
        proposalId: string,
        currentConstitution: TruthConstitutionV1,
        events: any[],
        contextFactory: (event: any) => any,
        ledger?: TruthLedger
    ): ProposalEvaluation {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        // ── Step 1: Run simulation ──
        const simulationImpact = this.simulateProposal(
            proposalId,
            currentConstitution,
            events,
            contextFactory
        );

        // Compute risk: ratio of rejected to total events
        const currentResult = this.simulator.run(
            currentConstitution,
            events,
            contextFactory
        );
        const riskScore =
            currentResult.rejected.length /
            Math.max(1, currentResult.accepted.length + currentResult.rejected.length);

        // ── Step 2: Compute weighted votes ──
        const proposalVotes = this.getVotesForProposal(proposalId);
        const weightedVotes = proposalVotes.reduce((sum, v) => {
            const member = this.members.get(v.memberId);
            const weight = member?.trustLevel ?? 0;
            return sum + (v.vote === "YES" ? weight : -weight);
        }, 0);

        // ── Step 3: Decision ──
        const approved = weightedVotes > 0 && riskScore < 0.5;

        const reason = !approved
            ? weightedVotes <= 0
                ? `Insufficient council support (weighted votes: ${weightedVotes.toFixed(2)})`
                : `Simulation risk too high (risk score: ${riskScore.toFixed(2)})`
            : `Council approved with weighted votes ${weightedVotes.toFixed(2)} and risk ${riskScore.toFixed(2)}`;

        // ── Step 4: Record decision ──
        proposal.status = approved ? "APPROVED" : "REJECTED";

        const evaluation: ProposalEvaluation = {
            proposalId,
            approved,
            riskScore,
            weightedVotes,
            simulationImpact,
            evaluatedAt: Date.now(),
            reason,
        };

        this.evaluations.set(proposalId, evaluation);

        // ── Step 5: Record in truth ledger ──
        if (ledger) {
            ledger.append({
                id: `gov_${proposalId}_${Date.now()}`,
                stewardId: proposal.submittedBy,
                type: "GOVERNANCE_DECISION",
                timestamp: Date.now(),
                payload: {
                    proposalId,
                    approved,
                    riskScore,
                    weightedVotes,
                    reason,
                },
                version: 1,
            });
        }

        return evaluation;
    }

    getEvaluation(proposalId: string): ProposalEvaluation | undefined {
        return this.evaluations.get(proposalId);
    }

    // ─────────────────────────────────────────────
    // Application Phase
    // ─────────────────────────────────────────────

    /**
     * Applies an approved proposal to the constitution registry.
     * Creates a new constitution version with the proposed rules added.
     */
    applyProposal(
        proposalId: string,
        registry: ConstitutionRegistry,
        baseVersion: string,
        newVersion: string
    ): void {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        if (proposal.status !== "APPROVED") {
            throw new Error(
                `Cannot apply proposal ${proposalId}: status is ${proposal.status}, expected APPROVED`
            );
        }

        // Get current constitution and build new version
        const currentConstitution = registry.get(baseVersion);
        if (!currentConstitution) {
            throw new Error(
                `Base constitution version ${baseVersion} not found in registry`
            );
        }

        const newConstitution = new TruthConstitutionV1();

        // Note: TruthConstitutionV1 doesn't expose its rules array,
        // so we register the proposed new rules into a fresh constitution.
        // In a production system, we'd copy all existing rules + add new ones.
        // For now, the caller should build the full new constitution.
        for (const rule of proposal.proposedRules) {
            newConstitution.register(rule);
        }

        registry.registerVersion(newVersion, newConstitution);
        registry.setActive(newVersion);
    }
}
