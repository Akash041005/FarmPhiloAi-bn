const logger = require('../utils/logger');

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const isRateLimitError = (error) => {
  const message = error.message?.toLowerCase() || '';
  const status = error.status || error.statusCode || 0;
  
  return (
    message.includes('429') ||
    message.includes('503') ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('too many requests') ||
    message.includes('resource exhausted') ||
    message.includes('service unavailable') ||
    message.includes('high demand') ||
    status === 429 ||
    status === 503
  );
};

const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRateLimitError(error)) {
        throw error;
      }

      if (attempt === maxRetries - 1) {
        logger.warn(`Max retries (${maxRetries}) reached for rate-limited request`);
        throw error;
      }

      const backoffTime = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      if (onRetry) {
        onRetry({
          attempt: attempt + 1,
          maxRetries,
          delay: backoffTime,
          error: error.message
        });
      }

      logger.warn(`Rate limited. Retry ${attempt + 1}/${maxRetries} in ${backoffTime}ms...`);
      await delay(backoffTime);
    }
  }

  throw lastError;
};

const withRateLimitHandling = (fn, fallback = null) => {
  return async (...args) => {
    try {
      return await retryWithBackoff(() => fn(...args));
    } catch (error) {
      if (fallback && typeof fallback === 'function') {
        logger.warn('Using fallback due to rate limit');
        return fallback(error);
      }
      throw error;
    }
  };
};

class RateLimitTracker {
  constructor() {
    this.requestCounts = new Map();
    this.windowMs = 60000;
    this.maxRequests = 15;
  }

  canMakeRequest(key = 'global') {
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now - record.windowStart >= this.windowMs) {
      this.requestCounts.set(key, { windowStart: now, count: 1 });
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getTimeUntilReset(key = 'global') {
    const record = this.requestCounts.get(key);
    if (!record) return 0;
    return Math.max(0, this.windowMs - (Date.now() - record.windowStart));
  }

  reset(key = 'global') {
    this.requestCounts.delete(key);
  }
}

const rateLimitTracker = new RateLimitTracker();

module.exports = {
  retryWithBackoff,
  isRateLimitError,
  withRateLimitHandling,
  RateLimitTracker,
  rateLimitTracker
};
