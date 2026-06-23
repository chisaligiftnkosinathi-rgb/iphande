import { Router } from 'express';
import { auditEngine } from '../governance/audit/GovernanceAuditEngine';
import { registry } from '../governance/constitution/ConstitutionRegistry';
import { council } from '../governance/council/GovernanceCouncilEngine';
import { ledger } from '../governance/ledger/TruthLedger';

const router = Router();

router.get('/proposals', (req, res) => {
    res.json(council.getAllProposals());
});

router.post('/proposal', (req, res) => {
    const { proposal, actor } = req.body;
    try {
        council.submitProposal(proposal);
        auditEngine.record(actor, 'PROPOSAL_CREATED', 'SUCCESS', { proposalId: proposal.id });
        res.status(201).json(proposal);
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/vote', (req, res) => {
    const { vote, actor } = req.body;
    try {
        council.submitVote(vote);
        auditEngine.record(actor, 'VOTE_CAST', 'SUCCESS', { proposalId: vote.proposalId });
        res.json({ status: 'VOTE_RECORDED' });
    } catch (e: any) {
        res.status(400).json({ error: e.message });
    }
});

router.post('/evaluate', (req, res) => {
    const { proposalId, actor, events, contextFactory } = req.body;
    const evaluation = council.evaluateProposal(proposalId, registry.getActive(), events, contextFactory, ledger);
    auditEngine.record(actor, 'PROPOSAL_EVALUATED', 'SUCCESS', { proposalId, approved: evaluation.approved });
    res.json(evaluation);
});

export default router;
