import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import type { Database } from "./db/client";
import { userSessions, users } from "../db/schema";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/** True for the old unsalted-SHA256 hashes some accounts may still carry
 * over from the Mongo/FastAPI backend at migration time; bcrypt hashes
 * always start with "$2". */
export function isLegacySha256Hash(hash: string): boolean {
  return !hash.startsWith("$2");
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Verifies against either a bcrypt hash or a legacy unsalted-SHA256 hash. */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isLegacySha256Hash(hash)) {
    return (await sha256Hex(password)) === hash;
  }
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}

/** URL-safe random token, equivalent to Python's secrets.token_urlsafe(32). */
export function generateResetToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function isAdminEmail(email: string, env: { ADMIN_EMAILS?: string }): boolean {
  const list = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export async function createSession(db: Database, userId: string): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(userSessions).values({ sessionToken, userId, expiresAt });
  return { sessionToken, expiresAt };
}

export type CurrentUser = typeof users.$inferSelect;

export async function getCurrentUser(db: Database, authorizationHeader: string | null): Promise<CurrentUser | null> {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice("Bearer ".length);
  if (!token) return null;

  const session = await db.query.userSessions.findFirst({ where: eq(userSessions.sessionToken, token) });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;

  const user = await db.query.users.findFirst({ where: eq(users.id, session.userId) });
  return user ?? null;
}

/** Throws a Response-shaped error the caller should return directly. */
export class HttpError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
  }
}

export function jsonError(status: number, detail: string): Response {
  return new Response(JSON.stringify({ error: detail }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function requireUser(db: Database, request: Request): Promise<CurrentUser> {
  const user = await getCurrentUser(db, request.headers.get("Authorization"));
  if (!user) throw new HttpError(401, "Not authenticated");
  return user;
}

export async function requireAdmin(db: Database, request: Request): Promise<CurrentUser> {
  const user = await requireUser(db, request);
  if (user.role !== "admin") throw new HttpError(403, "Admin access required");
  return user;
}
