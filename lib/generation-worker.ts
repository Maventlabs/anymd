import {
  AiProviderError,
  generateDocumentsWithProvider,
} from "./ai-provider";
import {
  createGenerationJobRepository,
  parseQueueConfig,
  type GenerationJob,
  type GenerationJobRepository,
} from "./generation-jobs";
import { loadSkillsCatalog, type CatalogResult } from "./skills";

type GenerationProvider = typeof generateDocumentsWithProvider;

export type GenerationWorkerDependencies = {
  loadCatalog?: typeof loadSkillsCatalog;
  generateBundle?: GenerationProvider;
  now?: () => Date;
};

export async function processGenerationJob(
  id: string,
  repository: GenerationJobRepository = createGenerationJobRepository(),
  now = new Date(),
  dependencies: GenerationWorkerDependencies = {},
): Promise<GenerationJob | null> {
  const config = parseQueueConfig();
  const loadCatalog = dependencies.loadCatalog ?? loadSkillsCatalog;
  const generateBundle =
    dependencies.generateBundle ?? generateDocumentsWithProvider;
  const clock = dependencies.now ?? (() => new Date());
  if (await repository.recoverExpiredJob(id, now))
    return repository.getJob(id);

  const job = await repository.claimJob(id, now, config);
  if (!job) return repository.getJob(id);

  try {
    const catalog: CatalogResult = await loadCatalog();
    const selected = catalog.data.filter(({ id: skillId }) =>
      job.input.selectedSkillIds.includes(skillId),
    );
    if (selected.length !== job.input.selectedSkillIds.length) {
      await repository.markTerminalFailure(
        id,
        "failed",
        "UNKNOWN_SKILL",
        clock(),
      );
      return repository.getJob(id);
    }

    const result = await generateBundle(
      job.input,
      selected,
      clock().toISOString(),
      { timeoutMs: config.timeoutMs },
    );
    await repository.markSucceeded(id, result, clock());
  } catch (error) {
    const errorCode =
      error instanceof AiProviderError ? error.code : "GENERATION_FAILED";
    const finishedAt = clock();
    if (job.attemptCount >= job.maxAttempts) {
      await repository.markTerminalFailure(id, "failed", errorCode, finishedAt);
    } else {
      await repository.markRetryableFailure(
        id,
        errorCode,
        new Date(finishedAt.getTime() + config.retryDelayMs),
        finishedAt,
      );
    }
  }

  return repository.getJob(id);
}
