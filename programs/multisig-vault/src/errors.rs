use anchor_lang::prelude::*;

#[error_code]
pub enum VaultError {
    #[msg("The caller is not an owner of this vault.")]
    NotAnOwner,

    #[msg("The proposal has already been executed.")]
    ProposalAlreadyExecuted,

    #[msg("This owner has already approved the proposal.")]
    AlreadyApproved,

    #[msg("Not enough approvals to execute the proposal.")]
    NotEnoughApprovals,

    #[msg("Vault has insufficient funds to execute this proposal.")]
    InsufficientFunds,

    #[msg("Threshold must be greater than zero and less than or equal to the number of owners.")]
    InvalidThreshold,

    #[msg("Owners list contains duplicate entries.")]
    DuplicateOwners,

    #[msg("Proposal amount must be greater than zero.")]
    InvalidProposalAmount,

    #[msg("Proposal ID is invalid or already exists.")]
    InvalidProposalId,
}
