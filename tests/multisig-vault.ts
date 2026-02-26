import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MultisigVault } from "../target/types/multisig_vault";
import { LiteSVM } from "litesvm";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import * as path from "path";

describe("multisig-vault", () => {

  // Configure the client to use the local cluster
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const program = anchor.workspace.vaultTurbin as Program<VaultTurbin>;
    const programId = program.programId;

    let svm: LiteSVM;
    let payer: Keypair;

    // Planning all the needed accounts
    let authority : Keypair; 
    let owner1 : Keypair ; 
    let owner2 : Keypair ; 
    let owner3 : Keypair ; 

    let vaultPda : PublicKey ; 
    let proposalPda : PublicKey ; 
    
    const threshold = 2 ; 
    const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL 
    const proposalAmount = new anchor.BN(500_000_000); // 0.5 SOL 


    before(async () => {
        svm = new LiteSVM();

        const programParams = {
            path: path.resolve(__dirname, "../target/deploy/vault_turbin.so"),
            programId: programId
        };
        svm.addProgramFromFile(programParams.programId, programParams.path);

        payer = Keypair.generate();
        svm.airdrop(payer.publicKey, 10_000_000_000n); // 10 SOL

        vaultKeypair = Keypair.generate();
    });

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