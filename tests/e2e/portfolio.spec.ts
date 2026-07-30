import { expect, test } from "@playwright/test";

const CORE_ROUTES = [
  ["/", "Ibrahim Hussain"],
  ["/projects", "Systems I've shipped, simulated, and delivered."],
  ["/creative", "Ideas you can operate, not just observe."],
  ["/creative/cabinetry-studio", "Cabinetry Studio"],
  ["/creative/sentinel-observatory", "Threat globe"],
  ["/creative/verdant", "Plant a forest"],
  ["/creative/lumen-city", "Keep the lights on"],
] as const;

test("core portfolio routes render without horizontal overflow", async ({ page }) => {
  for (const [route, heading] of CORE_ROUTES) {
    const response = await page.goto(route);
    expect(response?.ok(), `${route} should return a successful response`).toBe(true);
    await expect(
      page.getByRole("heading", { name: heading, exact: true, level: 1 }),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${route} should not overflow horizontally`).toBeLessThanOrEqual(1);
  }
});

test("the primary navigation remains usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ibrahim Hussain", exact: true, level: 1 }),
  ).toBeVisible();

  const navigation = page.getByRole("navigation").first();
  await expect(navigation).toBeVisible();

  const links = navigation.getByRole("link");
  await expect(links).toHaveCount(4);

  for (const link of await links.all()) {
    const bounds = await link.boundingBox();
    expect(
      bounds,
      "each primary navigation link should have layout bounds",
    ).not.toBeNull();
    if (!bounds) {
      continue;
    }
    expect(
      bounds.height,
      "each primary navigation target should be at least 44px tall",
    ).toBeGreaterThanOrEqual(44);
    expect(
      bounds.x,
      "navigation targets should remain inside the left viewport edge",
    ).toBeGreaterThanOrEqual(0);
    expect(
      bounds.x + bounds.width,
      "navigation targets should remain inside the right viewport edge",
    ).toBeLessThanOrEqual(320);
  }

  await expect(
    navigation.getByRole("link", { name: "Home", exact: true }),
  ).toHaveAttribute("aria-current", "page");

  await navigation.getByRole("link", { name: "Creative", exact: true }).click();
  await expect(page).toHaveURL(/\/creative$/);
  await expect(
    page.getByRole("navigation").first().getByRole("link", {
      name: "Creative",
      exact: true,
    }),
  ).toHaveAttribute("aria-current", "page");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "the Creative route should fit a 320px viewport").toBeLessThanOrEqual(1);
});

test("Creative filters expose the intended project groups", async ({ page }) => {
  await page.goto("/creative");

  const filters = page.getByRole("group", { name: "Filter creative projects" });
  const projectLinks = page.locator('main a[href^="/creative/"]');

  await expect(projectLinks).toHaveCount(10);
  await filters
    .getByRole("button", { name: "Spatial & fabrication", exact: true })
    .click();
  await expect(projectLinks).toHaveCount(4);
  await expect(
    page.getByRole("link", { name: /Cabinetry Studio/ }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /Panel Studio/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Wardrobe Atelier/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Wood Object Index/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Apex Hypercars/ })).toHaveCount(0);

  await filters.getByRole("button", { name: "Automotive", exact: true }).click();
  await expect(projectLinks).toHaveCount(1);
  await expect(page.getByRole("link", { name: /Apex Hypercars/ })).toBeVisible();
  await expect(
    filters.getByRole("button", { name: "Automotive", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("Creative project navigation advances to the next project", async ({ page }) => {
  await page.goto("/creative/cabinetry-studio");

  const continuation = page.getByRole("navigation", {
    name: "Continue through creative projects",
  });
  const nextProject = continuation.getByRole("link", {
    name: /Next project.*Panel Studio/,
  });

  await expect(nextProject).toHaveAttribute("href", "/creative/panel-studio");
  await nextProject.click();
  await expect(page).toHaveURL(/\/creative\/panel-studio$/);
  await expect(
    page.getByRole("heading", { name: "Panel Studio", exact: true, level: 1 }),
  ).toBeVisible();
});

test("the Park export dialog owns focus and closes with Escape", async ({
  page,
}) => {
  await page.goto("/creative/park-operator");

  const trigger = page.getByRole("button", {
    name: "Export expedition",
    exact: true,
  });
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Export expedition" });
  await expect(dialog).toBeVisible();

  const closeButton = dialog.getByRole("button", {
    name: "Close export dialog",
  });
  await expect(closeButton).toBeFocused();
  expect(
    await page.evaluate(() =>
      document
        .querySelector('[role="dialog"]')
        ?.contains(document.activeElement),
    ),
    "focus should remain inside the modal while it is open",
  ).toBe(true);

  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Security Checkup analyzes locally and explains the result", async ({ page }) => {
  await page.goto("/labs/security-checkup");
  await page.getByLabel("Test a password").fill("Summer2024!");
  await expect(page.getByText("72.3 bits", { exact: true })).toBeVisible();
  await expect(page.getByText("18.4 centuries", { exact: true })).toBeVisible();
  await expect(page.getByText("Bytes sent — analysis is 100% local", { exact: true })).toBeVisible();
});

test("SOC Command Deck responds to analyst actions", async ({ page }) => {
  await page.goto("/labs/soc-command-deck");
  const triagedLabel = page.getByText("Triaged", { exact: true }).first();
  const metricCard = triagedLabel.locator("..");
  await expect(metricCard).toContainText("0%");

  const acknowledgements = page.getByRole("button", { name: "Acknowledge", exact: true });
  await acknowledgements.first().click();
  await expect(metricCard).not.toContainText("0%");

  await page.getByRole("button", { name: "Inject attack burst", exact: true }).click();
  await expect(page.getByText("Critical", { exact: true }).first()).toBeVisible();
});

test("the footer theme control remains usable above mobile navigation", async ({
  page,
}) => {
  await page.goto("/about");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
});
