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
  prizeValue: number;
  gamePrice: number;
  drawDate: string;
  validityMonths: number;
  active: boolean;
  totalEntries: number;
  createdAt: string;
}

export interface Voucher {
  id: string;
  voucherRef: string;
  userId: string;
  userName: string;
  userEmail: string;
  raffleId: string;
  raffleTitle: string;
  partnerId: string;
  partnerName: string;
  prizeValue: number;
  currency: string;
  isDigitalPrize: boolean;
  secretCode?: string;
  verificationCode: string;
  status: string;
  validUntil: string;
  redeemedAt?: string;
  createdAt: string;
  partnerEmail?: string;
  partnerWhatsapp?: string;
  partnerLine?: string;
  partnerAddress?: string;
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