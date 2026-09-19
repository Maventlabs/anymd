import {
  AuthInputError,
  createEmailUser,
  parseSignupInput,
  UserAlreadyExistsError,
} from "../../../../lib/auth-users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
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

    console.error("Signup failed", error);
    return Response.json({ error: "Unable to create account" }, { status: 500 });
  }
}
