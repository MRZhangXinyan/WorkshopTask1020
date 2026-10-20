// Part 8.2 and 8.3: key revocation and approved-validator membership.
const { verify } = require("../crypto");

class ValidatorRegistry {
    constructor(nodes) {
        this.secrets = new Map();
        this.revoked = new Set();
        for (const node of nodes) {
            if (this.secrets.has(node.id)) {
                throw new Error(`Duplicate validator ID: ${node.id}`);
            }
            this.secrets.set(node.id, node.secret);
        }
    }

    get totalNodes() {
        return this.secrets.size;
    }

    verifyVote(vote) {
        if (!vote || typeof vote.nodeId !== "string" ||
            (typeof vote.value !== "number" && typeof vote.value !== "string") ||
            typeof vote.signature !== "string") {
            return { valid: false, reason: "Malformed vote" };
        }
        if (!this.secrets.has(vote.nodeId)) {
            return { valid: false, reason: "Unapproved validator" };
        }
        if (this.revoked.has(vote.nodeId)) {
            return { valid: false, reason: "Revoked validator" };
        }
        const secret = this.secrets.get(vote.nodeId);
        if (!verify(vote.nodeId, vote.value, secret, vote.signature)) {
            return { valid: false, reason: "Invalid signature" };
        }
        return { valid: true, reason: "Accepted" };
    }

    revoke(nodeId) {
        if (!this.secrets.has(nodeId)) throw new Error("Unknown validator");
        this.revoked.add(nodeId);
    }

    // Optional alternative to revocation: changing the registered secret.
    rotateKey(node, newSecret) {
        if (!this.secrets.has(node.id)) throw new Error("Unknown validator");
        if (typeof newSecret !== "string" || newSecret.length < 1) {
            throw new Error("Invalid new secret");
        }
        node.secret = newSecret;
        this.secrets.set(node.id, newSecret);
        this.revoked.delete(node.id);
    }
}

module.exports = ValidatorRegistry;
