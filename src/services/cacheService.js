const NodeCache = require('node-cache');
const crypto = require('crypto');
const logger = require('../utils/logger');

const CACHE_TTL = 86400;
const CACHE_CHECK_PERIOD = 3600;

const analysisCache = new NodeCache({
  stdTTL: CACHE_TTL,
  checkperiod: CACHE_CHECK_PERIOD,
  useClones: false
});

const generateImageHash = (imageBuffer) => {
  return crypto
    .createHash('sha256')
    .update(imageBuffer)
    .digest('hex');
};

const getCachedAnalysis = (imageHash) => {
  const cached = analysisCache.get(imageHash);
  if (cached) {
    logger.info(`Cache HIT for image hash: ${imageHash.substring(0, 16)}...`);
    return cached;
  }
  logger.info(`Cache MISS for image hash: ${imageHash.substring(0, 16)}...`);
  return null;
};

const cacheAnalysis = (imageHash, result, metadata = {}) => {
  const cacheEntry = {
    result,
    timestamp: new Date(),
    cached: true,
    ...metadata
  };
  analysisCache.set(imageHash, cacheEntry);
  logger.info(`Cached analysis result for: ${imageHash.substring(0, 16)}...`);
};

const invalidateCache = (imageHash) => {
  analysisCache.del(imageHash);
  logger.info(`Invalidated cache for: ${imageHash.substring(0, 16)}...`);
};

const clearAllCache = () => {
  analysisCache.flushAll();
  logger.info('Cleared all cached analyses');
};

const getCacheStats = () => {
  const stats = analysisCache.getStats();
  return {
    keys: stats.keys,
    hits: stats.hits,
    misses: stats.misses,
    hitRate: stats.hits / (stats.hits + stats.misses) || 0
  };
};

analysisCache.on('expired', (key) => {
  logger.info(`Cache entry expired: ${key.substring(0, 16)}...`);
});

module.exports = {
  generateImageHash,
  getCachedAnalysis,
  cacheAnalysis,
  invalidateCache,
  clearAllCache,
  getCacheStats,
  analysisCache
};
