// Launch promotion: every account created before this moment starts with a
// free ticket. It is 00:00 on 1 Jan 2027 in Bangkok (UTC+7), i.e. the end of
// 31 Dec 2026 in Thailand, the app's market. Existing accounts are not
// back-filled. Keep in sync with frontend/src/constants/promo.ts (the landing
// page banner).
export const SIGNUP_BONUS_ENDS_AT = new Date("2027-01-01T00:00:00+07:00");
export const SIGNUP_BONUS_TICKETS = 1;

export function getSignupBonusTickets(now: Date = new Date()): number {
  return now.getTime() < SIGNUP_BONUS_ENDS_AT.getTime() ? SIGNUP_BONUS_TICKETS : 0;
}
