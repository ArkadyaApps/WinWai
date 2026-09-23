/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

interface Env {
  DB: D1Database;
  RESEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  ADMIN_EMAILS: string; // comma-separated list, auto-granted admin on first sign-in
  APP_URL: string; // e.g. https://app.winwai.online - used to build the reset-password link
  GOOGLE_PLACES_API_KEY: string;
}
