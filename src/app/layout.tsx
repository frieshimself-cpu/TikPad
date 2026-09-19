import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { scheduleOpportunisticClaim } from "@/lib/server/autoclaim";

const body = Inter({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "600"] });

export const metadata: Metadata = {
  title: "FansPad — Token fees for OnlyFans creators",
  description: "Launch a token on pump.fun, point its creator fees at any OnlyFans creator, and FansPad pays them automatically.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  scheduleOpportunisticClaim();
  return (
    <html lang="en" className={`${body.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <div className="lg:grid lg:grid-cols-[260px_1fr]">
            <Sidebar />
            <div className="flex min-h-screen min-w-0 flex-col">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
