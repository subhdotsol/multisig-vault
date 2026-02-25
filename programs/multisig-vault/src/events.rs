use anchor_lang::prelude::*;

#[event]
pub struct VaultInitialized {
    pub vault: Pubkey,
    pub authority: Pubkey,
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
}

#[event]
pub struct DepositEvent {
    pub vault: Pubkey,
    pub depositor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProposalCreated {
    pub vault: Pubkey,
    pub proposal: Pubkey,
    pub creator: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProposalApproved {
    pub vault: Pubkey,
    pub proposal: Pubkey,
    pub approver: Pubkey,
    pub total_approvals: u8,
}

#[event]
pub struct ProposalExecuted {
    pub vault: Pubkey,
    pub proposal: Pubkey,
    pub executor: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}
