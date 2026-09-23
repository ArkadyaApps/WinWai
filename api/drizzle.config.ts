import { defineConfig } from "drizzle-kit";

// `db:generate` only needs dialect+schema+out to turn schema.ts into SQL
// migration files - those get applied to D1 via `wrangler d1 migrations
// apply`, so no Cloudflare credentials are needed here.
export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./migrations",
});
