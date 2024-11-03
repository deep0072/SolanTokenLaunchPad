import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync, mintTo, createAssociatedTokenAccountInstruction, createMintToInstruction, createAssociatedTokenAccount } from "@solana/spl-token"
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { useState } from "react";

import { pinata } from "../utils/config";
import { handleSubmission } from "../utils/geturi";

const TokenLaunchPad = () => {
  const [selectedFile, setSelectedFile] = useState();

  // first get wallet
  const { connection } = useConnection();
  const wallet = useWallet();


  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // now get total lamports that required to create token
  // then create mintAccount using systemProgram via preparing txn
  // in txn we need to mention like who are the authority, whats the pub key of mint account
  // then confirm txn by signing wallet



 

  const createToken = async () => {
    const name = document.getElementById("Name").value;
    const Symbol = document.getElementById("Symbol").value;

    const supply = document.getElementById("Supply").value;

    let keyPair = Keypair.generate(); // getting keys for mintAccount

 
      
    // First get the ATA address
    const associatedToken = getAssociatedTokenAddressSync(
      keyPair.publicKey,    // mint address
      wallet.publicKey,     // token owner
      false,
      TOKEN_2022_PROGRAM_ID
    );

    console.log(name.value, "name");

    const jsonObj = {
       // Public key of the mint
      name: name, // Full name of the token
      symbol: Symbol,
      description:"my pigcoin",
       // Short market symbol
      // additionalMetadata: [['new-field', 'new-value']], // Optional custom fields
    };
    // console.log(jsonObj, "jsonobj")

    const imageUri = await handleSubmission(selectedFile,jsonObj)

    // console.log("imageUri", imageUri)

    console.log(name, "name", Symbol, "symbol");
    const metadata = {
      mint: keyPair.publicKey, // Public key of the mint
      name: name, // Full name of the token
      symbol: Symbol, // Short market symbol
      uri: imageUri, // Link to off-chain metadata JSON
      additionalMetadata: [], // Optional custom fields
    };
    console.log(metadata, "metadata");

    // Calculate the required account size for the mint
    // Includes space for metadata pointer extension
    const mintLen = getMintLen([ExtensionType.MetadataPointer]);
    // Calculate the length needed to store metadata

    /*
          type size represents data size in bytes
          length_size ==>  size in bytes to store the length of the metadata
          packed_metadata ==> total size of metadata
          
          */
    // Includes type size, length size, and packed metadata

    const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

    // Prevents account from being deleted due to lack of rent payments
    const lamports = await connection.getMinimumBalanceForRentExemption(
      mintLen + metadataLen
    );

    console.log(lamports, "lamports");
    console.log(
      metadata,
      "metadata",
      TOKEN_2022_PROGRAM_ID,
      "TOKEN_2022_PROGRAM_ID"
    );

    const txn = new Transaction().add(
      // 1. Create a new account for the token mint
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: keyPair.publicKey,
        space: mintLen,
        lamports,
        programId: TOKEN_2022_PROGRAM_ID,
      }),

      // 2. Initialize metadata pointer for on-chain metadata info
      createInitializeMetadataPointerInstruction(
        keyPair.publicKey, // Mint account
        wallet.publicKey, // Metadata pointer authority
        keyPair.publicKey, // Metadata account means same mint account where metadata will be stores
        TOKEN_2022_PROGRAM_ID // Token program
      ),

      // 3. Initialize the mint with decimal places and authority
      createInitializeMintInstruction(
        keyPair.publicKey, // Mint account
        9, // Number of decimal places
        wallet.publicKey, // Mint authority
        null, // Freeze authority (optional)
        TOKEN_2022_PROGRAM_ID // Token program
      ),

      // 4. Initialize token metadata instruction that cause to creation of metadata of token
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,
        mint: keyPair.publicKey, // Mint account
        metadata: keyPair.publicKey, // Metadata account
        name: metadata.name, // Token name
        symbol: metadata.symbol, // Token symbol
        uri: metadata.uri, // Metadata URI
        mintAuthority: wallet.publicKey, // Can mint new tokens
        updateAuthority: wallet.publicKey, // Can update metadata
      }),
 
      
       // Add these two new instructions
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,      // payer
          associatedToken,       // ata address
          wallet.publicKey,      // owner
          keyPair.publicKey,     // mint
          TOKEN_2022_PROGRAM_ID
      ),

      createMintToInstruction(
          keyPair.publicKey,     // mint
          associatedToken,       // destination token account
          wallet.publicKey,      // mint authority
          BigInt(supply),// amount to mint (must use BigInt for large numbers)
          [],                    // no additional signers needed
          TOKEN_2022_PROGRAM_ID
      )
    );

    console.log(txn, "txn");
    // const sign = await sendAndConfirmRawTransaction(connection,txn,[wallet,keyPair])
    // console.log(sign,"sign")

    txn.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash();
    txn.recentBlockhash = blockhash;
    txn.partialSign(keyPair);
    console.log(keyPair, "keyPair");
    console.log(connection, "connection");

    const balance = await connection.getBalance(wallet.publicKey);
    console.log(balance, "balance");

    const signature = await wallet.sendTransaction(txn, connection);
    console.log(signature, "signature")
   
  };
  return (
    <div className="flex flex-col items-center w-full max-w-md p-6 space-y-4 rounded-lg shadow-lg">
      <h1 className="text-2xl text-green-300">TokenLaunchPad</h1>
      <div className="flex flex-col justify-center items-center gap-3">
        <input type="text" placeholder="Name" id="Name" />
        <input type="text" placeholder="Symbol" id="Symbol" />
        <input type="text" placeholder="intial Supply" id="Supply" />
        <label className="form-label"> Choose File</label>
        <input type="file" onChange={changeHandler} />

        <button
          onClick={createToken}
          className="border border-emerald-400 rounded-md text-green-300 text-sm px-3 py-2 hover:border-gray-600 "
        >
          {" "}
          create a token
        </button>
      </div>
    </div>
  );
};

export default TokenLaunchPad;
