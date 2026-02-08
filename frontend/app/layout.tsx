import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Crawler X9",
  description: "Create and monitor web crawler alerts."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
