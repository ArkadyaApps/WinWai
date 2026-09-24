import { getDb } from "../../api/src/lib/db/client";
import { runDueDraws } from "../../api/src/lib/db/draws";

interface Env {
  DB: D1Database;
}

// Runs every 15 minutes (see wrangler.toml). A round is only drawn once its
// ticket goal was met AND the 1/3/7-day tier delay has elapsed, so most runs
// find nothing due and exit after a single SELECT.
export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(
      (async () => {
        const summary = await runDueDraws(getDb(env));
        console.log(
          JSON.stringify({ drawn: summary.drawn.length, skipped: summary.skipped, errors: summary.errors, at: new Date().toISOString() })
        );
        if (summary.errors.length > 0) console.error("Draw errors:", JSON.stringify(summary.errors));
      })()
    );
  },
};
