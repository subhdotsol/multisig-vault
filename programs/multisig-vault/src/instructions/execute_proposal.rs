// Steps for execute proposal :
// 1. Validate inputs:
//    - Ensure proposal has not been executed.
//    - Ensure vault has sufficient balance for the transfer.
//    - Ensure threshold of approvals is met (is_threshold_met).
// 2. Transfer SOL from Vault PDA to the recipient using System Program CPI.
// 3. Mark `proposal.executed = true`.
// 4. Emit `ProposalExecuted` event.
// 5. Ensure the required accounts are provided:
//    - Executor (Signer)
//    - Vault PDA
//    - Proposal PDA
//    - Recipient account
//    - System Program
