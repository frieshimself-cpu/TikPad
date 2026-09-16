"use client";

import dynamic from "next/dynamic";

// The wallet button reads window state; render it client-only to avoid hydration mismatches.
export const WalletButton = dynamic(async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton, {
  ssr: false,
  loading: () => <div className="h-10 w-36 rounded-xl border border-line-strong bg-elev" />,
});
