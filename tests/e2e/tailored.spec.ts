import { expect, test } from "@playwright/test";

// The Hermes tailored-resume contract: /?ref=<id> fetches
// /data/<id>.json client-side and swaps in the tailored view.

test("a valid ref renders the tailored view with its evidence sections", async ({
  page,
}) => {
  await page.goto("/?ref=phase5-bc509e");

  await expect(page.getByText(/Tailored for/)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View the full portfolio →" }),
  ).toBeVisible();
  await expect(page.getByText("Highlighted Experience")).toBeVisible();
});

test("an unknown ref falls back to the full homepage with a notice", async ({
  page,
}) => {
  await page.goto("/?ref=e2e-does-not-exist");

  await expect(
    page.getByText(
      "No tailored payload found for ref=e2e-does-not-exist. Showing base profile.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Ibrahim Hussain", exact: true, level: 1 }),
  ).toBeVisible();
});

test("the homepage ships its full content without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Ibrahim Hussain", exact: true, level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Professional Case Studies" }),
  ).toBeVisible();
  await expect(page.getByText("Automated tool tests")).toBeVisible();

  await context.close();
});
