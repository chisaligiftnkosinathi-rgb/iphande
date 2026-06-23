import { Router } from 'express';
import { ledger } from '../governance/ledger/TruthLedger';
import { replayEngine } from '../governance/replay/StewardReplayEngine';

const router = Router();

router.get('/steward/:id', (req, res) => {
    const stewardId = req.params.id;
    const events = ledger.getBySteward(stewardId);

    if (events.length === 0) {
        return res.status(404).json({ message: 'Steward history not found' });
    }

    const state = replayEngine.reconstruct(stewardId, events);
    res.json(state);
});

export default router;
