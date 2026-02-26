// steps for deposit :
// 1. Validate the deposit amount:
//    - Ensure deposit amount > 0.
// 2. Transfer SOL from the depositor to the Vault PDA using the System Program CPI.
// 3. Emit the DepositEvent.
// 4. Ensure the required accounts are provided:
//    - Depositor (Signer)
//    - Vault PDA
//    - System Program

use crate::{events::DepositEvent, transfer_sol, Vault};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct DepositVault<'info> {
    #[account(mut)]
    pub depositor: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

impl<'info> DepositVault<'info> {
    pub fn deposit(&self, amount: u64) -> Result<()> {
        require!(
            amount > 0,
            ErrorCode::from(anchor_lang::error::ErrorCode::ConstraintRaw)
        );

        transfer_sol(
            &self.depositor.to_account_info(),
            &self.vault.to_account_info(),
            amount,
            &self.system_program.to_account_info(),
        )?;

        emit!(DepositEvent {
            vault: self.vault.key(),
            depositor: self.depositor.key(),
            amount,
        });
        Ok(())
    }
}
