import { test, expect, type Page } from "@playwright/test";
async function visualEvidence(page: Page, name: string) {
  const shot = await page.screenshot({
    path: test.info().outputPath(`${name}.jpg`),
    type: "jpeg",
    quality: 65,
  });
  await test.info().attach(name, { body: shot, contentType: "image/jpeg" });
}
async function go(page: Page, name: string) {
  await page.getByRole("button", { name: /Places/ }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(name) })
    .click();
}
async function dismiss(page: Page) {
  await page.getByRole("button", { name: "Close panel" }).click();
}
async function continueTo(page: Page) {
  await page.getByRole("button", { name: /Continue journey/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}
async function battle(page: Page) {
  for (let i = 0; i < 60; i++) {
    if (
      !(await page
        .getByRole("region", { name: "Combat", exact: true })
        .isVisible())
    )
      return;
    const danger = await page.locator(".intent").innerText(),
      aim = page.getByRole("button", { name: /^Aimed shot/ }),
      fire = page.getByRole("button", { name: /^Fire/ }),
      reload = page.getByRole("button", { name: /^Reload/ });
    const btn = danger.includes("incoming")
      ? page.getByRole("button", { name: /^Guard/ })
      : !(await fire.isEnabled())
        ? reload
        : (await aim.isEnabled())
          ? aim
          : fire;
    await expect(btn).toBeEnabled();
    await btn.click();
    await page.waitForTimeout(450);
  }
  throw new Error("Combat did not finish");
}
test("Vault 13, repair, contracts, memory, faction choice and saved consequences", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto("/");
  await page.getByRole("button", { name: /Wake in Vault 13/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Found You", exact: true })).toBeVisible();
  await visualEvidence(page, info.project.name + "-vault");
  await continueTo(page);
  await expect(page.locator(".dialogue")).toContainText("Three miles east");
  await dismiss(page);
  await continueTo(page);
  await expect(page.locator(".dialogue")).toContainText("Water");
  await dismiss(page);
  await continueTo(page);
  await expect(page.locator(".weapon-inspect")).toContainText(
    "Vault 13 BB Gun",
  );
  await page.getByRole("button", { name: /Shoot the exposed release/ }).click();
  await expect(page.locator(".dialogue")).toContainText("drawer");
  await dismiss(page);
  await continueTo(page);
  await expect(
    page.getByRole("heading", { name: "Travis / Bay 13", exact: true }),
  ).toBeVisible();
  await visualEvidence(page, info.project.name + "-damaged-rifle");
  await page.getByRole("button", { name: /Restore M94 action/ }).click();
  await expect(page.locator(".weapon-inspect")).toContainText(
    "Action Restoration",
  );
  await dismiss(page);
  await page.getByRole("button", { name: /Continue journey/ }).click();
  await expect(
    page.getByRole("region", { name: "Combat", exact: true }),
  ).toBeVisible();
  const encounter = await page.locator(".combat-heading").innerText();
  await page.reload();
  await page.getByRole("button", { name: /Continue your journey/ }).click();
  await expect(page.locator(".combat-heading")).toHaveText(encounter, {
    useInnerText: true,
  });
  await battle(page);
  await go(page, "Travis / Bay 13");
  await expect(
    page.getByRole("button", { name: /Fit Rail Peep/ }),
  ).toBeEnabled();
  await page.getByRole("button", { name: /Fit Rail Peep/ }).click();
  await page.getByRole("button", { name: /Fit Rivetguard/ }).click();
  await expect(page.locator(".weapon-inspect")).toContainText("Rail Peep");
  await visualEvidence(page, info.project.name + "-upgraded-rifle");
  await dismiss(page);
  await go(page, "West Berm");
  await expect(page.locator(".dialogue")).toContainText("HOUND-LEAD");
  await dismiss(page);
  await go(page, "Signal relay");
  await expect(page.locator(".dialogue")).toContainText("Atlas cores");
  await page.getByRole("button", { name: /Give Tyrone time/ }).click();
  await dismiss(page);
  await page.getByRole("button", { name: /Loadout/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Vesper recovery warrant",
  );
  await page.getByRole("button", { name: /Load Ball/ }).click();
  await dismiss(page);
  await page.getByRole("button", { name: /Continue journey/ }).click();
  await expect(
    page.getByRole("region", { name: "Combat", exact: true }),
  ).toBeVisible();
  await visualEvidence(page, info.project.name + "-combat");
  await page.getByRole("button", { name: /^Aimed shot/ }).click();
  await expect(page.locator(".intent")).toContainText("wind-up");
  await page.getByRole("button", { name: /^Guard/ }).click();
  await expect(page.locator(".intent")).toContainText("Heavy shot");
  await page.getByRole("button", { name: /^Aimed shot/ }).click();
  await expect(page.locator(".combat-foot")).toContainText("INTERRUPTED");
  await battle(page);
  await continueTo(page);
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: /Negotiate a working agreement/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "A working road." }),
  ).toBeVisible();
  await dismiss(page);
  await go(page, "Market");
  await expect(page.locator(".dialogue")).toContainText(
    "Compact guards escort",
  );
  await expect(page.locator(".dialogue")).toContainText("Ashen scouts");
  await expect(page.locator(".dialogue")).toContainText("serials");
  await page.getByRole("button", { name: /Buy .30-30 Ball/ }).click();
  await dismiss(page);
  await visualEvidence(page, info.project.name + "-consequences");
  await page.reload();
  await page.getByRole("button", { name: /Continue your journey/ }).click();
  await expect(
    page.getByRole("heading", { name: "The road remembers" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Loadout/ }).click();
  await expect(page.locator(".weapon-inspect")).toContainText("Rail Peep");
  await visualEvidence(page, info.project.name + "-loadout");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(
    await page
      .locator("img")
      .evaluateAll((imgs) =>
        imgs.every(
          (i) =>
            i instanceof HTMLImageElement && i.complete && i.naturalWidth > 0,
        ),
      ),
  ).toBe(true);
  expect(errors).toEqual([]);
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
  await page.getByRole("button", { name: /Wake in Vault 13/ }).click();
  try {
    await expect(
      page.getByRole("button", { name: /Continue journey/ }),
    ).toBeDisabled();
    await expect(page.getByRole("button", { name: /Places/ })).toBeDisabled();
  } finally {
    release();
  }
  await expect(
    page.getByRole("button", { name: /Continue journey/ }),
  ).toBeEnabled();
  await continueTo(page);
  await expect(page.locator(".dialogue")).toContainText("Three miles east");
});
test("a damaged primary checkpoint recovers the last valid backup", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Wake in Vault 13/ }).click();
  await continueTo(page);
  await dismiss(page);
  await continueTo(page);
  await dismiss(page);
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          !!localStorage.getItem(
            "CapacitorStorage.hollow-bannock-save-v2-backup",
          ),
      ),
    )
    .toBe(true);
  // Damage storage in the new document, after the old page's lifecycle save
  // and before application startup reads it.
  await page.addInitScript(() => {
    localStorage.setItem("CapacitorStorage.hollow-bannock-save-v2", "{damaged");
  });
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Recovered the previous checkpoint",
  );
  await page.getByRole("button", { name: /Continue your journey/ }).click();
  await expect(page.locator("canvas")).toBeVisible();
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
