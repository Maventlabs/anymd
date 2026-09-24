import { neon } from "@neondatabase/serverless";
import { getServerEnv } from "@/lib/server-env";

export type Sql = ReturnType<typeof neon>;

type DatabaseRetryOptions = {
  sleep?: (delayMs: number) => Promise<void>;
  maxAttempts?: number;
};

const databaseRetryDelays = [250, 1_000] as const;

function hasTransientConnectionError(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (typeof current === "object") {
      const record = current as Record<string, unknown>;
      if (
        [
          "UND_ERR_CONNECT_TIMEOUT",
          "ECONNRESET",
          "ETIMEDOUT",
          "EAI_AGAIN",
          "ENETUNREACH",
        ].includes(record.code as string)
      )
        return true;
      const sourceError = record.sourceError;
      if (sourceError && sourceError !== current) {
        current = sourceError;
        continue;
      }
      const cause = record.cause;
      if (cause && cause !== current) {
        current = cause;
        continue;
      }
    }
    if (
      current instanceof Error &&
      /connect timeout|timeout exceeded when trying to connect/iu.test(
        current.message,
      )
    )
      return true;
    break;
  }
  return false;
}

export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  options: DatabaseRetryOptions = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? databaseRetryDelays.length + 1;
  const sleep =
    options.sleep ??
    ((delayMs: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, delayMs)));

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (!hasTransientConnectionError(error) || attempt + 1 >= maxAttempts)
        throw error;
      await sleep(databaseRetryDelays[Math.min(attempt, databaseRetryDelays.length - 1)]);
    }
  }
}

let sql: Sql | undefined;

export function getSql(): Sql {
  const databaseUrl = getServerEnv("DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for database access");
  }

  if (!sql) {
    const client = neon(databaseUrl);
    sql = ((strings: TemplateStringsArray, ...params: unknown[]) =>
      retryDatabaseOperation(() => client(strings, ...params))) as Sql;
  }
  return sql;
}
