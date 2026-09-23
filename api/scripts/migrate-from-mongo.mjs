/**
 * One-time data migration: MongoDB (old FastAPI/Railway backend) -> D1.
 *
 * Requires env vars:
 *   MONGO_URL              - the live Mongo connection string
 *   DB_NAME                - Mongo database name (default: "winwai")
 *   CLOUDFLARE_API_TOKEN    - token with D1:Edit on the target account
 *   CLOUDFLARE_ACCOUNT_ID   - Cloudflare account id
 *   D1_DATABASE_ID          - defaults to the winwai D1 database
 *
 * Run with: node scripts/migrate-from-mongo.mjs
 *
 * Idempotent: uses INSERT OR IGNORE, so it's safe to re-run after a
 * partial failure - already-migrated rows are left untouched.
 * user_sessions is intentionally NOT migrated - sessions are short-lived
 * (7 day expiry) and everyone will simply sign in again on the new backend.
 */
import { MongoClient } from "mongodb";

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || "winwai";
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const D1_DATABASE_ID = process.env.D1_DATABASE_ID || "08ab5fb0-687b-4dad-bdaa-5395bc21ce8a";

if (!MONGO_URL) throw new Error("MONGO_URL is required");
if (!CLOUDFLARE_API_TOKEN) throw new Error("CLOUDFLARE_API_TOKEN is required");
if (!CLOUDFLARE_ACCOUNT_ID) throw new Error("CLOUDFLARE_ACCOUNT_ID is required");

const D1_QUERY_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/d1/database/${D1_DATABASE_ID}/query`;

async function d1Query(sql, params) {
  const res = await fetch(D1_QUERY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`D1 error: ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}

// ---- type coercion helpers ----
const ms = (d) => (d instanceof Date ? d.getTime() : d == null ? null : new Date(d).getTime());
const bool = (b) => (b ? 1 : 0);
const jsonArr = (a) => JSON.stringify(Array.isArray(a) ? a : []);
const orNull = (v) => (v === undefined ? null : v);

async function insertRow(table, columns, row) {
  const placeholders = columns.map(() => "?").join(", ");
  const sql = `INSERT OR IGNORE INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
  const params = columns.map((c) => orNull(row[c]));
  await d1Query(sql, params);
}

async function migrateCollection(db, { name, table, columns, map, orderBy }) {
  const docs = await db.collection(name).find({}).sort(orderBy ? { [orderBy]: 1 } : {}).toArray();
  let ok = 0;
  let failed = 0;
  for (const doc of docs) {
    try {
      await insertRow(table, columns, map(doc));
      ok++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ${name} ${doc.id ?? doc._id}: ${e.message}`);
    }
  }
  console.log(`${name} -> ${table}: ${ok} migrated, ${failed} failed (of ${docs.length})`);
}

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  console.log(`Connected to Mongo db "${DB_NAME}". Migrating to D1 database ${D1_DATABASE_ID}...\n`);

  // Order matters: parents before children (foreign keys).
  await migrateCollection(db, {
    name: "users",
    table: "users",
    columns: [
      "id", "email", "name", "picture", "phone", "password_hash", "tickets", "role",
      "daily_streak", "last_login", "created_at", "reset_token", "reset_token_expiry",
      "used_referral_code", "referred_by",
    ],
    map: (u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      picture: orNull(u.picture),
      phone: orNull(u.phone),
      password_hash: orNull(u.password_hash),
      tickets: u.tickets ?? 0,
      role: u.role ?? "user",
      daily_streak: u.dailyStreak ?? 0,
      last_login: ms(u.lastLogin),
      created_at: ms(u.createdAt) ?? Date.now(),
      reset_token: orNull(u.resetToken),
      reset_token_expiry: ms(u.resetTokenExpiry),
      used_referral_code: bool(u.usedReferralCode),
      referred_by: orNull(u.referredBy),
    }),
  });

  await migrateCollection(db, {
    name: "partners",
    table: "partners",
    columns: [
      "id", "name", "description", "logo", "photo", "category", "sponsored", "contact_info",
      "email", "whatsapp", "line", "address", "location", "latitude", "longitude", "created_at",
    ],
    map: (p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      logo: orNull(p.logo),
      photo: orNull(p.photo),
      category: p.category,
      sponsored: bool(p.sponsored),
      contact_info: orNull(p.contactInfo),
      email: orNull(p.email),
      whatsapp: orNull(p.whatsapp),
      line: orNull(p.line),
      address: orNull(p.address),
      location: orNull(p.location),
      latitude: orNull(p.latitude),
      longitude: orNull(p.longitude),
      created_at: ms(p.createdAt) ?? Date.now(),
    }),
  });

  await migrateCollection(db, {
    name: "raffles",
    table: "raffles",
    columns: [
      "id", "title", "description", "image", "category", "partner_id", "partner_name", "location",
      "address", "prizes_available", "prizes_remaining", "ticket_cost", "prize_value",
      "prize_value_usd", "currency", "game_price", "draw_date", "minimum_draw_date",
      "last_extension_date", "validity_months", "active", "total_entries",
      "total_tickets_collected", "draw_status", "is_digital_prize", "secret_codes",
      "used_secret_codes", "language", "allowed_countries", "created_at", "drawn_at",
    ],
    map: (r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image: orNull(r.image),
      category: r.category,
      partner_id: r.partnerId,
      partner_name: orNull(r.partnerName),
      location: orNull(r.location),
      address: orNull(r.address),
      prizes_available: r.prizesAvailable,
      prizes_remaining: r.prizesRemaining,
      ticket_cost: r.ticketCost ?? 10,
      prize_value: r.prizeValue ?? 0,
      prize_value_usd: r.prizeValueUSD ?? 0,
      currency: r.currency ?? "THB",
      game_price: r.gamePrice ?? 0,
      draw_date: ms(r.drawDate),
      minimum_draw_date: ms(r.minimumDrawDate),
      last_extension_date: ms(r.lastExtensionDate),
      validity_months: r.validityMonths ?? 3,
      active: bool(r.active),
      total_entries: r.totalEntries ?? 0,
      total_tickets_collected: r.totalTicketsCollected ?? 0,
      draw_status: r.drawStatus ?? "pending",
      is_digital_prize: bool(r.isDigitalPrize),
      secret_codes: jsonArr(r.secretCodes),
      used_secret_codes: jsonArr(r.usedSecretCodes),
      language: r.language ?? "en",
      allowed_countries: jsonArr(r.allowedCountries?.length ? r.allowedCountries : ["TH"]),
      created_at: ms(r.createdAt) ?? Date.now(),
      drawn_at: ms(r.drawnAt),
    }),
  });

  await migrateCollection(db, {
    name: "entries",
    table: "entries",
    columns: ["id", "user_id", "raffle_id", "raffle_title", "tickets_used", "timestamp"],
    map: (e) => ({
      id: e.id,
      user_id: e.userId,
      raffle_id: e.raffleId,
      raffle_title: orNull(e.raffleTitle),
      tickets_used: e.ticketsUsed,
      timestamp: ms(e.timestamp) ?? Date.now(),
    }),
  });

  await migrateCollection(db, {
    name: "vouchers",
    table: "vouchers",
    columns: [
      "id", "voucher_ref", "user_id", "user_name", "user_email", "raffle_id", "raffle_title",
      "partner_id", "partner_name", "prize_value", "currency", "is_digital_prize", "secret_code",
      "verification_code", "status", "valid_until", "redeemed_at", "created_at", "partner_email",
      "partner_whatsapp", "partner_line", "partner_address",
    ],
    map: (v) => ({
      id: v.id,
      voucher_ref: v.voucherRef,
      user_id: v.userId,
      user_name: v.userName,
      user_email: v.userEmail,
      raffle_id: v.raffleId,
      raffle_title: v.raffleTitle,
      partner_id: v.partnerId,
      partner_name: v.partnerName,
      prize_value: v.prizeValue,
      currency: v.currency,
      is_digital_prize: bool(v.isDigitalPrize),
      secret_code: orNull(v.secretCode),
      verification_code: v.verificationCode,
      status: v.status ?? "active",
      valid_until: ms(v.validUntil),
      redeemed_at: ms(v.redeemedAt),
      created_at: ms(v.createdAt) ?? Date.now(),
      partner_email: orNull(v.partnerEmail),
      partner_whatsapp: orNull(v.partnerWhatsapp),
      partner_line: orNull(v.partnerLine),
      partner_address: orNull(v.partnerAddress),
    }),
  });

  await migrateCollection(db, {
    name: "winners",
    table: "winners",
    columns: ["id", "user_id", "raffle_id", "entry_id", "voucher_id", "draw_date", "notified", "created_at"],
    map: (w) => ({
      id: w.id,
      user_id: w.userId,
      raffle_id: w.raffleId,
      entry_id: w.entryId,
      voucher_id: w.voucherId,
      draw_date: ms(w.drawDate),
      notified: bool(w.notified),
      created_at: ms(w.createdAt) ?? Date.now(),
    }),
  });

  await migrateCollection(db, {
    name: "rewards",
    table: "rewards",
    columns: ["id", "user_id", "raffle_id", "raffle_title", "prize_details", "partner_name", "claim_status", "contact_info", "won_at", "claimed_at"],
    map: (r) => ({
      id: r.id,
      user_id: r.userId,
      raffle_id: r.raffleId,
      raffle_title: r.raffleTitle,
      prize_details: r.prizeDetails,
      partner_name: r.partnerName,
      claim_status: r.claimStatus ?? "unclaimed",
      contact_info: orNull(r.contactInfo),
      won_at: ms(r.wonAt) ?? Date.now(),
      claimed_at: ms(r.claimedAt),
    }),
  });

  // ad_rewards has no stable app-level id in Mongo (only _id) - let D1 autoincrement.
  const adRewardDocs = await db.collection("ad_rewards").find({}).toArray();
  let ok = 0, failed = 0;
  for (const doc of adRewardDocs) {
    try {
      await insertRow(
        "ad_rewards",
        ["user_id", "transaction_id", "tickets", "reward_item", "source", "timestamp"],
        {
          user_id: doc.userId,
          transaction_id: doc.transactionId,
          tickets: doc.tickets ?? 1,
          reward_item: orNull(doc.rewardItem),
          source: doc.adNetwork ? "ssv" : "client",
          timestamp: ms(doc.timestamp) ?? Date.now(),
        }
      );
      ok++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ad_rewards ${doc._id}: ${e.message}`);
    }
  }
  console.log(`ad_rewards -> ad_rewards: ${ok} migrated, ${failed} failed (of ${adRewardDocs.length})`);

  await client.close();
  console.log("\nDone.");
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
