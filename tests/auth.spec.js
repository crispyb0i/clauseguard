import { test, expect } from '@playwright/test';

// Set TEST_EMAIL and TEST_PASSWORD in your environment or .env.test
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('shows sign in and sign up tabs', async ({ page }) => {
    await expect(page.locator('#tabSignin')).toBeVisible();
    await expect(page.locator('#tabSignup')).toBeVisible();
  });

  test('shows forgot password link', async ({ page }) => {
    await expect(page.getByText(/Forgot password/i)).toBeVisible();
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.locator('#signinEmail').fill('wrong@example.com');
    await page.locator('#signinPassword').fill('wrongpassword');
    await page.locator('#signinBtn').click();
    await expect(page.locator('#signinAlert.visible')).toBeVisible({ timeout: 15000 });
  });

  test('shows error for short password on sign up', async ({ page }) => {
    await page.locator('#tabSignup').click();
    await page.locator('#signupEmail').fill('test@example.com');
    await page.locator('#signupPassword').fill('short');
    await page.locator('#signupBtn').click();
    await expect(page.locator('#signupAlert.visible')).toBeVisible();
    await expect(page.locator('#signupAlert')).toContainText(/at least 8 characters/i);
  });

  test('redirects to /app after successful sign in', async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
    await page.getByPlaceholder(/email/i).first().fill(EMAIL);
    await page.getByPlaceholder(/password/i).first().fill(PASSWORD);
    await page.getByRole('button', { name: /Sign in/i }).click();
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
  });
});

test.describe('Auth redirect', () => {
  test('unauthenticated /app redirects to /login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/, { timeout: 8000 });
  });
});
