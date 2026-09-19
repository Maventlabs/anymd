type RuntimeProcess = {
  env?: Record<string, string | undefined>;
};

const runtimeGlobal = globalThis as typeof globalThis & {
  process?: RuntimeProcess;
};

export function getServerEnv(key: string): string | undefined {
  return runtimeGlobal.process?.env?.[key];
}

export function getServerEnvSnapshot(): Record<string, string | undefined> {
  return new Proxy(
    {},
    {
      get: (_target, key) =>
        typeof key === "string" ? getServerEnv(key) : undefined,
    },
  );
}
