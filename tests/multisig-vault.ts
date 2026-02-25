import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MultisigVault } from "../target/types/multisig_vault";

describe("multisig-vault", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.multisigVault as Program<MultisigVault>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});

// test cases to cover 

// Initialization
// - Vault created
// - Owners stored
// - Threshold stored

// Proposal Creation
// - Proposal PDA derived correctly
// - Stores amount & recipient

// Approval Flow
// - Owner can approve
// - Non-owner cannot approve ❌
// - Double approval blocked ❌

// Execution
// - Execution fails if approvals < threshold ❌
// - Execution succeeds when threshold met ✅
// - Execution cannot run twice ❌

// Edge Case
// - Proposal fails if vault balance insufficient