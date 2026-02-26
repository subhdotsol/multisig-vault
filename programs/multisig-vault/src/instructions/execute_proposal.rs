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

use anchor_lang::prelude::*;

use crate::{errors::VaultError, events::ProposalExecuted, is_threshold_met, Proposal, Vault};

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    pub executor: Signer<'info>,

    #[account(mut)]
    pub vault: Account<'info, Vault>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    ///CHECK : recipient is valid
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> ExecuteProposal<'info> {
    pub fn execute(&mut self) -> Result<()> {
        require!(!self.proposal.executed, VaultError::ProposalAlreadyExecuted);
        require!(
            self.vault.to_account_info().lamports() >= self.proposal.amount,
            VaultError::InsufficientFunds
        );
        require!(
            is_threshold_met(&self.vault, &self.proposal),
            VaultError::NotEnoughApprovals
        );

        **self.vault.to_account_info().try_borrow_mut_lamports()? -= self.proposal.amount;
        **self.recipient.try_borrow_mut_lamports()? += self.proposal.amount;

        self.proposal.executed = true;

        emit!(ProposalExecuted {
            vault: self.vault.key(),
            proposal: self.proposal.key(),
            executor: self.executor.key(),
            amount: self.proposal.amount,
            recipient: self.recipient.key(),
        });
        Ok(())
    }
}
