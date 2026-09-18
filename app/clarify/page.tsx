import type { Metadata } from "next";
import ClarificationFlow from "@/components/clarification-flow";

export const metadata: Metadata = { title: "Clarify your idea | AnyMD" };

export default function ClarifyPage() {
  return <ClarificationFlow />;
}
