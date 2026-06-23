import { auditEngine } from '../../governance/audit/GovernanceAuditEngine';
import { registry } from '../../governance/constitution/ConstitutionRegistry';
import { ConstitutionRule, TruthConstitution } from '../../governance/constitution/TruthConstitution';
import { ConstitutionProposal, CouncilMember, CouncilVote } from '../../governance/council/councilTypes';
import { council } from '../../governance/council/GovernanceCouncilEngine';
import { TruthLedger } from '../../governance/ledger/TruthLedger';

describe('Governance Proposal Cycle Verification', () => {
    const AUDITOR_ID = 'AUDITOR-001';
    const STEWARD_ID = 'STEWARD-001';
    const RESEARCHER_ID = 'RESEARCHER-001';
    const PROPOSAL_ID = 'PROP-001';

    let initialConstitution: TruthConstitution;

    beforeAll(() => {
        // Setup initial constitution
        initialConstitution = new TruthConstitution('v1.0');
        const initialRule: ConstitutionRule = {
            id: 'initial-rule',
            category: 'GOVERNANCE',
            description: 'An initial rule',
            evaluate: (event: any, context: any) => ({ allowed: true }),
        };
        initialConstitution.register(initialRule);
        registry.registerVersion('v1.0', initialConstitution);
        registry.setActive('v1.0');

        // Register council members
        const auditor: CouncilMember = { id: AUDITOR_ID, name: 'Test Auditor', role: 'AUDITOR', trustLevel: 0.9, registeredAt: Date.now() };
        const steward: CouncilMember = { id: STEWARD_ID, name: 'Test Steward', role: 'STEWARD', trustLevel: 0.6, registeredAt: Date.now() };
        const researcher: CouncilMember = { id: RESEARCHER_ID, name: 'Test Researcher', role: 'RESEARCHER', trustLevel: 0.7, registeredAt: Date.now() };
        council.registerMember(auditor);
        council.registerMember(steward);
        council.registerMember(researcher);
    });

    beforeEach(() => {
        // Clear audit log and reset proposals/votes for isolation
        (auditEngine as any).records = [];
        (council as any).proposals = new Map();
        (council as any).votes = [];
        (council as any).evaluations = new Map();
    });

    test('Create Proposal -> Cast Votes -> Run Simulation -> Evaluate -> Approve', () => {
        const newRule: ConstitutionRule = {
            id: 'new-signal-limit',
            category: 'GOVERNANCE',
            description: 'Limit signal value to 100',
            evaluate: (event: any, context: any) => {
                if (event.type === 'SIGNAL_INGESTED' && event.payload.signal > 100) {
                    return { allowed: false, reason: 'Signal exceeds 100' };
                }
                return { allowed: true };
            },
        };

        const proposal: ConstitutionProposal = {
            id: PROPOSAL_ID,
            description: 'Propose a new signal limit rule',
            proposedRules: [newRule],
            submittedBy: AUDITOR_ID,
            timestamp: Date.now(),
            status: 'DRAFT',
        };

        // 1. Create Proposal
        council.submitProposal(proposal);
        expect(council.getProposal(PROPOSAL_ID)?.status).toBe('DRAFT');
        expect(auditEngine.getHistory()).toHaveLength(1);
        expect(auditEngine.getHistory()[0].action).toBe('PROPOSAL_CREATED');

        // Simulate some events for evaluation
        const testEvents = [
            { stewardId: STEWARD_ID, type: 'SIGNAL_INGESTED', payload: { signal: 50 }, version: 1 },
            { stewardId: STEWARD_ID, type: 'SIGNAL_INGESTED', payload: { signal: 120 }, version: 1 }, // This would be rejected by new rule
        ];
        const contextFactory = (event: any) => ({});

        // 2. Run Simulation
        const simulationImpact = council.simulateProposal(PROPOSAL_ID, initialConstitution, testEvents, contextFactory);
        expect(council.getProposal(PROPOSAL_ID)?.status).toBe('SIMULATED');
        expect(simulationImpact.rejectedDelta).toBeGreaterThan(0); // New rule rejects one event

        // 3. Cast Votes
        const vote1: CouncilVote = { memberId: AUDITOR_ID, proposalId: PROPOSAL_ID, vote: 'YES', rationale: 'Good rule', timestamp: Date.now() };
        const vote2: CouncilVote = { memberId: STEWARD_ID, proposalId: PROPOSAL_ID, vote: 'YES', rationale: 'Agreed', timestamp: Date.now() };
        const vote3: CouncilVote = { memberId: RESEARCHER_ID, proposalId: PROPOSAL_ID, vote: 'NO', rationale: 'Too strict', timestamp: Date.now() };
        council.submitVote(vote1);
        council.submitVote(vote2);
        council.submitVote(vote3);
        expect(council.getProposal(PROPOSAL_ID)?.status).toBe('VOTING');
        expect(auditEngine.getHistory()).toHaveLength(1 + 3); // 1 for proposal, 3 for votes

        // 4. Evaluate
        const evaluation = council.evaluateProposal(PROPOSAL_ID, initialConstitution, testEvents, contextFactory, new TruthLedger());

        // Assertions for Approval
        expect(evaluation.approved).toBe(true);
        expect(council.getProposal(PROPOSAL_ID)?.status).toBe('APPROVED');
        expect(auditEngine.getHistory()).toHaveLength(1 + 3 + 1); // +1 for evaluation
        expect(auditEngine.getHistory().some(r => r.action === 'PROPOSAL_EVALUATED' && r.result === 'SUCCESS')).toBe(true);
    });
});
