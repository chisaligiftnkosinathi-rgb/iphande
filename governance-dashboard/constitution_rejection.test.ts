import { auditEngine } from '../../governance/audit/GovernanceAuditEngine';
import { registry } from '../../governance/constitution/ConstitutionRegistry';
import { ConstitutionRule, TruthConstitution } from '../../governance/constitution/TruthConstitution';
import { ledger } from '../../governance/ledger/TruthLedger';

describe('Constitutional Rejection Verification', () => {
    const STEWARD_ID = 'EXTERNAL-SOURCE-001';
    const INITIAL_LEDGER_COUNT = ledger.getAll().length;
    const INITIAL_AUDIT_COUNT = auditEngine.getHistory().length;

    // Setup a constitution with a rejection rule
    beforeAll(() => {
        const testConstitution = new TruthConstitution('vReject');
        const lowTrustExternalRule: ConstitutionRule = {
            id: 'reject-low-trust-external',
            category: 'GOVERNANCE',
            description: 'Rejects events from external sources with trust < 0.5',
            evaluate: (event: any, context: any) => {
                if (context.isExternalSource && context.trustLevel < 0.5) {
                    return { allowed: false, reason: 'Low trust external source' };
                }
                return { allowed: true };
            },
        };
        testConstitution.register(lowTrustExternalRule);
        registry.registerVersion('vReject', testConstitution);
        registry.setActive('vReject');
    });

    beforeEach(() => {
        // Clear ledger and audit log before each test to ensure isolation
        (ledger as any).events = [];
        (auditEngine as any).records = [];
    });

    test('External source with low trust -> Constitution FAIL -> Ledger NO WRITE -> Audit FAILURE', () => {
        // 1. Steward emits a signal (simulated external)
        const signalEvent = {
            stewardId: STEWARD_ID,
            type: 'SIGNAL_INGESTED',
            payload: { signal: 10 },
            version: 1,
        };

        const eventContext = {
            isExternalSource: true,
            trustLevel: 0.3, // Low trust
        };

        // 2. Constitution evaluates it
        const activeConstitution = registry.getActive();
        const evaluationResult = activeConstitution.evaluate(signalEvent, eventContext);

        let eventAccepted = false;
        try {
            if (evaluationResult.allowed) {
                eventAccepted = true;
                ledger.append(signalEvent); // This should not happen if rejected
                auditEngine.record(STEWARD_ID, 'LEDGER_EVENT_APPENDED', 'SUCCESS', { eventId: 'N/A' });
            } else {
                auditEngine.record(STEWARD_ID, 'LEDGER_EVENT_APPENDED', 'FAILURE', { reason: evaluationResult.reason });
            }
        } catch (error: any) {
            auditEngine.record(STEWARD_ID, 'LEDGER_EVENT_APPENDED', 'FAILURE', { error: error.message });
        }

        // Assertions for Constitution FAIL and Ledger NO WRITE
        expect(eventAccepted).toBe(false);
        expect(evaluationResult.allowed).toBe(false);
        expect(evaluationResult.reason).toBe('Low trust external source');
        expect(ledger.getAll()).toHaveLength(INITIAL_LEDGER_COUNT); // Ledger count should not increase

        // Assertions for Audit FAILURE
        const auditRecords = auditEngine.getHistory();
        expect(auditRecords).toHaveLength(INITIAL_AUDIT_COUNT + 1);
        expect(auditRecords[0].action).toBe('LEDGER_EVENT_APPENDED');
        expect(auditRecords[0].result).toBe('FAILURE');
        expect(auditRecords[0].details.reason).toBe('Low trust external source');
    });
});
