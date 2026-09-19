import { createHmac } from "node:crypto";
import { isIP } from "node:net";

export class GenerationQueueError extends Error {
  constructor(
    public readonly code: "IP_UNAVAILABLE" | "NOT_CONFIGURED",
    message: string,
  ) {
    super(message);
    this.name = "GenerationQueueError";
  }
}

export function extractClientIp(request: Request, headerName: string) {
  const value = request.headers.get(headerName)?.split(",", 1)[0]?.trim();
  if (!value || !isIP(value))
    throw new GenerationQueueError(
      "IP_UNAVAILABLE",
      `Missing or invalid ${headerName} header`,
    );
  return value;
}

export function clientIpHash(ip: string, pepper: string) {
  if (pepper.length < 16)
    throw new GenerationQueueError(
      "NOT_CONFIGURED",
      "ANYMD_IP_HASH_PEPPER must contain at least 16 characters",
    );
  return createHmac("sha256", pepper).update(ip).digest("hex");
}

export function parseQueueRate(value: string | undefined) {
  const rate = value === undefined ? 15 : Number(value);
  if (!Number.isInteger(rate) || rate < 1 || rate > 60)
    throw new GenerationQueueError(
      "NOT_CONFIGURED",
      "ANYMD_QUEUE_RATE_PER_MINUTE must be an integer from 1 to 60",
    );
  return rate;
}
