import { expect, test } from "@playwright/test";

const CORE_ROUTES = [
  ["/", "Ibrahim Hussain"],
  ["/projects", "Everything I have built, in one place."],
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

test("Security Checkup analyzes locally and explains the result", async ({ page }) => {
  await page.goto("/labs/security-checkup");
  await page.getByLabel("Test a password").fill("Summer2024!");
  await expect(page.getByText("72.3 bits", { exact: true })).toBeVisible();
  await expect(page.getByText("18.4 centuries", { exact: true })).toBeVisible();
  await expect(page.getByText("Bytes sent — analysis is 100% local", { exact: true })).toBeVisible();
});

test("SOC Command Deck responds to analyst actions", async ({ page }) => {
  await page.goto("/labs/soc-command-deck");
  const triagedLabel = page.getByText("Triaged", { exact: true });
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
