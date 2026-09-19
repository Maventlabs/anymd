import type { Metadata } from "next";
import ClarificationFlow from "@/components/clarification-flow";

export const metadata: Metadata = {
  title: "Clarify your product brief",
  description:
    "Answer focused product questions so your AnyMD brief reflects the real scope of the build.",
  alternates: { canonical: "/clarify" },
};

export default function ClarifyPage() {
  return <ClarificationFlow />;
}
