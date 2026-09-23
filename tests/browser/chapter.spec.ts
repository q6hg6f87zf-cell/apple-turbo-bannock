import { test, expect, type Page } from "@playwright/test";
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
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Enter Ironclad" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: `test-results/${info.project.name}-street.png`,
  });
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
  await page.screenshot({
    path: `test-results/${info.project.name}-combat.png`,
  });
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
  await dismiss(page);
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
