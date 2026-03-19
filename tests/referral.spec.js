/**
 * Referral system tests
 *
 * Coverage:
 *  1. API auth boundaries (no credentials required)
 *  2. API contract validation (bad inputs, self-referral, non-existent code)
 *  3. Login page — captures ?ref= param and auto-switches to signup tab
 *  4. App page — referral card is visible and contains a valid link
 *  5. App page — copy-link button interaction
 *  6. App page — usage indicator text format (with/without bonus)
 *  7. App page — pending ref cleared from localStorage after activation attempt
 */

import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

// ── Helper: get a real Supabase access_token via REST (no browser needed) ─────
async function getAuthToken(request) {
  // Get project credentials from the live config endpoint
  const cfgRes = await request.get('/api/config');
  const { supabaseUrl, supabaseAnonKey } = await cfgRes.json();

  const authRes = await request.post(
    `${supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      data: { email: EMAIL, password: PASSWORD },
    }
  );
  expect(authRes.status(), 'Supabase sign-in failed').toBe(200);
  const { access_token } = await authRes.json();
  return access_token;
}

// ── Helper: sign in via the UI and wait for auth to complete ──────────────────
async function signInViaUI(page) {
  await page.goto('/login');
  // Wait until the card is visible (opacity transition done) OR we've been
  // redirected to /app already (already-signed-in case)
  await Promise.race([
    page.locator('#card').waitFor({ state: 'visible', timeout: 12000 }),
    page.waitForURL(/\/app/, { timeout: 12000 }),
  ]);

  if (!page.url().includes('/app')) {
    await page.locator('#signinEmail').fill(EMAIL);
    await page.locator('#signinPassword').fill(PASSWORD);
    await page.locator('#signinBtn').click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
  }

  // Wait for initAuth() to finish — it sets navUser visible when done
  await page.locator('#navUser').waitFor({ state: 'visible', timeout: 15000 });
}

// ── 1. API auth boundaries ─────────────────────────────────────────────────────
test.describe('POST /api/referral-activate — auth boundary', () => {
  test('returns 401 without Authorization header', async ({ request }) => {
    const res = await request.post('/api/referral-activate', {
      data: { ref: 'abcd1234' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 401 with a garbage Bearer token', async ({ request }) => {
    const res = await request.post('/api/referral-activate', {
      data: { ref: 'abcd1234' },
      headers: { Authorization: 'Bearer this-is-not-a-real-token' },
    });
    expect(res.status()).toBe(401);
  });

  test('returns 405 for GET', async ({ request }) => {
    const res = await request.get('/api/referral-activate');
    expect(res.status()).toBe(405);
  });
});

// ── 2. API contract validation ─────────────────────────────────────────────────
test.describe('POST /api/referral-activate — validation', () => {
  test.skip(() => !EMAIL || !PASSWORD, 'TEST_EMAIL / TEST_PASSWORD not set');

  let token;
  test.beforeEach(async ({ request }) => {
    token = await getAuthToken(request);
  });

  test('returns 400 for missing ref field', async ({ request }) => {
    const res = await request.post('/api/referral-activate', {
      data: {},
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
  });

  test('returns 400 for non-existent referral code', async ({ request }) => {
    const res = await request.post('/api/referral-activate', {
      data: { ref: 'zzzzzzzz' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/not found/i);
  });

  test('returns 400 for self-referral (own referral code)', async ({ request, page }) => {
    // Get this user's own referral code from the app page
    await signInViaUI(page);
    await page.locator('#referralCard').waitFor({ state: 'visible', timeout: 10000 });
    const linkValue = await page.locator('#referralLinkInput').inputValue();
    const ownRef = new URL(linkValue).searchParams.get('ref');
    expect(ownRef, 'own referral code not found in link').toBeTruthy();

    const res = await request.post('/api/referral-activate', {
      data: { ref: ownRef },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/yourself/i);
  });

  test('returns 200 or 400 (not 5xx) for a random code', async ({ request }) => {
    // Any valid auth request should be handled gracefully — no server errors
    const res = await request.post('/api/referral-activate', {
      data: { ref: 'testcode' },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBeLessThan(500);
    // Either already_referred (200) or code not found (400)
    expect([200, 400]).toContain(res.status());
  });
});

// ── 3. Login page — ?ref= param handling ──────────────────────────────────────
test.describe('Login page — referral link behaviour', () => {
  test('visiting /login?ref=testcode stores ref in localStorage', async ({ page }) => {
    await page.goto('/login?ref=testcode99');

    await page.waitForFunction(
      () => localStorage.getItem('cg_pending_ref') !== null,
      { timeout: 8000 }
    );

    const stored = await page.evaluate(() => localStorage.getItem('cg_pending_ref'));
    expect(stored).toBe('testcode99');

    await page.evaluate(() => localStorage.removeItem('cg_pending_ref'));
  });

  test('visiting /login?ref= auto-switches to the Sign up tab', async ({ page }) => {
    await page.goto('/login?ref=testcode99');

    // initSupabase calls switchTab('signup') via setTimeout
    await page.locator('#signupForm').waitFor({ state: 'visible', timeout: 8000 });
    await expect(page.locator('#tabSignup')).toHaveClass(/active/);
  });

  test('visiting /login without ref does not set localStorage', async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('cg_pending_ref'));
    await page.reload();

    const stored = await page.evaluate(() => localStorage.getItem('cg_pending_ref'));
    expect(stored).toBeNull();
  });
});

// ── 4 & 5. App page — referral card ───────────────────────────────────────────
test.describe('App page — referral card', () => {
  test.skip(() => !EMAIL || !PASSWORD, 'TEST_EMAIL / TEST_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    await signInViaUI(page);
  });

  test('referral card is visible after sign-in', async ({ page }) => {
    await expect(page.locator('#referralCard')).toBeVisible({ timeout: 10000 });
  });

  test('referral link input contains a valid URL with ?ref= param', async ({ page }) => {
    await page.locator('#referralCard').waitFor({ state: 'visible', timeout: 10000 });

    const linkValue = await page.locator('#referralLinkInput').inputValue();
    expect(linkValue).toMatch(/https?:\/\/.+\/login\?ref=[a-f0-9]{8}/i);
  });

  test('copy button changes text to "Copied!" then resets', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#referralCard').waitFor({ state: 'visible', timeout: 10000 });

    const copyBtn = page.locator('#referralCopyBtn');
    await copyBtn.click();

    await expect(copyBtn).toHaveText('Copied!', { timeout: 3000 });
    await expect(copyBtn).toHaveText('Copy link', { timeout: 4000 });
  });

  test('clipboard contains the referral link after copy', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.locator('#referralCard').waitFor({ state: 'visible', timeout: 10000 });

    const expectedLink = await page.locator('#referralLinkInput').inputValue();
    await page.locator('#referralCopyBtn').click();
    await page.waitForTimeout(300);

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(expectedLink);
  });
});

// ── 6. App page — usage indicator ─────────────────────────────────────────────
test.describe('App page — usage indicator', () => {
  test.skip(() => !EMAIL || !PASSWORD, 'TEST_EMAIL / TEST_PASSWORD not set');

  test.beforeEach(async ({ page }) => {
    await signInViaUI(page);
  });

  test('usage indicator is visible and shows correct format', async ({ page }) => {
    const indicator = page.locator('#usageIndicator');
    await expect(indicator).toBeVisible({ timeout: 10000 });

    const text = await page.locator('#usageText').textContent();
    expect(text).toMatch(/\d+ of \d+ analyses used this month/i);
  });

  test('usage text shows "(N bonus)" label when user has bonus_analyses', async ({ page }) => {
    await page.locator('#usageIndicator').waitFor({ state: 'visible', timeout: 10000 });

    const text = await page.locator('#usageText').textContent();
    if (text.includes('bonus')) {
      expect(text).toMatch(/\(\d+ bonus\)/);
    } else {
      // No bonus for this test user — verify base format is intact
      expect(text).toMatch(/^\d+ of \d+ analyses used this month$/);
    }
  });
});

// ── 7. Pending ref cleared from localStorage ───────────────────────────────────
test.describe('App page — pending ref cleared after activation', () => {
  test.skip(() => !EMAIL || !PASSWORD, 'TEST_EMAIL / TEST_PASSWORD not set');

  test('cg_pending_ref is removed after app initialises', async ({ page }) => {
    // Plant a fake pending ref before navigating to /app via login
    await page.goto('/login');
    await page.evaluate(() => localStorage.setItem('cg_pending_ref', 'fakecode1'));

    await page.locator('#card').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('#signinEmail').fill(EMAIL);
    await page.locator('#signinPassword').fill(PASSWORD);
    await page.locator('#signinBtn').click();
    await expect(page).toHaveURL(/\/app/, { timeout: 15000 });

    // Wait for initAuth to run (navUser visible = auth complete = ref cleared)
    await page.locator('#navUser').waitFor({ state: 'visible', timeout: 15000 });

    const remaining = await page.evaluate(() => localStorage.getItem('cg_pending_ref'));
    expect(remaining).toBeNull();
  });
});
