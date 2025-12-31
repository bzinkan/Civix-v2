// Usage limiting for free tier
import { db } from '@/lib/db';
import { startOfMonth } from 'date-fns';

const FREE_QUERY_LIMIT = parseInt(process.env.FREE_QUERY_LIMIT || '3');

export interface UsageCheck {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetDate?: Date;
  requiresAuth?: boolean;
}

/**
 * Check if user can make a query
 */
export async function checkUsageLimit(
  userId?: string,
  fingerprint?: string
): Promise<UsageCheck> {
  // Logged-in users
  if (userId) {
    return await checkUserUsage(userId);
  }

  // Anonymous users
  if (fingerprint) {
    return await checkAnonymousUsage(fingerprint);
  }

  // No identifier - deny
  return {
    allowed: false,
    remaining: 0,
    limit: FREE_QUERY_LIMIT,
    requiresAuth: true,
  };
}

/**
 * Check usage for logged-in user
 */
async function checkUserUsage(userId: string): Promise<UsageCheck> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionStatus: true,
      queryCredits: true,
    },
  });

  if (!user) {
    return {
      allowed: false,
      remaining: 0,
      limit: FREE_QUERY_LIMIT,
    };
  }

  // Active subscribers: unlimited
  if (user.subscriptionStatus === 'active') {
    return {
      allowed: true,
      remaining: Infinity,
      limit: Infinity,
    };
  }

  // Users with purchased credits
  if (user.queryCredits > 0) {
    return {
      allowed: true,
      remaining: user.queryCredits,
      limit: user.queryCredits,
    };
  }

  // Free tier users: monthly limit
  const monthStart = startOfMonth(new Date());
  const queryCount = await db.decision.count({
    where: {
      userId,
      createdAt: {
        gte: monthStart,
      },
    },
  });

  return {
    allowed: queryCount < FREE_QUERY_LIMIT,
    remaining: Math.max(0, FREE_QUERY_LIMIT - queryCount),
    limit: FREE_QUERY_LIMIT,
    resetDate: new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1),
  };
}

/**
 * Check usage for anonymous user
 */
async function checkAnonymousUsage(fingerprint: string): Promise<UsageCheck> {
  const usage = await db.anonymousUsage.findUnique({
    where: { fingerprint },
  });

  const currentCount = usage?.queryCount || 0;

  return {
    allowed: currentCount < FREE_QUERY_LIMIT,
    remaining: Math.max(0, FREE_QUERY_LIMIT - currentCount),
    limit: FREE_QUERY_LIMIT,
    requiresAuth: currentCount >= FREE_QUERY_LIMIT,
  };
}

/**
 * Increment usage counter
 */
export async function incrementUsage(
  userId?: string,
  fingerprint?: string
): Promise<void> {
  if (userId) {
    // For users with credits, decrement
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { queryCredits: true },
    });

    if (user && user.queryCredits > 0) {
      await db.user.update({
        where: { id: userId },
        data: {
          queryCredits: {
            decrement: 1,
          },
        },
      });
    }
    // For free tier users, usage is tracked via Decision count
  } else if (fingerprint) {
    // Increment anonymous usage
    await db.anonymousUsage.upsert({
      where: { fingerprint },
      create: {
        fingerprint,
        queryCount: 1,
        lastQueryAt: new Date(),
      },
      update: {
        queryCount: {
          increment: 1,
        },
        lastQueryAt: new Date(),
      },
    });
  }
}

/**
 * Reset monthly usage (run via cron)
 */
export async function resetMonthlyUsage(): Promise<void> {
  // Anonymous users: reset counts at month start
  await db.anonymousUsage.updateMany({
    data: {
      queryCount: 0,
    },
  });

  // User decisions don't need reset - we count by createdAt
  console.log('Monthly usage reset complete');
}

/**
 * Add query credits to user (for purchases)
 */
export async function addQueryCredits(
  userId: string,
  credits: number
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      queryCredits: {
        increment: credits,
      },
    },
  });
}

/**
 * Activate subscription
 */
export async function activateSubscription(
  userId: string,
  subscriptionId: string,
  endsAt?: Date
): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'active',
      subscriptionId,
      subscriptionEndsAt: endsAt,
    },
  });
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(userId: string): Promise<void> {
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'cancelled',
    },
  });
}
