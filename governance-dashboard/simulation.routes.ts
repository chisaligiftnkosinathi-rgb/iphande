import { Router } from 'express';
import { registry } from '../governance/constitution/ConstitutionRegistry';
import { council } from '../governance/council/GovernanceCouncilEngine';

const router = Router();

router.post('/run', (req, res) => {
    const { proposalId, constitutionVersion, events, contextFactory } = req.body;

    const proposal = council.getProposal(proposalId);
    if (!proposal) return res.status(404).json({ message: 'Proposal not found' });

    const targetConstitution = registry.get(constitutionVersion);
    if (!targetConstitution) return res.status(404).json({ message: 'Constitution version not found' });

    const impact = council.simulateProposal(proposalId, targetConstitution, events, contextFactory);

    // Placeholder for 'Children Can't Go Hungry' invariant check
    const childrenImpact = impact.rejectedDelta > 5 ? 'FAIL' : 'PASS';

    res.json({
        ...impact,
        childrenImpact,
        proposalId
    });
});

export default router;
