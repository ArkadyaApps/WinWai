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
  category: string;
  sponsored: boolean;
  contactInfo?: string;
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
  prizesAvailable: number;
  prizesRemaining: number;
  ticketCost: number;
  drawDate: string;
  active: boolean;
  totalEntries: number;
  createdAt: string;
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