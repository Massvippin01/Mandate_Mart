import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
