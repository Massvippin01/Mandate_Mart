import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MandateMart — Agentic Commerce with Delegated Spend Authority",
  description:
    "AI agents negotiate, Double Gates enforce, SHA-256 Merkle chains audit — all on live Razorpay rails. Track 01: Razorpay National Hackathon.",
  keywords: [
    "agentic commerce",
    "razorpay",
    "mandate",
    "ZOPA",
    "merkle ledger",
    "Ed25519",
    "double gate",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-zinc-950 text-zinc-100`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
