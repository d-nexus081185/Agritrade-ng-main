import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Preloader } from "@/components/ui/Preloader";
import "./globals.css";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", display: "swap", axes: ["SOFT", "opsz"] });
const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "AgriTrade — Wholesale farm produce marketplace", template: "%s · AgriTrade" },
  description:
    "AgriTrade connects retail buyers with wholesale sellers of eggs, poultry, fish, yam, onions and other farm produce across Nigeria.",
};

export const viewport: Viewport = { themeColor: "#1f4d33" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Preloader />
        <a href="#main" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
