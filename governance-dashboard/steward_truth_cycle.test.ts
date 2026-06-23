import { auditEngine } from '../../governance/audit/GovernanceAuditEngine';
import { registry } from '../../governance/constitution/ConstitutionRegistry';
import { ConstitutionRule, TruthConstitution } from '../../governance/constitution/TruthConstitution';
import { ledger } from '../../governance/ledger/TruthLedger';
import { replayEngine } from '../../governance/replay/StewardReplayEngine';

describe('Steward Truth Cycle Verification', () => {
    const STEWARD_ID = 'MEL-OS-0001';
    const INITIAL_LEDGER_COUNT = ledger.getAll().length;
    const INITIAL_AUDIT_COUNT = auditEngine.getHistory().length;

    // Setup a basic constitution for testing
    beforeAll(() => {
        const testConstitution = new TruthConstitution('vTest');
        const allowAllRule: ConstitutionRule = {
            id: 'allow-all',
            category: 'GOVERNANCE',
            description: 'Allows all events for testing purposes',
            evaluate: (event: any, context: any) => ({ allowed: true }),
        };
        testConstitution.register(allowAllRule);
        registry.registerVersion('vTest', testConstitution);
        registry.setActive('vTest');
    });

    beforeEach(() => {
        // Clear ledger and audit log before each test to ensure isolation
        (ledger as any).events = [];
        (auditEngine as any).records = [];
    });

    test('Steward emits signal -> Constitution PASS -> Ledger Append -> Replay Reconstruct -> Audit Recorded', () => {
        // 1. Steward emits a signal
        const signalEvent = {
            stewardId: STEWARD_ID,
            type: 'SIGNAL_INGESTED',
            payload: { signal: 85 },
            version: 1,
        };

        // 2. Constitution evaluates it
        const activeConstitution = registry.getActive();
        const evaluationResult = activeConstitution.evaluate(signalEvent, {});

        let eventAccepted = false;
        let appendedEvent: any;

        if (evaluationResult.allowed) {
            eventAccepted = true;
            // 3. Ledger records it
            appendedEvent = ledger.append(signalEvent);
            auditEngine.record(STEWARD_ID, 'LEDGER_EVENT_APPENDED', 'SUCCESS', { eventId: appendedEvent.id });
        } else {
            auditEngine.record(STEWARD_ID, 'LEDGER_EVENT_APPENDED', 'FAILURE', { reason: evaluationResult.reason });
        }

        // Assertions for Constitution PASS and Ledger Append
        expect(eventAccepted).toBe(true);
        expect(ledger.getAll()).toHaveLength(INITIAL_LEDGER_COUNT + 1);
        expect(appendedEvent).toBeDefined();
        expect(appendedEvent.stewardId).toBe(STEWARD_ID);
        expect(appendedEvent.type).toBe('SIGNAL_INGESTED');

        // 4. Replay reconstructs it
        const stewardEvents = ledger.getBySteward(STEWARD_ID);
        const reconstructedState = replayEngine.reconstruct(STEWARD_ID, stewardEvents);

        // Assertions for Replay Reconstruct
        expect(reconstructedState.stewardId).toBe(STEWARD_ID);
        expect(reconstructedState.totalSignals).toBe(1);
        expect(reconstructedState.lastSignalValue).toBe(85);

        // 5. Audit Engine records the governance action
        const auditRecords = auditEngine.getHistory();
        expect(auditRecords).toHaveLength(INITIAL_AUDIT_COUNT + 1);
        expect(auditRecords[0].action).toBe('LEDGER_EVENT_APPENDED');
        expect(auditRecords[0].result).toBe('SUCCESS');
    });
});
