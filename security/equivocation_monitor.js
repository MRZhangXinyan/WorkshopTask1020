// Part 8.1: compare valid messages from the same sender in the same round.
class EquivocationMonitor {
    constructor() {
        this.messages = new Map();
    }

    record(vote, recipient, round) {
        const key = JSON.stringify([round, vote.nodeId]);
        if (!this.messages.has(key)) this.messages.set(key, []);
        const history = this.messages.get(key);
        history.push({
            nodeId: vote.nodeId,
            value: vote.value,
            signature: vote.signature,
            recipient,
            round
        });
        const values = new Set(history.map(item => JSON.stringify(item.value)));
        return {
            detected: values.size > 1,
            evidence: history.map(item => ({ ...item }))
        };
    }

    isEquivocating(nodeId, round) {
        const key = JSON.stringify([round, nodeId]);
        const history = this.messages.get(key) || [];
        return new Set(history.map(item => JSON.stringify(item.value))).size > 1;
    }
}

module.exports = EquivocationMonitor;
