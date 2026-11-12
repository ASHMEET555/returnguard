import type { Metadata } from "next";
import "./globals.css";
import "@returnguard/react/styles.css";
import { AuthProvider } from "../lib/authContext";

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
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
