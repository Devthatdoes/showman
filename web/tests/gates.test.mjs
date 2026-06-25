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

let owner, other, slug;

before(async () => {
  owner = await signup(`owner_${rand()}@test.local`);
  other = await signup(`other_${rand()}@test.local`);
  assert.ok(owner.userId, "owner signup should return a user id");
  assert.ok(other.userId, "other signup should return a user id");
  slug = `ci-artist-${rand()}`;
  await pool.query(
    "insert into artist_profiles (slug, stage_name, genres, owner_user_id) values ($1, $2, $3::jsonb, $4)",
    [slug, "CI Test Artist", JSON.stringify(["techno"]), owner.userId],
  );
});

after(async () => {
  await pool.query("delete from artist_profiles where slug = $1", [slug]);
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
