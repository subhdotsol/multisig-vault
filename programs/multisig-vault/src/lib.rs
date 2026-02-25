use anchor_lang::prelude::*;

pub mod state;
pub use state::*;

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
