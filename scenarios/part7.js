const Node = require("../node");
const {forgeVote, stealKey} = require("../attacks");

const nodes = [

    new Node("A"),
    new Node("B"),
    new Node("C"),
    new Node("D")

];

const stolenSecret = stealKey(nodes[0]);


const forgedVote =
    forgeVote(
        "A",
        stolenSecret,
        999
    );

console.log(nodes[0].verifyVote(forgedVote, () => nodes[0].secret)) //verify forged vote with stolen secret