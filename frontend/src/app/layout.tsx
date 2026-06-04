import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dr. Bem Estar | Dashboard Operacional",
  description: "Dashboard operacional com disparos, conversas e indicadores do Chatwoot.",
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
