import { randomUUID } from "node:crypto";
import { getSql, type Sql } from "./database";
import { hashPassword } from "./password";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export type SignupInput = {
  email: string;
  password: string;
  name?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  password_hash?: string | null;
};

export class AuthInputError extends Error {}
export class UserAlreadyExistsError extends Error {}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseSignupInput(input: unknown): SignupInput {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new AuthInputError("Invalid signup payload");
  }

  const record = input as Record<string, unknown>;
  const keys = Object.keys(record);
  if (keys.some((key) => !["email", "password", "name"].includes(key))) {
    throw new AuthInputError("Invalid signup payload");
  }

  if (typeof record.email !== "string" || typeof record.password !== "string") {
    throw new AuthInputError("Email and password are required");
  }

  const email = normalizeEmail(record.email);
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new AuthInputError("Enter a valid email address");
  }
  if (
    record.password.length < MIN_PASSWORD_LENGTH ||
    record.password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new AuthInputError(
      `Password must be ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} characters`,
    );
  }

  let name: string | undefined;
  if (record.name !== undefined) {
    if (typeof record.name !== "string" || record.name.trim().length > 80) {
      throw new AuthInputError("Name must be 80 characters or fewer");
    }
    name = record.name.trim() || undefined;
  }

  return { email, password: record.password, ...(name ? { name } : {}) };
}

export async function findUserByEmail(
  email: string,
  query: Sql = getSql(),
): Promise<AuthUser | null> {
  const rows = (await query`
    SELECT id, email, name, image, password_hash
    FROM public.app_users
    WHERE email = ${normalizeEmail(email)}
    LIMIT 1
  `) as Record<string, unknown>[];

  return (rows[0] as AuthUser | undefined) ?? null;
}

export async function createEmailUser(
  input: SignupInput,
  query: Sql = getSql(),
): Promise<AuthUser> {
  const passwordHash = await hashPassword(input.password);
  const rows = (await query`
    INSERT INTO public.app_users (id, email, name, password_hash)
    VALUES (${randomUUID()}, ${input.email}, ${input.name ?? null}, ${passwordHash})
    ON CONFLICT (email) DO NOTHING
    RETURNING id, email, name, image, password_hash
  `) as Record<string, unknown>[];

  if (!rows[0]) throw new UserAlreadyExistsError("Email is already registered");
  return rows[0] as AuthUser;
}

export async function upsertOAuthUser(
  input: { email: string; name?: string | null; image?: string | null },
  query: Sql = getSql(),
): Promise<AuthUser> {
  const email = normalizeEmail(input.email);
  const rows = (await query`
    INSERT INTO public.app_users (id, email, name, image, email_verified_at)
    VALUES (${randomUUID()}, ${email}, ${input.name ?? null}, ${input.image ?? null}, now())
    ON CONFLICT (email) DO UPDATE SET
      name = COALESCE(public.app_users.name, EXCLUDED.name),
      image = COALESCE(public.app_users.image, EXCLUDED.image),
      email_verified_at = COALESCE(public.app_users.email_verified_at, now()),
      updated_at = now()
    RETURNING id, email, name, image, password_hash
  `) as Record<string, unknown>[];

  return rows[0] as AuthUser;
}

export async function linkOAuthAccount(
  input: { userId: string; provider: string; providerAccountId: string },
  query: Sql = getSql(),
): Promise<void> {
  await query`
    INSERT INTO public.app_accounts (id, user_id, provider, provider_account_id)
    VALUES (${randomUUID()}, ${input.userId}, ${input.provider}, ${input.providerAccountId})
    ON CONFLICT (provider, provider_account_id) DO NOTHING
  `;
}
