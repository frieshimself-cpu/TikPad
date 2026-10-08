import type { Metadata } from "next";
import { Gloria_Hallelujah, JetBrains_Mono, Patrick_Hand } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { TopNav } from "@/components/TopNav";
import { Footer } from "@/components/Footer";
import { BRAND, TAGLINE } from "@/lib/brand";

const display = Gloria_Hallelujah({ variable: "--font-display-face", subsets: ["latin"], weight: "400" });
const body = Patrick_Hand({ variable: "--font-body", subsets: ["latin"], weight: "400" });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: `${BRAND} — ${TAGLINE}`,
  description: "Launch a coin on pump.fun from your own wallet. Every coin image is checked first; AI-generated images are not allowed to deploy.",
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
