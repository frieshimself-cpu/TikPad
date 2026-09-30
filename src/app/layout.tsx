import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Ticker } from "@/components/Ticker";
import { scheduleOpportunisticClaim } from "@/lib/server/autoclaim";

const display = Instrument_Serif({ variable: "--font-display-face", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "HushX — Token fees for creators on X",
  description: "Launch a token on pump.fun, point its creator fees at any X creator, and HushX pays them automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  scheduleOpportunisticClaim();
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="lg:grid lg:grid-cols-[260px_1fr]">
            <Sidebar />
            <div className="flex min-h-screen min-w-0 flex-col">
              <Ticker />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
