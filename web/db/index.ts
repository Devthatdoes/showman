import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse one pool across hot reloads in dev to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __showmanPool?: Pool };

const pool =
  globalForDb.__showmanPool ??
  new Pool({ connectionString: process.env.DATABASE_URL });

if (process.env.NODE_ENV !== "production") globalForDb.__showmanPool = pool;

export const db = drizzle(pool, { schema });
