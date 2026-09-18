import { loadSkillsCatalog } from "@/lib/skills";

export async function GET() {
  return Response.json(await loadSkillsCatalog());
}
