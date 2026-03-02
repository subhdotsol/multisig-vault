import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MultisigVault } from "../target/types/multisig_vault";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import * as fs from "fs";

// ---------------------------------------------------------------------------
// Increase Mocha timeout for devnet latency (set --timeout 100000 in package.json too)
// ---------------------------------------------------------------------------

describe("multisig-vault (Devnet)", () => {
  console.log("Starting Devnet Tests now");
  // Configure the client to use the devnet cluster (set in Anchor.toml)
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.multisigVault as Program<MultisigVault>;
  const programId = program.programId;


  function loadKeypair(filePath: string): Keypair {
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Keypair.fromSecretKey(Uint8Array.from(raw));
  }

  let authority: Keypair;
  let owner1: Keypair;
  let owner2: Keypair;
  let owner3: Keypair;

  let vaultPda: PublicKey;

  const threshold = 2;
  const depositAmount = new anchor.BN(1_000_000_000); // 1 SOL
  const proposalAmount = new anchor.BN(500_000_000);  // 0.5 SOL

  before(async () => {
    // Option A (recommended): load pre-funded keypairs from disk.
    authority = loadKeypair(".keys/authority.json");
    owner1    = loadKeypair(".keys/owner1.json");
    owner2    = loadKeypair(".keys/owner2.json");
    owner3    = loadKeypair(".keys/owner3.json");

    // Option B: generate fresh keypairs and request devnet airdrops.
    // NOTE: devnet rate-limits airdrops. Use Option A when possible.
    // authority = Keypair.generate();
    // owner1    = Keypair.generate();
    // owner2    = Keypair.generate();
    // owner3    = Keypair.generate();

    // const connection = provider.connection;

    // async function airdropAndConfirm(pubkey: PublicKey, lamports: number) {
    //   const sig = await connection.requestAirdrop(pubkey, lamports);
    //   await connection.confirmTransaction(sig, "confirmed");
    // }

    // await airdropAndConfirm(authority.publicKey, 10_000_000_000);
    // await airdropAndConfirm(owner1.publicKey,    10_000_000_000);
    // await airdropAndConfirm(owner2.publicKey,    10_000_000_000);
    // await airdropAndConfirm(owner3.publicKey,    10_000_000_000);

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), authority.publicKey.toBuffer()],
      programId
    );
  });

  // -------------------------------------------------------------------------

  it("Initialize Vault", async () => {
    console.log("Test: Initialize Vault");
    try {
      await program.account.vault.fetch(vaultPda);
      console.log("Vault already initialized on devnet. Skipped creation.");
    } catch (err) {
      console.log("Creating new Vault...");
      await program.methods
        .initializeVault(
          [owner1.publicKey, owner2.publicKey, owner3.publicKey],
          threshold
        )
        .accounts({
          authority: authority.publicKey,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    }

    const vaultAcc = await program.account.vault.fetch(vaultPda);

    assert.equal(vaultAcc.threshold, threshold);
    assert.equal(vaultAcc.owners.length, 3);
  });

  // -------------------------------------------------------------------------

  it("Deposit SOL to Vault", async () => {
    console.log("Test: Deposit SOL to Vault");
    console.log(`Depositing ${depositAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL...`);
    await program.methods
      .depositVault(depositAmount)
      .accounts({
        depositor: authority.publicKey,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

    const balance = await provider.connection.getBalance(vaultPda);
    assert.ok(balance >= depositAmount.toNumber());
  });

  // -------------------------------------------------------------------------

  it("Create Proposal", async () => {
    console.log("Test: Create Proposal");
    const vaultAcc = await program.account.vault.fetch(vaultPda);
    const proposalCount = vaultAcc.proposalCount;
    console.log(`Creating Proposal ID: ${proposalCount.toNumber()} for ${proposalAmount.toNumber() / anchor.web3.LAMPORTS_PER_SOL} SOL`);

    const [proposalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        vaultPda.toBuffer(),
        new anchor.BN(proposalCount).toArrayLike(Buffer, "le", 8),
      ],
      programId
    );

    await program.methods
      .createProposal(owner1.publicKey, proposalAmount)
      .accounts({
        creator: owner1.publicKey,
        vault: vaultPda,
        // @ts-ignore
        proposal: proposalPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner1])
      .rpc();

    const proposalAcc = await program.account.proposal.fetch(proposalPda);

    assert.equal(proposalAcc.amount.toNumber(), proposalAmount.toNumber());
    assert.equal(
      proposalAcc.recipient.toBase58(),
      owner1.publicKey.toBase58()
    );
  });

  // -------------------------------------------------------------------------

  async function getLatestProposalPda(): Promise<PublicKey> {
    const vaultAcc = await program.account.vault.fetch(vaultPda);
    const proposalId = vaultAcc.proposalCount.toNumber() - 1;

    const [proposalPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("proposal"),
        vaultPda.toBuffer(),
        new anchor.BN(proposalId).toArrayLike(Buffer, "le", 8),
      ],
      programId
    );
    return proposalPda;
  }

  // -------------------------------------------------------------------------

  it("Owner can approve", async () => {
    console.log("Test: Owner 1 approves");
    const proposalPda = await getLatestProposalPda();

    await program.methods
      .approveProposal()
      .accounts({
        approver: owner1.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .signers([owner1])
      .rpc();
  });

  // -------------------------------------------------------------------------

  it("Blocks double approval", async () => {
    const proposalPda = await getLatestProposalPda();

    try {
      await program.methods
        .approveProposal()
        .accounts({
          approver: owner1.publicKey,
          vault: vaultPda,
          proposal: proposalPda,
        })
        .signers([owner1])
        .rpc();
      assert.fail("Should have thrown on double approval");
    } catch (err) {
      assert.ok(err, "Expected error on double approval");
    }
  });

  // -------------------------------------------------------------------------

  it("Non-owner cannot approve", async () => {
    const proposalPda = await getLatestProposalPda();

    const fake = Keypair.generate();
    const tx = new anchor.web3.Transaction().add(
      SystemProgram.transfer({
        fromPubkey: authority.publicKey,
        toPubkey: fake.publicKey,
        lamports: 10_000_000,
      })
    );
    const sig = await provider.connection.sendTransaction(tx, [authority]);
    await provider.connection.confirmTransaction(sig, "confirmed");

    try {
      await program.methods
        .approveProposal()
        .accounts({
          approver: fake.publicKey,
          vault: vaultPda,
          proposal: proposalPda,
        })
        .signers([fake])
        .rpc();
      assert.fail("Non-owner should not be able to approve");
    } catch (err) {
      assert.ok(err, "Expected error for non-owner");
    }
  });

  // -------------------------------------------------------------------------

  it("Fails execution before threshold", async () => {
    const proposalPda = await getLatestProposalPda();

    try {
      await program.methods
        .executeProposal()
        .accounts({
          executor: owner1.publicKey,
          vault: vaultPda,
          proposal: proposalPda,
          recipient: owner3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([owner1])
        .rpc();
      assert.fail("Should have failed due to insufficient approvals");
    } catch (err) {
      assert.ok(err, "Expected error for insufficient approvals");
    }
  });

  // -------------------------------------------------------------------------

  it("Executes when threshold met", async () => {
    console.log("Test: Executes when threshold met");
    const proposalPda = await getLatestProposalPda();

    console.log("   👍 Owner 2 approving...");
    // Second approval
    await program.methods
      .approveProposal()
      .accounts({
        approver: owner2.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
      })
      .signers([owner2])
      .rpc();

    // Execute
    await program.methods
      .executeProposal()
      .accounts({
        executor: owner2.publicKey,
        vault: vaultPda,
        proposal: proposalPda,
        recipient: owner3.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([owner2])
      .rpc();

    const proposalAcc = await program.account.proposal.fetch(proposalPda);
    assert.equal(proposalAcc.executed, true);
  });
});