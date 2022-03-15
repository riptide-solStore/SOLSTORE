import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { SolStore } from "../target/types/sol_store";
import {ASSOCIATED_TOKEN_PROGRAM_ID,TOKEN_PROGRAM_ID,mintTo,MINT_SIZE,createMint, createInitializeMintInstruction,createAssociatedTokenAccountInstruction,getAssociatedTokenAddress} from "@solana/spl-token"


describe("SolStore", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.SolStore as Program<SolStore>;

  const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
  );

 
  const mintKey = anchor.web3.Keypair.generate();


    let ATA = null;
 

 

  it("SHould Init",async() => {
    const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
    let ata = await getAssociatedTokenAddress(
      mintKey.publicKey, // mint
      program.provider.wallet.publicKey // owner
    );
    ATA = ata;
    console.log(`ATA: ${ata.toBase58()}`);
    const mint_tx = new anchor.web3.Transaction().add(
      anchor.web3.SystemProgram.createAccount({
        fromPubkey: program.provider.wallet.publicKey,
        newAccountPubkey: mintKey.publicKey,
        space: MINT_SIZE,
        lamports,
        programId:TOKEN_PROGRAM_ID,
    }), createInitializeMintInstruction(
      mintKey.publicKey, // mint pubkey
      0, // decimals
      program.provider.wallet.publicKey, // mint authority
      program.provider.wallet.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
    ),
    createAssociatedTokenAccountInstruction(
      program.provider.wallet.publicKey,
      ata,
      program.provider.wallet.publicKey,
      mintKey.publicKey
    )
    )
    const res = await program.provider.send(mint_tx,[mintKey]);
    console.log(await program.provider.connection.getParsedAccountInfo(mintKey.publicKey));
  
    console.log("ACCOUNT",res);
    console.log("MINTKEY",mintKey.publicKey.toString());
    console.log("USER",program.provider.wallet.publicKey.toString())
  })

  it("Should Create a Merchant Account",async() => {

    const [merchant, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("merchant"),program.provider.wallet.publicKey.toBuffer()],
      program.programId
    );
    const tx = await program.rpc.createMerchant("Pratik",{accounts:{
      authority: program.provider.wallet.publicKey,
      rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      systemProgram: anchor.web3.SystemProgram.programId,
      merchant:merchant,

    }})

    console.log("Create Merchant",tx);
  })



  it("Is initialized!", async () => {
    // Add your test here.

    const [merchant, nonce] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("merchant"),program.provider.wallet.publicKey.toBuffer()],
      program.programId
    );

    const [metadatakey,] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );
    console.log("METDATA",metadatakey.toString());

    const [masterKey,] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKey.publicKey.toBuffer(),
        Buffer.from('edition')
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );


    console.log("MASTER EDITION",masterKey.toString())

      console.log("ATA FOR ME",ATA.toString());
    const tx = await program.rpc.txWithCoupon("Pratik","PAT","https://ipfs.io/ipfs/QmP7UWyKkcoH5TEg4bLjvMoHmdxJRhednBzGkHqbWUgGX4",1000,true,{
      accounts:{
        authority: program.provider.wallet.publicKey,
        merchant:merchant,
        metadata:metadatakey,
        mint:mintKey.publicKey,
        mplProgram:TOKEN_METADATA_PROGRAM_ID,
        rent:anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram:TOKEN_PROGRAM_ID,
        masterEdition:masterKey,
        recipient:ATA
      }
    })
   
    console.log("Your transaction signature", tx);
  });
});
