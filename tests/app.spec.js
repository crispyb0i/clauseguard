import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

// Sign in before each test in this suite
test.beforeEach(async ({ page }) => {
  test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
  await page.goto('/login');
  await page.getByPlaceholder(/email/i).first().fill(EMAIL);
  await page.getByPlaceholder(/password/i).first().fill(PASSWORD);
  await page.getByRole('button', { name: /Sign in/i }).click();
  await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
});

test.describe('App — authenticated', () => {
  test('shows user email in nav', async ({ page }) => {
    const navEmail = page.locator('#navEmail');
    await expect(navEmail).toBeVisible();
    await expect(navEmail).not.toBeEmpty();
  });

  test('shows Manage subscription and Sign out in nav', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Manage subscription/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sign out/i })).toBeVisible();
  });

  test('shows usage indicator', async ({ page }) => {
    await expect(page.locator('#usageIndicator')).toBeVisible({ timeout: 8000 });
  });

  test('upload zone is visible', async ({ page }) => {
    await expect(page.locator('.drop-zone')).toBeVisible();
  });

  test('analyze button is disabled with no input', async ({ page }) => {
    await expect(page.locator('#analyzeBtn')).toBeDisabled();
  });

  test('analyze button enables after pasting text', async ({ page }) => {
    const textarea = page.locator('textarea');
    await textarea.fill('This is a sample contract clause for testing purposes. The employee agrees to work for a period of one year.');
    await expect(page.locator('#analyzeBtn')).toBeEnabled({ timeout: 5000 });
  });

  test('PostHog identify is called', async ({ page }) => {
    const identified = await page.evaluate(() => {
      return window.posthog?._isIdentified?.() ?? (window.posthog?.get_distinct_id?.() !== undefined);
    });
    expect(identified).toBeTruthy();
  });

  test('sign out redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: /Sign out/i }).click();
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
