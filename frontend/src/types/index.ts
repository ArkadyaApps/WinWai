export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  tickets: number;
  role: string;
  dailyStreak: number;
  lastLogin?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  description: string;
  logo?: string;
  photo?: string;
  category: string;
  sponsored: boolean;
  contactInfo?: string;
  // Contact details
  email?: string;
  whatsapp?: string;
  line?: string;
  // Location details
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

export interface Raffle {
  id: string;
  title: string;
  description: string;
  image?: string;
  category: string;
  partnerId: string;
  partnerName?: string;
  location?: string;
  address?: string;
  prizesAvailable: number;
  prizesRemaining: number;
  ticketCost: number;
  drawDate: string;
  validityMonths: number;
  active: boolean;
  totalEntries: number;
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherCode: string;
  userId: string;
  userName: string;
  userEmail: string;
  raffleId: string;
  raffleTitle: string;
  prizeDetails: string;
  partnerId: string;
  partnerName: string;
  category: string;
  issuedAt: string;
  expiresAt: string;
  isRedeemed: boolean;
  redeemedAt?: string;
  location?: string;
  address?: string;
  terms?: string;
}

export interface Reward {
  id: string;
  userId: string;
  raffleId: string;
  raffleTitle: string;
  prizeDetails: string;
  partnerName: string;
  claimStatus: string;
  contactInfo?: string;
  wonAt: string;
  claimedAt?: string;
}

export interface Entry {
  id: string;
  userId: string;
  raffleId: string;
  raffleTitle?: string;
  ticketsUsed: number;
  timestamp: string;
}