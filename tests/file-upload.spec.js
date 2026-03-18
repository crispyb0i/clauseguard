import { test, expect } from '@playwright/test';

const FIXTURES = process.cwd() + '/tests/fixtures';

const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

async function signIn(page) {
  await page.goto('/login');
  // Wait for initSupabase() to finish and reveal the card (opacity becomes 1)
  await page.waitForFunction(() => {
    const card = document.getElementById('card');
    return card && card.style.opacity === '1';
  }, { timeout: 15000 });
  await page.locator('#signinEmail').fill(EMAIL);
  await page.locator('#signinPassword').fill(PASSWORD);
  await page.locator('#signinBtn').click();
  await expect(page).toHaveURL(/\/app/, { timeout: 15000 });
}

test.describe('File upload', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!EMAIL || !PASSWORD, 'TEST_EMAIL and TEST_PASSWORD not set');
    await signIn(page);
  });

  // ── TXT upload ────────────────────────────────────────────────────────────
  test('TXT file: shows file preview and populates textarea', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(FIXTURES + '/sample-contract.txt');

    // File preview should appear
    await expect(page.locator('#filePreview')).toBeVisible();
    await expect(page.locator('#fileName')).toHaveText('sample-contract.txt');

    // Drop zone should be hidden once a file is selected
    await expect(page.locator('#dropZone')).toBeHidden();
  });

  // ── DOCX upload ───────────────────────────────────────────────────────────
  test('DOCX file: mammoth extracts text and enables analyze button', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(FIXTURES + '/sample-contract.docx');

    // File preview badge
    await expect(page.locator('#filePreview')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#fileName')).toHaveText('sample-contract.docx');
    await expect(page.locator('#fileIcon')).toHaveText('📘');

    // Analyze button must be enabled — proves mammoth extracted text without error
    await expect(page.locator('#analyzeBtn')).toBeEnabled({ timeout: 10000 });

    // No error shown (extraction didn't throw)
    await expect(page.locator('#errorBox')).toBeHidden();
  });

  // ── PDF upload ────────────────────────────────────────────────────────────
  test('PDF file: shows file preview with correct icon', async ({ page }) => {
    // Create a minimal PDF buffer inline (no external file needed)
    const minimalPdf = Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
      '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n' +
      '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\n' +
      'xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n' +
      '0000000058 00000 n\n0000000115 00000 n\n' +
      'trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF'
    );

    await page.locator('#fileInput').setInputFiles({
      name: 'contract.pdf',
      mimeType: 'application/pdf',
      buffer: minimalPdf,
    });

    await expect(page.locator('#filePreview')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#fileName')).toHaveText('contract.pdf');
    await expect(page.locator('#fileIcon')).toHaveText('📕');
  });

  // ── Legacy .doc error ─────────────────────────────────────────────────────
  test('.doc file: analyze shows a clear error message', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles({
      name: 'contract.doc',
      mimeType: 'application/msword',
      buffer: Buffer.from('PK fake doc content that is definitely not valid'),
    });

    await expect(page.locator('#filePreview')).toBeVisible({ timeout: 5000 });
    await page.locator('#analyzeBtn').click();

    // Should show error, not loading/results
    const errorBox = page.locator('#errorBox');
    await expect(errorBox).toBeVisible({ timeout: 10000 });
    await expect(errorBox).toContainText(/\.docx|word document/i);
    await expect(page.locator('#loadingSection')).toBeHidden();
  });

  // ── File remove button ────────────────────────────────────────────────────
  test('remove button clears file and restores drop zone', async ({ page }) => {
    await page.locator('#fileInput').setInputFiles(FIXTURES + '/sample-contract.txt');
    await expect(page.locator('#filePreview')).toBeVisible();

    await page.locator('#fileRemove').click();

    await expect(page.locator('#filePreview')).toBeHidden();
    await expect(page.locator('#dropZone')).toBeVisible();
  });
});
