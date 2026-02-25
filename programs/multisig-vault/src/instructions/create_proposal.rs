// Steps for create proposal :
// 1. Validate inputs:
//    - Ensure signer is an owner (is_owner).
//    - Ensure amount > 0.
//    - Ensure vault balance ≥ requested amount.
// 2. Derive the Proposal PDA using seeds: [b"proposal", vault.key(), proposal_id.to_le_bytes()].
// 3. Initialize the Proposal PDA with:
//    - Vault reference
//    - Proposal ID
//    - Recipient account
//    - Amount
//    - Approvals = empty
//    - Executed = false
//    - PDA bump
// 4. Increment the vault’s proposal_count.
// 5. Emit ProposalCreated event.
// 6. Ensure the required accounts are provided:
//    - Creator (Signer)
//    - Vault PDA
//    - Proposal PDA (created)
//    - System Program
