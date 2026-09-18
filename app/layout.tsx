import type { Metadata } from "next";
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";
import "./globals.css";
import { DraftProvider } from "@/components/draft-provider";

export const metadata: Metadata = {
  title: "AnyMD - A thoughtful start to your next build",
  description:
    "Clarify a product idea, review matched skills, and assemble agent-ready Markdown documents with AnyMD.",
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
