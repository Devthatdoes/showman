// Authorization / ownership gate tests.
// These exercise the real HTTP surface against a running app + Postgres, so they catch
// behavior regressions (e.g. "create works while signed out", "non-owner can manage")
// that typecheck/lint/build cannot. Run with a server up: `node --test tests/gates.test.mjs`
// (CI wraps this with start-server-and-test). Requires DATABASE_URL and a reachable BASE_URL.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const rand = () => Math.random().toString(36).slice(2, 10);

async function signup(email) {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    // Better Auth enforces an Origin check (CSRF) on auth POSTs; send the app origin.
    headers: { "content-type": "application/json", origin: BASE },
    body: JSON.stringify({ email, password: "supersecret123", name: "Test" }),
  });
  const set = res.headers.getSetCookie?.() ?? [];
  const cookie = set.map((c) => c.split(";")[0]).join("; ");
  const body = await res.json().catch(() => ({}));
  return { cookie, userId: body?.user?.id };
}

// fetch follows redirects by default, so res.url is the final landing URL.
const visit = (path, cookie) =>
  fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {} });

let owner, other, outsider, slug, incompleteSlug, imageOnlySlug, bookerProfileId, bookingRequestId, acceptedRequestId, draftRequestId;

before(async () => {
  owner = await signup(`owner_${rand()}@test.local`);
  other = await signup(`other_${rand()}@test.local`);
  outsider = await signup(`outsider_${rand()}@test.local`);
  assert.ok(owner.userId, "owner signup should return a user id");
  assert.ok(other.userId, "other signup should return a user id");
  assert.ok(outsider.userId, "outsider signup should return a user id");
  slug = `ci-artist-${rand()}`;
  incompleteSlug = `ci-incomplete-${rand()}`;
  imageOnlySlug = `ci-image-only-${rand()}`;
  await pool.query(
    "insert into artist_profiles (slug, stage_name, image_url, primary_genre, genres, owner_user_id) values ($1, $2, $3, $4, $5::jsonb, $6)",
    [slug, "CI Test Artist", "/uploads/artists/ci-test.jpg", "Electronic", JSON.stringify(["Electronic", "techno"]), owner.userId],
  );
  await pool.query(
    "insert into artist_profiles (slug, stage_name, genres, owner_user_id) values ($1, $2, $3::jsonb, $4)",
    [incompleteSlug, "CI Incomplete Artist", JSON.stringify(["draft"]), owner.userId],
  );
  await pool.query(
    "insert into artist_profiles (slug, stage_name, image_url, genres, owner_user_id) values ($1, $2, $3, $4::jsonb, $5)",
    [imageOnlySlug, "CI Image Only Artist", "/uploads/artists/ci-image-only.jpg", JSON.stringify(["draft"]), owner.userId],
  );
  await pool.query(
    "insert into availability_windows (artist_id, start_date, end_date, status, market, note) select id, $2, $3, 'open', $4, $5 from artist_profiles where slug = $1",
    [slug, "2031-01-02", "2031-01-04", "Secret Test Market", "Private routing note"],
  );
  const booker = await pool.query(
    "insert into booker_profiles (slug, display_name, owner_user_id, role_title, home_market) values ($1, $2, $3, $4, $5) returning id",
    [`ci-booker-${rand()}`, "CI Test Booker", other.userId, "Talent buyer", "Test Market"],
  );
  bookerProfileId = booker.rows[0].id;
  const request = await pool.query(
    "insert into booking_requests (booker_profile_id, artist_id, status, event_name, event_type, market, pitch) select $1, id, 'request_sent', $3, 'show', $4, $5 from artist_profiles where slug = $2 returning id",
    [bookerProfileId, slug, "CI Test Event", "Test Market", "A structured pitch for the test artist."],
  );
  bookingRequestId = request.rows[0].id;
  const acceptedRequest = await pool.query(
    "insert into booking_requests (booker_profile_id, artist_id, status, event_name, event_type, market, pitch) select $1, id, 'accepted', $3, 'show', $4, $5 from artist_profiles where slug = $2 returning id",
    [bookerProfileId, slug, "CI Accepted Event", "Test Market", "An already accepted pitch for the test artist."],
  );
  acceptedRequestId = acceptedRequest.rows[0].id;
  const draftRequest = await pool.query(
    "insert into booking_requests (booker_profile_id, artist_id, status, event_name, event_type, market, pitch) select $1, id, 'draft', $3, 'show', $4, $5 from artist_profiles where slug = $2 returning id",
    [bookerProfileId, slug, "CI Draft Event", "Test Market", "A private unsent draft pitch."],
  );
  draftRequestId = draftRequest.rows[0].id;
});

after(async () => {
  if (draftRequestId) await pool.query("delete from booking_requests where id = $1", [draftRequestId]);
  if (acceptedRequestId) await pool.query("delete from booking_requests where id = $1", [acceptedRequestId]);
  if (bookingRequestId) await pool.query("delete from booking_requests where id = $1", [bookingRequestId]);
  if (bookerProfileId) await pool.query("delete from booker_profiles where id = $1", [bookerProfileId]);
  await pool.query("delete from artist_profiles where slug in ($1, $2, $3)", [slug, incompleteSlug, imageOnlySlug]);
  await pool.query("delete from \"user\" where email like '%@test.local'");
  await pool.end();
});

test("anonymous: creating a profile requires sign-in", async () => {
  const res = await visit("/artists/new");
  assert.match(res.url, /\/sign-in/, "anonymous should be redirected to sign-in");
});

test("anonymous: /account requires sign-in", async () => {
  const res = await visit("/account");
  assert.match(res.url, /\/sign-in/);
});

test("anonymous: a profile is publicly viewable", async () => {
  const res = await visit(`/artists/${slug}`);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith(`/artists/${slug}`), "should stay on the public profile");
});

test("anonymous: incomplete artist profiles are not public", async () => {
  const res = await visit(`/artists/${incompleteSlug}`);
  assert.equal(res.status, 404);
});

test("anonymous: image-only artist profiles are not public", async () => {
  const res = await visit(`/artists/${imageOnlySlug}`);
  assert.equal(res.status, 404);
});

test("anonymous: directory hides incomplete artist profiles", async () => {
  const res = await visit("/artists");
  const body = await res.text();
  assert.match(body, /CI Test Artist/);
  assert.doesNotMatch(body, /CI Incomplete Artist/);
  assert.doesNotMatch(body, /CI Image Only Artist/);
});

test("anonymous: public profile does not expose availability details", async () => {
  const res = await visit(`/artists/${slug}`);
  const body = await res.text();
  assert.doesNotMatch(body, /Secret Test Market/);
  assert.doesNotMatch(body, /Private routing note/);
  assert.doesNotMatch(body, /2031/);
});

test("owner: can open the edit page", async () => {
  const res = await visit(`/artists/${slug}/edit`, owner.cookie);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith("/edit"), "owner should reach the edit page");
});

test("non-owner: is redirected away from the edit page", async () => {
  const res = await visit(`/artists/${slug}/edit`, other.cookie);
  assert.ok(!res.url.endsWith("/edit"), "a signed-in non-owner must not reach edit");
});

test("anonymous: is redirected away from the edit page", async () => {
  const res = await visit(`/artists/${slug}/edit`);
  assert.ok(!res.url.endsWith("/edit"));
});

test("owner: can open availability management", async () => {
  const res = await visit(`/artists/${slug}/availability`, owner.cookie);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith("/availability"));
});

test("non-owner: is redirected away from availability management", async () => {
  const res = await visit(`/artists/${slug}/availability`, other.cookie);
  assert.ok(!res.url.endsWith("/availability"), "a non-owner must not manage availability");
});

test("owner: team dashboard shows inbound request for managed artist", async () => {
  const res = await visit("/team", owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /CI Test Event/);
  assert.match(body, /CI Test Booker/);
});

test("non-owner: team dashboard does not show another artist's inbound request", async () => {
  const res = await visit("/team", outsider.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.doesNotMatch(body, /CI Test Event/);
  assert.doesNotMatch(body, /CI Test Booker/);
});

test("booker: dashboard shows their request workflow", async () => {
  const res = await visit("/booker", other.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /CI Test Booker/);
  assert.match(body, /CI Test Event/);
  assert.match(body, /CI Test Artist/);
});

test("signed-in user without booker profile is sent toward onboarding", async () => {
  const res = await visit("/booker", owner.cookie);
  const body = await res.text();
  assert.match(body, /Create your booker profile first/);
});

test("owner: a sent request exposes accept and decline controls", async () => {
  const res = await visit("/team", owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /CI Test Event/);
  assert.match(body, /Accept/);
  assert.match(body, /Decline/);
});

test("owner: an accepted request shows as accepted, not as a pending control", async () => {
  const res = await visit("/team", owner.cookie);
  const body = await res.text();
  assert.match(body, /CI Accepted Event/);
  assert.match(body, /Accepted in principle/);
});

test("booker: dashboard reflects an accepted request", async () => {
  const res = await visit("/booker", other.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /CI Accepted Event/);
  assert.match(body, /accepted/i);
});

test("privacy: a booker's unsent draft never reaches the artist team queue", async () => {
  const res = await visit("/team", owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.doesNotMatch(body, /CI Draft Event/);
  assert.doesNotMatch(body, /A private unsent draft pitch/);
});
