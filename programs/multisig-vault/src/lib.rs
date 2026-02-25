use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod state;
pub mod utils;

pub use state::*;
pub use utils::helper::{derive_proposal_pda, derive_vault_pda, is_threshold_met, transfer_sol};

declare_id!("AWoWjVRjYL5QoEizQJoh6UKTT8ZFLsL9E8Vg9L8GVkSi");

#[program]
pub mod multisig_vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
