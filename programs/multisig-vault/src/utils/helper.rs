use crate::{Proposal, Vault};
use anchor_lang::prelude::*;

// Functions to add

// 1. Owner validation
pub fn is_owner(vault: &Vault, signer: &Pubkey) -> bool {
    vault.owners.contains(signer)
}

// 2. Duplicate approver check
pub fn has_already_approved(proposal: &Proposal, signer: &Pubkey) -> bool {
    proposal.approvals.contains(signer)
}

// 3. PDA derivation helpers
pub fn derive_vault_pda(authority: &Pubkey, program_id: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(&[b"vault", authority.as_ref()], program_id)
}

pub fn derive_proposal_pda(vault: &Pubkey, proposal_id: u64, program_id: &Pubkey) -> (Pubkey, u8) {
    let id_bytes = &proposal_id.to_le_bytes();
    Pubkey::find_program_address(&[b"proposal", vault.as_ref(), id_bytes], program_id)
}

// 4. Threshold check
pub fn is_threshold_met(vault: &Vault, proposal: &Proposal) -> bool {
    // Returns true if number of approvals meets or exceeds vault threshold
    (proposal.approvals.len() as u8) >= vault.threshold
}

// usage -> require!(
//     utils::is_threshold_met(&vault, &proposal),
//     VaultError::NotEnoughApprovals
// );

// 5. Safe SOL Transfer
pub fn transfer_sol<'info>(
    from: &AccountInfo<'info>,
    to: &AccountInfo<'info>,
    amount: u64,
    system_program: &AccountInfo<'info>,
) -> Result<()> {
    let ix = anchor_lang::solana_program::system_instruction::transfer(from.key, to.key, amount);
    anchor_lang::solana_program::program::invoke(
        &ix,
        &[from.clone(), to.clone(), system_program.clone()],
    )?;
    Ok(())
}
