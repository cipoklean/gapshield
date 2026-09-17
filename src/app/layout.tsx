import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlex = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "GapShield AI - Weekend Risk Intelligence for Tokenized Stocks",
  description: "Know Monday's risk before Monday arrives. GapShield AI turns weekend news and market signals into actionable risk intelligence for tokenized US stocks on Bitget.",
  openGraph: {
    title: "GapShield AI - Weekend Risk Intelligence",
    description: "AI-powered weekend gap analysis for tokenized US stocks. Know Monday's risk before Monday arrives.",
    type: "website",
    locale: "en_US",
    siteName: "GapShield AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "GapShield AI - Weekend Risk Intelligence",
    description: "Know Monday's risk before Monday arrives. AI-powered weekend gap analysis for tokenized US stocks.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${geistSans.variable} ${ibmPlex.variable}`}>
      <body className="min-h-screen bg-[#080C14] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
