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

        // The user manually modified this earlier, but create_proposal.rs still expects proposalCount.
        // We defer deriving proposalPda to the exact tests where proposalCount is known.
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
    if ("err" in res) throw new Error(JSON.stringify((res as any).err));

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

      tx.recentBlockhash = svm.latestBlockhash();
      tx.feePayer = authority.publicKey;
      tx.sign(authority);

      const res = svm.sendTransaction(tx);
      if ("err" in res) throw new Error(JSON.stringify((res as any).err));

      const vaultAcc = svm.getAccount(vaultPda);
      assert.ok(vaultAcc.lamports >= depositAmount.toNumber());
  });

  it("Create Proposal", async () => {
      const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      const proposalCount = decodedVault.proposalCount;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalCount).toArrayLike(Buffer, "le", 8)],
          programId
      );

      const tx = await program.methods.createProposal(
          owner1.publicKey,
          proposalAmount
      ).accounts({
          creator: owner1.publicKey,
          vault: vaultPda,
          // @ts-ignore
          proposal: proposalPda,
          systemProgram: SystemProgram.programId,
      }).transaction();

      tx.recentBlockhash = svm.latestBlockhash();
      tx.feePayer = owner1.publicKey;
      tx.sign(owner1);

      const res = svm.sendTransaction(tx);
      // @ts-ignore
      if (res.meta?.err || res.err) throw new Error("Transaction failed");

      const proposalAcc = svm.getAccount(proposalPda);
      assert.ok(proposalAcc , "proposal should exist"); 

      const decoded = program.coder.accounts.decode("proposal" , Buffer.from(proposalAcc.data)); 
      
      assert.equal(decoded.amount.toNumber() , proposalAmount.toNumber());
      assert.equal(decoded.recipient.toBase58() , owner1.publicKey.toBase58());
  });


    it("Owner can approve", async () => {
      const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      // Proposal count was incremented in an earlier test, so the created proposal corresponds to ID = count - 1
      const proposalId = decodedVault.proposalCount.toNumber() - 1;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8)],
          programId
      );

      const tx = await program.methods
        .approveProposal()
        .accounts({
        approver: owner1.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .transaction();

    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = owner1.publicKey;
    tx.sign(owner1);

    const res = svm.sendTransaction(tx);
    // @ts-ignore
    if (res.meta?.err || res.err) {
        console.log("Tx Result:", JSON.stringify(res, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
        throw new Error("Transaction failed");
    }
  });

  it("Blocks double approval", async () => {
      const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      const proposalId = decodedVault.proposalCount.toNumber() - 1;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8)],
          programId
      );

      const tx = await program.methods
        .approveProposal()
        .accounts({
        approver: owner1.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .transaction();

    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = owner1.publicKey;
    tx.sign(owner1);

    const res = svm.sendTransaction(tx);
    assert.ok("err" in res, "Should fail double approval");
  });

  it("Non-owner cannot approve", async () => {
      const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      const proposalId = decodedVault.proposalCount.toNumber() - 1;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8)],
          programId
      );

      const fake = Keypair.generate();
      svm.airdrop(fake.publicKey, BigInt(1_000_000_000));

      const tx = await program.methods
        .approveProposal()
        .accounts({
        approver: fake.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .transaction();

    tx.recentBlockhash = svm.latestBlockhash();
    tx.feePayer = fake.publicKey;
    tx.sign(fake);

    const res = svm.sendTransaction(tx);
    assert.ok("err" in res, "Non-owner should fail");
  });


  it("Fails execution before threshold", async () => {
    const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      const proposalId = decodedVault.proposalCount.toNumber() - 1;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8)],
          programId
      );
    const tx = await program.methods
      .executeProposal()
      .accounts({
        executor: owner1.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
        recipient: owner3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    tx.recentBlockhash = svm.latestBlockhash().toString();
    tx.feePayer = owner1.publicKey;
    tx.sign(owner1);

    const res = svm.sendTransaction(tx);
    assert.ok("err" in res, "Should fail due to insufficient approvals");
  });

  it("Executes when threshold met", async () => {
    const vaultAccPre = svm.getAccount(vaultPda);
      const decodedVault = program.coder.accounts.decode("vault", Buffer.from(vaultAccPre.data));
      const proposalId = decodedVault.proposalCount.toNumber() - 1;
      
      const [proposalPda] = PublicKey.findProgramAddressSync(
          [Buffer.from("proposal"), vaultPda.toBuffer(), new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8)],
          programId
      );
    // Second approval
    const approveTx = await program.methods
      .approveProposal()
      .accounts({
        approver: owner2.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .transaction();

    approveTx.recentBlockhash = svm.latestBlockhash().toString();
    approveTx.feePayer = owner2.publicKey;
    approveTx.sign(owner2);
    svm.sendTransaction(approveTx);

    const executeTx = await program.methods
      .executeProposal()
      .accounts({
        executor: owner2.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
        recipient: owner3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .transaction();

    executeTx.recentBlockhash = svm.latestBlockhash().toString();
    executeTx.feePayer = owner2.publicKey;
    executeTx.sign(owner2);

    const res = svm.sendTransaction(executeTx);
    if ("err" in res) throw new Error(res.err.toString());

    const proposalAcc = svm.getAccount(proposalPda);
    const decoded = program.coder.accounts.decode(
      "proposal",
      Buffer.from(proposalAcc.data)
    );

    assert.equal(decoded.executed, true);
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