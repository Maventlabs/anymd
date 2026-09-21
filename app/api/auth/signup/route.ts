import {
  AuthInputError,
  createEmailUser,
  parseSignupInput,
  UserAlreadyExistsError,
} from "../../../../lib/auth-users";
import {
  consumeRequestRateLimit,
  rateLimitResponse,
} from "../../../../lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rateLimit = await consumeRequestRateLimit(request, "signup");
    if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

    const input = parseSignupInput(await request.json());
    const user = await createEmailUser(input);

    return Response.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof UserAlreadyExistsError) {
      return Response.json({ error: error.message }, { status: 409 });
    }

    if (error instanceof Error && error.message.includes("rate limiting"))
      return Response.json(
        { error: "Signup protection is temporarily unavailable" },
        { status: 503 },
      );

    console.error("Signup failed", error);
    return Response.json({ error: "Unable to create account" }, { status: 500 });
  }
}
