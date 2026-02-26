// Steps for initialize vault :
// 1. Derive the Vault PDA using seeds: [b"vault", authority.key()].
// 2. Validate the input:
//    - Ensure threshold > 0.
//    - Ensure threshold ≤ number of owners.
//    - Ensure the owners list has no duplicates.
// 3. Initialize the Vault state:
//    - Store authority.
//    - Store owners list.
//    - Store threshold.
//    - Set proposal counter = 0.
//    - Store PDA bump.
// 4. Emit the VaultInitialized event.
// 5. Ensure the required accounts are provided:
//    - Initializer (Signer)
//    - Vault PDA (created)
//    - System Program

use anchor_lang::prelude::*;

use crate::{errors::VaultError, events::VaultInitialized, Vault};

#[derive(Accounts)]
#[instruction(owners : Vec<Pubkey>, threshold : u8)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8+166,
        seeds = [
            b"vault",
            authority.key().as_ref(),
        ],
        bump,
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeVault<'info> {
    pub fn initialize(
        &mut self,
        owners: Vec<Pubkey>,
        threshold: u8,
        bump: &InitializeVaultBumps,
    ) -> Result<()> {
        require!(!owners.is_empty(), VaultError::InvalidThreshold);
        require!(threshold > 0, VaultError::InvalidThreshold);
        require!(
            threshold <= owners.len() as u8,
            VaultError::InvalidThreshold
        );

        let mut unique = owners.clone();
        unique.sort();
        unique.dedup();
        require!(unique.len() == owners.len(), VaultError::DuplicateOwners);

        self.vault.authority = self.authority.key();
        self.vault.owners = owners.clone();
        self.vault.threshold = threshold;
        self.vault.proposal_count = 0;
        self.vault.bump = bump.vault;

        emit!(VaultInitialized {
            vault: self.vault.key(),
            authority: self.authority.key(),
            owners,
            threshold,
        });
        Ok(())
    }
}
