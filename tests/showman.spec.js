// @ts-check
import { test, expect } from '@playwright/test';
import pg from 'pg';

// DB-backed flows (deletion guard, sign-up intent) assert real rows, so they
// need DATABASE_URL — export it before running (CI injects it; locally:
// `set -a; source web/.env; set +a`). The read-only UI tests above run without it.
const DATABASE_URL = process.env.DATABASE_URL;

/** @type {pg.Pool | undefined} */
let pool;
function db() {
  pool ??= new pg.Pool({ connectionString: DATABASE_URL });
  return pool;
}
test.afterAll(async () => {
  await pool?.end();
  pool = undefined;
});

const rand = () => Math.random().toString(36).slice(2, 10);

/**
 * Signs up through the real auth API using the page's cookie jar, so the
 * browser session belongs to this user afterwards. Returns the user id.
 * @param {import('@playwright/test').Page} page
 * @param {string | undefined} baseURL
 * @param {string} email
 */
async function signUpAs(page, baseURL, email) {
  const res = await page.request.post('/api/auth/sign-up/email', {
    // Better Auth enforces an Origin check (CSRF) on auth POSTs.
    headers: { origin: baseURL ?? 'http://localhost:3000' },
    data: { email, password: 'supersecret123', name: 'PW Test' },
  });
  expect(res.ok(), `sign-up should succeed for ${email}`).toBeTruthy();
  const body = await res.json();
  return body.user.id;
}

/**
 * @param {{ slug: string, ownerUserId: string, orgId?: string }} input
 * @returns {Promise<string>} artist id
 */
async function seedArtist({ slug, ownerUserId, orgId }) {
  const result = await db().query(
    "insert into artist_profiles (slug, stage_name, image_url, primary_genre, genres, owner_user_id, org_id) values ($1, $2, '/uploads/artists/pw-test.jpg', 'Electronic', '[\"Electronic\"]'::jsonb, $3, $4) returning id",
    [slug, `PW Artist ${slug}`, ownerUserId, orgId ?? null],
  );
  return result.rows[0].id;
}

/** Deletes only the exact users this test created — the two Playwright
 * projects run in parallel, so wildcard cleanup would nuke each other's rows.
 * @param {string[]} emails */
async function deleteUsers(emails) {
  if (emails.length) await db().query('delete from "user" where email = any($1)', [emails]);
}

test('landing surfaces the artist gallery as its discovery entry point', async ({ page }, testInfo) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: /book the rawest artists/i })).toBeVisible();

  // The redesigned landing routes discovery into the on-page artist gallery
  // (the search-driven directory flow is covered by the /artists test below).
  const exploreGallery = page.locator('a[href="#artists"]');
  await expect(exploreGallery).toBeVisible();
  await expect(exploreGallery).toHaveText(/explore gallery/i);
  await expect(page.locator('#artists')).toBeAttached();

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

test.describe('artist deletion guard', () => {
  test.skip(!DATABASE_URL, 'DATABASE_URL is required for DB-backed deletion tests');

  test('deleting an artist with booking history is refused with a message', async ({ page, baseURL }) => {
    const suffix = rand();
    const email = `pw_del_owner_${suffix}@test.local`;
    const slug = `pw-del-blocked-${suffix}`;
    let artistId, bookerProfileId;
    try {
      const userId = await signUpAs(page, baseURL, email);
      artistId = await seedArtist({ slug, ownerUserId: userId });
      const booker = await db().query(
        "insert into booker_profiles (slug, display_name, owner_user_id) values ($1, 'PW Booker', $2) returning id",
        [`pw-booker-${suffix}`, userId],
      );
      bookerProfileId = booker.rows[0].id;
      await db().query(
        "insert into booking_requests (booker_profile_id, artist_id, status, event_name, event_type, market, pitch) values ($1, $2, 'request_sent', 'PW Event', 'show', 'PW Market', 'A pitch.')",
        [bookerProfileId, artistId],
      );

      await page.goto(`/artists/${slug}/edit`);
      await page.getByRole('button', { name: /delete profile/i }).click();

      // Refusal, not a 500: back on the edit page with the explanation.
      await expect(page).toHaveURL(new RegExp(`/artists/${slug}/edit\\?error=has-bookings`));
      await expect(page.getByText(/can't be deleted because it has booking requests/i)).toBeVisible();

      const artistRow = await db().query('select 1 from artist_profiles where id = $1', [artistId]);
      expect(artistRow.rowCount).toBe(1);
      const requestRow = await db().query('select 1 from booking_requests where artist_id = $1', [artistId]);
      expect(requestRow.rowCount).toBe(1);
    } finally {
      if (artistId) await db().query('delete from booking_requests where artist_id = $1', [artistId]);
      if (bookerProfileId) await db().query('delete from booker_profiles where id = $1', [bookerProfileId]);
      if (artistId) await db().query('delete from artist_profiles where id = $1', [artistId]);
      await deleteUsers([email]);
    }
  });

  test('deleting an artist without bookings still works, availability windows included', async ({ page, baseURL }) => {
    const suffix = rand();
    const email = `pw_del_clean_${suffix}@test.local`;
    const slug = `pw-del-clean-${suffix}`;
    let artistId;
    try {
      const userId = await signUpAs(page, baseURL, email);
      artistId = await seedArtist({ slug, ownerUserId: userId });
      await db().query(
        "insert into availability_windows (artist_id, start_date, end_date, status) values ($1, '2031-05-01', '2031-05-03', 'open')",
        [artistId],
      );

      await page.goto(`/artists/${slug}/edit`);
      await page.getByRole('button', { name: /delete profile/i }).click();

      // The refusal catch must not swallow the success redirect.
      await expect(page).toHaveURL(/\/artists$/);
      const artistRow = await db().query('select 1 from artist_profiles where id = $1', [artistId]);
      expect(artistRow.rowCount).toBe(0);
      const windows = await db().query('select 1 from availability_windows where artist_id = $1', [artistId]);
      expect(windows.rowCount).toBe(0);
    } finally {
      if (artistId) await db().query('delete from artist_profiles where id = $1', [artistId]);
      await deleteUsers([email]);
    }
  });

  test('an active org agent can delete a request-free artist of their org', async ({ page, baseURL }) => {
    const suffix = rand();
    const ownerEmail = `pw_del_orgowner_${suffix}@test.local`;
    const agentEmail = `pw_del_agent_${suffix}@test.local`;
    const slug = `pw-del-agent-${suffix}`;
    let artistId, orgId;
    try {
      const ownerId = await signUpAs(page, baseURL, ownerEmail);
      // Second sign-up replaces the session cookie: the browser is now the agent.
      const agentId = await signUpAs(page, baseURL, agentEmail);
      const org = await db().query(
        "insert into orgs (slug, name, type, owner_user_id) values ($1, 'PW Org', 'management', $2) returning id",
        [`pw-org-${suffix}`, ownerId],
      );
      orgId = org.rows[0].id;
      await db().query(
        "insert into memberships (user_id, org_id, role, status) values ($1, $3, 'owner', 'active'), ($2, $3, 'agent', 'active')",
        [ownerId, agentId, orgId],
      );
      artistId = await seedArtist({ slug, ownerUserId: ownerId, orgId });

      await page.goto(`/artists/${slug}/edit`);
      await page.getByRole('button', { name: /delete profile/i }).click();

      await expect(page).toHaveURL(/\/artists$/);
      const artistRow = await db().query('select 1 from artist_profiles where id = $1', [artistId]);
      expect(artistRow.rowCount).toBe(0);
    } finally {
      if (artistId) await db().query('delete from artist_profiles where id = $1', [artistId]);
      if (orgId) {
        await db().query('delete from memberships where org_id = $1', [orgId]);
        await db().query('delete from orgs where id = $1', [orgId]);
      }
      await deleteUsers([ownerEmail, agentEmail]);
    }
  });
});
