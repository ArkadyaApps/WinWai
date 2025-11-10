/**
 * WinWai Raffle Backend - AdMob Monetized Raffle System
 * 
 * This Firebase Cloud Function implements an automated raffle draw system
 * that triggers only when BOTH conditions are met:
 * 1. Ad revenue threshold (based on cumulative ad views) is reached
 * 2. Scheduled draw date has arrived or passed
 * 
 * @author WinWai Development Team
 * @version 1.0.0
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// ═══════════════════════════════════════════════════════════════════════════
// 📋 CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // Default eCPM (revenue per 1000 ad impressions) in dollars
  DEFAULT_ECPM: 3,
  
  // Default ad fill rate (90% of ad requests are filled)
  DEFAULT_FILL_RATE: 0.9,
  
  // Safety margin multiplier (10% buffer to ensure prize is covered)
  SAFETY_MARGIN: 1.1,
  
  // Maximum entries to process per batch (for large raffles)
  MAX_BATCH_SIZE: 500,
  
  // Timezone for date operations
  TIMEZONE: 'Asia/Bangkok'
};

// ═══════════════════════════════════════════════════════════════════════════
// 📦 TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface RaffleDocument {
  id: string;
  prizeValue: number;          // Prize value in dollars
  eCPM: number;                // Revenue per 1000 impressions
  fillRate: number;            // Ad fill rate (0-1)
  totalAdViews: number;        // Cumulative ad views
  drawDate: Timestamp;         // Scheduled draw date
  status: 'active' | 'completed' | 'cancelled';
  winnerId: string | null;     // Winner user ID
  title: string;               // Raffle title
  category: string;            // food, hotel, spa
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface EntryDocument {
  raffleId: string;
  userId: string;
  tickets: number;             // Number of tickets for this entry
  enteredAt: Timestamp;
}

interface RaffleHistoryDocument {
  raffleId: string;
  winnerId: string;
  winnerName: string;
  prizeValue: number;
  totalAdViews: number;
  totalEntries: number;
  totalParticipants: number;
  drawDate: Timestamp;
  drawnAt: Timestamp;
  category: string;
  title: string;
}

interface WeightedEntry {
  userId: string;
  tickets: number;
  weight: number;              // Cumulative weight for selection
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎯 MAIN CLOUD FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Scheduled function that runs daily at 12:00 PM Bangkok time
 * Checks all active raffles and triggers draws for eligible ones
 * 
 * Schedule: Every day at 12:00 PM (Asia/Bangkok timezone)
 * Trigger: Firebase Cloud Scheduler
 */
export const checkRaffles = functions
  .region('asia-southeast1')
  .pubsub
  .schedule('0 12 * * *')
  .timeZone('Asia/Bangkok')
  .onRun(async (context) => {
    console.log('🔍 Starting daily raffle check...');
    
    try {
      // Get current timestamp
      const now = Timestamp.now();
      
      // Query all active raffles
      const rafflesSnapshot = await db
        .collection('raffles')
        .where('status', '==', 'active')
        .get();
      
      if (rafflesSnapshot.empty) {
        console.log('✅ No active raffles found');
        return null;
      }
      
      console.log(`📊 Found ${rafflesSnapshot.size} active raffle(s)`);
      
      // Process each raffle
      const drawPromises: Promise<void>[] = [];
      
      for (const doc of rafflesSnapshot.docs) {
        const raffle = { id: doc.id, ...doc.data() } as RaffleDocument;
        
        // Check if raffle is eligible for draw
        if (isEligibleForDraw(raffle, now)) {
          console.log(`🎲 Raffle ${raffle.id} is eligible for draw`);
          drawPromises.push(runDraw(raffle.id));
        } else {
          console.log(`⏳ Raffle ${raffle.id} not yet eligible:`, {
            adsNeeded: calculateAdsNeeded(raffle),
            currentAds: raffle.totalAdViews,
            drawDate: raffle.drawDate.toDate(),
            now: now.toDate()
          });
        }
      }
      
      // Execute all draws in parallel
      await Promise.all(drawPromises);
      
      console.log('✅ Daily raffle check completed');
      return null;
      
    } catch (error) {
      console.error('❌ Error in checkRaffles:', error);
      throw error;
    }
  });

/**
 * HTTP-triggered function to manually trigger a raffle draw
 * Useful for testing or manual intervention by admins
 * 
 * Usage: POST /runDrawManual with { raffleId: "xyz" }
 */
export const runDrawManual = functions
  .region('asia-southeast1')
  .https
  .onCall(async (data, context) => {
    // Verify admin authentication
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can manually trigger draws'
      );
    }
    
    const { raffleId } = data;
    
    if (!raffleId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'raffleId is required'
      );
    }
    
    console.log(`🎲 Manual draw triggered for raffle: ${raffleId}`);
    
    try {
      await runDraw(raffleId);
      return { success: true, message: 'Draw completed successfully' };
    } catch (error) {
      console.error('❌ Error in manual draw:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to run draw: ' + (error as Error).message
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// 🎰 CORE RAFFLE LOGIC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Check if a raffle is eligible for draw
 * Both conditions must be met:
 * 1. Ad revenue threshold reached (totalAdViews >= adjustedAdsNeeded)
 * 2. Draw date has arrived (currentDate >= drawDate)
 * 
 * @param raffle - The raffle document to check
 * @param now - Current timestamp
 * @returns true if eligible, false otherwise
 */
function isEligibleForDraw(raffle: RaffleDocument, now: Timestamp): boolean {
  // Condition 1: Check ad revenue threshold
  const adsNeeded = calculateAdsNeeded(raffle);
  const adThresholdMet = raffle.totalAdViews >= adsNeeded;
  
  // Condition 2: Check if draw date has arrived
  const dateReached = now.toMillis() >= raffle.drawDate.toMillis();
  
  console.log(`Eligibility check for raffle ${raffle.id}:`, {
    adThresholdMet,
    dateReached,
    currentAds: raffle.totalAdViews,
    requiredAds: adsNeeded,
    drawDate: raffle.drawDate.toDate(),
    now: now.toDate()
  });
  
  // Both conditions must be true
  return adThresholdMet && dateReached;
}

/**
 * Calculate the number of ad views needed to cover the prize
 * Formula: (prizeValue / eCPM) * 1000 * (1 / fillRate) * SAFETY_MARGIN
 * 
 * @param raffle - The raffle document
 * @returns Number of ad views needed
 */
function calculateAdsNeeded(raffle: RaffleDocument): number {
  const { prizeValue, eCPM, fillRate } = raffle;
  
  // Basic calculation: how many ads needed at given eCPM
  const baseAds = (prizeValue / eCPM) * 1000;
  
  // Adjust for fill rate and add safety margin
  const adjustedAds = baseAds * (1 / fillRate) * CONFIG.SAFETY_MARGIN;
  
  // Round up to ensure we always have enough
  return Math.ceil(adjustedAds);
}

/**
 * Execute the raffle draw for a specific raffle
 * Steps:
 * 1. Fetch all entries
 * 2. Select weighted random winner
 * 3. Update raffle document
 * 4. Create history record
 * 5. Reset counters for next cycle
 * 
 * @param raffleId - ID of the raffle to draw
 */
async function runDraw(raffleId: string): Promise<void> {
  console.log(`🎲 Starting draw for raffle: ${raffleId}`);
  
  try {
    // Use Firestore transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      // 1. Get raffle document
      const raffleRef = db.collection('raffles').doc(raffleId);
      const raffleDoc = await transaction.get(raffleRef);
      
      if (!raffleDoc.exists) {
        throw new Error(`Raffle ${raffleId} not found`);
      }
      
      const raffle = { id: raffleDoc.id, ...raffleDoc.data() } as RaffleDocument;
      
      // Verify raffle is still active
      if (raffle.status !== 'active') {
        throw new Error(`Raffle ${raffleId} is not active (status: ${raffle.status})`);
      }
      
      // 2. Fetch all entries for this raffle
      const entriesSnapshot = await db
        .collection('entries')
        .where('raffleId', '==', raffleId)
        .get();
      
      if (entriesSnapshot.empty) {
        console.log(`⚠️ No entries found for raffle ${raffleId}, skipping draw`);
        
        // Update raffle status to cancelled
        transaction.update(raffleRef, {
          status: 'cancelled',
          updatedAt: FieldValue.serverTimestamp()
        });
        
        return;
      }
      
      // Convert to weighted entries
      const entries: WeightedEntry[] = entriesSnapshot.docs.map(doc => ({
        userId: doc.data().userId,
        tickets: doc.data().tickets,
        weight: 0
      }));
      
      console.log(`📊 Processing ${entries.length} entries with ${entries.reduce((sum, e) => sum + e.tickets, 0)} total tickets`);
      
      // 3. Select weighted random winner
      const winnerId = pickWeightedWinner(entries);
      
      if (!winnerId) {
        throw new Error('Failed to select winner');
      }
      
      console.log(`🎉 Winner selected: ${winnerId}`);
      
      // 4. Get winner details
      const winnerDoc = await db.collection('users').doc(winnerId).get();
      const winnerName = winnerDoc.exists ? winnerDoc.data()?.name || 'Unknown User' : 'Unknown User';
      
      // 5. Update raffle document
      transaction.update(raffleRef, {
        status: 'completed',
        winnerId: winnerId,
        drawnAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      // 6. Create history record
      const historyRef = db.collection('raffle_history').doc();
      transaction.set(historyRef, {
        raffleId: raffleId,
        winnerId: winnerId,
        winnerName: winnerName,
        prizeValue: raffle.prizeValue,
        totalAdViews: raffle.totalAdViews,
        totalEntries: entries.reduce((sum, e) => sum + e.tickets, 0),
        totalParticipants: entries.length,
        drawDate: raffle.drawDate,
        drawnAt: FieldValue.serverTimestamp(),
        category: raffle.category,
        title: raffle.title
      } as Partial<RaffleHistoryDocument>);
      
      // 7. Create reward document for winner
      const rewardRef = db.collection('rewards').doc();
      transaction.set(rewardRef, {
        userId: winnerId,
        raffleId: raffleId,
        raffleTitle: raffle.title,
        partnerName: raffle.category,
        prizeDetails: `${raffle.title} - Value: $${raffle.prizeValue}`,
        claimStatus: 'unclaimed',
        wonAt: FieldValue.serverTimestamp(),
        expiresAt: Timestamp.fromMillis(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days
      });
      
      console.log(`✅ Draw completed for raffle ${raffleId}. Winner: ${winnerId}`);
    });
    
  } catch (error) {
    console.error(`❌ Error running draw for raffle ${raffleId}:`, error);
    throw error;
  }
}

/**
 * Select a random winner weighted by ticket count
 * Uses a fair weighted random selection algorithm
 * 
 * Algorithm:
 * 1. Calculate cumulative weights for each entry
 * 2. Generate random number between 0 and total weight
 * 3. Find entry whose cumulative weight exceeds random number
 * 
 * @param entries - Array of entries with userId and ticket count
 * @returns userId of the winner, or null if no entries
 */
function pickWeightedWinner(entries: WeightedEntry[]): string | null {
  if (entries.length === 0) {
    console.warn('⚠️ No entries provided to pickWeightedWinner');
    return null;
  }
  
  // Calculate cumulative weights
  let cumulativeWeight = 0;
  const weightedEntries = entries.map(entry => {
    cumulativeWeight += entry.tickets;
    return {
      ...entry,
      weight: cumulativeWeight
    };
  });
  
  const totalWeight = cumulativeWeight;
  
  console.log(`🎲 Total weight: ${totalWeight} tickets`);
  
  // Generate random number between 0 and total weight
  const randomValue = Math.random() * totalWeight;
  
  console.log(`🎯 Random value: ${randomValue.toFixed(2)}`);
  
  // Find winner using binary search for efficiency
  let left = 0;
  let right = weightedEntries.length - 1;
  
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    
    if (weightedEntries[mid].weight < randomValue) {
      left = mid + 1;
    } else {
      right = mid;
    }
  }
  
  const winner = weightedEntries[left];
  
  console.log(`🎉 Winner: ${winner.userId} with ${winner.tickets} ticket(s)`);
  
  return winner.userId;
}

// ═══════════════════════════════════════════════════════════════════════════
// 🛠️ HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calculate the threshold of ad views needed for a given prize configuration
 * Useful for simulating and planning raffle economics
 * 
 * @param prizeValue - Prize value in dollars
 * @param eCPM - Revenue per 1000 impressions (optional, uses default)
 * @param fillRate - Ad fill rate 0-1 (optional, uses default)
 * @returns Object with breakdown of required ad views
 */
export const simulateThreshold = functions
  .region('asia-southeast1')
  .https
  .onCall(async (data, context) => {
    const {
      prizeValue,
      eCPM = CONFIG.DEFAULT_ECPM,
      fillRate = CONFIG.DEFAULT_FILL_RATE
    } = data;
    
    if (!prizeValue || prizeValue <= 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'prizeValue must be a positive number'
      );
    }
    
    // Calculate base ad views needed
    const baseAds = (prizeValue / eCPM) * 1000;
    
    // Adjust for fill rate
    const adsWithFillRate = baseAds * (1 / fillRate);
    
    // Add safety margin
    const finalAds = adsWithFillRate * CONFIG.SAFETY_MARGIN;
    
    // Calculate expected revenue
    const expectedRevenue = (finalAds / 1000) * eCPM * fillRate;
    
    return {
      prizeValue,
      eCPM,
      fillRate,
      safetyMargin: CONFIG.SAFETY_MARGIN,
      breakdown: {
        baseAdsNeeded: Math.ceil(baseAds),
        adjustedForFillRate: Math.ceil(adsWithFillRate),
        finalWithMargin: Math.ceil(finalAds),
        expectedRevenue: parseFloat(expectedRevenue.toFixed(2)),
        marginAmount: parseFloat((expectedRevenue - prizeValue).toFixed(2)),
        marginPercentage: parseFloat((((expectedRevenue - prizeValue) / prizeValue) * 100).toFixed(2))
      },
      example: {
        if100UsersWatch: Math.ceil(finalAds / 100),
        adsPerUser: Math.ceil(finalAds / 100)
      }
    };
  });

/**
 * Get raffle statistics and status
 * Useful for admin dashboard and monitoring
 * 
 * @param raffleId - ID of the raffle to check
 * @returns Statistics and status information
 */
export const getRaffleStats = functions
  .region('asia-southeast1')
  .https
  .onCall(async (data, context) => {
    const { raffleId } = data;
    
    if (!raffleId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'raffleId is required'
      );
    }
    
    try {
      // Get raffle document
      const raffleDoc = await db.collection('raffles').doc(raffleId).get();
      
      if (!raffleDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'Raffle not found');
      }
      
      const raffle = { id: raffleDoc.id, ...raffleDoc.data() } as RaffleDocument;
      
      // Get entries count
      const entriesSnapshot = await db
        .collection('entries')
        .where('raffleId', '==', raffleId)
        .get();
      
      const totalTickets = entriesSnapshot.docs.reduce(
        (sum, doc) => sum + doc.data().tickets,
        0
      );
      
      // Calculate thresholds
      const adsNeeded = calculateAdsNeeded(raffle);
      const progress = (raffle.totalAdViews / adsNeeded) * 100;
      
      // Check eligibility
      const now = Timestamp.now();
      const isEligible = isEligibleForDraw(raffle, now);
      
      return {
        raffleId,
        status: raffle.status,
        prizeValue: raffle.prizeValue,
        category: raffle.category,
        title: raffle.title,
        adMetrics: {
          currentAdViews: raffle.totalAdViews,
          requiredAdViews: adsNeeded,
          progressPercentage: parseFloat(progress.toFixed(2)),
          eCPM: raffle.eCPM,
          fillRate: raffle.fillRate
        },
        participation: {
          totalEntries: totalTickets,
          totalParticipants: entriesSnapshot.size
        },
        schedule: {
          drawDate: raffle.drawDate.toDate(),
          dateReached: now.toMillis() >= raffle.drawDate.toMillis(),
          daysUntilDraw: Math.ceil(
            (raffle.drawDate.toMillis() - now.toMillis()) / (1000 * 60 * 60 * 24)
          )
        },
        eligibility: {
          isEligible,
          canDraw: isEligible && raffle.status === 'active',
          reasons: {
            adThresholdMet: raffle.totalAdViews >= adsNeeded,
            dateReached: now.toMillis() >= raffle.drawDate.toMillis(),
            statusActive: raffle.status === 'active'
          }
        },
        winnerId: raffle.winnerId
      };
      
    } catch (error) {
      console.error('Error getting raffle stats:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to get raffle stats: ' + (error as Error).message
      );
    }
  });

/**
 * Increment ad view count for a raffle
 * Called when user watches an ad for a raffle
 * 
 * @param raffleId - ID of the raffle
 * @param adCount - Number of ads watched (default 1)
 */
export const incrementAdViews = functions
  .region('asia-southeast1')
  .https
  .onCall(async (data, context) => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated'
      );
    }
    
    const { raffleId, adCount = 1 } = data;
    
    if (!raffleId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'raffleId is required'
      );
    }
    
    try {
      const raffleRef = db.collection('raffles').doc(raffleId);
      
      await raffleRef.update({
        totalAdViews: FieldValue.increment(adCount),
        updatedAt: FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Incremented ad views for raffle ${raffleId} by ${adCount}`);
      
      return { success: true, adCount };
      
    } catch (error) {
      console.error('Error incrementing ad views:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to increment ad views: ' + (error as Error).message
      );
    }
  });

// ═══════════════════════════════════════════════════════════════════════════
// 🧪 TESTING & DEBUGGING FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Test the weighted winner selection algorithm
 * Useful for verifying fairness and distribution
 */
export const testWeightedSelection = functions
  .region('asia-southeast1')
  .https
  .onCall(async (data, context) => {
    // Verify admin authentication
    if (!context.auth || !context.auth.token.admin) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only administrators can run tests'
      );
    }
    
    const { iterations = 1000 } = data;
    
    // Sample entries for testing
    const testEntries: WeightedEntry[] = [
      { userId: 'user1', tickets: 1, weight: 0 },
      { userId: 'user2', tickets: 5, weight: 0 },
      { userId: 'user3', tickets: 10, weight: 0 },
      { userId: 'user4', tickets: 2, weight: 0 }
    ];
    
    const results: { [key: string]: number } = {};
    
    // Run selection multiple times
    for (let i = 0; i < iterations; i++) {
      const winner = pickWeightedWinner([...testEntries]);
      if (winner) {
        results[winner] = (results[winner] || 0) + 1;
      }
    }
    
    // Calculate percentages
    const percentages: { [key: string]: number } = {};
    const totalTickets = testEntries.reduce((sum, e) => sum + e.tickets, 0);
    
    for (const entry of testEntries) {
      const expectedPercentage = (entry.tickets / totalTickets) * 100;
      const actualPercentage = ((results[entry.userId] || 0) / iterations) * 100;
      
      percentages[entry.userId] = {
        tickets: entry.tickets,
        expectedPercentage: parseFloat(expectedPercentage.toFixed(2)),
        actualPercentage: parseFloat(actualPercentage.toFixed(2)),
        difference: parseFloat(Math.abs(expectedPercentage - actualPercentage).toFixed(2)),
        wins: results[entry.userId] || 0
      };
    }
    
    return {
      iterations,
      totalTickets,
      results: percentages
    };
  });

// ═══════════════════════════════════════════════════════════════════════════
// 📝 EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * All exported functions:
 * 
 * Scheduled:
 * - checkRaffles: Daily check at 12:00 PM Bangkok time
 * 
 * HTTP Callable:
 * - runDrawManual: Manually trigger a raffle draw (admin only)
 * - simulateThreshold: Calculate ad views needed for prize value
 * - getRaffleStats: Get detailed raffle statistics
 * - incrementAdViews: Increment ad view count for a raffle
 * - testWeightedSelection: Test weighted selection algorithm (admin only)
 */

export { CONFIG };
