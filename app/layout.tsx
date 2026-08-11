import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fringe Ledger — Edinburgh Fringe reviews, intelligently combined",
  description: "Independent Edinburgh Festival Fringe reviews combined into one transparent, source-by-source ranking.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
