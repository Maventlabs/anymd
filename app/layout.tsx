import type { Metadata } from "next";
import "@fontsource-variable/geist";
import "@fontsource/instrument-serif/400.css";
import "./globals.css";
import { DraftProvider } from "@/components/draft-provider";
import AnalyticsConsent from "@/components/analytics-consent";
import LayoutPreloader from "@/components/ui/layout-preloader";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.ANYMD_APP_URL?.trim() || "http://localhost:3000",
  ),
  title: {
    default: "AnyMD | Turn product ideas into build-ready briefs",
    template: "%s | AnyMD",
  },
  description:
    "AnyMD is a PRD generator for coding agents. Turn rough product ideas into clear requirements, AGENTS.md context, and build-ready briefs.",
  applicationName: "AnyMD",
  keywords: [
    "product requirements document",
    "PRD generator",
    "AI coding agent",
    "AGENTS.md",
    "product planning",
  ],
  alternates: { canonical: "/" },
  verification: {
    google: "googlefc1cf9cb6fcfd597",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "AnyMD",
    url: "/",
    title: "AnyMD | Turn product ideas into build-ready briefs",
    description:
      "Clarify a product idea and create the Markdown context your coding agent needs to build it.",
    images: [
      {
        url: "/brand/anymd-logo.png",
        width: 1774,
        height: 887,
        alt: "AnyMD by Maventlabs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AnyMD | Turn product ideas into build-ready briefs",
    description:
      "Clarify a product idea and create the Markdown context your coding agent needs to build it.",
    images: ["/brand/anymd-logo.png"],
  },
  icons: {
    icon: "/brand/anymd-mark.png",
    apple: "/brand/anymd-mark.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <LayoutPreloader />
        <DraftProvider>
          {children}
          <AnalyticsConsent />
        </DraftProvider>
      </body>
    </html>
  );
}
