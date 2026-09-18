"use client";

import {
  createContext,
  useContext,
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

type DraftContextValue = {
  draft: Draft;
  setDraft: Dispatch<SetStateAction<Draft>>;
  clarification: Clarification;
  setClarification: Dispatch<SetStateAction<Clarification>>;
  submitIdea: () => void;
};
const DraftContext = createContext<DraftContextValue | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({
    idea: "",
    stack: {},
    selectedSkillIds: [],
    step: "idea",
  });
  const [submittedIdea, setSubmittedIdea] = useState("");
  const [clarification, setClarification] = useState(emptyClarification);
  function submitIdea() {
    const next = continueDraft(draft);
    setClarification((state) =>
      clarificationForIdea(submittedIdea, next.idea, state),
    );
    setSubmittedIdea(next.idea);
    setDraft(next);
  }
  return (
    <DraftContext
      value={{ draft, setDraft, clarification, setClarification, submitIdea }}
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
