// @ts-check
import { test, expect } from '@playwright/test';

test('landing routes discovery intent to the artist directory', async ({ page }, testInfo) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /book the rawest artists/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /^artists$/i })).toHaveAttribute('href', '/artists');

  await page.getByRole('searchbox', { name: /search artists/i }).fill('rage');
  await page.getByRole('button', { name: /^search$/i }).click();
  await expect(page).toHaveURL(/\/artists\?q=rage/);

  await page.screenshot({
    path: `test-results/showman-landing-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test('artist directory exposes app search controls', async ({ page }, testInfo) => {
  await page.goto('/artists');

  await expect(page.getByRole('heading', { name: /^artists$/i })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: /search artists/i })).toBeVisible();
  await expect(page.getByLabel(/broad genre/i)).toBeVisible();

  await page.screenshot({
    path: `test-results/showman-artists-${testInfo.project.name}.png`,
    fullPage: true,
  });
});

test('landing artist preview stays above the page while scrolling', async ({ page }) => {
  await page.goto('/');

  const firstArtist = page.locator('.raw-artist-card').first();
  if (await firstArtist.count() === 0) {
    test.skip(true, 'No public artist cards are available in this database.');
  }

  await firstArtist.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 1200);
  await expect(dialog).toBeVisible();
  await expect(page.locator('body')).toHaveClass(/raw-modal-open/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(scrollBefore);

  const modalBox = await dialog.boundingBox();
  expect(modalBox).not.toBeNull();
  const topElementIsModal = await page.evaluate(({ x, y }) => {
    const element = document.elementFromPoint(x, y);
    return Boolean(element?.closest('.raw-modal, .raw-artist-preview'));
  }, {
    x: Math.round((modalBox?.x ?? 0) + (modalBox?.width ?? 0) / 2),
    y: Math.round((modalBox?.y ?? 0) + Math.min(80, (modalBox?.height ?? 0) / 2)),
  });
  expect(topElementIsModal).toBeTruthy();

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.locator('body')).not.toHaveClass(/raw-modal-open/);
});

test('request access enters the booker onboarding lane', async ({ page }) => {
  await page.goto('/sign-up?role=booker&artist=test-artist');

  await expect(page.getByRole('radio', { name: /booker \/ promoter/i })).toBeChecked();
  await expect(page.getByRole('radio', { name: /artist \/ team/i })).not.toBeChecked();
});
