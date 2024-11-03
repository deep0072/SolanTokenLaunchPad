import { TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { FaRegCopy } from "react-icons/fa"; // Import copy icon

const TokenList = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  const [fetchedTokens, setFetchedTokens] = useState([]);
  const [selectedOption, setSelectedOption] = useState(""); // State for dropdown selection

  // Function to fetch user's tokens
  const fetchUserTokens = async () => {
    try {
      if (!wallet.publicKey) return;

      const response = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, {
        programId: TOKEN_2022_PROGRAM_ID,
      });

      const tokens = response.value.map(accountInfo => {
        const tokenData = accountInfo.account.data.parsed.info;

        return {
          name: tokenData.mint, // Placeholder for token name
          symbol: "",           // Placeholder for token symbol
          mint: tokenData.mint,
          supply: tokenData.tokenAmount.amount,
         };
      });

      setFetchedTokens(tokens);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  };

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  // Fetch tokens when component mounts and wallet changes
  useEffect(() => {
    fetchUserTokens();
  }, [wallet, connection]);

  // Handle dropdown selection change
  const handleDropdownChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className="token-list ">
      <div className="flex justify-center text-white text-2xl"> <select
        className="mb-4 p-2 bg-gray-800 text-white rounded-md"
        value={selectedOption}
        onChange={handleDropdownChange}
      >
        <option value="">Select an option</option>
        <option value="show">Show Tokens ({fetchedTokens.length})</option>
        <option value="hide">Hide Tokens</option>
      </select></div>

      {/* Dropdown for selecting token visibility */}
     

      {/* Conditionally render the token list based on dropdown selection */}
      {selectedOption === "show" && fetchedTokens.length > 0 ? (
        <div className="overflow-y-auto max-h-80"> {/* Make table scrollable */}
          <table className="w-full text-center border-collapse mt-4 ">
            <thead>
              <tr style={{ backgroundColor: "#006400", color: "white" }}>
                <th className="p-2 border border-yellow-500">Token Address</th>
                <th className="p-2 border border-yellow-500">Token Supply</th>
               
              </tr>
            </thead>
            <tbody >
              {fetchedTokens.map((token, index) => (
                <tr key={index} className="text-white">
                  <td className="p-2 border border-yellow-500 flex items-center justify-center">
                    {token.mint}
                    <FaRegCopy
                      className="ml-2 cursor-pointer text-yellow-500"
                      onClick={() => copyToClipboard(token.mint)}
                    />
                  </td>
                  <td className="p-2 border border-yellow-500">{token.supply}</td>
                  <td className="p-2 border border-yellow-500">{token.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : selectedOption === "show" && fetchedTokens.length === 0 ? (
        <p>No tokens found.</p>
      ) : null}
    </div>
  );
};

export default TokenList;
