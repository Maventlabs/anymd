import type { Metadata } from "next";
import SkillSelection from "@/components/skill-selection";

export const metadata: Metadata = { title: "Recommended skills | AnyMD" };

export default function SkillsPage() {
  return <SkillSelection />;
}
