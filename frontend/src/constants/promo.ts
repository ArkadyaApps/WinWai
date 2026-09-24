// Launch promotion: every new account created before this moment gets a free
// ticket (granted by the API, see api/src/lib/promo.ts - keep the two in sync).
// 00:00 on 1 Jan 2027 in Bangkok = the end of 31 Dec 2026 in Thailand.
export const SIGNUP_BONUS_ENDS_AT = new Date('2027-01-01T00:00:00+07:00');
