// Steps for approve proposal :
// 1. Validate inputs:
//    - Ensure signer is an owner (is_owner).
//    - Ensure proposal has not been executed.
//    - Ensure signer has not already approved (has_already_approved).
// 2. Add signer’s pubkey to `proposal.approvals`.
// 3. Emit `ProposalApproved` event, including total approvals.
// 4. Ensure the required accounts are provided:
//    - Approver (Signer)
//    - Vault PDA
//    - Proposal PDA
