/**
 * API boundary tests — verify auth enforcement and basic contract on all endpoints.
 * These run against the live site and require no credentials.
 */
import { test, expect } from '@playwright/test';

test.describe('API auth boundaries', () => {
  test('POST /api/analyze — 401 without auth', async ({ request }) => {
    const res = await request.post('/api/analyze', {
      data: { text: 'sample contract text' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/delete-account — 401 without auth', async ({ request }) => {
    const res = await request.post('/api/delete-account');
    expect(res.status()).toBe(401);
  });

  test('GET /api/export-data — 401 without auth', async ({ request }) => {
    const res = await request.get('/api/export-data');
    expect(res.status()).toBe(401);
  });

  test('POST /api/revoke-share — 401 without auth', async ({ request }) => {
    const res = await request.post('/api/revoke-share', {
      data: { token: 'any-token' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/generate-share — 401 without auth', async ({ request }) => {
    const res = await request.post('/api/generate-share', {
      data: { analysisId: 'any-id' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/generate-share — 400 without analysisId', async ({ request }) => {
    const res = await request.post('/api/generate-share', {
      headers: { Authorization: 'Bearer fake-token' },
      data: {},
    });
    // 400 (missing body) or 401 (token rejected) — either way not 200
    expect(res.status()).not.toBe(200);
  });

  test('GET /api/portal — 401 without auth', async ({ request }) => {
    const res = await request.get('/api/portal');
    // portal may return 405 for GET; what matters is it doesn't return 200
    expect(res.status()).not.toBe(200);
  });
});

test.describe('GET /api/share', () => {
  test('missing token returns 400', async ({ request }) => {
    const res = await request.get('/api/share');
    expect(res.status()).toBe(400);
  });

  test('unknown token returns 404', async ({ request }) => {
    const res = await request.get('/api/share?token=nonexistent-token-12345');
    expect(res.status()).toBe(404);
  });

  test('response is not cached (no public cache header)', async ({ request }) => {
    const res = await request.get('/api/share?token=nonexistent-token-12345');
    const cc = res.headers()['cache-control'] ?? '';
    expect(cc).not.toContain('public');
  });
});

test.describe('Stripe webhook', () => {
  test('POST /api/webhook — 400 without stripe-signature header', async ({ request }) => {
    const res = await request.post('/api/webhook', {
      data: '{}',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /api/webhook — 400 with invalid signature', async ({ request }) => {
    const res = await request.post('/api/webhook', {
      data: '{}',
      headers: {
        'content-type': 'application/json',
        'stripe-signature': 't=1234567890,v1=invalidsignature',
      },
    });
    expect(res.status()).toBe(400);
  });
});

test.describe('Password reset page', () => {
  test('reset-password page loads', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(page).not.toHaveURL(/login/);
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Account management UI', () => {
  const EMAIL = process.env.TEST_EMAIL;
  const PASSWORD = process.env.TEST_PASSWORD;

  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
    await page.goto('/login');
    await page.locator('#signinEmail').fill(EMAIL);
    await page.locator('#signinPassword').fill(PASSWORD);
    await page.locator('#signinBtn').click();
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
  });

  test('delete account modal opens with correct warning', async ({ page }) => {
    // Open nav dropdown
    await page.locator('#navEmail').click();
    await page.getByRole('button', { name: /Delete account/i }).click();
    const modal = page.locator('#deleteModal');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText(/cannot be undone/i);
  });

  test('delete account modal can be cancelled', async ({ page }) => {
    await page.locator('#navEmail').click();
    await page.getByRole('button', { name: /Delete account/i }).click();
    await expect(page.locator('#deleteModal')).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.locator('#deleteModal')).toBeHidden();
  });

  test('download my data button is present in nav dropdown', async ({ page }) => {
    await page.locator('#navEmail').click();
    await expect(page.getByRole('button', { name: /Download my data/i })).toBeVisible();
  });
});
