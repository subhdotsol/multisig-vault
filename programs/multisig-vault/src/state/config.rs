use anchor_lang::prelude::*;

#[account]
pub struct Vault {
    pub authority: Pubkey,   // Creator of the vault
    pub owners: Vec<Pubkey>, // 3 founders
    pub threshold: u8,       // Required approvals (e.g., 2)
    pub proposal_count: u64, // Incrementing proposal ID
    pub bump: u8,            // PDA bump
    pub padding: [u8; 16],
}

// 8 + 32 + 4 + 96 + 1 + 8 + 1 + 16 = 166 bytes

#[account]
pub struct Proposal {
    pub vault: Pubkey,          // Parent vault reference
    pub proposal_id: u64,       // Unique ID
    pub recipient: Pubkey,      // Who receives SOL
    pub amount: u64,            // Amount of SOL
    pub approvals: Vec<Pubkey>, // Founders who approved
    pub executed: bool,         // Has it been executed?
    pub bump: u8,               // PDA bump
}

// 8 + 32 + 8 + 32 + 8 + 4 + 96 + 1 + 1 = 190 bytes
