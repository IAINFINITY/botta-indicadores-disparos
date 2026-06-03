import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bodyFont = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const displayFont = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Botta Indicadores Disparos",
  description: "Dashboard de disparos, conversas e overview operacional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}>
      <body>{children}</body>
    </html>
  );
}
