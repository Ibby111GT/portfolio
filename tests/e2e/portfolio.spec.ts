import { expect, test } from "@playwright/test";

const CORE_ROUTES = [
  ["/", "Ibrahim Hussain"],
  ["/projects", "Start simple. Go deep when you're ready."],
  ["/creative", "Four collections. Systems you can play."],
  ["/creative/cabinetry-studio", "Cabinetry Studio"],
  ["/creative/sentinel-observatory", "Sentinel Observatory"],
  ["/creative/verdant", "Verdant"],
  ["/creative/lumen-city", "Lumen City"],
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

test("Creative projects are organized into four clear collections", async ({
  page,
}) => {
  await page.goto("/creative");

  const collections = page.getByRole("navigation", {
    name: "Creative collections",
  });
  const projectLinks = page.locator('main a[href^="/creative/"]');

  await expect(collections.getByRole("link")).toHaveCount(4);
  await expect(projectLinks).toHaveCount(21);
  await expect(page.locator("#design").locator('a[href^="/creative/"]')).toHaveCount(
    5,
  );
  await expect(
    page.locator("#simulations").locator('a[href^="/creative/"]'),
  ).toHaveCount(3);
  await expect(
    page.locator("#generative").locator('a[href^="/creative/"]'),
  ).toHaveCount(8);
  await expect(
    page.locator("#playable").locator('a[href^="/creative/"]'),
  ).toHaveCount(5);
  await expect(page.getByRole("link", { name: /Apex Hypercars/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Lantern Vale/ })).toBeVisible();
});

test("Projects are grouped into three paths and remain searchable", async ({
  page,
}) => {
  await page.goto("/projects");

  const paths = page.getByRole("navigation", { name: "Project collections" });
  await expect(paths.getByRole("link")).toHaveCount(3);
  await expect(
    page.locator("#professional-work").locator('a[href^="/work/"]'),
  ).toHaveCount(4);
  await expect(
    page.locator("#open-source").locator('a[href^="/projects/"]'),
  ).toHaveCount(6);
  await expect(
    page.locator("#interactive-labs").locator('a[href^="/labs/"]'),
  ).toHaveCount(11);

  await page
    .getByPlaceholder(/Search all \d+ entries by project, skill, or outcome/)
    .fill("Python");
  await expect(
    page.locator("#open-source").locator('a[href^="/projects/"]'),
  ).toHaveCount(5);
  await expect(page.locator("#professional-work")).toHaveCount(0);
  await expect(page.locator("#interactive-labs")).toHaveCount(0);
  // Path cards follow the filter: only the surviving group keeps its card.
  await expect(paths.getByRole("link")).toHaveCount(1);
});

test("Creative details separate the quick guide from technical depth", async ({
  page,
}) => {
  await page.goto("/creative/cabinetry-studio");

  await expect(
    page.getByRole("heading", {
      name: "Cabinetry Studio",
      exact: true,
      level: 1,
    }),
  ).toHaveCount(1);
  await expect(page.getByText("Try it in order", { exact: true })).toBeVisible();
  await expect(
    page.getByText("What you are looking at", { exact: true }).first(),
  ).toBeVisible();

  const navigator = page.getByRole("navigation", {
    name: "Choose your depth",
  });
  const technicalLink = navigator.getByRole("link", {
    name: /Technical details/,
  });
  await expect(technicalLink).toHaveAttribute("href", "#technical-details");
  await technicalLink.click();
  await expect(page).toHaveURL(/#technical-details$/);
  await expect(
    page.getByRole("heading", { name: "How the system works.", exact: true }),
  ).toBeVisible();
});

test("Creative project navigation advances to the next project", async ({ page }) => {
  await page.goto("/creative/cabinetry-studio");

  const continuation = page.getByRole("navigation", {
    name: "Continue through creative projects",
  });
  const nextProject = continuation.getByRole("link", {
    name: /Next in this collection.*Panel Studio/,
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
