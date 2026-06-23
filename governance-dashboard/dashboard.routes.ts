import { Router } from 'express';
import { registry } from '../governance/constitution/ConstitutionRegistry';
import { council } from '../governance/council/GovernanceCouncilEngine';
import { ledger } from '../governance/ledger/TruthLedger';
import { SQLiteLedgerStore } from '../governance/persistence/SQLiteLedgerStore';

const router = Router();
const store = new SQLiteLedgerStore();

router.get('/overview', (req, res) => {
    const events = ledger.getAll();
    const stewards = new Set(events.map(e => e.stewardId));
    res.json({
        constitutionVersion: registry.getActiveVersion(),
        ledgerEvents: events.length,
        activeStewards: stewards.size,
        openProposals: council.getAllProposals().filter(p => p.status === 'VOTING').length,
        chainIntegrity: ledger.verifyIntegrity() ? 'VALID' : 'BROKEN'
    });
});

/**
 * Returns the full forensic audit chain for the dashboard visualization.
 */
router.get('/chain', (req, res) => {
    const events = ledger.getAll();
    const forensicChain = events.map((e, i) => ({
        sequence: e.sequence,
        id: e.id,
        type: e.type,
        hash: e.hash,
        previousHash: e.previousHash,
        isLinked: i === 0 || e.previousHash === events[i - 1].hash
    }));

    res.json({
        isValid: ledger.verifyIntegrity(),
        chain: forensicChain
    });
});

/**
 * DEMO ENDPOINT: Simulates a database-level tamper event.
 */
router.post('/debug/tamper', (req, res) => {
    const { eventId, maliciousPayload } = req.body;
    store.dangerouslyTamperEvent(eventId, maliciousPayload);

    // Force re-hydration to show the failure in the UI
    ledger.hydrateFromDisk();

    res.json({
        message: "Truth has been tampered with. Check integrity status.",
        newIntegrity: ledger.verifyIntegrity() ? 'VALID' : 'BROKEN'
    });
});

export default router;
