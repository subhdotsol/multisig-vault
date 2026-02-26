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

use crate::{
    errors::VaultError, events::ProposalCreated, utils::helper::is_owner, Proposal, Vault,
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = creator,
        space = 8+190,
        seeds = [
            b"proposal",
            vault.key().as_ref(),
            &vault.proposal_count.to_le_bytes(),
        ],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

impl<'info> CreateProposal<'info> {
    pub fn create(
        &mut self,
        recipient: Pubkey,
        amount: u64,
        bumps: &CreateProposalBumps,
    ) -> Result<()> {
        require!(
            is_owner(&self.vault, &self.creator.key()),
            VaultError::NotAnOwner
        );
        require!(amount > 0, VaultError::InvalidProposalAmount);
        require!(
            self.vault.to_account_info().lamports() >= amount,
            VaultError::InsufficientFunds
        );

        self.proposal.vault = self.vault.key();
        self.proposal.proposal_id = self.vault.proposal_count;
        self.proposal.recipient = recipient;
        self.proposal.amount = amount;
        self.proposal.approvals = Vec::new();
        self.proposal.executed = false;
        self.proposal.bump = bumps.proposal;

        self.vault.proposal_count += 1;

        emit!(ProposalCreated {
            vault: self.vault.key(),
            proposal: self.proposal.key(),
            creator: self.creator.key(),
            recipient,
            amount,
        });
        Ok(())
    }
}
