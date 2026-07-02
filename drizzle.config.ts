import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next reads .env.local; drizzle-kit doesn't by default. Load it for CLI runs.
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
