import type { Metadata } from "next";
import DocumentGenerator from "@/components/document-generator";

export const metadata: Metadata = {
  title: "Generate project documents",
  description:
    "Generate and review the prd.md and AGENTS.md files for your coding agent.",
  alternates: { canonical: "/generate" },
};

export default function GeneratePage() {
  return <DocumentGenerator />;
}
