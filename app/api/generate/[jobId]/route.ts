import { auth } from "@/auth";
import { createGenerationJobRepository } from "@/lib/generation-jobs";
import { processGenerationJob } from "@/lib/generation-worker";

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await context.params;
  const session = await auth();
  const repository = createGenerationJobRepository();
  const existing = await repository.getJob(
    jobId,
    session?.user?.id,
  );
  if (!existing)
    return Response.json(
      { error: { code: "JOB_NOT_FOUND", message: "Generation job not found." } },
      { status: 404 },
    );
  const job =
    existing.status === "queued" || existing.status === "processing"
      ? await processGenerationJob(jobId, repository)
      : existing;
  return Response.json({ job });
}
