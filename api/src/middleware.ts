import { defineMiddleware } from "astro:middleware";

// The frontend (winwai.online / winwai.pages.dev / EAS-built app, all
// separate origins from this API) needs CORS to call these routes from a
// browser at all. Auth here is a Bearer token the client must read from its
// own storage and attach explicitly (not a cookie), so a permissive origin
// doesn't expose the usual cross-site-cookie risk a wildcard would with
// cookie-based auth.
function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  const response = await next();
  const headers = corsHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
});
