import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle client over Neon. Guarded: if DATABASE_URL is unset the app still
 * runs — Kanban lane persistence just no-ops (every item shows its computed
 * lane, drags don't stick) and the board renders a "connect a database"
 * banner. This lets the rest of phase 1 work before Neon is provisioned.
 */
const url = process.env.DATABASE_URL;

export const dbEnabled = Boolean(url);

export const db = url ? drizzle(neon(url), { schema }) : null;
