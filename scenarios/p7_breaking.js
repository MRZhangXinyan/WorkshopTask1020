const Node = require("../node");
const Simulator = require("../simulator");
const { makeByzantine } = require("../attacks");

// Step 1: Create four validators.
const nodes = [
    new Node("A"),
    new Node("B"),
    new Node("C"),
    new Node("D")
];

// Step 2: Compromise two nodes (C and D).
// Both ignore the proposed value 100 and vote 50 instead.
makeByzantine(nodes[2], 50);
makeByzantine(nodes[3], 50);

console.log("\n===== Test 1: Normal quorum, two Byzantine nodes =====");

const originalSimulator = new Simulator(nodes);
originalSimulator.runConsensus(100);

// Step 3: Combine the two Byzantine nodes with an unsafe quorum.
class WeakQuorum {
    size() {
        return 2;
    }

    reached(voteCount) {
        return voteCount >= this.size();
    }
}

console.log("\n===== Test 2: Weakened quorum, two Byzantine nodes =====");

const weakenedSimulator = new Simulator(nodes, new WeakQuorum());
weakenedSimulator.runConsensus(100);