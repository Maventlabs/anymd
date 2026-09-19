export const tokenPackages = {
  starter: {
    tokens: 10,
    unitAmount: 299,
    name: "10 AnyMD tokens",
  },
  builder: {
    tokens: 50,
    unitAmount: 1_199,
    name: "50 AnyMD tokens",
  },
  studio: {
    tokens: 100,
    unitAmount: 1_999,
    name: "100 AnyMD tokens",
  },
} as const;

export type TokenPackageId = keyof typeof tokenPackages;

export class TokenPackageError extends Error {
  constructor(public readonly code: "INVALID_PACKAGE") {
    super(code);
    this.name = "TokenPackageError";
  }
}

export function getTokenPackage(value: unknown) {
  if (
    typeof value !== "string" ||
    !Object.prototype.hasOwnProperty.call(tokenPackages, value)
  )
    throw new TokenPackageError("INVALID_PACKAGE");
  return {
    id: value as TokenPackageId,
    ...tokenPackages[value as TokenPackageId],
  };
}
