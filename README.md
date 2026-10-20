# Breaking and Understanding Byzantine Fault Tolerance (BFT)

**University of Bristol — COMSM0122: Fundamentals of System Security**  
**Workshop 2: Breaking and Understanding Byzantine Fault Tolerance**

> **Project type:** Educational JavaScript simulation; not a production BFT implementation.  
> **Workshop date:** [Insert workshop date]  
> **Student(s):** [Insert name(s)]

## 1. Project Overview

This project explores **Byzantine Fault Tolerance (BFT)** through a simplified JavaScript consensus simulator. Four validator nodes (A, B, C and D) are used to demonstrate how voting and quorum rules affect consensus, how malicious behaviour can undermine the system's assumptions, and how defensive mechanisms can detect or mitigate attacks.

The work covers the workshop's **Parts 1–8**:

- **Parts 1–6:** Run and analyse the supplied honest-consensus and attack scenarios.
- **Part 7:** Combine Byzantine voting and quorum tampering to investigate failures of progress and safety assumptions.
- **Part 8:** Implement and evaluate five educational defensive mechanisms.

**Part 9 is an optional extension** in the workshop manual and is not represented here as a separately completed task.

The original simulator and Parts 1–6 scenarios are preserved for baseline comparisons. Part 7 adds a new attack scenario, while Part 8 adds a separate `HardenedSimulator` rather than replacing the original `simulator.js`.

## 2. Learning Objectives

The simulator is intended to illustrate:

1. How nodes generate votes and how a quorum is calculated.
2. How one Byzantine validator can be tolerated in the four-node voting example.
3. Why authenticated messages may still be contradictory (equivocation).
4. How compromised credentials allow validator impersonation.
5. Why validator membership and admission control matter.
6. How weakening quorum rules can allow conflicting values to satisfy a threshold.
7. How to test the effect of malicious node behaviour and unsafe parameters.
8. How equivocation monitoring, key revocation, validator registration, quorum validation and commit certificates improve the **educational model**.

## 3. Requirements

- **Node.js 18 or later** (tested with Node.js v22.16.0)
- npm (included with typical Node.js installations)
- A terminal, such as Ubuntu/WSL, macOS Terminal, Windows Terminal or VS Code's integrated terminal
- An editor such as Visual Studio Code

The project uses **CommonJS** modules (`require`) and Node.js built-in modules, including `crypto` and `node:test`. The supplied `package.json` declares no external runtime dependencies. It is not necessary to install a database or run multiple machines.

## 4. Installation and Quick Start

Extract the project and open a terminal **inside the `bft-lab` directory**, where `package.json` is located.

```bash
node --version
npm --version
npm install
npm start
```

`npm start` prints the original scenario choices. The added Part 7, Part 8 and test commands are also available through `package.json`:

```bash
npm run part7
npm run part8
npm run test:part8
```

Each scenario can also be executed directly with Node.js; for example:

```bash
node scenarios/honest.js
node scenarios/part8_hardening.js
```

## 5. Project Structure

```text
bft-lab/
├── README.md                         # Full project documentation
├── README_PART8.md                   # Part 8-specific notes
├── PART8_STEP_BY_STEP_ZH.md          # Chinese implementation guide
├── package.json                      # npm scripts and project metadata
├── package-lock.json
├── index.js                          # Lists original workshop scenarios
├── node.js                           # Validator identity, vote creation
├── network.js                        # Simple message recording/broadcast helper
├── crypto.js                         # Educational SHA-256-based vote authentication
├── quorum.js                         # Default quorum calculation
├── simulator.js                      # Original simplified consensus simulator
├── attacks.js                        # Reusable attack helpers
├── scenarios/
│   ├── honest.js                      # Part 1: honest consensus
│   ├── byzantine.js                  # Part 2: one Byzantine voter
│   ├── equivocation.js               # Part 3: conflicting messages
│   ├── key_theft.js                  # Part 4: stolen-secret impersonation
│   ├── sybil.js                      # Part 5: fabricated identities
│   ├── quorum_tampering.js           # Part 6: weakened quorum
│   ├── part7_breaking.js             # Part 7: combined attack experiments
│   └── part8_hardening.js            # Part 8: five mitigation demonstrations
├── security/
│   ├── registry.js                   # Membership, vote checks, revocation/rotation
│   ├── equivocation_monitor.js       # Per-round conflicting-message evidence
│   └── hardened_simulator.js         # Hardened voting and certificate verification
└── tests/
    └── part8.test.js                 # 16 automated security regression tests
```

The original `network.js` is a simple demonstration helper; the original consensus loop does **not** simulate a real asynchronous network protocol.

## 6. Running Parts 1–6: Original Workshop Scenarios

Run these commands from the project root:

| Part | Scenario | Command | Main observation |
|---|---|---|---|
| 1 | Honest consensus | `npm run honest` | A, B, C and D vote for 100; `COMMITTED: 100` with quorum 3. |
| 2 | Byzantine behaviour | `npm run byzantine` | A, B and C vote 100; D votes 50; `COMMITTED: 100`. |
| 3 | Equivocation | `npm run equivocation` | D generates values 100, 50 and 75 for A, B and C respectively. |
| 4 | Key theft | `npm run key-theft` | An attacker obtains A's simulated secret and constructs a vote for 999 claiming to be A. |
| 5 | Sybil attack | `npm run sybil` | The displayed validator list grows from A–D to A–D plus X1–X4. |
| 6 | Quorum tampering | `npm run quorum` | A 2–2 split with quorum reduced to 2 produces `SAFETY VIOLATION!`. |

### Part 1: Honest Consensus

Four validators vote for the same proposal (`100`). With the default quorum of three, the proposed value is committed. This establishes the normal reference behaviour.

### Part 2: Byzantine Behaviour

The `makeByzantine()` helper changes D's voting behaviour to always return `50` while A, B and C vote for `100`. Three matching votes meet the quorum, so the simulator commits `100`.

### Part 3: Equivocation

The `makeEquivocator()` helper creates different authenticated messages for different recipients. This scenario **prints conflicting messages**; it does not itself run the Part 8 equivocation detector.

### Part 4: Key Theft

`stealKey()` returns the simulated secret belonging to Node A. `forgeVote()` uses that secret to construct a message claiming to be from A with value `999`. The original scenario prints the forged message; it does not independently display a signature-verification outcome.

### Part 5: Sybil Attack

The script adds X1–X4 to an existing four-validator JavaScript array. It demonstrates uncontrolled membership expansion, but the original scenario does **not** perform a consensus run with these identities.

### Part 6: Quorum Tampering

`WeakQuorum` deliberately reduces the required votes from three to two. With A and B voting for `100` and C and D voting for `50`, both values satisfy the weakened threshold. The original simulator reports a safety violation. This is a **threshold-conflict demonstration**, not a complete simulation of two independently finalised commits in a production BFT protocol.

### Quorum Rule

For the default educational configuration, `quorum.js` uses:

```text
quorum = floor((2 × totalNodes) / 3) + 1
```

For four nodes, the quorum is **3**. In classical BFT reasoning, a configuration of `n = 3f + 1` is associated with a maximum of `f` Byzantine faults under the relevant protocol assumptions; this four-node example is designed around `f = 1`.

## 7. Part 7: Breaking BFT

Execute:

```bash
npm run part7
```

`scenarios/part7_breaking.js` performs **two comparisons with the same four validators**. C and D are made Byzantine and always vote `50`, while A and B vote for the proposal `100`.

| Experiment | Votes for 100 | Votes for 50 | Quorum | Observed simulator output |
|---|---:|---:|---:|---|
| Test 1: Default quorum | 2 | 2 | 3 | `NO CONSENSUS` |
| Test 2: Weakened quorum | 2 | 2 | 2 | `SAFETY VIOLATION!` |

**Interpretation:** In Test 1, neither value receives three votes. This execution makes no progress, illustrating the effect of exceeding the four-node configuration's designed one-Byzantine-node fault bound. It does **not** demonstrate two conflicting commits.

In Test 2, a custom `WeakQuorum` accepts two votes. Both values then meet the weakened threshold, demonstrating why quorum configuration is security-critical. The simulator's safety-violation message reflects conflicting quorum winners in its simplified tally, not a formal proof of a real protocol safety failure.

## 8. Part 8: Hardening the BFT Simulator

Execute all five demonstrations:

```bash
npm run part8
```

The original `simulator.js` remains unchanged. The demonstrations use `security/hardened_simulator.js`, which checks validator membership and message authentication **before counting votes**, prevents duplicate voter IDs from being counted repeatedly, validates quorum size, and records supporting evidence for a successful commit.

### 8.1 Equivocation Detection

**Threat:** D sends `100` to A, `50` to B, and `75` to C in the same round.

**Mitigation:** `EquivocationMonitor` records sender ID, value, signature, recipient and round. When it observes two different values attributed to the same sender in the same round, it reports `EQUIVOCATION DETECTED` and retains the compared messages as evidence. Within the hardened consensus tally, votes from an observed equivocator are excluded.

**Observed result:**

```text
D -> A: Accepted
D -> B: EQUIVOCATION DETECTED
D -> C: EQUIVOCATION DETECTED
```

**Limitation:** Detection requires conflicting messages to be shared with the monitor. The signed content does not cryptographically bind the round identifier.

### 8.2 Key Protection: Revocation and Rotation

**Threat:** A stolen simulated secret allows an attacker to create votes that pass the toy authentication check.

**Mitigation:** `ValidatorRegistry.revoke("A")` marks A as revoked, and the verifier rejects subsequent votes associated with A. The registry also supports `rotateKey(node, newSecret)` as an optional way to replace the registered secret.

**Observed result:**

```text
Before revocation: { valid: true, reason: 'Accepted' }
After revocation:  { valid: false, reason: 'Revoked validator' }
```

**Limitation:** Revocation also blocks legitimate votes from A. Governance approval, credential redistribution, and validation of historic certificates are outside the simulator's scope. The demonstrated key-rotation method is a local state update rather than secure distributed key management.

### 8.3 Sybil Prevention Through Validator Admission Control

**Threat:** An attacker creates additional validator IDs (e.g., X1–X4).

**Mitigation:** `ValidatorRegistry` maintains approved validator IDs and their registered secrets. Votes from unknown identities, or votes that fail authentication against a registered identity, are rejected. Duplicate validator IDs are rejected when the registry is created.

**Observed result:**

```text
X1 vote: { valid: false, reason: 'Unapproved validator' }
```

**Limitation:** A real deployment still needs a trustworthy process for approving and removing validators. Registration cannot repair a leaked secret by itself.

### 8.4 Quorum Rule Protection

**Threat:** A developer or attacker configures a two-vote quorum for four nodes.

**Mitigation:** `validateQuorum()` checks that quorum size is an integer and lies between `floor(2n/3) + 1` and `n`, where `n` is the registered validator count.

**Observed result:**

```text
Attack blocked: Unsafe quorum size: 2; expected 3..4
```

**Limitation:** This sanity check enforces the threshold used by the educational model; it is not a substitute for a complete protocol proof. A larger-than-necessary quorum may also reduce progress under faults.

### 8.5 Commit Certificate and Audit Log

**Threat:** A result such as `COMMITTED: 100` does not, on its own, retain evidence of who supported the value.

**Mitigation:** After one value reaches quorum, the hardened simulator builds a certificate containing the round, committed value, quorum, and vote evidence (`nodeId`, `value`, and `signature`). It saves the certificate in `auditLog`. `verifyCertificate()` checks the present quorum, distinct signer IDs, approved/non-revoked membership, authentication and agreement with the claimed value.

**Observed result:** With A, B and C voting `100` and Byzantine D voting `50`:

```text
Required Quorum = 3
Value 100: 3 valid vote(s)
Value 50: 1 valid vote(s)
COMMITTED: 100
Valid certificate: true
Altered value accepted: false
Audit records: 1
```

**Limitation:** Historic certificates are checked using the *current* registry state, so subsequent revocation or key rotation can invalidate earlier evidence. The toy signed payload does not cryptographically bind a round or view and is not a production-grade commit certificate.

## 9. Automated Testing

Run the Part 8 security regression tests:

```bash
npm run test:part8
```

The test suite uses Node.js's built-in `node:test` runner and `node:assert/strict` to verify:

- Detection of conflicting authenticated messages in the same round.
- No false positive for repeated identical messages or messages in a different round.
- Exclusion of observed equivocators from the consensus tally.
- Rejection of compromised credentials after revocation or rotation.
- Rejection of unapproved identities, invalid identity signatures and duplicate validator registration.
- Rejection of unsafe quorum configurations and acceptance of the default quorum of three.
- Generation and validation of commit certificates.
- Rejection of tampered certificates, duplicated signers and insufficient evidence.
- Rejection of malformed or unsigned votes and duplicate votes.
- Failure to reach the original three-vote quorum in the two-Byzantine-node example.

**Verified result for this reference implementation:**

```text
# tests 16
# pass 16
# fail 0
```

A passing test suite confirms the documented examples under this simulator's assumptions; it does **not** establish formal BFT safety or production security.

## 10. Saving Experimental Evidence

On a Bash-compatible shell (including Ubuntu/WSL), outputs can be displayed and saved simultaneously:

```bash
mkdir -p evidence
npm run honest       | tee evidence/part1_honest.txt
npm run byzantine    | tee evidence/part2_byzantine.txt
npm run equivocation | tee evidence/part3_equivocation.txt
npm run key-theft    | tee evidence/part4_key_theft.txt
npm run sybil        | tee evidence/part5_sybil.txt
npm run quorum       | tee evidence/part6_quorum.txt
npm run part7        | tee evidence/part7_breaking.txt
npm run part8        | tee evidence/part8_hardening.txt
npm run test:part8   | tee evidence/part8_tests.txt
```

The `evidence/` folder is a suggested way to organise screenshots and text logs; it is **not** a required location defined in the workshop manual. For each experiment, record the command, important observations, attack assumptions, observed impact and (for mitigations) remaining limitations.

## 11. Security Model and Known Limitations

This code is **intentionally simplified for classroom use**. The following limitations must be understood before interpreting the results:

1. **Not a real digital-signature scheme:** `crypto.js` calculates `SHA-256(nodeId:value:secret)`. It does not implement RSA, ECDSA, Ed25519 or a standards-based HMAC construction. The comparison in `verify()` is also not timing-safe.
2. **Predictable secrets:** Node secrets take the form `secret-A`, `secret-B`, etc. They are not protected credentials.
3. **No cryptographic round/view binding:** A message can be replayed or relabelled into a different round because the signed content includes only node ID, value and secret.
4. **Simplified network:** `network.js` records sends/broadcasts, but the consensus engine is a synchronous local simulation without real asynchronous message delivery, authenticated peer channels or fault-tolerant communication stages.
5. **Simplified consensus:** This is not a full PBFT/HotStuff implementation, and its printed `SAFETY VIOLATION!` should not be interpreted as evidence of independently finalised conflicting commits.
6. **Centralised demonstration registry and monitor:** Validator approval, revocation and equivocation evidence sharing assume trusted management and shared visibility, rather than demonstrating distributed governance or evidence propagation.
7. **Certificate limitations:** Certificates use the current registry on verification; old certificates can stop verifying after a key change or revocation. The implementation also omits production-grade certificate persistence and robust replay protection.
8. **Availability is not guaranteed:** Rejecting compromised validators and requiring a safe quorum may make progress impossible if too many validators are unavailable or revoked.

A production deployment would require well-specified consensus phases and rounds, secure key generation/storage, formally designed signing domains, validator governance, authenticated networking, durable audit records, replay protection and broader adversarial testing.

## 12. Workshop Submission Notes

Consult the workshop manual and the current Blackboard instructions before submitting. The manual requests:

- A ZIP submission through Blackboard during the applicable workshop submission window.
- Appropriate documentation and a `README.md` for the GitHub project.
- A GitHub tag containing the workshop date and name.
- An invitation to the GitHub user **`systemsecuritybcsg`**.

The manual refers to submitting the implementation of “both tasks” without unambiguously identifying those two tasks in its Parts 1–9 structure; clarify the final assessment/submission scope with teaching staff if necessary. **Do not treat the optional Part 9 as compulsory.**

Before uploading, confirm the project still runs from a clean checkout, that no real secrets or credentials are included, and that the README's student/date placeholders are filled in.

## 13. Acknowledgement

This project uses the BFT workshop starter code supplied for **COMSM0122: Fundamentals of System Security**. The additional Part 7 scenario, Part 8 security components, tests and documentation are educational extensions built on that starter code. The original teaching examples have been preserved for comparisons.
