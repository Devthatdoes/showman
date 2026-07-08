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

let owner, other, outsider, slug, incompleteSlug, imageOnlySlug, ownerOrgId, bookerProfileId, bookingRequestId, acceptedRequestId, draftRequestId;
let agent, viewer, invitedAgent, crossAgent, orgArtistSlug, crossOrgId;

before(async () => {
  owner = await signup(`owner_${rand()}@test.local`);
  other = await signup(`other_${rand()}@test.local`);
  outsider = await signup(`outsider_${rand()}@test.local`);
  agent = await signup(`agent_${rand()}@test.local`);
  viewer = await signup(`viewer_${rand()}@test.local`);
  invitedAgent = await signup(`invited_agent_${rand()}@test.local`);
  crossAgent = await signup(`cross_agent_${rand()}@test.local`);
  assert.ok(owner.userId, "owner signup should return a user id");
  assert.ok(other.userId, "other signup should return a user id");
  assert.ok(outsider.userId, "outsider signup should return a user id");
  assert.ok(agent.userId && viewer.userId && invitedAgent.userId && crossAgent.userId, "org test signups should return user ids");
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
  const ownerOrg = await pool.query(
    "insert into orgs (slug, name, type, owner_user_id) values ($1, $2, 'management', $3) returning id",
    [`ci-owner-org-${rand()}`, "CI Owner Org", owner.userId],
  );
  ownerOrgId = ownerOrg.rows[0].id;
  await pool.query(
    "insert into memberships (user_id, org_id, role, status) values ($1, $2, 'owner', 'active')",
    [owner.userId, ownerOrgId],
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

  // Org-managed artist: page access must match the mutation layer (canManageArtist),
  // so seed the full membership matrix — agent-active (allowed), viewer-active,
  // agent-invited, and an active agent of a DIFFERENT org (all denied).
  orgArtistSlug = `ci-org-artist-${rand()}`;
  await pool.query(
    "insert into artist_profiles (slug, stage_name, image_url, primary_genre, genres, owner_user_id, org_id) values ($1, $2, $3, $4, $5::jsonb, $6, $7)",
    [orgArtistSlug, "CI Org Artist", "/uploads/artists/ci-org.jpg", "Electronic", JSON.stringify(["Electronic"]), owner.userId, ownerOrgId],
  );
  await pool.query(
    "insert into memberships (user_id, org_id, role, status) values ($1, $4, 'agent', 'active'), ($2, $4, 'viewer', 'active'), ($3, $4, 'agent', 'invited')",
    [agent.userId, viewer.userId, invitedAgent.userId, ownerOrgId],
  );
  const crossOrg = await pool.query(
    "insert into orgs (slug, name, type, owner_user_id) values ($1, $2, 'management', $3) returning id",
    [`ci-cross-org-${rand()}`, "CI Cross Org", crossAgent.userId],
  );
  crossOrgId = crossOrg.rows[0].id;
  await pool.query(
    "insert into memberships (user_id, org_id, role, status) values ($1, $2, 'agent', 'active')",
    [crossAgent.userId, crossOrgId],
  );
});

after(async () => {
  if (draftRequestId) await pool.query("delete from booking_requests where id = $1", [draftRequestId]);
  if (acceptedRequestId) await pool.query("delete from booking_requests where id = $1", [acceptedRequestId]);
  if (bookingRequestId) await pool.query("delete from booking_requests where id = $1", [bookingRequestId]);
  if (bookerProfileId) await pool.query("delete from booker_profiles where id = $1", [bookerProfileId]);
  if (orgArtistSlug) await pool.query("delete from artist_profiles where slug = $1", [orgArtistSlug]);
  if (ownerOrgId) await pool.query("delete from memberships where org_id = $1", [ownerOrgId]);
  if (ownerOrgId) await pool.query("delete from orgs where id = $1", [ownerOrgId]);
  if (crossOrgId) await pool.query("delete from memberships where org_id = $1", [crossOrgId]);
  if (crossOrgId) await pool.query("delete from orgs where id = $1", [crossOrgId]);
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

test("anonymous: /booking is a public booking entry surface", async () => {
  const res = await visit("/booking");
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /Start booking setup/);
  assert.match(body, /Browse artists/);
  assert.doesNotMatch(body, /Open dashboard/);
});

test("anonymous: homepage points booking traffic to /booking", async () => {
  const res = await visit("/");
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /<a[^>]*href="\/booking"[^>]*>Booking<\/a>/);
  assert.doesNotMatch(body, /href="\/#bookers"/);
  assert.match(body, />Booking</);
  assert.doesNotMatch(body, /Bookers/);
  assert.doesNotMatch(body, /Join as Booker/);
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

test("org agent: can open the edit page for an org-managed artist", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/edit`, agent.cookie);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith("/edit"), "an active org agent should reach the edit page");
});

test("org agent: can open availability management for an org-managed artist", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/availability`, agent.cookie);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith("/availability"), "an active org agent should reach availability");
});

test("org owner: still reaches the edit page for an org-managed artist", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/edit`, owner.cookie);
  assert.equal(res.status, 200);
  assert.ok(res.url.endsWith("/edit"));
});

test("org viewer: is redirected away from the edit page", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/edit`, viewer.cookie);
  assert.ok(!res.url.endsWith("/edit"), "a viewer-role member must not reach edit");
});

test("org viewer: is redirected away from availability management", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/availability`, viewer.cookie);
  assert.ok(!res.url.endsWith("/availability"), "a viewer-role member must not manage availability");
});

test("invited (not active) agent: is redirected away from the edit page", async () => {
  const res = await visit(`/artists/${orgArtistSlug}/edit`, invitedAgent.cookie);
  assert.ok(!res.url.endsWith("/edit"), "a non-active membership must not grant edit access");
});

test("cross-org agent: an active agent of a different org is redirected away", async () => {
  const resEdit = await visit(`/artists/${orgArtistSlug}/edit`, crossAgent.cookie);
  assert.ok(!resEdit.url.endsWith("/edit"), "agent status in another org must not grant edit access");
  const resAvail = await visit(`/artists/${orgArtistSlug}/availability`, crossAgent.cookie);
  assert.ok(!resAvail.url.endsWith("/availability"), "agent status in another org must not grant availability access");
});

test("owner: edit page explains a refused delete via the error query param", async () => {
  const res = await visit(`/artists/${slug}/edit?error=has-bookings`, owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /can(&#x27;|')t be deleted because it has booking requests/);
});

test("owner: edit page shows no refusal message without the error query param", async () => {
  const res = await visit(`/artists/${slug}/edit`, owner.cookie);
  const body = await res.text();
  assert.doesNotMatch(body, /can(&#x27;|')t be deleted because it has booking requests/);
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

test("booking entry: artist-team actor is not automatically made into a booker", async () => {
  const before = await pool.query("select count(*)::int as count from booker_profiles where owner_user_id = $1", [owner.userId]);
  const res = await visit("/booking", owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /No booking principal is active yet/);
  assert.match(body, /CI Owner Org/);
  assert.match(body, /Booking capability not assumed/);
  assert.doesNotMatch(body, /Open dashboard/);
  const after = await pool.query("select count(*)::int as count from booker_profiles where owner_user_id = $1", [owner.userId]);
  assert.equal(after.rows[0].count, before.rows[0].count);
});

test("booking entry: existing booker can continue to operational workflow", async () => {
  const res = await visit("/booking", other.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /CI Test Booker/);
  assert.match(body, /Open dashboard/);
  assert.match(body, /Create event brief/);
  assert.match(body, /Browse artists/);
});

test("booker onboarding uses booking-principal language without cross-dashboard shortcuts", async () => {
  const res = await visit("/onboarding?role=booker", owner.cookie);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /Set up your booking profile/);
  assert.match(body, /Browse artists/);
  assert.doesNotMatch(body, /Set up the demand side/);
  assert.doesNotMatch(body, />Team dashboard</);
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
