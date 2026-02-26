use anchor_lang::prelude::*;

pub mod errors;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

pub use instructions::*;
pub use state::*;
pub use utils::helper::{derive_proposal_pda, derive_vault_pda, is_threshold_met, transfer_sol};

declare_id!("AWoWjVRjYL5QoEizQJoh6UKTT8ZFLsL9E8Vg9L8GVkSi");

#[program]
pub mod multisig_vault {

    use super::*;

    pub fn initialize_vault(
        ctx: Context<InitializeVault>,
        owners: Vec<Pubkey>,
        threshold: u8,
    ) -> Result<()> {
        ctx.accounts.initialize(owners, threshold, &ctx.bumps)
    }

    pub fn deposit_vault(ctx: Context<DepositVault>, amount: u64) -> Result<()> {
        ctx.accounts.deposit(amount)
    }

    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.create(recipient, amount, &ctx.bumps)
    }

    pub fn approve_proposal(ctx: Context<ApproveProposal>) -> Result<()> {
        ctx.accounts.approve()
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        ctx.accounts.execute()
    }
}
