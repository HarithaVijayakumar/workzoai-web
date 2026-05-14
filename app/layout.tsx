import type { Metadata } from "next";
import "./globals.css";
import SessionFreshnessGuard from "@/components/SessionFreshnessGuard";

export const metadata: Metadata = {
  title: "WorkZo AI | Real Interview AI",
  description:
    "Practice a real interview before the real one with an AI recruiter that reads your CV, asks follow-ups, applies pressure, and gives honest feedback.",
  icons: {
    icon: [
      { url: "/workzo_icon.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/workzo_icon.png",
    apple: "/workzo_icon.png",
  },
  openGraph: {
    title: "WorkZo AI | Real Interview AI",
    description: "Face a real interview before the real one.",
    images: ["/workzo_icon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionFreshnessGuard />
        {children}
      </body>
    </html>
  );
}