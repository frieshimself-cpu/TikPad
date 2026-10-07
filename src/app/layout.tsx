import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { BRAND, TAGLINE } from "@/lib/brand";

const display = Instrument_Serif({ variable: "--font-display-face", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const body = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: `${BRAND} — ${TAGLINE}`,
  description: "Launch a coin on pump.fun with your own wallet and dev buy. Every coin image is checked first; AI-generated images are not allowed to deploy.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <TopNav />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
