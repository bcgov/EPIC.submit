import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import path from 'node:path';

const project = 'E2E Coastal Project';
const plan = 'E2E Environmental Management Plan';
const password = 'E2e-only-password-123!';
const baseURL = 'http://web:5173';
const files = path.resolve('playwright/test-data');
type Email = { to: string[]; subject: string; body: string };

async function email(request: APIRequestContext, recipient: string, subject: RegExp, count = 1) {
  let matches: Email[] = [];
  await expect.poll(async () => {
    const response = await request.get('http://fakes:8090/messages');
    expect(response.ok()).toBeTruthy();
    matches = (await response.json() as Email[]).filter(
      message => message.to.includes(recipient) && subject.test(message.subject),
    );
    return matches.length;
  }, { timeout: 30_000, message: `Rendered email to ${recipient}: ${subject}` }).toBe(count);
  expect(matches[0].body).not.toMatch(/\{\{|\{%/);
  return matches[0];
}

async function login(page: Page, username: string) {
  await expect(page).toHaveURL(/keycloak:8080/);
  await page.getByRole('textbox', { name: /Username|Email/ }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: /Sign In/ }).click();
  await expect(page).toHaveURL(/web:5173/);
}

async function register(page: Page, url: string, username: string) {
  await page.goto(url);
  await page.getByRole('button', { name: 'Login with Business BCeID', exact: true }).click();
  await login(page, username);
  await expect(page).toHaveURL(/account-registration\/create-account/);
  await page.getByLabel('Your Given Name', { exact: true }).fill('E2E');
  await page.getByLabel('Your Surname', { exact: true }).fill(username);
  await page.getByLabel('Your Company Name', { exact: true }).fill('E2E Coastal Energy');
  await page.getByLabel('Your Position/Role', { exact: true }).fill('Account Administrator');
  await page.getByLabel('Your Work Phone Number', { exact: true }).fill('2505550100');
  await page.getByLabel('Your Work Email Address', { exact: true }).fill(`${username}@example.test`);
  await page.getByRole('checkbox').check();
  const terms = page.getByRole('region', { name: 'Terms text' });
  await terms.focus();
  await terms.press('Control+End');
  await page.getByRole('button', { name: 'I Agree to the Terms and Conditions' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
}

async function saveDocumentForm(page: Page) {
  await page.getByRole('button', { name: 'Save Completed Form', exact: true }).click();
  await expect(page.getByText('Submission saved successfully', { exact: true })).toBeVisible();
}

async function upload(page: Page, inputIndex: number, name: string) {
  const put = page.waitForResponse(response =>
    response.request().method() === 'PUT' && new URL(response.url()).hostname === 'storage');
  await page.locator('input[type="file"]').nth(inputIndex).setInputFiles(path.join(files, name));
  expect((await put).ok(), `S3 accepted ${name}`).toBeTruthy();
  await expect(page.getByRole('row').filter({ hasText: name })).toBeVisible();
}

test('invitation, registration, submission and staff review with real queued emails', async ({ page: staff, browser, request }) => {
  const adminContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const proponentContext = await browser.newContext({ baseURL, ignoreHTTPSErrors: true });
  const admin = await adminContext.newPage();
  const proponent = await proponentContext.newPage();
  let registrationUrl = '';
  let packagePath = '';

  try {
    await test.step('Staff generates the initial account invitation', async () => {
      await staff.goto('/staff/proponents/9001');
      await login(staff, 'staff');
      await expect(staff.getByText('E2E Coastal Energy', { exact: true }).first()).toBeVisible();
      await staff.getByRole('row').filter({ hasText: project }).getByRole('checkbox').check();
      await staff.getByRole('button', { name: 'Generate Link', exact: true }).click();
      const link = staff.locator('input[readonly]');
      await expect(link).toHaveValue(/account-registration\?token=/);
      registrationUrl = await link.inputValue();
    });

    await test.step('First administrator registers and emails an invitation', async () => {
      await register(admin, registrationUrl, 'admin');
      await expect(admin).toHaveURL(/second-admin/);
      await admin.getByRole('radio', { name: /^Yes, I would like to invite/ }).check();
      await admin.locator('input[type="email"]').fill('proponent@example.test');
      await admin.getByRole('button', { name: 'Send Invite', exact: true }).click();
      await expect(admin).toHaveURL(/confirm-projects/);
      await admin.getByRole('radio', { name: 'Yes, this is correct', exact: true }).check();
      await admin.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(admin).toHaveURL(/completed/);
      const invitation = await email(request, 'proponent@example.test', /Invitation/i);
      expect(invitation.body).toContain(project);
      const emailView = await adminContext.newPage();
      await emailView.setContent(invitation.body);
      const href = await emailView.locator('a[href*="account-registration?token="]').first().getAttribute('href');
      expect(href).toBeTruthy();
      registrationUrl = href!;
      expect(new URL(registrationUrl).origin).toBe(baseURL);
      await emailView.close();
    });

    await test.step('Invited administrator follows captured email and registers', async () => {
      await register(proponent, registrationUrl, 'proponent');
      await expect(proponent).toHaveURL(/proponent\/projects/);
      await proponent.reload();
      await proponent.getByText(project, { exact: true }).click();
      await proponent.getByRole('button', { name: 'New Submission', exact: true }).click();
      await proponent.getByTestId('main-condition').click();
      await proponent.getByRole('option', { name: `Condition 1 - ${plan}`, exact: true }).click();
      await proponent.getByRole('button', { name: /Next|Continue/ }).click();
      await proponent.locator('input[name="radio-yes"]').check();
      await proponent.getByRole('button', { name: /Create.*Submission/ }).click();
      await expect(proponent).toHaveURL(/submission-packages\/\d+$/);
      packagePath = new URL(proponent.url()).pathname;
    });

    await test.step('Proponent completes contacts and uploads consultation and plan files', async () => {
      await proponent.getByTestId('submission-item-action-Submission Contact Information').click();
      for (const [name, value] of Object.entries({
        givenName: 'E2E', surname: 'Proponent', company: 'E2E Coastal Energy',
        position: 'Administrator', workPhoneNumber: '2505550100', workEmailAddress: 'proponent@example.test',
      })) {
        await proponent.locator(`input[name="primaryContact.${name}"]`).fill(value);
      }
      await proponent.getByRole('button', { name: 'Save', exact: true }).click();
      await expect(proponent.getByText('Submission created successfully', { exact: true })).toBeVisible();
      await proponent.goto(packagePath);
      await proponent.getByTestId('submission-item-action-Consultation Record(s)').click();
      const consultationAnswers = proponent.locator('input[type="radio"][value="true"]');
      await expect(consultationAnswers).toHaveCount(4);
      for (const answer of await consultationAnswers.all()) await answer.check();
      await upload(proponent, 0, 'test-consultation-record.pdf');
      await saveDocumentForm(proponent);
      await proponent.goto(packagePath);
      await proponent.getByTestId('submission-item-action-Management Plan').click();
      const planAnswers = proponent.locator('input[type="radio"][value="true"]');
      await expect(planAnswers).toHaveCount(3);
      for (const answer of await planAnswers.all()) await answer.check();
      await upload(proponent, 0, 'test-management-plan.pdf');
      await upload(proponent, 1, 'test-supporting-doc-1.pdf');
      await saveDocumentForm(proponent);
      await proponent.goto(packagePath);
      await proponent.reload();
      await proponent.getByRole('button', { name: 'Submit to EAO', exact: true }).click();
      await expect(proponent.getByText(/successfully submitted/)).toBeVisible();
      await proponent.reload();
      await expect(proponent.getByText(/successfully submitted/)).toBeVisible();
      const confirmation = await email(request, 'proponent@example.test', /^Confirmation of receipt/);
      expect(confirmation.body).toContain(plan);
      const notification = await email(request, 'staff@example.test', /^SUBMISSION -/);
      expect(notification.body).toContain(project);
      expect(notification.body).toContain(plan);
    });

    await test.step('Staff reviews the submitted documents and sends recommendations', async () => {
      const staffPath = packagePath.replace('/proponent/', '/staff/');
      await staff.goto(staffPath);
      await expect(staff.getByText('test-management-plan.pdf', { exact: true })).toBeVisible();
      for (const [section, option] of [
        ['Consultation Record(s)', 'Yes, the holder has passed the Consultation Check'],
        ['Management Plan', 'Yes, the holder passed the Management Plan Review'],
      ]) {
        const row = staff.getByRole('row').filter({ has: staff.getByText(section, { exact: true }) });
        await row.getByText('Review', { exact: true }).click();
        await staff.getByRole('button', { name: section === 'Consultation Record(s)' ? 'Start Consultation Check' : 'Start MP Review', exact: true }).click();
        const review = staff.getByTestId('review-section');
        await review.getByRole('combobox').click();
        await staff.getByRole('option', { name: option, exact: true }).click();
        await review.getByRole('button', { name: 'Send Recommendations to Manager', exact: true }).click();
        await expect(staff.getByText('Recommendation sent to manager', { exact: true })).toBeVisible();
        await staff.reload();
        await expect(review.getByRole('combobox')).toContainText(option);
        await expect(review.getByRole('button', { name: 'Send Recommendations to Manager', exact: true })).toBeDisabled();
        await staff.goto(staffPath);
      }
      const recommendation = await email(request, 'manager@example.test', /^Submission awaiting Manager approval/, 2);
      expect(recommendation.body).toContain(plan);
      await proponent.reload();
      await expect(proponent.getByText('test-management-plan.pdf', { exact: true })).toBeVisible();
    });
  } finally {
    await adminContext.close();
    await proponentContext.close();
  }
});
