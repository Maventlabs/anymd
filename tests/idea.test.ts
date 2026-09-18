import test from "node:test";
import assert from "node:assert/strict";
import {
  continueDraft,
  stackOptions,
  validateIdea,
  type Draft,
} from "../lib/idea";

test("validates trimmed code points, including Unicode", () => {
  assert.ok(validateIdea(" \n \t "));
  assert.ok(validateIdea("a".repeat(19)));
  assert.equal(validateIdea(" a".trim().repeat(20)), null);
  assert.equal(validateIdea("  " + "😀".repeat(20) + "  "), null);
  assert.equal(validateIdea("界".repeat(5000)), null);
  assert.ok(validateIdea("界".repeat(5001)));
});
test("handoff retains idea and all six preferences without mutating the draft", () => {
  const stack = Object.fromEntries(
    Object.entries(stackOptions).map(([key, options]) => [key, options[0]]),
  );
  const draft: Draft = {
    idea: "  A multilingual portal for independent teachers.  ",
    stack,
    selectedSkillIds: ["test-driven-development"],
    step: "idea",
  };
  const next = continueDraft(draft);
  assert.equal(next.step, "clarification");
  assert.equal(next.idea, draft.idea.trim());
  assert.deepEqual(next.stack, stack);
  assert.deepEqual(next.selectedSkillIds, ["test-driven-development"]);
  assert.equal(draft.step, "idea");
  const back: Draft = { ...next, step: "idea" };
  assert.equal(continueDraft(back).idea, next.idea);
  assert.deepEqual(continueDraft(back).stack, next.stack);
});
test("invalid input stays at the idea step and no preferences are required", () => {
  const draft: Draft = {
    idea: "Too short",
    stack: {},
    selectedSkillIds: [],
    step: "idea",
  };
  assert.equal(continueDraft(draft), draft);
  assert.equal(
    continueDraft({
      ...draft,
      idea: "An app for keeping family recipes together.",
    }).step,
    "clarification",
  );
});
