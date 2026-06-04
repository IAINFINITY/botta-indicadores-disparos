import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Botta Indicadores Disparos",
  description: "Dashboard de disparos, conversas e visão operacional.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body>{children}</body>
    </html>
  );
}
