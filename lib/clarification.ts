import { themePresetIds } from "@/lib/themes";

export type QuestionId =
  | "problem"
  | "audience"
  | "platform"
  | "browsers"
  | "mobile-os"
  | "core-flow"
  | "scope"
  | "out-of-scope"
  | "privacy"
  | "auth"
  | "roles"
  | "output-language"
  | "theme"
  | "constraints";
export type Answers = Partial<Record<QuestionId, string>>;
export type Question = {
  id: QuestionId;
  title: string;
  help: string;
  options?: readonly string[];
  optional?: boolean;
  minLength?: number;
};

const questions: readonly Question[] = [
  {
    id: "problem",
    title: "What problem should this solve?",
    help: "Describe what is difficult today and why a better solution matters.",
  },
  {
    id: "audience",
    title: "Who needs this most?",
    help: "Describe your first users, their situation, and what they use today.",
  },
  {
    id: "platform",
    title: "Where will people use it?",
    help: "This determines which platform details we ask next.",
    options: ["Web", "Mobile", "Both"],
  },
  {
    id: "browsers",
    title: "Which browsers should it support?",
    help: "Name the browsers, devices, or accessibility needs that matter. If undecided, describe your likely users' devices.",
  },
  {
    id: "mobile-os",
    title: "Which mobile operating systems?",
    help: "Choose the platforms your first release needs to support.",
    options: ["iOS", "Android", "iOS and Android"],
  },
  {
    id: "core-flow",
    title: "What is the main journey?",
    help: "Walk through the most important task, from the first action to a successful result.",
  },
  {
    id: "scope",
    title: "What belongs in the first release?",
    help: "List the essential capabilities. Focus on what users must be able to do.",
  },
  {
    id: "out-of-scope",
    title: "What can wait?",
    help: "Name features or use cases you explicitly do not want in the first release.",
  },
  {
    id: "privacy",
    title: "What data needs care?",
    help: "Describe the data collected, who may access it, and any retention or privacy needs. Describe categories, not real secrets or personal records.",
  },
  {
    id: "auth",
    title: "How should access work?",
    help: "Choose whether people need accounts and different permissions.",
    options: ["No sign-in", "One account type", "Multiple roles"],
  },
  {
    id: "roles",
    title: "Who can do what?",
    help: "Name each role and its permissions, including what it must not access.",
  },
  {
    id: "output-language",
    title: "What language should the documents use?",
    help: "Name any language or write 'match my input'. AnyMD preserves Unicode text exactly.",
    minLength: 2,
  },
  {
    id: "theme",
    title: "Which visual direction fits the product?",
    help: "Choose one curated font and color system for the generated project.",
    options: themePresetIds,
  },
  {
    id: "constraints",
    title: "Anything else to work around?",
    help: "Optional: integrations, deadlines, budgets, performance needs, or technical constraints. Leave blank if none are known.",
    optional: true,
  },
];

export function visibleQuestions(answers: Answers): readonly Question[] {
  return questions.filter(({ id }) =>
    id === "browsers"
      ? answers.platform === "Web" || answers.platform === "Both"
      : id === "mobile-os"
        ? answers.platform === "Mobile" || answers.platform === "Both"
        : id === "roles"
          ? answers.auth === "Multiple roles"
          : true,
  );
}

export function validateAnswer(question: Question, value = ""): string | null {
  if (question.options)
    return question.options.includes(value)
      ? null
      : "Choose one of the available options.";
  const length = Array.from(value.trim()).length;
  if (question.optional && length === 0) return null;
  const minimum = question.minLength ?? 10;
  if (length < minimum)
    return `Add at least ${minimum} characters so the detail is useful.`;
  if (length > 2000) return "Keep this answer to 2,000 characters or fewer.";
  return null;
}

export type Clarification = {
  answers: Answers;
  completed: QuestionId[];
  current: QuestionId | "review";
};
export function emptyClarification(): Clarification {
  return { answers: {}, completed: [], current: "problem" };
}

export function updateAnswer(
  state: Clarification,
  id: QuestionId,
  value: string,
): Clarification {
  const answers = { ...state.answers, [id]: value };
  const visible = new Set(
    visibleQuestions(answers).map((question) => question.id),
  );
  for (const key of Object.keys(answers) as QuestionId[]) {
    if (!visible.has(key)) delete answers[key];
  }
  return {
    ...state,
    answers,
    completed: state.completed.filter((key) => key !== id && visible.has(key)),
  };
}

export function clarificationForIdea(
  previous: string,
  next: string,
  state: Clarification,
): Clarification {
  // Ignore whitespace-only edits, but never reuse answers for changed idea content.
  const normalize = (idea: string) => idea.trim().replace(/\s+/gu, " ");
  return normalize(previous) === normalize(next) ? state : emptyClarification();
}

export function completedQuestions(state: Clarification): number {
  return visibleQuestions(state.answers).filter(
    (question) =>
      state.completed.includes(question.id) &&
      !validateAnswer(question, state.answers[question.id]),
  ).length;
}

export function clarificationProgress(state: Clarification): number {
  const total = visibleQuestions(state.answers).length;
  const completed = completedQuestions(state);
  return Math.round(
    ((completed + (state.current === "review" && completed === total ? 1 : 0)) /
      (total + 1)) *
      100,
  );
}
