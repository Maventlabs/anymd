import Stripe from "stripe";
import { getServerEnvSnapshot } from "@/lib/server-env";

export class StripeConfigError extends Error {
  constructor() {
    super("Stripe configuration is incomplete");
    this.name = "StripeConfigError";
  }
}

export function getStripe(env?: Record<string, string | undefined>) {
  const runtimeEnv = env ?? getServerEnvSnapshot();
  const key = runtimeEnv.STRIPE_SECRET_KEY?.trim();
  if (!key) throw new StripeConfigError();
  return new Stripe(key, {
    appInfo: { name: "AnyMD", version: "0.1.0" },
  });
}

export function getAppUrl(
  request: Request,
  env?: Record<string, string | undefined>,
) {
  const runtimeEnv = env ?? getServerEnvSnapshot();
  const configured = runtimeEnv.ANYMD_APP_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol !== "http:" && url.protocol !== "https:")
      throw new StripeConfigError();
    return url.origin;
  }
  if (runtimeEnv.NODE_ENV === "production") throw new StripeConfigError();
  return new URL(request.url).origin;
}
