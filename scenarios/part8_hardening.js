const Node = require("../node");
const { makeEquivocator, makeByzantine, stealKey, forgeVote } = require("../attacks");
const HardenedSimulator = require("../security/hardened_simulator");

function createNodes() {
    return ["A", "B", "C", "D"].map(id => new Node(id));
}

console.log("\n===== Part 8.1: Equivocation detection =====");
{
    const nodes = createNodes();
    const sim = new HardenedSimulator(nodes);
    const d = nodes[3];
    makeEquivocator(d, { A: 100, B: 50, C: 75 });
    for (const peer of ["A", "B", "C"]) {
        const result = sim.observeVote(d.voteForPeer(peer), peer, 1);
        console.log(`D -> ${peer}: ${result.reason}`);
        if (result.reason === "EQUIVOCATION DETECTED") {
            console.log("Evidence:", result.evidence.map(v => `${v.recipient}:${v.value}`).join(", "));
        }
    }
}

console.log("\n===== Part 8.2: Key revocation =====");
{
    const nodes = createNodes();
    const sim = new HardenedSimulator(nodes);
    const fake = forgeVote("A", stealKey(nodes[0]), 999);
    console.log("Before revocation:", sim.registry.verifyVote(fake));
    sim.registry.revoke("A");
    console.log("After revocation:", sim.registry.verifyVote(fake));
}

console.log("\n===== Part 8.3: Validator admission control =====");
{
    const sim = new HardenedSimulator(createNodes());
    const sybil = new Node("X1");
    console.log("X1 vote:", sim.registry.verifyVote(sybil.vote(100)));
}

console.log("\n===== Part 8.4: Quorum sanity check =====");
{
    class WeakQuorum {
        size() { return 2; }
        reached(count) { return count >= 2; }
    }
    const sim = new HardenedSimulator(createNodes(), { quorum: new WeakQuorum() });
    try {
        sim.runConsensus(100);
    } catch (error) {
        console.log("Attack blocked:", error.message);
    }
}

console.log("\n===== Part 8.5: Commit certificate =====");
{
    const nodes = createNodes();
    makeByzantine(nodes[3], 50);
    const sim = new HardenedSimulator(nodes);
    const result = sim.runConsensus(100);
    console.log("Valid certificate:", sim.verifyCertificate(result.certificate));
    const tampered = { ...result.certificate, value: 999 };
    console.log("Altered value accepted:", sim.verifyCertificate(tampered));
    console.log("Audit records:", sim.auditLog.length);
}
