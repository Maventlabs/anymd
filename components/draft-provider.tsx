"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { continueDraft, type Draft } from "@/lib/idea";
import {
  clarificationForIdea,
  emptyClarification,
  type Clarification,
} from "@/lib/clarification";
import {
  clearDraftSnapshot,
  loadDraftSnapshot,
  saveDraftSnapshot,
} from "@/lib/draft-storage";

type DraftContextValue = {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  clarification: Clarification;
  setClarification: Dispatch<SetStateAction<Clarification>>;
  submitIdea: () => void;
  resetDraft: () => void;
};
const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<Draft>({
    idea: "",
    stack: {},
    selectedSkillIds: [],
    step: "idea",
  });
  const [submittedIdea, setSubmittedIdeaState] = useState("");
  const [clarification, setClarificationState] =
    useState(emptyClarification);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(true);
  const localChangeRef = useRef(false);
  const storageOperationRef = useRef<Promise<void>>(Promise.resolve());

  function enqueueStorageOperation(operation: () => Promise<void>) {
    const next = storageOperationRef.current.then(
      () => operation(),
      (reason: unknown) => {
        console.warn("AnyMD recovered from a local draft storage error.", reason);
        return operation();
      },
    );
    storageOperationRef.current = next;
    return next;
  }

  useEffect(() => {
    let active = true;
    void loadDraftSnapshot()
      .then((snapshot) => {
        if (!active) return;
        if (snapshot && !localChangeRef.current) {
          setDraftState(snapshot.draft);
          setClarificationState(snapshot.clarification);
          setSubmittedIdeaState(snapshot.submittedIdea);
        }
        setHydrated(true);
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setPersistenceEnabled(false);
        setHydrated(true);
        console.warn(
          "AnyMD draft persistence is unavailable; continuing in memory.",
          reason,
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !persistenceEnabled) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      const snapshot = { draft, clarification, submittedIdea };
      const hasContent =
        snapshot.draft.idea.trim().length > 0 ||
        Object.keys(snapshot.draft.stack).length > 0 ||
        snapshot.draft.selectedSkillIds.length > 0 ||
        Object.keys(snapshot.clarification.answers).length > 0 ||
        snapshot.clarification.completed.length > 0 ||
        snapshot.submittedIdea.length > 0;
      void enqueueStorageOperation(() =>
        hasContent ? saveDraftSnapshot(snapshot) : clearDraftSnapshot(),
      ).catch((reason: unknown) => {
        if (!active) return;
        setPersistenceEnabled(false);
        console.warn(
          "AnyMD draft persistence failed; continuing in memory.",
          reason,
        );
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [clarification, draft, hydrated, persistenceEnabled, submittedIdea]);

  const setDraft: Dispatch<SetStateAction<Draft>> = (next) => {
    localChangeRef.current = true;
    setDraftState(next);
  };
  const setClarification: Dispatch<SetStateAction<Clarification>> = (next) => {
    localChangeRef.current = true;
    setClarificationState(next);
  };

  function submitIdea() {
    const next = continueDraft(draft);
    setClarification((state) =>
      clarificationForIdea(submittedIdea, next.idea, state),
    );
    setSubmittedIdeaState(next.idea);
    setDraft(next);
  }

  function resetDraft() {
    localChangeRef.current = true;
    setDraftState({ idea: "", stack: {}, selectedSkillIds: [], step: "idea" });
    setClarificationState(emptyClarification());
    setSubmittedIdeaState("");
    if (!persistenceEnabled) return;
    void enqueueStorageOperation(() => clearDraftSnapshot()).catch((reason: unknown) => {
      setPersistenceEnabled(false);
      console.warn("AnyMD could not clear the local draft.", reason);
    });
  }

  return (
    <DraftContext
      value={{
        draft,
        setDraft,
        clarification,
        setClarification,
        submitIdea,
        resetDraft,
      }}
    >
      {children}
    </DraftContext>
  );
}

export function useDraft() {
  const context = useContext(DraftContext);
  if (!context) throw new Error("useDraft requires DraftProvider");
  return context;
}
