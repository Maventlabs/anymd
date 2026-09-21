import assert from "node:assert/strict";
import test from "node:test";
import {
  createDraftStorageRecord,
  parseDraftStorageRecord,
  type DraftStorageSnapshot,
} from "../lib/draft-storage";

const snapshot: DraftStorageSnapshot = {
  draft: {
    idea: "A useful product idea with enough detail.",
    stack: { Frontend: "Next.js", Database: "Neon" },
    selectedSkillIds: ["frontend-design"],
    step: "clarification" as const,
  },
  clarification: {
    answers: {
      problem: "People lose important decisions in scattered tools.",
      platform: "Web",
    },
    completed: ["problem", "platform"],
    current: "audience" as const,
  },
  submittedIdea: "A useful product idea with enough detail.",
};

test("creates a versioned record without changing the draft snapshot", () => {
  const record = createDraftStorageRecord(snapshot, 123);

  assert.deepEqual(record, {
    version: 1,
    savedAt: 123,
    snapshot,
  });
});

test("parses a valid persisted draft record", () => {
  assert.deepEqual(
    parseDraftStorageRecord(createDraftStorageRecord(snapshot, 123)),
    snapshot,
  );
});

test("rejects malformed or future persisted draft records", () => {
  assert.equal(parseDraftStorageRecord(null), null);
  assert.equal(
    parseDraftStorageRecord({
      ...createDraftStorageRecord(snapshot),
      version: 2,
    }),
    null,
  );
  assert.equal(
    parseDraftStorageRecord({
      ...createDraftStorageRecord(snapshot),
      snapshot: { ...snapshot, draft: { ...snapshot.draft, step: "done" } },
    }),
    null,
  );
  assert.equal(
    parseDraftStorageRecord({
      ...createDraftStorageRecord(snapshot),
      snapshot: {
        ...snapshot,
        clarification: { ...snapshot.clarification, current: "unknown" },
      },
    }),
    null,
  );
});
