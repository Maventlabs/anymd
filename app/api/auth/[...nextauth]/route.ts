import { handlers } from "../../../../auth";
import type { NextRequest } from "next/server";
import {
  consumeRequestRateLimit,
  rateLimitResponse,
} from "../../../../lib/rate-limit";

export const runtime = "nodejs";

async function guarded(
  request: NextRequest,
  handler: (request: NextRequest) => Response | Promise<Response>,
) {
  const result = await consumeRequestRateLimit(request, "auth");
  if (!result.allowed) return rateLimitResponse(result);
  return handler(request);
}

export async function GET(request: NextRequest) {
  return guarded(request, handlers.GET);
}

export async function POST(request: NextRequest) {
  return guarded(request, handlers.POST);
}
