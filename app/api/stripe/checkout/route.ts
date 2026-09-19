import { auth } from "@/auth";
import { randomBytes } from "node:crypto";
import { getAppUrl, getStripe, StripeConfigError } from "@/lib/stripe";
import { getTokenPackage, TokenPackageError } from "@/lib/token-packages";

function errorResponse(code: string, status: number, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse("AUTH_REQUIRED", 401, "Sign in to purchase tokens.");

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    return errorResponse("INVALID_REQUEST", 400, "The checkout request is invalid.");
  }
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    JSON.stringify(Object.keys(value).sort()) !== JSON.stringify(["packageId"])
  )
    return errorResponse("INVALID_REQUEST", 400, "The checkout request is invalid.");

  let tokenPackage;
  try {
    tokenPackage = getTokenPackage((value as { packageId?: unknown }).packageId);
  } catch (error) {
    if (error instanceof TokenPackageError)
      return errorResponse("INVALID_PACKAGE", 400, "The token package is invalid.");
    throw error;
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim();
  if (idempotencyKey && !/^[A-Za-z0-9._:-]{8,255}$/u.test(idempotencyKey))
    return errorResponse("INVALID_REQUEST", 400, "The checkout request is invalid.");

  try {
    const stripe = getStripe();
    const appUrl = getAppUrl(request);
    const created = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: userId,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: tokenPackage.unitAmount,
              product_data: { name: tokenPackage.name },
            },
          },
        ],
        metadata: {
          userId,
          packageId: tokenPackage.id,
          tokens: String(tokenPackage.tokens),
        },
        success_url: `${appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/pricing?checkout=cancelled`,
        integration_identifier: `anymd_checkout_${randomBytes(4).toString("hex")}`,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (!created.url) return errorResponse("CHECKOUT_FAILED", 502, "Checkout could not be created.");
    return Response.json({ url: created.url }, { status: 201 });
  } catch (error) {
    if (error instanceof StripeConfigError)
      return errorResponse("STRIPE_NOT_CONFIGURED", 503, "Payments are not configured.");
    return errorResponse("CHECKOUT_FAILED", 502, "Checkout could not be created.");
  }
}
