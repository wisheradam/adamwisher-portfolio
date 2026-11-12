import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
const routes = [
  "/",
  "/work",
  "/about",
  "/education",
  "/contact",
  "/projects/login",
  "/work/single-source-of-truth",
  "/work/check2go",
  "/work/innova-knowledge-base",
  "/work/business-systems-transformation",
  "/work/ai-support-assistant",
  "/work/prescription-medication-marketplace",
];
for (const width of [1440, 390, 320]) {
  test(`public routes and layout at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of routes) {
      const response = await page.goto(route);
      expect(response?.status(), route).toBe(200);
      await expect(page.locator("main h1"), route).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (
        width === 390 &&
        [
          "/work",
          "/about",
          "/education",
          "/contact",
          "/projects/login",
        ].includes(route)
      )
        await page.screenshot({
          path: `/tmp/adam-qa-${route.replaceAll("/", "-")}.png`,
          fullPage: true,
        });
      const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(
        dimensions.content,
        `${route} horizontal overflow at ${width}`,
      ).toBeLessThanOrEqual(dimensions.viewport);
      const a11y = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      expect(
        a11y.violations,
        `${route}: ${JSON.stringify(a11y.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })))}`,
      ).toEqual([]);
    }
  });
  test(`home matches source structure and assets at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("#selected-work .project-card")).toHaveCount(3);
    expect(
      await page
        .locator("#selected-work")
        .evaluate((el) => el.getBoundingClientRect().top),
    ).toBeLessThan(
      await page
        .locator(".ask-adam")
        .evaluate((el) => el.getBoundingClientRect().top),
    );
    expect(
      await page
        .locator(".project-visual img")
        .evaluateAll((images) =>
          images.every(
            (img) =>
              (img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    ).toBe(true);
    await page.getByRole("link", { name: "View selected work" }).click();
    await expect(page).toHaveURL(/#selected-work$/);
    await page.goto("/");
    await page.screenshot({
      path: `docs/review/home-${width}-light.png`,
      fullPage: true,
    });
    if (width === 390)
      await page.screenshot({
        path: "docs/review/liquid-glass-mobile.png",
        fullPage: false,
      });
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveClass("dark");
    await page.reload();
    await expect(page.locator("html")).toHaveClass("dark");
    const a11y = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(a11y.violations).toEqual([]);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({
      path: `docs/review/home-${width}-dark.png`,
      fullPage: true,
    });
  });
}
test("mobile menu traps keyboard focus, Escape restores opener, navigation works", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const opener = page.getByRole("button", { name: "Open navigation" });
  await opener.click();
  const dialog = page.getByRole("dialog", { name: "Navigation" });
  await expect(dialog).toBeVisible();
  for (let n = 0; n < 9; n++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() =>
        document.querySelector("dialog")?.contains(document.activeElement),
      ),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
  await opener.click();
  await dialog.getByRole("link", { name: "Contact" }).click();
  await expect(page).toHaveURL(/\/contact$/);
});
test("Ask Adam supports loading, answer and announced errors without losing API contract", async ({
  page,
}) => {
  await page.goto("/");
  let release: () => void = () => {};
  const pending = new Promise<void>((r) => {
    release = r;
  });
  await page.route("**/api/ask-adam", async (route) => {
    expect(route.request().postDataJSON().question).toBe(
      "Show me his AI experience",
    );
    await pending;
    await route.fulfill({
      json: { answer: "Verified professional experience." },
    });
  });
  await page
    .getByRole("button", { name: "Show me his AI experience", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Send question to Ask Adam" }),
  ).toBeDisabled();
  release();
  await expect(page.getByRole("log")).toContainText(
    "Verified professional experience.",
  );
  await page.unroute("**/api/ask-adam");
  await page.route("**/api/ask-adam", (route) =>
    route.fulfill({
      status: 503,
      json: { error: "Service unavailable. Try again." },
    }),
  );
  await page.locator("#ask-adam-input").fill("Another question");
  await page.getByRole("button", { name: "Send question to Ask Adam" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Service unavailable",
  );
  await expect(page.locator("#ask-adam-input")).toBeFocused();
});
test("contact validates input and preserves consent, failure, success and phone reveal (mocked delivery)", async ({
  page,
}) => {
  await page.goto("/contact");
  await page.getByRole("button", { name: "Send request" }).click();
  expect(
    await page
      .locator('input[name="name"]')
      .evaluate((el) => (el as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.getByLabel("Your name").fill("Review Tester");
  await page.getByLabel("Email address").fill("review@example.com");
  await page
    .getByLabel("Your message")
    .fill("A review-only message. No real email is sent.");
  await page.getByRole("checkbox").check();
  await page.route("**/api/contact", (route) => {
    expect(route.request().postDataJSON().consent).toBe(true);
    return route.fulfill({
      status: 503,
      json: { error: "Please try again later." },
    });
  });
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Please try again later",
  );
  await page.unroute("**/api/contact");
  await page.route("**/api/contact", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.getByRole("button", { name: "Send request" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Your request has been sent",
  );
  await page.route("**/api/contact/phone", (route) =>
    route.fulfill({ json: { phone: "+12025550123" } }),
  );
  await page.getByRole("button", { name: "Show phone number" }).click();
  await expect(page.locator('a[href="tel:+12025550123"]')).toBeVisible();
});
test("education expands curriculum; private projects remain protected", async ({
  page,
}) => {
  await page.goto("/education");
  const details = page.locator("details").first();
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
  await page.goto("/projects");
  await expect(page).toHaveURL(/\/projects\/login$/);
  await expect(page.getByLabel("Access password")).toBeVisible();
  await page.goto("/projects/product-checker");
  await expect(page).toHaveURL(/\/projects\/login$/);
  await page.goto("/learning");
  await expect(page).toHaveURL(/\/education$/);
});

test("intermediate widths, reduced motion, visible focus and real local Ask Adam", async ({
  page,
}) => {
  for (const width of [768, 1024, 1180]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  expect(
    await page
      .locator("html")
      .evaluate((el) => getComputedStyle(el).scrollBehavior),
  ).toBe("auto");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  expect(
    await page
      .getByRole("link", { name: "Skip to content" })
      .evaluate((el) => getComputedStyle(el).outlineStyle),
  ).not.toBe("none");
  await page.locator("#ask-adam-input").fill("Show me Adam's AI experience.");
  await page.getByRole("button", { name: "Send question to Ask Adam" }).click();
  await expect(page.getByRole("log")).toContainText("INNOVA");
});

test("glass controls retain a legible opaque alternative and Inter loads", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() =>
      Array.from(document.fonts).some(
        (font) => font.family.includes("Inter") && font.status === "loaded",
      ),
    ),
  ).toBe(true);
  const action = page.getByRole("link", { name: "View selected work" });
  const before = await action.boundingBox();
  const session = await context.newCDPSession(page);
  await session.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
  });
  expect(
    await action.evaluate((el) => getComputedStyle(el).backdropFilter),
  ).toBe("none");
  await expect(action).toBeVisible();
  expect(await action.boundingBox()).toEqual(before);
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await action.click();
  await expect(page).toHaveURL(/#selected-work$/);
});
