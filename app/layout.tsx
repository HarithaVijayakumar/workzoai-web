import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorkZo AI",
  description: "Realistic AI recruiter interview simulation platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}