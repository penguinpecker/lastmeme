import type { Metadata } from "next";
import { VT323, Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Web3Providers } from "@/components/shared/Web3Providers";

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt323",
  display: "swap",
});

const archivoBlack = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo-black",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LastMeme.fm — Plagiarism court for memecoins",
  description:
    "Real-time plagiarism detection for Four.Meme on BSC. Derivative tokens fight. Winner absorbs loser creator fees for 7 days. Buy directly on-chain.",
  openGraph: {
    title: "LastMeme.fm",
    description: "One cluster enters. One leaves.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${vt323.variable} ${archivoBlack.variable} ${jetbrains.variable}`}>
      <body>
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}
