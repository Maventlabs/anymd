import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/clarify",
  "/skills",
  "/generate",
  "/pricing",
  "/login",
  "/signup",
  "/profile",
];

test("public route shells fit narrow and desktop viewports", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });

    for (const route of routes) {
      await test.step(`${route} at ${width}px`, async () => {
        await page.goto(route);
        await page.locator("main").first().waitFor();

        const overflow = await page.evaluate(() => {
          const offenders = Array.from(document.querySelectorAll<HTMLElement>("body *"))
            .map((element) => ({
              element,
              rect: element.getBoundingClientRect(),
            }))
            .filter(({ element, rect }) => {
              if (rect.width === 0 || (rect.left >= -1 && rect.right <= window.innerWidth + 1)) return false;
              let ancestor = element.parentElement;
              while (ancestor && ancestor !== document.body) {
                const overflowX = getComputedStyle(ancestor).overflowX;
                if (["hidden", "clip", "auto", "scroll"].includes(overflowX)) return false;
                ancestor = ancestor.parentElement;
              }
              return true;
            })
            .sort((left, right) => right.rect.right - left.rect.right)
            .slice(0, 12)
            .map(({ element, rect }) => ({
              tag: element.tagName,
              className: typeof element.className === "string" ? element.className : "",
              id: element.id,
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              overflowX: getComputedStyle(element).overflowX,
            }));

          return {
            document: document.documentElement.scrollWidth - window.innerWidth,
            body: document.body.scrollWidth - window.innerWidth,
            offenders,
          };
        });

        expect(overflow.document, `${route} document overflow: ${JSON.stringify(overflow.offenders)}`).toBeLessThanOrEqual(1);
        expect(overflow.body, `${route} body overflow`).toBeLessThanOrEqual(1);
      });
    }
  }
});
