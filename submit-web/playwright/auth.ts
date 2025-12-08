import { Page } from "@playwright/test";

const AUTHORITY = "https://dev.loginproxy.gov.bc.ca/auth/realms/eao-epic";
const CLIENT_ID = "epic-submit";
const TOKEN_ENDPOINT = `${AUTHORITY}/protocol/openid-connect/token`;

export interface TokenResponse {
  access_token: string;
  id_token: string;
  refresh_token: string;
  token_type: string;
  scope: string;
}

/**
 * ROPC (Resource Owner Password Credentials) Flow
 * Fast authentication for test setup/teardown
 */
export async function kcLogin(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  // Get tokens via ROPC
  const response = await page.request.post(TOKEN_ENDPOINT, {
    form: {
      grant_type: "password",
      client_id: CLIENT_ID,
      username,
      password,
      scope: "openid profile email",
    },
  });

  const tokens: TokenResponse = await response.json();

  // Store tokens in sessionStorage matching oidc-client-ts format
  const storageKey = `oidc.user:${AUTHORITY}:${CLIENT_ID}`;
  const user = {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    refresh_token: tokens.refresh_token,
    token_type: "Bearer",
    scope: "openid profile email",
    profile: {
      sub: username,
    },
  };

  await page.addInitScript(
    (payload) => {
      window.sessionStorage.setItem(payload.key, JSON.stringify(payload.user));
    },
    { key: storageKey, user },
  );
}

/**
 * Clear authentication session
 * Uses context storage API to avoid SecurityError on fresh pages
 */
export async function kcLogout(page: Page): Promise<void> {
  // Clear storage using Playwright's context API (works even before navigation)
  await page.context().clearCookies();

  // Also clear storage state if page has a valid origin
  try {
    await page.evaluate(() => {
      window.sessionStorage.clear();
      window.localStorage.clear();
    });
  } catch (e) {
    // Ignore SecurityError if page hasn't navigated yet
  }
}

/**
 * Login via BCSC (BC Services Card) with full UI interaction
 * Handles the multi-step BCSC test login flow
 */
export async function loginViaBCSC(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  // Step 1: Navigate to app and click Login
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Login" }).first().click();

  // Step 2: Select BCSC login
  await page.locator("#bcsc-login").click();

  // Step 3: BCSC test login flow
  await page.locator("#tile_test_with_username_password_device_div_id").click();

  // Step 4: Fill credentials
  await page.locator("#username").fill(username);
  await page.locator("#password").fill(password);
  await page.locator("#submit-btn").click();

  // Step 5: Accept terms
  await page.getByText("I agree").click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 6: Wait for OAuth callback and routing
  await page.waitForURL(/\/oidc-callback/);

  // Wait for final routing to dashboard
  await page.waitForURL(/\/(staff|proponent)/);

  // Ensure not redirected to error page
  const url = page.url();
  if (url.includes("/error")) {
    throw new Error(
      "Login failed - redirected to error page. Check API connectivity.",
    );
  }
}

/**
 * Login via BCeID (Business BCeID) with full UI interaction
 */
export async function loginViaBCeID(
  page: Page,
  username: string,
  password: string,
): Promise<void> {
  // Step 1: Navigate to app and click Login
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Login" }).first().click();

  // Step 2: Select BCeID login
  await page.locator("#bceid-login").click();

  // Step 3: Fill BCeID credentials (cross-origin)
  await page.locator('[name="user"]').fill(username);
  await page.locator('[name="password"]').fill(password);
  await page.locator('[name="btnSubmit"]').click();

  // Step 4: Wait for OAuth callback and routing
  await page.waitForURL(/\/oidc-callback/, { timeout: 15000 });

  // Wait for network to be idle (user data loading)
  await page.waitForLoadState("networkidle");

  // Wait for final routing to dashboard
  await page.waitForURL(/\/(staff|proponent)/, { timeout: 20000 });

  // Ensure not redirected to error page
  const url = page.url();
  if (url.includes("/error")) {
    throw new Error(
      "Login failed - redirected to error page. Check API connectivity.",
    );
  }
}
