import { Router } from 'express';
import { auditEngine } from '../governance/audit/GovernanceAuditEngine';
import { ledger } from '../governance/ledger/TruthLedger';

const router = Router();

router.post('/event', (req, res) => {
    const { stewardId, type, payload } = req.body;

    try {
        const event = ledger.append({ stewardId, type, payload, version: 1 });
        auditEngine.record(stewardId, 'LEDGER_EVENT_APPENDED', 'SUCCESS', { eventId: event.id });
        res.status(201).json({ eventId: event.id, accepted: true });
    } catch (error: any) {
        auditEngine.record(stewardId, 'LEDGER_EVENT_APPENDED', 'FAILURE', { error: error.message });
        res.status(400).json({ accepted: false, reason: error.message });
    }
});

router.get('/events', (req, res) => {
    res.json(ledger.getAll());
});

router.get('/steward/:id', (req, res) => {
    const events = ledger.getBySteward(req.params.id);
    if (events.length === 0) {
        return res.status(404).json({ message: 'No events found for steward' });
    }
    res.json(events);
});

export default router;
