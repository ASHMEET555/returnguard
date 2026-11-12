import type { Metadata } from "next";
import "./globals.css";
import "@returnguard/react/styles.css";

export const metadata: Metadata = {
  title: "ReturnGuard Risk Operations Dashboard",
  description: "Payment fraud detection and risk operations console",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
