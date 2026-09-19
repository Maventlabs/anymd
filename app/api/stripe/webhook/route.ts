import Stripe from "stripe";
import { createTokenRepository } from "@/lib/tokens";
import { getStripe, StripeConfigError } from "@/lib/stripe";
import { getServerEnv } from "@/lib/server-env";
import { getTokenPackage, TokenPackageError } from "@/lib/token-packages";

function metadataValue(metadata: Stripe.Metadata | null, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" ? value : undefined;
}

export async function POST(request: Request) {
  const secret = getServerEnv("STRIPE_WEBHOOK_SECRET")?.trim();
  if (!secret) return new Response("Webhook is not configured", { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Invalid webhook", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      secret,
    );
  } catch {
    return new Response("Invalid webhook", { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  )
    return Response.json({ received: true });

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") return Response.json({ received: true });

  const userId = metadataValue(session.metadata, "userId");
  const packageId = metadataValue(session.metadata, "packageId");
  const tokens = Number(metadataValue(session.metadata, "tokens"));
  if (!userId || !packageId || !Number.isSafeInteger(tokens))
    return new Response("Invalid webhook", { status: 400 });

  let tokenPackage;
  try {
    tokenPackage = getTokenPackage(packageId);
  } catch (error) {
    if (error instanceof TokenPackageError)
      return new Response("Invalid webhook", { status: 400 });
    throw error;
  }
  if (tokenPackage.tokens !== tokens) return new Response("Invalid webhook", { status: 400 });

  try {
    await createTokenRepository().creditPurchase(
      userId,
      tokenPackage.tokens,
      event.id,
      tokenPackage.id,
      { checkoutSessionId: session.id, paymentStatus: session.payment_status },
    );
  } catch (error) {
    if (error instanceof StripeConfigError)
      return new Response("Webhook is not configured", { status: 503 });
    return new Response("Webhook processing failed", { status: 500 });
  }
  return Response.json({ received: true });
}
