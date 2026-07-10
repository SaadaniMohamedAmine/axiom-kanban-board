import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Axiom Kanban Board",
  description: "A modern Kanban board application",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "Axiom",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="theme-color" content="#0f131d" />
      </head>
      <body>{children}</body>
    </html>
  );
}
