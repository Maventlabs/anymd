import type { Metadata } from "next";
import DocumentGenerator from "@/components/document-generator";

export const metadata: Metadata = { title: "Generated documents | AnyMD" };

export default function GeneratePage() {
  return <DocumentGenerator />;
}
