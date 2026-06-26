import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as authSchema from "@/db/auth-schema";

const localPreviewOrigins =
  process.env.NODE_ENV === "production"
    ? []
    : [
        "http://localhost:*",
        "http://127.0.0.1:*",
      ];

const configuredTrustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
  emailAndPassword: { enabled: true },
  trustedOrigins: Array.from(
    new Set([
      ...localPreviewOrigins,
      ...(configuredTrustedOrigins ?? []),
      ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ]),
  ),
  // nextCookies must be the LAST plugin so Set-Cookie headers from server actions are applied.
  plugins: [nextCookies()],
});
