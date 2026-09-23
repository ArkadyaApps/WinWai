import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text, index } from "drizzle-orm/sqlite-core";

const nowMs = sql`(unixepoch() * 1000)`;

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    picture: text("picture"),
    phone: text("phone"),
    passwordHash: text("password_hash"),
    tickets: integer("tickets").notNull().default(50),
    role: text("role").notNull().default("user"), // "user" | "admin"
    dailyStreak: integer("daily_streak").notNull().default(0),
    lastLogin: integer("last_login", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
    resetToken: text("reset_token"),
    resetTokenExpiry: integer("reset_token_expiry", { mode: "timestamp_ms" }),
    usedReferralCode: integer("used_referral_code", { mode: "boolean" }).notNull().default(false),
    referredBy: text("referred_by"),
  },
  (t) => ({
    resetTokenIdx: index("users_reset_token_idx").on(t.resetToken),
  })
);

export const userSessions = sqliteTable(
  "user_sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
  },
  (t) => ({
    userIdx: index("user_sessions_user_id_idx").on(t.userId),
  })
);

export const partners = sqliteTable("partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  logo: text("logo"),
  photo: text("photo"),
  category: text("category").notNull(), // food | hotel | spa
  sponsored: integer("sponsored", { mode: "boolean" }).notNull().default(false),
  contactInfo: text("contact_info"),
  email: text("email"),
  whatsapp: text("whatsapp"),
  line: text("line"),
  address: text("address"),
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
});

export const raffles = sqliteTable(
  "raffles",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    image: text("image"),
    category: text("category").notNull(),
    partnerId: text("partner_id").notNull().references(() => partners.id),
    partnerName: text("partner_name"),
    location: text("location"),
    address: text("address"),
    prizesAvailable: integer("prizes_available").notNull(),
    prizesRemaining: integer("prizes_remaining").notNull(),
    ticketCost: integer("ticket_cost").notNull().default(10),
    prizeValue: real("prize_value").notNull().default(0),
    prizeValueUsd: real("prize_value_usd").notNull().default(0),
    currency: text("currency").notNull().default("THB"),
    gamePrice: real("game_price").notNull().default(0),
    drawDate: integer("draw_date", { mode: "timestamp_ms" }).notNull(),
    minimumDrawDate: integer("minimum_draw_date", { mode: "timestamp_ms" }),
    lastExtensionDate: integer("last_extension_date", { mode: "timestamp_ms" }),
    validityMonths: integer("validity_months").notNull().default(3),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    totalEntries: integer("total_entries").notNull().default(0),
    totalTicketsCollected: integer("total_tickets_collected").notNull().default(0),
    drawStatus: text("draw_status").notNull().default("pending"), // pending | eligible | drawn | cancelled
    isDigitalPrize: integer("is_digital_prize", { mode: "boolean" }).notNull().default(false),
    // D1/SQLite has no native array type - stored as JSON text, typed via Drizzle's json mode.
    secretCodes: text("secret_codes", { mode: "json" }).$type<string[]>().notNull().default([]),
    usedSecretCodes: text("used_secret_codes", { mode: "json" }).$type<string[]>().notNull().default([]),
    language: text("language").notNull().default("en"), // en | th | fr | ar
    allowedCountries: text("allowed_countries", { mode: "json" }).$type<string[]>().notNull().default(["TH"]),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
    drawnAt: integer("drawn_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    activeDrawIdx: index("raffles_active_draw_idx").on(t.active, t.drawStatus, t.drawDate),
    categoryIdx: index("raffles_category_idx").on(t.category),
  })
);

export const entries = sqliteTable(
  "entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    raffleId: text("raffle_id").notNull().references(() => raffles.id),
    raffleTitle: text("raffle_title"),
    ticketsUsed: integer("tickets_used").notNull(),
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull().default(nowMs),
  },
  (t) => ({
    userIdx: index("entries_user_id_idx").on(t.userId),
    raffleIdx: index("entries_raffle_id_idx").on(t.raffleId),
  })
);

export const vouchers = sqliteTable(
  "vouchers",
  {
    id: text("id").primaryKey(),
    voucherRef: text("voucher_ref").notNull().unique(),
    userId: text("user_id").notNull().references(() => users.id),
    userName: text("user_name").notNull(),
    userEmail: text("user_email").notNull(),
    raffleId: text("raffle_id").notNull().references(() => raffles.id),
    raffleTitle: text("raffle_title").notNull(),
    partnerId: text("partner_id").notNull(),
    partnerName: text("partner_name").notNull(),
    prizeValue: real("prize_value").notNull(),
    currency: text("currency").notNull(),
    isDigitalPrize: integer("is_digital_prize", { mode: "boolean" }).notNull(),
    secretCode: text("secret_code"),
    verificationCode: text("verification_code").notNull(),
    status: text("status").notNull().default("active"), // active | redeemed | expired | cancelled
    validUntil: integer("valid_until", { mode: "timestamp_ms" }).notNull(),
    redeemedAt: integer("redeemed_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
    partnerEmail: text("partner_email"),
    partnerWhatsapp: text("partner_whatsapp"),
    partnerLine: text("partner_line"),
    partnerAddress: text("partner_address"),
  },
  (t) => ({
    userIdx: index("vouchers_user_id_idx").on(t.userId),
  })
);

export const winners = sqliteTable(
  "winners",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    raffleId: text("raffle_id").notNull().references(() => raffles.id),
    entryId: text("entry_id").notNull().references(() => entries.id),
    voucherId: text("voucher_id").notNull().references(() => vouchers.id),
    drawDate: integer("draw_date", { mode: "timestamp_ms" }).notNull(),
    notified: integer("notified", { mode: "boolean" }).notNull().default(false),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
  },
  (t) => ({
    userIdx: index("winners_user_id_idx").on(t.userId),
  })
);

export const rewards = sqliteTable(
  "rewards",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id),
    raffleId: text("raffle_id").notNull().references(() => raffles.id),
    raffleTitle: text("raffle_title").notNull(),
    prizeDetails: text("prize_details").notNull(),
    partnerName: text("partner_name").notNull(),
    claimStatus: text("claim_status").notNull().default("unclaimed"), // unclaimed | pending | claimed
    contactInfo: text("contact_info"),
    wonAt: integer("won_at", { mode: "timestamp_ms" }).notNull().default(nowMs),
    claimedAt: integer("claimed_at", { mode: "timestamp_ms" }),
  },
  (t) => ({
    userIdx: index("rewards_user_id_idx").on(t.userId),
  })
);

// Records both client-reported ad completions and (once wired up) verified
// Ad Placement API / AdMob SSV callbacks. `source` distinguishes which.
export const adRewards = sqliteTable(
  "ad_rewards",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull().references(() => users.id),
    transactionId: text("transaction_id").notNull().unique(),
    tickets: integer("tickets").notNull(),
    rewardItem: text("reward_item"),
    source: text("source").notNull().default("client"), // "client" | "ssv"
    timestamp: integer("timestamp", { mode: "timestamp_ms" }).notNull().default(nowMs),
  },
  (t) => ({
    userTimeIdx: index("ad_rewards_user_id_timestamp_idx").on(t.userId, t.timestamp),
  })
);
