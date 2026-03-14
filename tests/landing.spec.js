import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/ClauseGuard/);
  });

  test('nav has Log in and Start free links', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start free/i })).toBeVisible();
  });

  test('no 7-day free trial copy anywhere', async ({ page }) => {
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('7-day');
    expect(bodyText).not.toContain('7 day');
  });

  test('shows 3 free analyses messaging', async ({ page }) => {
    await expect(page.getByText(/3 free analyses/i).first()).toBeVisible();
  });

  test('PostHog is initialized', async ({ page }) => {
    const posthogLoaded = await page.evaluate(() => typeof window.posthog !== 'undefined');
    expect(posthogLoaded).toBe(true);
  });

  test('Log in link goes to /login', async ({ page }) => {
    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('hero CTA goes to /login', async ({ page }) => {
    await page.getByRole('link', { name: /Start for free/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('pricing section is visible', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await expect(page.locator('.plan-name').filter({ hasText: 'Starter' })).toBeVisible();
    await expect(page.locator('.plan-name').filter({ hasText: 'Pro' })).toBeVisible();
    await expect(page.locator('.plan-name').filter({ hasText: 'Team' })).toBeVisible();
  });
});
