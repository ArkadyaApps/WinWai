import type { APIRoute } from "astro";
import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb } from "../../../../lib/db/client";
import { users } from "../../../../db/schema";
import { hashPassword, requireAdmin } from "../../../../lib/auth";
import { json, handleError } from "../../../../lib/respond";
import { CreateUserSchema } from "../../../../lib/validations/admin";

export const GET: APIRoute = async ({ request, url, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Number(url.searchParams.get("limit") ?? 20);
    const q = url.searchParams.get("q");
    const role = url.searchParams.get("role");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (q) conditions.push(or(like(users.name, `%${q}%`), like(users.email, `%${q}%`)));
    if (role === "user" || role === "admin") conditions.push(eq(users.role, role));

    const results = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return json(
      results.map(({ passwordHash, resetToken, resetTokenExpiry, ...u }) => u)
    );
  } catch (e) {
    return handleError(e);
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals.runtime.env);
    await requireAdmin(db, request);

    const parsed = CreateUserSchema.safeParse(await request.json());
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { name, email, phone, password, role, tickets } = parsed.data;

    const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (existing) return json({ error: "User with this email already exists" }, 400);

    const newUser = {
      id: crypto.randomUUID(),
      name,
      email,
      phone: phone ?? null,
      passwordHash: await hashPassword(password),
      role,
      tickets,
      dailyStreak: 0,
      lastLogin: new Date(),
    };
    await db.insert(users).values(newUser);

    const { passwordHash: _ph, ...safeUser } = newUser;
    return json(safeUser);
  } catch (e) {
    return handleError(e);
  }
};
