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

test('request access enters the booker onboarding lane', async ({ page }) => {
  await page.goto('/sign-up?role=booker&artist=test-artist');

  await expect(page.getByRole('radio', { name: /booker \/ promoter/i })).toBeChecked();
  await expect(page.getByRole('radio', { name: /artist \/ team/i })).not.toBeChecked();
});
