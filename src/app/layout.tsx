import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TopNav } from "@/components/TopNav";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";
import { scheduleOpportunisticClaim } from "@/lib/server/autoclaim";

const body = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "AdPad — Coins that buy their own ads",
  description: "Launch on pump.fun and the coin's creator rewards fund its advertising: X promoted posts, KOL promos and placements, automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  scheduleOpportunisticClaim();
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <Ticker />
          <TopNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
