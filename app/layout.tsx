import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "StellarGift — Crypto Gift Cards on Stellar",
  description: "Generate a one-time secret link that holds XLM. Anyone with the link can claim it — no account needed to receive.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-[#F8F4EE] text-[#1C1A16] min-h-screen">
        {children}
      </body>
    </html>
  );
}
