/**
 * Rate limiting utilities for managing user message limits
 * Limits: 10 messages per conversation in a 4-hour interval
 */

const RATE_LIMIT_KEY_PREFIX = 'rate_limit_';
const USER_ID_KEY = 'user_id';
const MESSAGE_LIMIT = 10;
const TIME_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

interface RateLimitData {
  messageCount: number;
  firstMessageTimestamp: number;
  conversationId: string;
}

/**
 * Get or create user ID
 * Checks for user_id in URL params first, then localStorage
 * If neither exists, generates a new UUID
 */
export const getUserId = (): string => {
  // Check URL params first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlUserId = params.get('user_id');
    if (urlUserId) {
      // Store in localStorage for persistence
      localStorage.setItem(USER_ID_KEY, urlUserId);
      return urlUserId;
    }

    // Check localStorage
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    if (storedUserId) {
      return storedUserId;
    }

    // Generate new UUID
    const newUserId = crypto.randomUUID();
    localStorage.setItem(USER_ID_KEY, newUserId);
    return newUserId;
  }

  // Fallback for server-side rendering
  return crypto.randomUUID();
};

/**
 * Get rate limit data for a conversation
 */
export const getRateLimitData = (
  conversationId: string,
): RateLimitData | null => {
  if (typeof window === 'undefined') return null;

  const key = `${RATE_LIMIT_KEY_PREFIX}${conversationId}`;
  const stored = localStorage.getItem(key);

  if (!stored) return null;

  try {
    return JSON.parse(stored) as RateLimitData;
  } catch {
    return null;
  }
};

/**
 * Save rate limit data for a conversation
 */
const saveRateLimitData = (data: RateLimitData): void => {
  if (typeof window === 'undefined') return;

  const key = `${RATE_LIMIT_KEY_PREFIX}${data.conversationId}`;
  localStorage.setItem(key, JSON.stringify(data));
};

/**
 * Check if rate limit has been exceeded
 * Returns an object with isLimited flag and resetTime if limited
 */
export const checkRateLimit = (
  conversationId: string,
): {
  isLimited: boolean;
  resetTime: number | null;
  remainingMessages: number;
} => {
  const data = getRateLimitData(conversationId);

  if (!data) {
    return {
      isLimited: false,
      resetTime: null,
      remainingMessages: MESSAGE_LIMIT,
    };
  }

  const now = Date.now();
  const timeElapsed = now - data.firstMessageTimestamp;

  // If time window has passed, reset the limit
  if (timeElapsed >= TIME_WINDOW_MS) {
    return {
      isLimited: false,
      resetTime: null,
      remainingMessages: MESSAGE_LIMIT,
    };
  }

  // Check if limit exceeded
  const isLimited = data.messageCount >= MESSAGE_LIMIT;
  const resetTime = isLimited
    ? data.firstMessageTimestamp + TIME_WINDOW_MS
    : null;
  const remainingMessages = Math.max(0, MESSAGE_LIMIT - data.messageCount);

  return {
    isLimited,
    resetTime,
    remainingMessages,
  };
};

/**
 * Record a new message sent in the conversation
 */
export const recordMessage = (conversationId: string): void => {
  const data = getRateLimitData(conversationId);
  const now = Date.now();

  if (!data) {
    // First message in this conversation
    saveRateLimitData({
      messageCount: 1,
      firstMessageTimestamp: now,
      conversationId,
    });
    return;
  }

  const timeElapsed = now - data.firstMessageTimestamp;

  if (timeElapsed >= TIME_WINDOW_MS) {
    // Time window has passed, reset the counter
    saveRateLimitData({
      messageCount: 1,
      firstMessageTimestamp: now,
      conversationId,
    });
  } else {
    // Increment the counter
    saveRateLimitData({
      ...data,
      messageCount: data.messageCount + 1,
    });
  }
};

/**
 * Format time remaining until reset
 */
export const formatTimeRemaining = (resetTime: number): string => {
  const now = Date.now();
  const msRemaining = resetTime - now;

  if (msRemaining <= 0) return '0m';

  const hours = Math.floor(msRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};
