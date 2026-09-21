import type { Clarification, QuestionId } from "@/lib/clarification";
import type { Draft } from "@/lib/idea";

export const DRAFT_STORAGE_VERSION = 1;
export const DRAFT_DATABASE_NAME = "anymd-draft";
export const DRAFT_STORE_NAME = "drafts";
export const DRAFT_RECORD_KEY = "current";

export type DraftStorageSnapshot = {
  draft: Draft;
  clarification: Clarification;
  submittedIdea: string;
};

export type DraftStorageRecord = {
  version: typeof DRAFT_STORAGE_VERSION;
  savedAt: number;
  snapshot: DraftStorageSnapshot;
};

const questionIds = new Set<QuestionId>([
  "problem",
  "audience",
  "platform",
  "browsers",
  "mobile-os",
  "core-flow",
  "scope",
  "out-of-scope",
  "privacy",
  "auth",
  "roles",
  "output-language",
  "theme",
  "constraints",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === "string")
  );
}

function isQuestionId(value: unknown): value is QuestionId {
  return typeof value === "string" && questionIds.has(value as QuestionId);
}

function isDraft(value: unknown): value is Draft {
  if (!isRecord(value)) return false;
  return (
    typeof value.idea === "string" &&
    isStringRecord(value.stack) &&
    Array.isArray(value.selectedSkillIds) &&
    value.selectedSkillIds.every((id) => typeof id === "string") &&
    (value.step === "idea" || value.step === "clarification")
  );
}

function isClarification(value: unknown): value is Clarification {
  if (!isRecord(value)) return false;
  return (
    isStringRecord(value.answers) &&
    Array.isArray(value.completed) &&
    value.completed.every(isQuestionId) &&
    (value.current === "review" || isQuestionId(value.current))
  );
}

export function createDraftStorageRecord(
  snapshot: DraftStorageSnapshot,
  savedAt = Date.now(),
): DraftStorageRecord {
  return {
    version: DRAFT_STORAGE_VERSION,
    savedAt,
    snapshot,
  };
}

export function parseDraftStorageRecord(
  value: unknown,
): DraftStorageSnapshot | null {
  if (!isRecord(value)) return null;
  if (value.version !== DRAFT_STORAGE_VERSION) return null;
  if (typeof value.savedAt !== "number" || !Number.isFinite(value.savedAt))
    return null;
  if (!isRecord(value.snapshot)) return null;
  if (!isDraft(value.snapshot.draft)) return null;
  if (!isClarification(value.snapshot.clarification)) return null;
  if (typeof value.snapshot.submittedIdea !== "string") return null;

  return {
    draft: value.snapshot.draft,
    clarification: value.snapshot.clarification,
    submittedIdea: value.snapshot.submittedIdea,
  };
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionComplete(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
  });
}

function openDraftDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is unavailable."));
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DRAFT_DATABASE_NAME, DRAFT_STORAGE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DRAFT_STORE_NAME))
        request.result.createObjectStore(DRAFT_STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open IndexedDB."));
    request.onblocked = () => reject(new Error("IndexedDB upgrade was blocked."));
  });
}

export async function loadDraftSnapshot(): Promise<DraftStorageSnapshot | null> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readonly");
    const value = await requestResult(
      transaction.objectStore(DRAFT_STORE_NAME).get(DRAFT_RECORD_KEY),
    );
    return parseDraftStorageRecord(value);
  } finally {
    database.close();
  }
}

export async function saveDraftSnapshot(
  snapshot: DraftStorageSnapshot,
): Promise<void> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    transaction.objectStore(DRAFT_STORE_NAME).put(
      createDraftStorageRecord(snapshot),
      DRAFT_RECORD_KEY,
    );
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}

export async function clearDraftSnapshot(): Promise<void> {
  const database = await openDraftDatabase();
  try {
    const transaction = database.transaction(DRAFT_STORE_NAME, "readwrite");
    transaction.objectStore(DRAFT_STORE_NAME).delete(DRAFT_RECORD_KEY);
    await transactionComplete(transaction);
  } finally {
    database.close();
  }
}
