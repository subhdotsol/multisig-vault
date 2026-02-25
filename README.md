# Multi-Sig Vault (Anchor Program)

A Solana smart contract built with Anchor implementing an M-of-N Multi-Signature Treasury Vault.

Funds stored in the vault can only be withdrawn when a minimum number of registered founders approve a withdrawal proposal.

# Overview

This program demonstrates:

- Anchor framework usage
- Program Derived Addresses (PDAs)
- Custom constraint logic with M-of-N approval system
- Secure treasury management
- Full state lifecycle management

The vault enforces decentralized fund control by requiring multiple approvals before any withdrawal can occur.

# Purpose

The vault simulates a shared treasury controlled by multiple founders.

A withdrawal can only execute if `approval_count >= threshold`, preventing unilateral fund access and increasing security.

# Real-World Example

Consider a startup with three founders: Alice, Bob, and Charlie.

They create a treasury vault with:

- Owners = [Alice, Bob, Charlie]
- Threshold = 2

If a withdrawal of 5 SOL is proposed:

- At least 2 founders must approve
- One founder alone cannot withdraw funds

This prevents rogue behavior, compromised wallet access, and accidental transfers.

# Architecture

The program consists of:

- One program
- Two PDA accounts
- Three founder signers
- System program
- Recipient account

# On-Chain State

## Vault Account (PDA)

**Purpose**  
Stores treasury configuration and holds SOL.

**Stored Fields**

- authority: creator of the vault
- owners: vector of founder public keys
- threshold: minimum approvals required
- proposal_count: incrementing identifier
- bump

Holds SOL: Yes

## Proposal Account (PDA)

Created for each withdrawal request.

**Stored Fields**

- vault: parent vault reference
- proposal_id
- recipient
- amount
- approvals: vector of approving founders
- executed: boolean
- bump

Holds SOL: No  
Tracks only approval state.

# Unique Constraint Logic

Withdrawal execution requires:

1. Proposal has not been executed
2. `approvals.len() >= threshold`
3. Each approval is from a registered owner
4. Each owner can approve only once
5. Vault has sufficient balance

This enforces decentralized control.

# Instructions

The program contains five instructions.

## Initialize Vault

Creates the vault PDA.

**Validations**

- Threshold must be greater than zero
- Threshold must be less than or equal to number of owners
- Owners must be unique

**Accounts**

- Initializer (Signer)
- Vault PDA (created)
- System Program

## Deposit

Transfers SOL into the vault.

**Who Can Deposit**  
Anyone

**Accounts**

- Depositor (Signer)
- Vault PDA
- System Program

## Create Proposal

Creates a withdrawal request.

**Validations**

- Caller must be a registered owner
- Amount must be greater than zero
- Vault balance must be greater than or equal to amount

**Accounts**

- Creator (Signer)
- Vault PDA
- Proposal PDA (created)
- System Program

## Approve Proposal

Adds founder approval to a proposal.

**Validations**

- Signer must be a registered owner
- Proposal not executed
- Signer has not already approved

**Accounts**

- Approver (Signer)
- Vault PDA
- Proposal PDA

## Execute Proposal

Transfers SOL after sufficient approvals.

**Validations**

- Proposal not executed
- Approvals meet or exceed threshold
- Vault balance is sufficient

**Accounts**

- Executor (Signer)
- Vault PDA
- Proposal PDA
- Recipient
- System Program

# End-to-End Flow Example

1. Initialize vault with three owners and threshold of two.
2. Deposit 10 SOL; vault balance becomes 10 SOL.
3. Create a withdrawal proposal of 5 SOL; approvals = [], executed = false.
4. Bob approves → approvals = [Bob]; Charlie approves → approvals = [Bob, Charlie].
5. Execute proposal; funds transferred; vault balance = 5 SOL; proposal marked executed.
6. Re-execution attempt fails because executed = true.

# Account Summary

| Account        | Type          | Signs? |
|----------------|---------------|--------|
| Founder 1      | Keypair       | Yes    |
| Founder 2      | Keypair       | Yes    |
| Founder 3      | Keypair       | Yes    |
| Vault PDA      | PDA           | No     |
| Proposal PDA   | PDA           | No     |
| Recipient      | System Account| No     |
| System Program | Program       | No     |

# Security Considerations

- Prevent double approvals
- Prevent proposal re-execution
- Enforce owner-only approvals
- Ensure threshold requirement
- Validate sufficient vault balance
- Limit approval vector growth

# Required Test Cases

**Initialization**

- Correct owners stored
- Threshold stored
- Fail if threshold exceeds number of owners

**Deposit**

- Balance increases

**Proposal Creation**

- Owner can create
- Non-owner cannot create

**Approval**

- Owner can approve
- Non-owner cannot approve
- Double approval fails

**Execution**

- Fails if approvals are below threshold
- Succeeds if approvals meet or exceed threshold
- Fails if executed twice
- Fails if insufficient balance

# Deployment (Devnet)

```bash
solana config set --url devnet
anchor build
anchor deploy
anchor test --provider.cluster devnet