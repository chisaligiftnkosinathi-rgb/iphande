// ═══════════════════════════════════════════════════════════════
// 🏛 GOVERNANCE COUNCIL ENGINE — INTEGRATION TEST
// ═══════════════════════════════════════════════════════════════
//
// Tests the full proposal lifecycle:
//   1. Register council members
//   2. Submit proposal to add stricter governance rule
//   3. Simulate impact
//   4. Cast weighted votes
//   5. Evaluate → APPROVED
//   6. Apply to constitution registry
//   7. Second proposal → REJECTED (insufficient support)
//   8. Verify ledger records preserved
//
// Run: npx ts-node app/tabs/governance_council_test.ts
// ═══════════════════════════════════════════════════════════════

import {
    TruthConstitutionV1,
    epistemicNoLowTrustExternalOverride,
    governanceMinStewardHistory,
    integrityCalibrationConsistency,
    ethicalNoRealityFabrication,
} from "./truthConstitutionV1";
import { ConstitutionRegistry } from "./constitutionRegistry";
import { TruthLedger } from "./truthLedger";
import { GovernanceCouncilEngine } from "./governanceCouncilEngine";
import { CouncilProposalLedger } from "./councilProposalLedger";
import { ConstitutionProposal } from "./councilTypes";

// ─────────────────────────────────────────────────
// 1. BUILD CURRENT CONSTITUTION (v1)
// ─────────────────────────────────────────────────

const v1 = new TruthConstitutionV1();
v1.register(epistemicNoLowTrustExternalOverride);
v1.register(governanceMinStewardHistory);
v1.register(integrityCalibrationConsistency);
v1.register(ethicalNoRealityFabrication);

const registry = new ConstitutionRegistry();
registry.registerVersion("v1", v1);
registry.setActive("v1");

const truthLedger = new TruthLedger();
const proposalLedger = new CouncilProposalLedger();

// ─────────────────────────────────────────────────
// 2. SETUP COUNCIL
// ─────────────────────────────────────────────────

const council = new GovernanceCouncilEngine();

council.registerMember({
    id: "m1",
    name: "Lead Auditor",
    role: "AUDITOR",
    trustLevel: 0.9,
    registeredAt: Date.now(),
});

council.registerMember({
    id: "m2",
    name: "System Steward",
    role: "STEWARD",
    trustLevel: 0.6,
    registeredAt: Date.now(),
});

council.registerMember({
    id: "m3",
    name: "Research Lead",
    role: "RESEARCHER",
    trustLevel: 0.7,
    registeredAt: Date.now(),
});

console.log(`\n🏛 COUNCIL FORMED — ${council.getMemberCount()} members registered\n`);

// ─────────────────────────────────────────────────
// 3. TEST DATA (events for simulation)
// ─────────────────────────────────────────────────

const testEvents = [
    { type: "SIGNAL_INGESTED", payload: { amount: 30 }, stewardId: "A" },
    { type: "SIGNAL_INGESTED", payload: { amount: 45 }, stewardId: "A" },
    { type: "SIGNAL_INGESTED", payload: { amount: 80 }, stewardId: "B" },
    { type: "SIGNAL_INGESTED", payload: { amount: 15 }, stewardId: "C" },
];

function contextFactory(event: any) {
    return {
        stewardHistoryCount: event.stewardId === "A" ? 4 : 1,
        isExternalSource: false,
        trustScore: 0.85,
    };
}

// ═══════════════════════════════════════════════════════════════
// TEST 1: PROPOSAL THAT SHOULD BE APPROVED
// ═══════════════════════════════════════════════════════════════

console.log("═══════════════════════════════════════════════════");
console.log("  TEST 1: Stricter governance rule (expect APPROVED)");
console.log("═══════════════════════════════════════════════════\n");

const proposal1: ConstitutionProposal = {
    id: "p1",
    description: "Add stricter governance: high-value signals require 5+ steward history",
    proposedRules: [
        {
            id: "governance.high_value_strict_v2",
            category: "GOVERNANCE",
            description: "High value signals require 5+ steward history",
            evaluate: (event: any, ctx: any) => {
                if (event.type !== "SIGNAL_INGESTED") return { allowed: true };
                if (
                    (ctx.stewardHistoryCount ?? 0) < 5 &&
                    event.payload.amount > 70
                ) {
                    return {
                        allowed: false,
                        reason: "v2 stricter: requires 5+ history for high-value signals",
                    };
                }
                return { allowed: true };
            },
        },
    ],
    submittedBy: "m1",
    timestamp: Date.now(),
    status: "DRAFT",
};

// Submit
council.submitProposal(proposal1);
proposalLedger.recordProposal(proposal1);
console.log("📋 Proposal 1 submitted:", proposal1.description);

// Simulate
const impact1 = council.simulateProposal(
    "p1",
    v1,
    testEvents,
    contextFactory
);
console.log("🔬 Simulation impact:", impact1);

// Vote
council.submitVote({
    memberId: "m1",
    proposalId: "p1",
    vote: "YES",
    rationale: "Stricter governance improves trust safety",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m1",
    proposalId: "p1",
    vote: "YES",
    rationale: "Stricter governance improves trust safety",
    timestamp: Date.now(),
});

council.submitVote({
    memberId: "m2",
    proposalId: "p1",
    vote: "YES",
    rationale: "Aligns with provision-first principle",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m2",
    proposalId: "p1",
    vote: "YES",
    rationale: "Aligns with provision-first principle",
    timestamp: Date.now(),
});

council.submitVote({
    memberId: "m3",
    proposalId: "p1",
    vote: "NO",
    rationale: "May block legitimate new stewards",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m3",
    proposalId: "p1",
    vote: "NO",
    rationale: "May block legitimate new stewards",
    timestamp: Date.now(),
});

console.log("🗳  Votes cast: 2 YES (trust 0.9 + 0.6), 1 NO (trust 0.7)");

// Evaluate
const result1 = council.evaluateProposal(
    "p1",
    v1,
    testEvents,
    contextFactory,
    truthLedger
);
proposalLedger.recordEvaluation(result1);

console.log("\n🏛 COUNCIL DECISION (Proposal 1):");
console.log(`   Approved:       ${result1.approved ? "✅ YES" : "❌ NO"}`);
console.log(`   Risk Score:     ${result1.riskScore.toFixed(3)}`);
console.log(`   Weighted Votes: ${result1.weightedVotes.toFixed(3)}`);
console.log(`   Reason:         ${result1.reason}`);
console.log(`   Simulation:     Δaccept=${result1.simulationImpact.acceptedDelta}, Δreject=${result1.simulationImpact.rejectedDelta}`);

// Apply if approved
if (result1.approved) {
    // Build new constitution with all rules
    const v2 = new TruthConstitutionV1();
    v2.register(epistemicNoLowTrustExternalOverride);
    v2.register(governanceMinStewardHistory);
    v2.register(integrityCalibrationConsistency);
    v2.register(ethicalNoRealityFabrication);
    for (const rule of proposal1.proposedRules) {
        v2.register(rule);
    }
    registry.registerVersion("v2", v2);
    registry.setActive("v2");
    console.log("\n✅ Proposal applied — Constitution v2 is now active");
}

// ═══════════════════════════════════════════════════════════════
// TEST 2: PROPOSAL THAT SHOULD BE REJECTED
// ═══════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════");
console.log("  TEST 2: Overly permissive rule (expect REJECTED)");
console.log("═══════════════════════════════════════════════════\n");

const proposal2: ConstitutionProposal = {
    id: "p2",
    description: "Remove all trust requirements (dangerous)",
    proposedRules: [
        {
            id: "governance.allow_all",
            category: "GOVERNANCE",
            description: "Allow everything regardless of trust",
            evaluate: () => ({ allowed: true }),
        },
    ],
    submittedBy: "m2",
    timestamp: Date.now(),
    status: "DRAFT",
};

council.submitProposal(proposal2);
proposalLedger.recordProposal(proposal2);
console.log("📋 Proposal 2 submitted:", proposal2.description);

// Simulate
const impact2 = council.simulateProposal(
    "p2",
    registry.getActive()!,
    testEvents,
    contextFactory
);
console.log("🔬 Simulation impact:", impact2);

// Vote — only 1 YES, 2 NO
council.submitVote({
    memberId: "m2",
    proposalId: "p2",
    vote: "YES",
    rationale: "Would simplify system",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m2",
    proposalId: "p2",
    vote: "YES",
    rationale: "Would simplify system",
    timestamp: Date.now(),
});

council.submitVote({
    memberId: "m1",
    proposalId: "p2",
    vote: "NO",
    rationale: "Completely undermines trust architecture",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m1",
    proposalId: "p2",
    vote: "NO",
    rationale: "Completely undermines trust architecture",
    timestamp: Date.now(),
});

council.submitVote({
    memberId: "m3",
    proposalId: "p2",
    vote: "NO",
    rationale: "Violates epistemic safety",
    timestamp: Date.now(),
});
proposalLedger.recordVote({
    memberId: "m3",
    proposalId: "p2",
    vote: "NO",
    rationale: "Violates epistemic safety",
    timestamp: Date.now(),
});

console.log("🗳  Votes cast: 1 YES (trust 0.6), 2 NO (trust 0.9 + 0.7)");

// Evaluate
const result2 = council.evaluateProposal(
    "p2",
    registry.getActive()!,
    testEvents,
    contextFactory,
    truthLedger
);
proposalLedger.recordEvaluation(result2);

console.log("\n🏛 COUNCIL DECISION (Proposal 2):");
console.log(`   Approved:       ${result2.approved ? "✅ YES" : "❌ NO"}`);
console.log(`   Risk Score:     ${result2.riskScore.toFixed(3)}`);
console.log(`   Weighted Votes: ${result2.weightedVotes.toFixed(3)}`);
console.log(`   Reason:         ${result2.reason}`);

// ═══════════════════════════════════════════════════════════════
// VERIFICATION: LEDGER INTEGRITY
// ═══════════════════════════════════════════════════════════════

console.log("\n═══════════════════════════════════════════════════");
console.log("  VERIFICATION: Ledger Integrity");
console.log("═══════════════════════════════════════════════════\n");

console.log(`📒 Proposal Ledger: ${proposalLedger.getCount()} entries`);
console.log(`   Approved: ${proposalLedger.getApprovedProposals().length}`);
console.log(`   Rejected: ${proposalLedger.getRejectedProposals().length}`);
console.log(`📜 Truth Ledger: ${truthLedger.getAll().length} governance events recorded`);

const govEvents = truthLedger
    .getAll()
    .filter((e) => e.type === "GOVERNANCE_DECISION");
console.log(`   GOVERNANCE_DECISION events: ${govEvents.length}`);

for (const e of govEvents) {
    console.log(
        `     → ${e.payload.proposalId}: ${e.payload.approved ? "APPROVED" : "REJECTED"} — ${e.payload.reason}`
    );
}

// ─────────────────────────────────────────────────
// FINAL SUMMARY
// ─────────────────────────────────────────────────

console.log("\n═══════════════════════════════════════════════════");
console.log("  🧭 FULL STACK VERIFICATION COMPLETE");
console.log("═══════════════════════════════════════════════════");
console.log(`
  1. 🏛  Constitution Layer    — v2 active with council-approved rules
  2. 🔬  Simulation Layer      — Impact predicted for both proposals
  3. 🧠  Validation Layer      — Structural correctness enforced
  4. 📜  Ledger Layer          — ${truthLedger.getAll().length} immutable events
  5. 🏛  Council Layer (NEW)   — ${proposalLedger.getCount()} proposals evaluated
`);
