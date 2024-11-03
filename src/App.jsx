import TokenLaunchPad from './components/TokenLaunchPad'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletDisconnectButton, WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import "@solana/wallet-adapter-react-ui/styles.css";
import TokenLaunchPad2 from './components/TokenLaunchPad2';
import TokenList from './components/TokenList';

function App() {
  return (
    <div className="min-h-screen bg-gray-700">
      <ConnectionProvider
        endpoint={"https://api.devnet.solana.com"}
      >
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: 20,
                alignItems: "center",
              }}
            >
              <WalletMultiButton />
              <WalletDisconnectButton />
            </div>

            <div className="flex flex-col items-center">
              <div className="w-3/4 mt-6">
                <TokenLaunchPad2 /> {/* TokenLaunchPad2 is now above TokenList */}
              </div>

              <div className="w-3/4 mt-6">
                <TokenList /> {/* TokenList is now below TokenLaunchPad2 */}
              </div>
            </div>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </div>
  );
}

export default App;
