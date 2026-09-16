"use client";

import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";

const DEFAULT_RPC = "https://api.mainnet-beta.solana.com";
// Treat an empty or malformed env value as unset (a blank variable in the host's UI must not break the build).
const envRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? "";
const RPC = /^https?:\/\//.test(envRpc) ? envRpc : DEFAULT_RPC;

export function Providers({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
