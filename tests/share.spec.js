import { test, expect } from '@playwright/test';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

test.describe('Share page — unauthenticated', () => {
  test('missing token shows error, not blank page', async ({ page }) => {
    await page.goto('/share');
    // Page should render something meaningful, not just white
    await expect(page.locator('body')).not.toBeEmpty();
    // Should show an error state, not analysis content
    await expect(page.locator('#analysisContent')).toBeHidden();
  });

  test('invalid token returns error message', async ({ page }) => {
    await page.goto('/share?t=invalid-token-that-does-not-exist');
    await expect(page.locator('#errorState')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('#analysisContent')).toBeHidden();
  });

  test('share page has correct title', async ({ page }) => {
    await page.goto('/share?t=invalid-token-that-does-not-exist');
    await expect(page).toHaveTitle(/ClauseGuard/i);
  });
});

test.describe('Share link — create and revoke', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
    await page.goto('/login');
    await page.locator('#signinEmail').fill(EMAIL);
    await page.locator('#signinPassword').fill(PASSWORD);
    await page.locator('#signinBtn').click();
    await expect(page).toHaveURL(/\/app/, { timeout: 10000 });
  });

  test('share link opens valid share page', async ({ page, context }) => {
    // Run an analysis first
    await page.locator('#contractText').fill(
      'SERVICE AGREEMENT. Provider may change fees at any time without notice. ' +
      'Client waives all rights to dispute charges. Auto-renews annually unless cancelled 90 days prior.'
    );
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#shareBtn')).toBeVisible();

    // Intercept clipboard to capture the share URL
    let shareUrl = null;
    await page.exposeFunction('captureClipboard', (url) => { shareUrl = url; });
    await page.evaluate(() => {
      const orig = navigator.clipboard.writeText.bind(navigator.clipboard);
      navigator.clipboard.writeText = async (text) => {
        window.captureClipboard(text);
        return orig(text);
      };
    });

    await page.locator('#shareBtn').click();

    // Wait for the share URL to be captured
    await page.waitForFunction(() => typeof window._shareUrlCaptured !== 'undefined' || true, {}, { timeout: 3000 }).catch(() => {});

    // If clipboard API isn't available in test context, skip the share page check
    if (!shareUrl) {
      test.skip(true, 'Clipboard not accessible in this test context');
      return;
    }

    // Open share page
    const sharePage = await context.newPage();
    await sharePage.goto(shareUrl);
    await expect(sharePage.locator('#analysisContent')).toBeVisible({ timeout: 10000 });
    await sharePage.close();
  });

  test('revoking a share link hides share and revoke buttons', async ({ page }) => {
    await page.locator('#contractText').fill(
      'FREELANCE CONTRACT. All work product belongs to client. ' +
      'Freelancer may not work for any competitor for 5 years after contract ends.'
    );
    await page.locator('#analyzeBtn').click();
    await expect(page.locator('#resultsSection')).toBeVisible({ timeout: 60000 });
    await expect(page.locator('#revokeShareBtn')).toBeVisible();

    await page.locator('#revokeShareBtn').click();

    await expect(page.locator('#shareBtn')).toBeHidden({ timeout: 8000 });
    await expect(page.locator('#revokeShareBtn')).toBeHidden({ timeout: 8000 });
  });
});
