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

test("Continuum Engine hydrates its field and responds to controls", async ({
  page,
}) => {
  await page.goto("/creative/continuum-engine");

  const canvas = page.getByRole("img", {
    name: "Interactive generative topology field with flowing luminous particles",
  });
  await expect(canvas).toBeVisible();
  await expect
    .poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).width))
    .toBeGreaterThan(300);

  await page.getByRole("button", { name: "New universe" }).click();
  await expect(page.getByText("gen 02")).toBeVisible();

  await page.getByRole("button", { name: "Freeze time" }).click();
  await expect(page.getByRole("button", { name: "Step frame" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Resume time" })).toBeVisible();
});

test("Digital Biosphere evolves and responds to ecological controls", async ({
  page,
}) => {
  await page.goto("/creative/digital-biosphere");

  const canvas = page.getByRole("img", {
    name: "Autonomous digital biosphere with evolving organisms and resources",
  });
  await expect(canvas).toBeVisible();
  await expect
    .poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).width))
    .toBeGreaterThan(300);

  await page.getByRole("button", { name: "New ecosystem" }).click();
  await expect(page.getByText("epoch 2")).toBeVisible();

  await page.getByRole("button", { name: "Pause life" }).click();
  await expect(page.getByRole("button", { name: "Resume life" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nutrient rain" })).toBeEnabled();
});

test("Aegis Home explains and responds to synthetic RF anomalies", async ({
  page,
}) => {
  await page.goto("/labs/aegis-home");

  await expect(
    page.getByRole("heading", { level: 1, name: /AEGIS.*HOME/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", {
      name: "Interactive floor plan showing synthetic wireless signals",
    }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Unknown signal arrives" }).click();
  await expect(page.getByText("Unknown BLE signal entered")).toBeVisible();
  await expect(page.getByText("Review suggested")).toBeVisible();

  await page.getByRole("button", { name: "Room baseline changes" }).click();
  await expect(
    page.getByRole("tab", { name: "Room-change map" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText("Room baseline changed")).toBeVisible();

  const beforeInspection = page.url();
  await page.getByRole("button", { name: "Inspect Work laptop" }).click();
  await expect(page.getByText("Work laptop", { exact: true })).toHaveCount(2);
  expect(page.url()).toBe(beforeInspection);

  await page
    .getByLabel("Import authorized telemetry JSON")
    .setInputFiles({
      name: "authorized-home.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        JSON.stringify([
          {
            label: "Owned office beacon",
            kind: "ble",
            state: "trusted",
            zone: "office",
            x: 18,
            y: 65,
            rssi: -48,
            confidence: 95,
          },
        ]),
      ),
    });
  await expect(
    page.getByText(/1 authorized records loaded locally/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Inspect Owned office beacon" }),
  ).toBeVisible();
});

test("Agent Foundry builds, retrieves, refuses, and exports a grounded agent", async ({
  page,
}) => {
  await page.goto("/labs/agent-foundry");

  await expect(
    page.getByRole("heading", { level: 1, name: /AGENT.*FOUNDRY/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Run grounded agent" }).click();
  await expect(
    page.getByRole("region", { name: "Grounded response" }),
  ).toContainText("incident commander");
  await expect(page.getByText("Match 1", { exact: false })).toBeVisible();

  await page
    .getByLabel("Question for the agent")
    .fill("What is the office lunch menu?");
  await page.getByRole("button", { name: "Run grounded agent" }).click();
  await expect(
    page.getByRole("region", { name: "Grounded response" }),
  ).toContainText("could not find enough support");
});
