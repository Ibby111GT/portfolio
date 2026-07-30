import { expect, test } from "@playwright/test";

test("case study pages server-render real stat values", async ({ page }) => {
  await page.goto("/work/private-ai-feasibility");

  await expect(
    page.getByRole("heading", { level: 1 }),
  ).toContainText("Private AI");
  await expect(page.getByText("Capstone project at UTDsolv Expo")).toBeVisible();
  await expect(
    page.getByText("Regulatory ceiling designed under"),
  ).toBeVisible();
});

test("unknown slugs return a real HTTP 404", async ({ page }) => {
  for (const path of ["/work/bogus", "/projects/bogus", "/creative/bogus"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
  }
  await expect(page.getByText("404 · route not found")).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Browse projects/ }),
  ).toBeVisible();
});

test("tool pages label the usage section accurately", async ({ page }) => {
  await page.goto("/projects/threatlens");

  await expect(
    page.getByRole("link", { name: /Where this is used/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Where this is used" }),
  ).toBeVisible();
});

test("the last case study ends its collection instead of wrapping", async ({
  page,
}) => {
  await page.goto("/work/roomi-group");

  const rail = page.getByRole("navigation", { name: "Continue exploring" });
  await expect(rail.getByText("Collection complete")).toBeVisible();
  await expect(rail.getByText("Next case study")).toHaveCount(0);
});

test("showcase tabs support the ARIA keyboard pattern", async ({ page }) => {
  await page.goto("/");

  const firstTab = page.getByRole("tab", { name: /Investigate an attack/ });
  await firstTab.focus();
  await expect(firstTab).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("ArrowRight");
  const secondTab = page.getByRole("tab", { name: /Operate critical data/ });
  await expect(secondTab).toBeFocused();
  await expect(secondTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toContainText("Run SentinelStream");

  await page.keyboard.press("End");
  const thirdTab = page.getByRole("tab", { name: /Design resilient systems/ });
  await expect(thirdTab).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Open the feasibility study",
  );
});

test("lab pages carry their catalog accent and section anchors", async ({
  page,
}) => {
  await page.goto("/labs/data-systems/finance");

  await expect(
    page.getByRole("link", { name: "<- All projects" }),
  ).toHaveAttribute("href", "/projects#interactive-labs");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "LedgerPulse",
  );
});
