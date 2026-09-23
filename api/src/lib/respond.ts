import { HttpError } from "./auth";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function handleError(e: unknown): Response {
  if (e instanceof HttpError) {
    return json({ error: e.detail }, e.status);
  }
  console.error(e);
  return json({ error: "Internal server error" }, 500);
}
