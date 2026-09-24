import { expect, test, type Page } from "@playwright/test";
import { generateDocuments, parseGenerateRequest } from "../lib/generator";

test.setTimeout(60_000);

async function mockDocumentGeneration(page: Page) {
  let generationInput: ReturnType<typeof parseGenerateRequest> | null = null;
  await page.route("**/api/generate", async (route) => {
    const input = parseGenerateRequest(route.request().postDataJSON());
    generationInput = input;
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({
        job: { id: "job-e2e", status: "queued" },
        billing: "free",
      }),
    });
  });
  await page.route("**/api/generate/job-e2e", async (route) => {
    if (!generationInput) throw new Error("Generation input was not captured");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        job: {
          id: "job-e2e",
          status: "succeeded",
          result: generateDocuments(
            generationInput,
            [],
            "2026-09-18T12:00:00.000Z",
          ),
        },
      }),
    });
  });
  await page.route("**/api/generate/rebuild", async (route) => {
    const payload = route.request().postDataJSON() as { bundle: unknown };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(payload.bundle),
    });
  });
}

async function reachSkills(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const declineAnalytics = page.getByRole("button", { name: "Tidak sekarang" });
  if (await declineAnalytics.isVisible().catch(() => false)) {
    await declineAnalytics.click();
  }
  await page
    .getByLabel("Describe your product idea")
    .fill(
      "A client portal for independent designers to share milestones, collect feedback, and record approvals.",
    );
  await page.getByRole("button", { name: "Continue to clarification" }).click();
  await expect(page).toHaveURL(/\/clarify$/);

  for (let step = 0; step < 24; step += 1) {
    if (
      await page
        .getByRole("heading", { name: "Review your brief." })
        .isVisible()
        .catch(() => false)
    )
      break;
    const stackHeading = page.getByRole("heading", {
      name: /Here is a considered starting stack\.|Choose the tools behind it\./,
    });
    if (await stackHeading.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Continue to questions" }).click();
      continue;
    }
    const radio = page.getByRole("radio").first();
    if (await radio.isVisible().catch(() => false)) await radio.click();
    else {
      const answer = page.locator(".clarify-stage textarea");
      if (await answer.isVisible())
        await answer.fill(
          "Projects, milestones, feedback, files, and approvals need a clear shared record.",
        );
    }
    const review = page.getByRole("button", {
      name: "Review answers",
      exact: true,
    });
    if (await review.isVisible().catch(() => false)) await review.click();
    else await page.getByRole("button", { name: "Next", exact: true }).click();
  }

  await page.getByRole("button", { name: "Review recommended skills" }).click();
  await expect(page).toHaveURL(/\/skills$/);
}

test("Phase 4 generates template documents without responsive overflow", async ({
  page,
}, testInfo) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await mockDocumentGeneration(page);
  await reachSkills(page);
  await page
    .getByRole("button", { name: "Continue with recommendations" })
    .click();
  await page.getByRole("button", { name: "Generate documents" }).click();

  await expect(page).toHaveURL(/\/generate$/);
  await expect(
    page.getByRole("heading", { name: "Your product brief, assembled." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "prd.md", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "AGENTS.md" })).toBeVisible();
  await expect(page.getByRole("button", { name: "SESSION.md" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Product Overview" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Raw Markdown" }).click();
  await expect(page.locator(".document-raw")).toContainText("#");
  await page.getByRole("button", { name: "Copy prd.md" }).click();
  await expect(page.getByRole("status")).toContainText("Copied prd.md");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "#",
  );
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download prd.md" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("prd.md");
  await page.getByRole("button", { name: "Sections" }).click();
  const initializationPrompt = page
    .locator(".document-section")
    .filter({
      has: page.getByRole("heading", { name: "Prompt Inisiasi untuk Agent" }),
    });
  await initializationPrompt
    .getByRole("button", { name: "Copy initialization prompt" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Copied initialization prompt",
  );
  expect(
    (await page.evaluate(() => navigator.clipboard.readText())).replace(
      /\r\n/g,
      "\n",
    ),
  ).toBe(await initializationPrompt.locator("pre").textContent());

  await page.getByRole("button", { name: "AGENTS.md" }).click();
  await expect(
    page.getByRole("heading", { name: "Responsive and accessibility rules" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "SESSION.md" }).click();
  await expect(page.getByRole("heading", { name: "SESSION.md" })).toBeVisible();
  await expect(page.locator(".document-markdown")).toContainText("## Current State");

  await page.getByRole("checkbox", { name: "Include Claude Code bridge" }).check();
  await expect(page.getByRole("button", { name: "CLAUDE.md" })).toBeVisible();
  await page.getByRole("button", { name: "CLAUDE.md" }).click();
  await expect(page.locator(".document-markdown")).toContainText("@AGENTS.md");

  await page.getByRole("button", { name: "prd.md" }).click();
  const sectionsBefore = await page.locator(".document-section").allTextContents();
  await page.getByRole("button", { name: "Rebuild Product Overview" }).click();
   await expect(page.getByRole("status")).toContainText("Rebuilt Product Overview", {
     timeout: 15_000,
   });
  await expect.poll(() => page.locator(".document-section").allTextContents()).toEqual(
    sectionsBefore,
  );

  if (testInfo.project.name.includes("mobile"))
    await page.setViewportSize({ width: 320, height: 800 });

  const layout = await page.evaluate(() => ({
    pageOverflow:
      document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cards: Array.from(document.querySelectorAll<HTMLElement>(".document-section")).map(
      (card) => {
        const box = card.getBoundingClientRect();
        return { left: box.left, right: box.right, width: box.width };
      },
    ),
    boundedElements: Array.from(
      document.querySelectorAll<HTMLElement>(
        ".document-toolbar, .document-nav, .document-markdown, .document-summary",
      ),
    ).map((element) => {
      const box = element.getBoundingClientRect();
      return { left: box.left, right: box.right, width: box.width };
    }),
    viewport: window.innerWidth,
  }));
  expect(layout.pageOverflow).toBeLessThanOrEqual(1);
  expect(layout.cards.length).toBeGreaterThan(0);
  for (const card of layout.cards) {
    expect(card.left).toBeGreaterThanOrEqual(-1);
    expect(card.right).toBeLessThanOrEqual(layout.viewport + 1);
    expect(card.width).toBeGreaterThan(0);
  }
  for (const element of layout.boundedElements) {
    expect(element.left).toBeGreaterThanOrEqual(-1);
    expect(element.right).toBeLessThanOrEqual(layout.viewport + 1);
    expect(element.width).toBeGreaterThan(0);
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: testInfo.outputPath("phase-4-documents.png"),
    fullPage: true,
  });
});

test("direct document generation without a draft shows the empty state", async ({
  page,
}) => {
  await page.goto("/generate");
  await expect(
    page.getByRole("heading", { name: "Complete your brief first." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Start with an idea" })).toBeVisible();
});

test("malformed successful generation responses show a recoverable error", async ({
  page,
}) => {
  await reachSkills(page);
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        generatorVersion: 1,
        generatedAt: "not-a-date",
        documents: [],
      }),
    }),
  );
  await page
    .getByRole("button", { name: "Continue with recommendations" })
    .click();
  await page.getByRole("button", { name: "Generate documents" }).click();

  await expect(
    page.getByRole("heading", { name: "The documents could not be assembled." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("an empty recommendation set remains valid", async ({
  page,
}) => {
  await mockDocumentGeneration(page);
  await page.route("**/api/skills", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], meta: { source: "snapshot" } }),
    }),
  );
  await reachSkills(page);
  await expect(page.getByText("0 recommended", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Continue with recommendations" })
    .click();
  await page.getByRole("button", { name: "Generate documents" }).click();

  await expect(
    page.getByRole("button", { name: "prd.md", exact: true }),
  ).toBeVisible();
});

test("a terminal queue failure exposes a retryable recovery state", async ({
  page,
}) => {
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ job: { id: "job-failed", status: "queued" } }),
    }),
  );
  await page.route("**/api/generate/job-failed", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        job: { id: "job-failed", status: "failed", errorCode: "REQUEST_FAILED" },
      }),
    }),
  );
  await reachSkills(page);
  await page.getByRole("button", { name: "Continue with recommendations" }).click();
  await page.getByRole("button", { name: "Generate documents" }).click();

  await expect(
    page.getByRole("heading", { name: "The documents could not be assembled." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
});

test("an exhausted quota exposes the token purchase recovery state", async ({
  page,
}) => {
  await page.route("**/api/generate", (route) =>
    route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          code: "QUOTA_EXHAUSTED",
          message: "Your free generation is used and your token balance is empty.",
        },
      }),
    }),
  );
  await reachSkills(page);
  await page.getByRole("button", { name: "Continue with recommendations" }).click();
  await page.getByRole("button", { name: "Generate documents" }).click();

  await expect(
    page.getByRole("heading", { name: "Your free generation is used." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Buy tokens" })).toHaveAttribute(
    "href",
    "/pricing",
  );
});
