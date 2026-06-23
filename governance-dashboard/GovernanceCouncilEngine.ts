import { ConstitutionComparator } from '../constitution/ConstitutionComparator';
import { ConstitutionSimulator } from '../constitution/ConstitutionSimulator';
import { TruthConstitution } from '../constitution/TruthConstitution';
import { TruthLedger } from '../ledger/TruthLedger';
import { ConstitutionProposal, CouncilMember, CouncilVote, ProposalEvaluation } from './councilTypes';

export class GovernanceCouncilEngine {
    private members: Map<string, CouncilMember> = new Map();
    private proposals: Map<string, ConstitutionProposal> = new Map();
    private votes: CouncilVote[] = [];
    private evaluations: Map<string, ProposalEvaluation> = new Map();

    private simulator: ConstitutionSimulator;
    private comparator: ConstitutionComparator;

    constructor(simulator: ConstitutionSimulator, comparator: ConstitutionComparator) {
        this.simulator = simulator;
        this.comparator = comparator;
    }

    registerMember(member: CouncilMember): void {
        if (member.trustLevel < 0 || member.trustLevel > 1) {
            throw new Error(`Trust level must be between 0 and 1, got ${member.trustLevel}`);
        }
        this.members.set(member.id, member);
    }

    getMember(id: string): CouncilMember | undefined {
        return this.members.get(id);
    }

    getAllMembers(): CouncilMember[] {
        return Array.from(this.members.values());
    }

    getMemberCount(): number {
        return this.members.size;
    }

    submitProposal(proposal: ConstitutionProposal): void {
        if (!this.members.has(proposal.submittedBy)) {
            throw new Error(`Submitter ${proposal.submittedBy} is not a registered council member`);
        }
        proposal.status = 'DRAFT';
        this.proposals.set(proposal.id, proposal);
    }

    getProposal(id: string): ConstitutionProposal | undefined {
        return this.proposals.get(id);
    }

    getAllProposals(): ConstitutionProposal[] {
        return Array.from(this.proposals.values());
    }

    simulateProposal(
        proposalId: string,
        currentConstitution: TruthConstitution,
        events: any[],
        contextFactory: (event: any) => any
    ): ProposalEvaluation['simulationImpact'] {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        const currentResult = this.simulator.run(currentConstitution, events, contextFactory);

        const proposedConstitution = new TruthConstitution('proposed-version');
        for (const rule of currentConstitution.getRules()) {
            proposedConstitution.register(rule);
        }
        for (const rule of proposal.proposedRules) {
            proposedConstitution.register(rule);
        }

        const proposedResult = this.simulator.run(proposedConstitution, events, contextFactory);
        const impact = this.comparator.compare(currentResult, proposedResult);

        proposal.status = 'SIMULATED';
        return impact;
    }

    submitVote(vote: CouncilVote): void {
        if (!this.members.has(vote.memberId)) {
            throw new Error(`Voter ${vote.memberId} is not a registered council member`);
        }

        const proposal = this.proposals.get(vote.proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${vote.proposalId} not found`);
        }
        if (proposal.status !== 'SIMULATED' && proposal.status !== 'VOTING') {
            throw new Error(`Proposal ${vote.proposalId} is not in a voteable state (current: ${proposal.status})`);
        }

        const existingVote = this.votes.find((v) => v.memberId === vote.memberId && v.proposalId === vote.proposalId);
        if (existingVote) {
            throw new Error(`Member ${vote.memberId} has already voted on proposal ${vote.proposalId}`);
        }

        proposal.status = 'VOTING';
        this.votes.push(vote);
    }

    getVotesForProposal(proposalId: string): CouncilVote[] {
        return this.votes.filter((v) => v.proposalId === proposalId);
    }

    evaluateProposal(
        proposalId: string,
        currentConstitution: TruthConstitution,
        events: any[],
        contextFactory: (event: any) => any,
        ledger?: TruthLedger
    ): ProposalEvaluation {
        const proposal = this.proposals.get(proposalId);
        if (!proposal) {
            throw new Error(`Proposal ${proposalId} not found`);
        }

        const simulationImpact = this.simulateProposal(proposalId, currentConstitution, events, contextFactory);

        const currentResult = this.simulator.run(currentConstitution, events, contextFactory);
        const riskScore = currentResult.rejected.length / Math.max(1, currentResult.accepted.length + currentResult.rejected.length);

        const proposalVotes = this.getVotesForProposal(proposalId);
        const weightedVotes = proposalVotes.reduce((sum, v) => {
            const member = this.members.get(v.memberId);
            const weight = member ? member.trustLevel : 0;
            return sum + (v.vote === 'YES' ? weight : -weight);
        }, 0);

        const approved = weightedVotes > 0 && riskScore < 0.5;

        const reason = !approved
            ? weightedVotes <= 0
                ? `Insufficient council support (weighted votes: ${weightedVotes.toFixed(2)})`
                : `Simulation risk too high (risk score: ${riskScore.toFixed(2)})`
            : `Council approved with weighted votes ${weightedVotes.toFixed(2)} and risk ${riskScore.toFixed(2)}`;

        proposal.status = approved ? 'APPROVED' : 'REJECTED';

        const evaluation: ProposalEvaluation = {
            proposalId,
            approved,
            riskScore,
            weightedVotes,
            simulationImpact,
            evaluatedAt: Date.now(),
            reason,
            voteBreakdown: proposalVotes.map((v) => ({
                member: this.members.get(v.memberId)?.name || v.memberId,
                vote: v.vote,
                weight: this.members.get(v.memberId)?.trustLevel || 0,
            })),
        };

        this.evaluations.set(proposalId, evaluation);

        if (ledger) {
            ledger.append({
                stewardId: proposal.submittedBy,
                type: 'GOVERNANCE_DECISION',
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

        if (proposal.status !== 'APPROVED') {
            throw new Error(`Cannot apply proposal ${proposalId}: status is ${proposal.status}, expected APPROVED`);
        }

        const currentConstitution = registry.get(baseVersion);
        if (!currentConstitution) {
            throw new Error(`Base constitution version ${baseVersion} not found in registry`);
        }

        const newConstitution = new TruthConstitution(newVersion);
        for (const rule of currentConstitution.getRules()) {
            newConstitution.register(rule);
        }
        for (const rule of proposal.proposedRules) {
            newConstitution.register(rule);
        }

        registry.registerVersion(newVersion, newConstitution);
        registry.setActive(newVersion);
    }
}

import { comparator } from '../constitution/ConstitutionComparator';
import { simulator } from '../constitution/ConstitutionSimulator';

export const council = new GovernanceCouncilEngine(simulator, comparator);
