import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

let pageErrors: string[] = [];
test.beforeEach(async ({ page }) => {
  pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Submit component contracts");
  await page.evaluate(async () => { await document.fonts.ready; });
});
test.afterEach(() => expect(pageErrors).toEqual([]));

async function fillRequired(page: Page) {
  await page.getByRole("textbox", { name: "Contact name", exact: true }).fill("Ada Example");
  await page.getByRole("textbox", { name: "Work phone", exact: true }).fill("2505550123");
  await page.getByRole("combobox", { name: "Supporting projects", exact: true }).click();
  await page.getByRole("option", { name: "Alpha", exact: true }).click();
  await page.keyboard.press("Escape");
}

const output = (page: Page, label: string) => page.locator(`output[aria-label="${label}"]`);

test("saves masked values, zero selections and dates in their existing formats", async ({ page }) => {
  await fillRequired(page);
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(output(page, "Submitted values")).toContainText('"contact":"Ada Example"');
  const values = JSON.parse(await output(page, "Submitted values").innerText());
  expect(values).toMatchObject({ contact: "Ada Example", phone: "(250) 555-0123", project: 0, projects: ["alpha"], decisionDate: "2026-10-25" });
  await expect(output(page, "Dirty fields")).toContainText('"phone":true');
  await expect(output(page, "Dirty fields")).toContainText('"projects":true');
});

test("clears a zero-valued selection and selects with the keyboard without submitting", async ({ page }) => {
  await page.getByRole("button", { name: "Clear Project", exact: true }).click();
  const select = page.getByRole("combobox", { name: "Project", exact: true });
  await expect(select).toContainText("Choose a project");
  await select.press("ArrowDown");
  await page.keyboard.press("End");
  await page.keyboard.press("Enter");
  await expect(select).toContainText("Project One");
  await expect(output(page, "Submitted values")).toHaveText("Not submitted");
});

test("select-all and deleting a selected chip update the registered field", async ({ page }) => {
  await page.getByRole("combobox", { name: "Supporting projects", exact: true }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Alpha", exact: true }).press("Backspace");
  await expect(page.getByRole("button", { name: "Alpha", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Beta", exact: true })).toBeVisible();
  await page.getByRole("textbox", { name: "Contact name", exact: true }).fill("Ada Example");
  await page.getByRole("textbox", { name: "Work phone", exact: true }).fill("2505550123");
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(output(page, "Submitted values")).toContainText('"projects":["beta"]');
});

test("edits segmented dates and clears filters without changing date-only strings", async ({ page }) => {
  const date = page.locator('[data-form-field="decisionDate"]');
  await date.getByRole("spinbutton", { name: "Day", exact: true }).press("ArrowUp");
  await fillRequired(page);
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(output(page, "Submitted values")).toContainText('"decisionDate":"2026-10-26"');
  const from = page.getByRole("group", { name: "Date Submitted - From", exact: true });
  await from.getByRole("spinbutton", { name: "Day", exact: true }).press("ArrowUp");
  await expect(output(page, "Filter values")).toContainText('"from":"2026-10-02"');
  await from.hover();
  await from.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(output(page, "Filter values")).toContainText('"from":""');
});

test("focuses invalid fields and does not steal focus while the user corrects them", async ({ page }) => {
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Contact name", exact: true })).toBeFocused();
  await page.getByRole("textbox", { name: "Contact name", exact: true }).fill("Corrected");
  const phone = page.getByRole("textbox", { name: "Work phone", exact: true });
  await phone.fill("2505550123");
  await expect(phone).toBeFocused();
});

test("focuses the accessible date field when it is the remaining error", async ({ page }) => {
  await fillRequired(page);
  await page.getByRole("button", { name: "Clear decision date", exact: true }).click();
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  const date = page.locator('[data-form-field="decisionDate"]');
  await expect(date).toContainText("Enter a decision date");
  await expect(date.getByRole("spinbutton", { name: "Year", exact: true })).toBeFocused();
});

test("keeps review actions separate from disclosure buttons and restores dialog focus", async ({ page }) => {
  await expect(page.locator("button button")).toHaveCount(0);
  await page.getByRole("button", { name: "Accept update", exact: true }).click();
  await expect(output(page, "Decision")).toHaveText("Update accepted");
  await expect(page.getByRole("button", { name: "Management plan", exact: true })).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("button", { name: "split button dropdown", exact: true }).click();
  await page.getByRole("menuitem", { name: "Withdraw update", exact: true }).click();
  await expect(output(page, "Decision")).toHaveText("Update withdrawn");
  const trigger = page.getByRole("button", { name: "Review decision", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Confirm review decision", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Accept review", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(output(page, "Decision")).toHaveText("Review accepted");
});

test("retains terms acceptance gating on Escape, backdrop and scrolling", async ({ page }) => {
  await page.getByRole("button", { name: "Read terms", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Terms and Conditions", exact: true });
  const agree = dialog.getByRole("button", { name: "I Agree to the Terms and Conditions", exact: true });
  await expect(agree).toBeDisabled();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(dialog).toBeVisible();
  const text = dialog.getByRole("region", { name: "Terms text", exact: true });
  await text.evaluate((element) => { element.scrollTop = element.scrollHeight; });
  await expect(agree).toBeEnabled();
  await agree.click();
  await expect(dialog).toHaveCount(0);
  await expect(output(page, "Terms version")).toHaveText("42");
});

test("loads the shared fonts and styles and has no serious accessibility findings", async ({ page }, info) => {
  await expect(page.getByRole("button", { name: "Save submission", exact: true })).toHaveCSS("background-color", "rgb(1, 51, 102)");
  expect(await page.evaluate(() => Array.from(document.fonts).some((face) => face.family.includes("BC Sans") && face.status === "loaded"))).toBe(true);
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((issue) => issue.impact === "serious" || issue.impact === "critical");
  expect(violations.map(({ id, nodes }) => ({ id, elements: nodes.map((node) => node.target) }))).toEqual([]);
  await page.screenshot({ path: info.outputPath("controls-desktop.png"), fullPage: true });
});

test("keeps the shared layout within a narrow viewport", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole("textbox", { name: "Contact name", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("controls-mobile.png"), fullPage: true });
});

test("validates date bounds and opens the supported calendar", async ({ page }) => {
  await fillRequired(page);
  const date = page.locator('[data-form-field="decisionDate"]');
  await date.getByRole("spinbutton", { name: "Year", exact: true }).press("ArrowUp");
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(date).toContainText("Choose a date in 2026");
  await expect(output(page, "Submitted values")).toHaveText("Not submitted");
  await date.getByRole("spinbutton", { name: "Year", exact: true }).press("ArrowDown");
  await date.getByRole("button", { name: /choose date/i }).click();
  await page.getByRole("dialog").getByRole("gridcell", { name: "26", exact: true }).click();
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(output(page, "Submitted values")).toContainText('"decisionDate":"2026-10-26"');
});

test("shows keyboard focus on shared buttons", async ({ page }) => {
  const save = page.getByRole("button", { name: "Save submission", exact: true });
  await save.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(save).toBeFocused();
  await expect(save).toHaveCSS("outline-style", "solid");
});

test("preserves multiline editing and the shared resize affordance", async ({ page }) => {
  const notes = page.getByRole("textbox", { name: "Review notes", exact: true });
  await expect(notes).toHaveCSS("resize", "vertical");
  await notes.fill("First line");
  await notes.press("End");
  await notes.press("Enter");
  await notes.pressSequentially("Second line");
  await expect(notes).toHaveValue("First line\nSecond line");
  await fillRequired(page);
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(output(page, "Submitted values")).toContainText('"notes":"First line\\nSecond line"');
});

test("does not steal deliberately moved focus after smooth error scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install();
  await page.getByRole("button", { name: "Save submission", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Contact name", exact: true })).toBeFocused();
  const phone = page.getByRole("textbox", { name: "Work phone", exact: true });
  await phone.focus();
  await page.clock.fastForward(1000);
  await expect(phone).toBeFocused();
});
