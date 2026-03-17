import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

async function signIn(page) {
  await page.goto('/login');
  await page.locator('#signinEmail').fill(EMAIL);
  await page.locator('#signinPassword').fill(PASSWORD);
  await page.locator('#signinBtn').click();
  await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
}

test.describe('Analysis flow', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
    await signIn(page);
  });

  test('sample contract button loads text and enables analyze', async ({ page }) => {
    await page.getByRole('button', { name: /Try with a sample contract/i }).click();
    const textarea = page.locator('#contractText');
    await expect(textarea).not.toBeEmpty();
    await expect(page.locator('#analyzeBtn')).toBeEnabled({ timeout: 5000 });
  });

  test('full analysis renders all result sections', async ({ page }) => {
    // Use sample contract so the test doesn't depend on external file
    await page.getByRole('button', { name: /Try with a sample contract/i }).click();
    await page.locator('#analyzeBtn').click();

    // Loading screen should appear
    await expect(page.locator('#loadingSection')).toBeVisible({ timeout: 5000 });

    // Wait for results (Claude can take up to 30s)
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });

    // All four result sections must render
    await expect(page.locator('#riskScore')).not.toBeEmpty();
    await expect(page.locator('#summaryText')).not.toBeEmpty();
    await expect(page.locator('#redFlagsList')).not.toBeEmpty();
    await expect(page.locator('#keyTermsList')).not.toBeEmpty();
  });

  test('sample analysis shows signup CTA, not share button', async ({ page }) => {
    await page.getByRole('button', { name: /Try with a sample contract/i }).click();
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });

    await expect(page.locator('#sampleCta')).toBeVisible();
    await expect(page.locator('#shareBtn')).toBeHidden();
  });

  test('authenticated analysis shows share and revoke buttons', async ({ page }) => {
    const textarea = page.locator('#contractText');
    await textarea.fill(
      'CONSULTING AGREEMENT. This agreement is between Acme Inc ("Client") and Jane Doe ("Consultant"). ' +
      'The Consultant agrees to a 12-month non-compete clause covering all industries worldwide. ' +
      'Client may terminate this agreement at any time without notice or compensation. ' +
      'All intellectual property created during the engagement is assigned to the Client in perpetuity.'
    );
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });

    await expect(page.locator('#shareBtn')).toBeVisible();
    await expect(page.locator('#revokeShareBtn')).toBeVisible();
    await expect(page.locator('#sampleCta')).toBeHidden();
  });

  test('reset app returns to upload screen', async ({ page }) => {
    await page.getByRole('button', { name: /Try with a sample contract/i }).click();
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });

    await page.getByRole('button', { name: /Analyze another contract/i }).click();
    await expect(page.locator('#uploadSection')).toBeVisible();
    await expect(page.locator('#resultsSection')).toBeHidden();
  });

  test('results section is not visible before analysis', async ({ page }) => {
    await expect(page.locator('#resultsSection')).toBeHidden();
    await expect(page.locator('#loadingSection')).toBeHidden();
  });
});
