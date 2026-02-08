import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Crawler X9",
  description: "Configure a simple web crawler alert"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
