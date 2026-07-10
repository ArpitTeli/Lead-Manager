import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Distribution System",
  description: "Internal lead sheet distribution tool",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
