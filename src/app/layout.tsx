import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "World Cup Predictions",
  description:
    "Private prediction league for family and friends: score predictions, captain's picks, and bracket challenge for FIFA World Cup 2026.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#14532d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
