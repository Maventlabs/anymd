import type { Metadata } from "next";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "./globals.css";
import { DraftProvider } from "@/components/draft-provider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.ANYMD_APP_URL?.trim() || "http://localhost:3000",
  ),
  title: {
    default: "AnyMD | Turn product ideas into build-ready briefs",
    template: "%s | AnyMD",
  },
  description:
    "Clarify a product idea, choose relevant skills, and create a PRD.md and AGENTS.md for your coding agent.",
  applicationName: "AnyMD",
  keywords: [
    "product requirements document",
    "PRD generator",
    "AI coding agent",
    "AGENTS.md",
    "product planning",
  ],
  alternates: { canonical: "/" },
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
    title: "AnyMD | Turn product ideas into build-ready briefs",
    description:
      "Clarify a product idea and create the Markdown context your coding agent needs to build it.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnyMD | Turn product ideas into build-ready briefs",
    description:
      "Clarify a product idea and create the Markdown context your coding agent needs to build it.",
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
        <DraftProvider>{children}</DraftProvider>
      </body>
    </html>
  );
}
