import { test, expect, type Page } from "@playwright/test";
async function visualEvidence(page: Page, name: string) {
  const shot = await page.screenshot({ type: "jpeg", quality: 60 });
  console.log(`VISUAL_EVIDENCE:${name}:${shot.toString("base64")}`);
}
async function go(page: Page, name: string) {
  await page.getByRole("button", { name: "Places", exact: false }).click();
  await page.getByRole("button", { name: new RegExp(name) }).click();
}
async function dismiss(page: Page) {
  await page.getByRole("button", { name: "Close panel" }).click();
}
async function battle(page: Page) {
  for (let i = 0; i < 30; i++) {
    if (
      !(await page
        .getByRole("region", { name: "Combat", exact: true })
        .isVisible())
    )
      return;
    const danger = await page.locator(".intent").innerText();
    const pulse = page.getByRole("button", { name: /Coil pulse/ });
    const btn = danger.includes("incoming")
      ? page.getByRole("button", { name: /^Guard/ })
      : (await pulse.isEnabled())
        ? pulse
        : page.getByRole("button", { name: /^Strike/ });
    await expect(btn).toBeEnabled();
    await btn.click();
    await page.waitForTimeout(550);
  }
  throw new Error("Combat did not finish");
}
test("walk, fight, upgrade, equip armour, choose ending and resume", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => {
    errors.push(e.message);
    console.log("PAGE ERROR:", e.message);
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Ironclad" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-street.png`,
  });
  if (info.project.name === "phone") await visualEvidence(page, "street");
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await dismiss(page);
  await go(page, "Supply cache");
  await expect(page.getByRole("dialog")).toBeVisible();
  await dismiss(page);
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(
    page.getByRole("region", { name: "Combat", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  // Reload during an encounter: the exact turn and enemy health must survive.
  const encounter = await page.locator(".combat-heading").innerText();
  await page.reload();
  await page.getByRole("button", { name: "Continue your journey" }).click();
  await expect(page.locator(".combat-heading")).toHaveText(encounter, {
    useInnerText: true,
  });
  await battle(page);
  await expect(
    page.getByRole("heading", { name: "Make it yours" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(
    page.getByRole("button", { name: /Fit Ironbound Coil/ }),
  ).toBeEnabled({ timeout: 15000 });
  await page.getByRole("button", { name: /Fit Ironbound Coil/ }).click();
  await expect(
    page.getByRole("button", { name: /Coil fitted/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: /Reinforce field coat/ }).click();
  await expect(
    page.getByRole("button", { name: /Armour fitted/ }),
  ).toBeDisabled();
  await dismiss(page);
  await go(page, "Signal relay");
  await expect(page.getByRole("dialog")).toBeVisible();
  await dismiss(page);
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(
    page.getByRole("region", { name: "Combat", exact: true }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.locator(".combat-heading")).toContainText("LOCKDOWN");
  await page.screenshot({
    path: `test-results/${info.project.name}-combat.png`,
  });
  if (info.project.name === "phone") await visualEvidence(page, "combat");
  await page.getByRole("button", { name: /^Coil pulse/ }).click();
  await expect(page.locator(".intent")).toContainText("Cannon wind-up");
  await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(page.locator(".intent")).toContainText("Heavy shot");
  await page.getByRole("button", { name: /^Coil pulse/ }).click();
  await expect(page.locator(".combat-foot")).toContainText(
    "CANNON INTERRUPTED",
  );
  await expect(page.locator(".combat-heading")).toContainText("OVERDRIVE");
  await battle(page);
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(
    page.getByRole("button", { name: /Broadcast the names/ }),
  ).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: /Broadcast the names/ }).click();
  await expect(
    page.getByRole("heading", { name: "The city heard you." }),
  ).toBeVisible();
  await dismiss(page);
  await page.getByRole("button", { name: /Loadout/ }).click();
  await expect(
    page.getByRole("heading", { name: "Ironbound rifle" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-loadout.png`,
  });
  if (info.project.name === "phone") await visualEvidence(page, "loadout");
  await dismiss(page);
  // The installed app bundles these resources. A web browser still requires its host.
  await page.reload();
  await page.getByRole("button", { name: "Continue your journey" }).click();
  await expect(
    page.getByRole("heading", { name: "A road of your own" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test.afterEach(async ({ page }, info) => {
  if (info.status !== info.expectedStatus) {
    await visualEvidence(page, info.project.name + "-failure");
    console.log("GAME DIAGNOSTIC", await page.locator("body").innerText());
    console.log(
      "SAVE DIAGNOSTIC",
      await page.evaluate(() => JSON.stringify(localStorage)),
    );
  }
});

test("travel waits for scene loading instead of losing the first tap", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/scene-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Ironclad" }).click();
  try {
    await expect(
      page.getByRole("button", { name: "Continue journey" }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /Places/ })).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: "Continue journey" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Continue journey" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
