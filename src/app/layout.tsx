import type { Metadata } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { Ticker } from "@/components/Ticker";
import { Footer } from "@/components/Footer";

const display = Bricolage_Grotesque({ variable: "--font-display-face", subsets: ["latin"], weight: ["600", "700", "800"] });
const body = IBM_Plex_Sans({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "TikPad — Route token fees to TikTok creators",
  description: "Launch a token on pump.fun, point its creator fees at any TikTok handle, and TikPad pays the creator out automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="lg:grid lg:grid-cols-[240px_1fr]">
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
