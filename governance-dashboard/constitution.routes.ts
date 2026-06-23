import { Router } from 'express';
import { registry } from '../governance/constitution/ConstitutionRegistry';
import { simulator } from '../governance/constitution/ConstitutionSimulator';

const router = Router();

router.get('/active', (req, res) => {
    const active = registry.getActive();
    res.json({
        version: registry.getActiveVersion(),
        rules: active.getRules()
    });
});

router.get('/versions', (req, res) => {
    res.json(registry.getVersionList());
});

router.post('/simulate', (req, res) => {
    const { constitutionVersion, events, contextFactory } = req.body;
    const targetCons = registry.get(constitutionVersion);
    if (!targetCons) return res.status(404).json({ message: 'Version not found' });

    const result = simulator.run(targetCons, events, contextFactory);
    res.json({
        accepted: result.accepted.length,
        rejected: result.rejected.length,
        riskScore: result.rejected.length / (events.length || 1)
    });
});

export default router;
