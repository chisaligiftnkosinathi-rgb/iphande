import { registry } from '../../governance/constitution/ConstitutionRegistry';
import { ConstitutionRule, TruthConstitution } from '../../governance/constitution/TruthConstitution';
import { ledger, LedgerEvent } from '../../governance/ledger/TruthLedger';
import { replayEngine, StewardState } from '../../governance/replay/StewardReplayEngine';

describe('Replay Integrity Verification', () => {
    const STEWARD_ID = 'MEL-OS-REPLAY';
    const NUM_EVENTS = 100;

    beforeAll(() => {
        // Setup a basic constitution (not directly used in this test, but good practice)
        const testConstitution = new TruthConstitution('vReplay');
        const allowAllRule: ConstitutionRule = {
            id: 'allow-all-replay',
            category: 'GOVERNANCE',
            description: 'Allows all events for replay testing',
            evaluate: (event: any, context: any) => ({ allowed: true }),
        };
        testConstitution.register(allowAllRule);
        registry.registerVersion('vReplay', testConstitution);
        registry.setActive('vReplay');
    });

    beforeEach(() => {
        // Clear ledger before each test
        (ledger as any).events = [];
    });

    test('Generate 100 events -> Reconstruct from ledger -> Compare states', () => {
        const expectedFinalState: StewardState = {
            stewardId: STEWARD_ID,
            totalSignals: 0,
            lastSignalValue: 0,
            calibrationBand: 'LOW',
            narrativeCount: 0,
            lastActive: 0,
        };

        // 1. Generate 100 events and append to ledger
        for (let i = 0; i < NUM_EVENTS; i++) {
            const signalValue = Math.floor(Math.random() * 100);
            const event: Omit<LedgerEvent, 'id' | 'timestamp'> = {
                stewardId: STEWARD_ID,
                type: 'SIGNAL_INGESTED',
                payload: { signal: signalValue },
                version: 1,
            };
            ledger.append(event);

            // Manually update expected state
            expectedFinalState.totalSignals++;
            expectedFinalState.lastSignalValue = signalValue;
            expectedFinalState.lastActive = Date.now(); // This will be approximate

            if (i % 10 === 0) {
                const band = i % 20 === 0 ? 'HIGH' : 'MEDIUM';
                ledger.append({ stewardId: STEWARD_ID, type: 'CALIBRATION_APPLIED', payload: { band }, version: 1 });
                expectedFinalState.calibrationBand = band;
                expectedFinalState.lastActive = Date.now();
            }
        }

        // 2. Reconstruct state from ledger
        const allStewardEvents = ledger.getBySteward(STEWARD_ID);
        const reconstructedState = replayEngine.reconstruct(STEWARD_ID, allStewardEvents);

        // 3. Compare states
        expect(reconstructedState.stewardId).toBe(expectedFinalState.stewardId);
        expect(reconstructedState.totalSignals).toBe(expectedFinalState.totalSignals);
        expect(reconstructedState.lastSignalValue).toBe(expectedFinalState.lastSignalValue);
        expect(reconstructedState.calibrationBand).toBe(expectedFinalState.calibrationBand);
        // Note: lastActive will be approximate due to Date.now() in append and reconstruction
        expect(reconstructedState.lastActive).toBeGreaterThan(0);
    });
});
