import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-kanban.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Axiom — The intelligence layer for elite teams.",
    template: "%s | Axiom",
  },
  description:
    "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine. Built for engineering teams that ship.",
  keywords: ["kanban", "project management", "AI", "sprint planning", "team collaboration"],
  authors: [{ name: "Axiom Team" }],
  creator: "Axiom",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: APP_URL,
    siteName: "Axiom",
    title: "Axiom — The intelligence layer for elite teams.",
    description:
      "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine.",
    images: [
      {
        url: "/og/image",
        width: 1200,
        height: 630,
        alt: "Axiom — AI-powered Kanban",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Axiom — The intelligence layer for elite teams.",
    description:
      "AI-powered Kanban board with sprint analytics, real-time collaboration, and Axiom Intelligence Engine.",
    images: ["/og/image"],
    creator: "@axiomapp",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="data-theme"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
