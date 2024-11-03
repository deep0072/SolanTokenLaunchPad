import React, { useState, useEffect } from 'react';
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_2022_PROGRAM_ID, getMintLen, createInitializeMetadataPointerInstruction, createInitializeMintInstruction, TYPE_SIZE, LENGTH_SIZE, ExtensionType, getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction, createMintToInstruction } from "@solana/spl-token";
import { createInitializeInstruction, pack } from '@solana/spl-token-metadata';
import { handleSubmission } from '../utils/geturi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';  


const TokenLaunchPad = () => {
  const [selectedFile, setSelectedFile] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [createdTokens, setCreatedTokens] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState(true);

  const { connection } = useConnection();
  const wallet = useWallet();
  const closeSuccessMessage = () => {
    setSuccessMessage('');
  };

  // Function to fetch user's tokens
  const fetchUserTokens = async () => {
    try {
      setIsLoadingTokens(true);
      if (!wallet.publicKey) return;

      // You'll need to implement this based on your backend/storage solution
      // This is just a placeholder - replace with your actual token fetching logic
      const response = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_2022_PROGRAM_ID
      });

      const tokens = response.value.map(accountInfo => {
        const tokenData = accountInfo.account.data.parsed.info;
        return {
          name: tokenData.mint, // You might want to fetch token metadata for actual name
          symbol: '', // Fetch from metadata
          mint: tokenData.mint,
          supply: tokenData.tokenAmount.amount,
          timestamp: new Date().toLocaleString() // You might want to store/fetch actual creation time
        };
      });

      setCreatedTokens(tokens);
    } catch (error) {
      console.error('Error fetching tokens:', error);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  // Fetch tokens when component mounts and wallet changes
  useEffect(() => {
    fetchUserTokens();
  }, [wallet.publicKey, connection]);

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const createToken = async () => {
    try {
      setIsLoading(true);
      setSuccessMessage('');

      
      const name = document.getElementById("Name").value;
      const Symbol = document.getElementById("Symbol").value;
      const supply = document.getElementById("Supply").value;

      let keyPair = Keypair.generate();
      
      const associatedToken = getAssociatedTokenAddressSync(
        keyPair.publicKey,    
        wallet.publicKey,     
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const jsonObj = {
        name: name,
        symbol: Symbol,
      };

      const imageUri = await handleSubmission(selectedFile, jsonObj);

      const metadata = {
        mint: keyPair.publicKey,
        name: name,
        symbol: Symbol,
        uri: imageUri,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const txn = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: wallet.publicKey,
          newAccountPubkey: keyPair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          keyPair.publicKey,
          wallet.publicKey,
          keyPair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          keyPair.publicKey,
          9,
          wallet.publicKey,
          null,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: keyPair.publicKey,
          metadata: keyPair.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          mintAuthority: wallet.publicKey,
          updateAuthority: wallet.publicKey,
        }),
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          associatedToken,
          wallet.publicKey,
          keyPair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
          keyPair.publicKey,
          associatedToken,
          wallet.publicKey,
          BigInt(supply),
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      txn.feePayer = wallet.publicKey;
      const { blockhash } = await connection.getLatestBlockhash();
      txn.recentBlockhash = blockhash;
      txn.partialSign(keyPair);

      const signature = await wallet.sendTransaction(txn, connection);
      setSuccessMessage(`Token Created Successfully! ${keyPair.publicKey}`);

      // After successful token creation
      await fetchUserTokens(); // Refresh the token list
      
    } catch (error) {
      console.error('Error creating token:', error);
      setSuccessMessage(`Error creating token: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-6xl p-6 space-y-8">
      {/* Token Form Section */}
      <div className="w-full max-w-md p-6 space-y-4 rounded-lg shadow-lg bg-gray-800">
        <h1 className="text-2xl text-green-300 text-center">Token LaunchPad</h1>
        
        {/* My Tokens Dropdown */}
     

        {/* Token Creation Form */}
        <div className="flex flex-col justify-center items-center gap-3">
          <input 
            type="text" 
            placeholder="Name" 
            id="Name"
            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-300" 
          />
          <input 
            type="text" 
            placeholder="Symbol" 
            id="Symbol"
            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-300" 
          />
          <input 
            type="text" 
            placeholder="Initial Supply" 
            id="Supply"
            className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-green-300" 
          />
          
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-300 mb-2">Choose File</label>
            <input 
              type="file" 
              onChange={changeHandler}
              className="w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-gray-700 file:text-white hover:file:bg-gray-600" 
            />
          </div>

          <button
            onClick={createToken}
            disabled={isLoading}
            className="w-full border border-emerald-400 rounded-md text-green-300 text-sm px-6 py-2 hover:bg-emerald-400/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <svg className="animate-spin h-5 w-5 text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Creating Token...' : 'Create Token'}
          </button>
        </div>

        {successMessage && (
          <div className={`mt-4 p-4 rounded-md ${successMessage.includes('Error') ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'} flex items-center gap-2`}>
            <p className="text-sm font-medium break-all">{successMessage}</p>
            <button onClick={closeSuccessMessage} className="text-gray-300 hover:text-gray-500">
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenLaunchPad;