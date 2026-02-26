# Multi-Sig Vault (Anchor Program)

> **Devnet Deployment:** [`AWoWjVRjYL5QoEizQJoh6UKTT8ZFLsL9E8Vg9L8GVkSi`](https://explorer.solana.com/address/AWoWjVRjYL5QoEizQJoh6UKTT8ZFLsL9E8Vg9L8GVkSi?cluster=devnet)

A robust Solana smart contract built with the Anchor framework, implementing an M-of-N Multi-Signature Treasury Vault. This program ensures secure treasury management by requiring a predefined threshold of registered owners to approve any withdrawal proposals before funds can be transferred.

## Test Coverage & Results

The smart contract is fully covered by an extensive integration test suite, validating all core constraints and security conditions.

<img width="454" height="277" alt="Screenshot 2026-02-26 at 12 41 40 PM" src="https://github.com/user-attachments/assets/d983e580-4533-4d76-914f-4dbcf1b5f64c" />


## Features & Architecture

- **Program Derived Addresses (PDAs):** Securely manages Vault and Proposal states without requiring private keys.
- **M-of-N Approval Constraint:** Withdrawals execute only if `approval_count >= threshold`.
- **Double-Approval Prevention:** Cryptographically prevents founders from approving the same proposal twice.
- **Strict Owner-Only Access:** Only registered owners can create or approve proposals.
- **State Lifecycle:** Complete lifecycle management from vault initialization to proposal execution.

## Smart Contract Instructions

1. **`initialize_vault`**: Creates the vault PDA, registers the owner public keys, and sets the required approval threshold.
2. **`deposit`**: Allows any user to seamlessly fund the vault treasury.
3. **`create_proposal`**: Enables a registered owner to propose a withdrawal to a designated recipient. 
4. **`approve_proposal`**: Allows other founders to sign and approve an active proposal.
5. **`execute_proposal`**: Triggers the exact transfer of SOL to the recipient once the approval threshold is securely met.

## State Accounts

### Vault Account (PDA)
Maintains the core configuration:
- `authority`: The creator of the vault.
- `owners`: Array of authorized founder public keys.
- `threshold`: The minimum number of approvals required for execution.
- `proposal_count`: Auto-incrementing identifier for subsequent proposals.

### Proposal Account (PDA)
Tracks individual withdrawal requests:
- `recipient` & `amount`: The target destination and requested SOL.
- `approvals`: Array of founders who have already signed the proposal.
- `executed`: Boolean flag preventing re-execution of completed transfers.

## Security Considerations

- Proposals cannot be executed more than once (`executed` flag).
- Withdrawals strictly revert if the vault possesses insufficient SOL.
- Fully decentralized control prevents single-point-of-failure vulnerabilities.
