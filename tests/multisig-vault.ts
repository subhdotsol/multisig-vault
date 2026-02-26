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

    const program = anchor.workspace.multisigVault as Program<MultisigVault>;
    const programId = program.programId;

    let svm: LiteSVM;

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
            path: path.resolve(__dirname, "../target/deploy/multisig_vault.so"),
            programId: programId
        };
        
        svm.addProgramFromFile(programParams.programId, programParams.path);

        // generating the accounts needed
        authority = Keypair.generate();
        owner1 = Keypair.generate();
        owner2 = Keypair.generate();
        owner3 = Keypair.generate();

        svm.airdrop(authority.publicKey, BigInt(10000000000)); // 10 SOL
        svm.airdrop(owner1.publicKey, BigInt(10000000000)); // 10 SOL
        svm.airdrop(owner2.publicKey, BigInt(10000000000)); // 10 SOL
        svm.airdrop(owner3.publicKey, BigInt(10000000000)); // 10 SOL

        [vaultPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("vault"), authority.publicKey.toBuffer()],
            programId
        );

        // [proposalPda] = PublicKey.findProgramAddressSync(
        //     [Buffer.from("proposal"), vaultPda.toBuffer(), Buffer.from(proposalCount.toString())],
        //     programId
        // );
    });

  it("Initialize Vault", async () => {
    const tx = await program.methods.initializeVault(
        [owner1.publicKey, owner2.publicKey, owner3.publicKey],
        threshold
    ).accounts({
        authority: authority.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
    }).transaction();

    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = authority.publicKey;
    tx.sign(authority);

    const res = svm.sendTransaction(tx);
    if ("err" in res) throw new Error(res.err.toString()); 

    const vaultAcc = svm.getAccount(vaultPda); 
    assert.ok(vaultAcc , "vault should exist"); 

    const decoded = program.coder.accounts.decode("vault" , Buffer.from(vaultAcc.data)); 
    
    assert.equal(decoded.threshold , threshold); 
    assert.equal(decoded.owners.length , 3);

  });

  it("Deposit SOL to Vault", async () => {
      const tx = await program.methods.depositVault(
          depositAmount
      ).accounts({
          depositor: authority.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
      }).transaction();

      tx.recentBlockhash = svm.latestBlockhash().toString();
      tx.feePayer = authority.publicKey;
      tx.sign(authority);

      const res = svm.sendTransaction(tx);
      if ("err" in res) throw new Error(res.err.toString()); 

      const vaultAcc = svm.getAccount(vaultPda);
      assert.ok(vaultAcc.lamports >= depositAmount.toNumber());
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