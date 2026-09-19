import type { Metadata } from "next";
import SkillSelection from "@/components/skill-selection";

export const metadata: Metadata = {
  title: "Review recommended skills",
  description:
    "Review task guidance matched to your product idea, stack preferences, and brief.",
  alternates: { canonical: "/skills" },
};

export default function SkillsPage() {
  return <SkillSelection />;
}
