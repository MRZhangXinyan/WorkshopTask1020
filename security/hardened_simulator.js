// Part 8: an opt-in protected simulator; original simulator.js is untouched.
const QuorumEngine = require("../quorum");
const ValidatorRegistry = require("./registry");
const EquivocationMonitor = require("./equivocation_monitor");

class HardenedSimulator {
    constructor(nodes, options = {}) {
        this.nodes = nodes;
        this.registry = options.registry || new ValidatorRegistry(nodes);
        this.quorum = options.quorum || new QuorumEngine(this.registry.totalNodes);
        this.monitor = new EquivocationMonitor();
        this.auditLog = [];
    }

    // Part 8.4: refuse incorrect threshold configuration before voting.
    validateQuorum() {
        const n = this.registry.totalNodes;
        const minimum = Math.floor((2 * n) / 3) + 1;
        const actual = this.quorum.size();
        if (!Number.isInteger(actual) || actual < minimum || actual > n) {
            throw new Error(`Unsafe quorum size: ${actual}; expected ${minimum}..${n}`);
        }
        return actual;
    }

    // Verify approval, revocation and the signature BEFORE recording evidence.
    observeVote(vote, recipient = "consensus", round = 1) {
        const result = this.registry.verifyVote(vote);
        if (!result.valid) return { accepted: false, reason: result.reason };
        const finding = this.monitor.record(vote, recipient, round);
        return {
            accepted: !finding.detected,
            reason: finding.detected ? "EQUIVOCATION DETECTED" : "Accepted",
            evidence: finding.evidence
        };
    }

    runConsensus(proposal, options = {}) {
        const round = options.round ?? 1;
        const threshold = this.validateQuorum();
        const rawVotes = options.votes || this.nodes.map(node => node.vote(proposal));
        const valid = [];
        const rejected = [];

        for (const vote of rawVotes) {
            const result = this.observeVote(vote, "consensus", round);
            if (result.accepted || result.reason === "EQUIVOCATION DETECTED") {
                valid.push(vote);
            } else {
                rejected.push({ nodeId: vote && vote.nodeId, reason: result.reason });
            }
        }

        // Only one vote per validator. Exclude all votes from an equivocator.
        const unique = new Map();
        for (const vote of valid) {
            if (this.monitor.isEquivocating(vote.nodeId, round)) {
                rejected.push({ nodeId: vote.nodeId, reason: "Equivocation" });
            } else if (unique.has(vote.nodeId)) {
                rejected.push({ nodeId: vote.nodeId, reason: "Duplicate vote" });
            } else {
                unique.set(vote.nodeId, vote);
            }
        }

        const tally = new Map();
        for (const vote of unique.values()) {
            const key = JSON.stringify(vote.value);
            if (!tally.has(key)) tally.set(key, { value: vote.value, votes: [] });
            tally.get(key).votes.push(vote);
        }
        const winners = [...tally.values()].filter(item => item.votes.length >= threshold);
        console.log(`Required Quorum = ${threshold}`);
        for (const item of tally.values()) {
            console.log(`Value ${item.value}: ${item.votes.length} valid vote(s)`);
        }
        rejected.forEach(item => console.log(`REJECT ${item.nodeId}: ${item.reason}`));

        let certificate = null;
        if (winners.length === 1) {
            const winner = winners[0];
            certificate = {
                round,
                value: winner.value,
                quorum: threshold,
                signatures: winner.votes.map(v => ({
                    nodeId: v.nodeId, value: v.value, signature: v.signature
                }))
            };
            console.log(`COMMITTED: ${winner.value}`);
            console.log("COMMIT CERTIFICATE:", JSON.stringify(certificate, null, 2));
            this.auditLog.push(certificate);
        } else if (winners.length === 0) {
            console.log("NO CONSENSUS");
        } else {
            console.log("SAFETY VIOLATION: multiple quorum winners");
        }
        return { certificate, rejected, winners, quorum: threshold };
    }

    // Part 8.5: certificate must have distinct, approved, valid signers.
    verifyCertificate(cert) {
        if (!cert || !Array.isArray(cert.signatures)) return false;
        const threshold = this.validateQuorum();
        if (cert.quorum !== threshold || cert.signatures.length < threshold) return false;
        const ids = new Set();
        for (const vote of cert.signatures) {
            if (JSON.stringify(vote.value) !== JSON.stringify(cert.value)) return false;
            if (ids.has(vote.nodeId)) return false;
            if (!this.registry.verifyVote(vote).valid) return false;
            ids.add(vote.nodeId);
        }
        return true;
    }
}

module.exports = HardenedSimulator;
