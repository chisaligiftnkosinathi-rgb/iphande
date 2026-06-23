// Layer 5 — Council Proposal Ledger
// Immutable audit trail of all proposals, votes, and evaluations.
// Nothing is overwritten. Every decision is preserved.

import {
    ConstitutionProposal,
    CouncilVote,
    ProposalEvaluation,
} from "./councilTypes";

export interface ProposalLedgerEntry {
    proposal: ConstitutionProposal;
    votes: CouncilVote[];
    evaluation?: ProposalEvaluation;
    recordedAt: number;
}

export class CouncilProposalLedger {
    private entries: Map<string, ProposalLedgerEntry> = new Map();

    /**
     * Records a proposal into the immutable ledger.
     * Once recorded, the entry can be updated with votes and evaluation,
     * but the original proposal data is frozen.
     */
    recordProposal(proposal: ConstitutionProposal): void {
        if (this.entries.has(proposal.id)) {
            throw new Error(
                `Proposal ${proposal.id} already exists in the ledger`
            );
        }

        this.entries.set(proposal.id, {
            proposal: { ...proposal },
            votes: [],
            recordedAt: Date.now(),
        });
    }

    /**
     * Appends a vote to an existing proposal entry.
     */
    recordVote(vote: CouncilVote): void {
        const entry = this.entries.get(vote.proposalId);
        if (!entry) {
            throw new Error(
                `Proposal ${vote.proposalId} not found in ledger`
            );
        }

        // Prevent duplicate votes from same member
        const alreadyVoted = entry.votes.some(
            (v) => v.memberId === vote.memberId
        );
        if (alreadyVoted) {
            throw new Error(
                `Member ${vote.memberId} already voted on proposal ${vote.proposalId}`
            );
        }

        entry.votes.push({ ...vote });
    }

    /**
     * Seals the proposal with its final evaluation.
     * Once sealed, no further votes can be added.
     */
    recordEvaluation(evaluation: ProposalEvaluation): void {
        const entry = this.entries.get(evaluation.proposalId);
        if (!entry) {
            throw new Error(
                `Proposal ${evaluation.proposalId} not found in ledger`
            );
        }
        if (entry.evaluation) {
            throw new Error(
                `Proposal ${evaluation.proposalId} has already been evaluated`
            );
        }

        entry.evaluation = { ...evaluation };
    }

    // ─────────────────────────────────────────────
    // Query Methods
    // ─────────────────────────────────────────────

    /**
     * Returns the full lifecycle of a proposal.
     */
    getProposalHistory(proposalId: string): ProposalLedgerEntry | undefined {
        return this.entries.get(proposalId);
    }

    /**
     * Returns all proposals that were approved.
     * Useful for rollback discovery.
     */
    getApprovedProposals(): ProposalLedgerEntry[] {
        return Array.from(this.entries.values()).filter(
            (entry) => entry.evaluation?.approved === true
        );
    }

    /**
     * Returns all proposals that were rejected.
     * Preserved for audit and learning.
     */
    getRejectedProposals(): ProposalLedgerEntry[] {
        return Array.from(this.entries.values()).filter(
            (entry) => entry.evaluation?.approved === false
        );
    }

    /**
     * Returns all ledger entries.
     */
    getAll(): ProposalLedgerEntry[] {
        return Array.from(this.entries.values());
    }

    /**
     * Returns the total number of proposals recorded.
     */
    getCount(): number {
        return this.entries.size;
    }
}
