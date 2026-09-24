import assert from "node:assert/strict";
import test from "node:test";
import {
  clarificationForIdea,
  clarificationProgress,
  completedQuestions,
  emptyClarification,
  updateAnswer,
  validateAnswer,
  visibleQuestions,
  type Clarification,
} from "../lib/clarification";

test("language and visual direction join the core questions with stable IDs", () => {
  assert.equal(visibleQuestions({}).length, 14);
  const web = visibleQuestions({ platform: "Web" }).map((q) => q.id);
  assert.ok(web.includes("browsers"));
  assert.ok(!web.includes("mobile-os"));
  const mobile = visibleQuestions({ platform: "Mobile" }).map((q) => q.id);
  assert.ok(mobile.includes("mobile-os"));
  assert.ok(!mobile.includes("browsers"));
  const both = visibleQuestions({ platform: "Both", auth: "Multiple roles" });
  assert.equal(both.length, 17);
  assert.equal(new Set(both.map((q) => q.id)).size, both.length);
  assert.deepEqual(
    both.map((q) => q.id),
    [
      "product-type",
      "scale",
      "stack-mode",
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
    ],
  );
});

test("accepts any named document language and only approved theme IDs", () => {
  const questions = visibleQuestions({});
  const language = questions.find((q) => q.id === "output-language")!;
  const theme = questions.find((q) => q.id === "theme")!;

  assert.equal(validateAnswer(language, "日本語"), null);
  assert.equal(validateAnswer(language, "العربية"), null);
  assert.ok(validateAnswer(language, ""));
  assert.equal(validateAnswer(theme, "precision-blue"), null);
  assert.ok(validateAnswer(theme, "apple"));
});

test("text validation trims and counts Unicode code points at boundaries", () => {
  const question = visibleQuestions({}).find(({ id }) => id === "problem")!;
  assert.ok(validateAnswer(question, "   "));
  assert.ok(validateAnswer(question, "😀".repeat(9)));
  assert.equal(validateAnswer(question, `  ${"😀".repeat(10)}  `), null);
  assert.equal(validateAnswer(question, "a".repeat(2000)), null);
  assert.ok(validateAnswer(question, "a".repeat(2001)));
});

test("optional blank is valid; nonblank text and choices must be valid", () => {
  const questions = visibleQuestions({ platform: "Mobile" });
  const optional = questions.find((q) => q.id === "constraints")!;
  assert.equal(validateAnswer(optional, "  "), null);
  assert.ok(validateAnswer(optional, "short"));
  for (const question of questions.filter((q) => q.options)) {
    assert.ok(validateAnswer(question));
    assert.ok(validateAnswer(question, "invalid"));
    for (const option of question.options!)
      assert.equal(validateAnswer(question, option), null);
  }
});

test("changing platform removes hidden answers and completion, never resurrecting them", () => {
  const initial: Clarification = {
    answers: {
      platform: "Both",
      browsers: "Chrome and Safari",
      "mobile-os": "iOS",
      problem: "A real problem",
    },
    completed: ["platform", "browsers", "mobile-os", "problem"],
    current: "platform",
  };
  const web = updateAnswer(initial, "platform", "Web");
  assert.equal(web.answers["mobile-os"], undefined);
  assert.deepEqual(web.completed, ["browsers", "problem"]);
  assert.equal(web.answers.browsers, "Chrome and Safari");
  const mobile = updateAnswer(web, "platform", "Mobile");
  assert.equal(mobile.answers.browsers, undefined);
  assert.equal(mobile.answers["mobile-os"], undefined);
  assert.equal(
    updateAnswer(mobile, "platform", "Both").answers.browsers,
    undefined,
  );
  assert.equal(initial.answers["mobile-os"], "iOS");
});

test("changing auth prunes role details and their completion", () => {
  const state: Clarification = {
    answers: { auth: "Multiple roles", roles: "Owners manage, readers view" },
    completed: ["auth", "roles"],
    current: "auth",
  };
  for (const auth of ["No sign-in", "One account type"]) {
    const result = updateAnswer(state, "auth", auth);
    assert.equal(result.answers.roles, undefined);
    assert.deepEqual(result.completed, []);
    assert.equal(
      updateAnswer(result, "auth", "Multiple roles").answers.roles,
      undefined,
    );
  }
});

test("progress only counts committed valid answers, including explicit optional skips", () => {
  const state = emptyClarification();
  assert.equal(clarificationProgress(state), 0);
  state.answers.problem = "This is a complete answer";
  assert.equal(completedQuestions(state), 0);
  state.completed.push("problem");
  assert.equal(completedQuestions(state), 1);
  state.answers.problem = "short";
  assert.equal(completedQuestions(state), 0);
  state.completed.push("constraints");
  assert.equal(completedQuestions(state), 1);
});

test("progress cannot reach 100 before review and updates after invalidation/branch changes", () => {
  let state = emptyClarification();
  state.answers = { platform: "Web", auth: "No sign-in" };
  for (const q of visibleQuestions(state.answers)) {
    state.answers[q.id] = q.options
      ? (state.answers[q.id] ?? q.options[0])
      : q.optional
        ? ""
        : "A useful answer for this question";
    state.completed.push(q.id);
  }
  assert.ok(clarificationProgress(state) < 100);
  state.current = "review";
  assert.equal(clarificationProgress(state), 100);
  state = updateAnswer(state, "platform", "Both");
  assert.ok(clarificationProgress(state) < 100);
  assert.equal(state.completed.includes("platform"), false);
});

test("resubmitting a changed idea clears clarifications but whitespace edits retain them", () => {
  const state: Clarification = {
    answers: { problem: "Keep bookings together" },
    completed: ["problem"],
    current: "audience",
  };
  assert.equal(
    clarificationForIdea("A booking app", "  A  booking\napp  ", state),
    state,
  );
  assert.deepEqual(
    clarificationForIdea("A booking app", "A recipe sharing app", state),
    emptyClarification(),
  );
});
