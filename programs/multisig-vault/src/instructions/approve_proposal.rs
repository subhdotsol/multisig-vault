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

use crate::{
    errors::VaultError,
    events::ProposalApproved,
    utils::helper::{has_already_approved, is_owner},
    Proposal, Vault,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct ApproveProposal<'info> {
    #[account(mut)]
    pub approver: Signer<'info>,

    pub vault: Account<'info, Vault>,
    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
}

impl<'info> ApproveProposal<'info> {
    pub fn approve(&mut self) -> Result<()> {
        require!(!self.proposal.executed, VaultError::ProposalAlreadyExecuted);
        require!(
            !is_owner(&self.vault, &self.approver.key()),
            VaultError::NotAnOwner
        );
        require!(
            has_already_approved(&self.proposal, &self.approver.key()),
            VaultError::AlreadyApproved
        );

        self.proposal.approvals.push(self.approver.key());

        emit!(ProposalApproved {
            vault: self.vault.key(),
            proposal: self.proposal.key(),
            approver: self.approver.key(),
            total_approvals: self.proposal.approvals.len() as u8,
        });
        Ok(())
    }
}
