import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/server-env";

export type Sql = ReturnType<typeof neon>;

let sql: Sql | undefined;

export function getSql(): Sql {
  const databaseUrl = getServerEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database access");
  }

  sql ??= neon(databaseUrl);
  return sql;
}
