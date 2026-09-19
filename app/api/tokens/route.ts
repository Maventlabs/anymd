import { auth } from "@/auth";
import { createTokenRepository } from "@/lib/tokens";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: { code: "AUTH_REQUIRED" } }, { status: 401 });

  const balance = await createTokenRepository().getBalance(userId);
  return Response.json(balance);
}
