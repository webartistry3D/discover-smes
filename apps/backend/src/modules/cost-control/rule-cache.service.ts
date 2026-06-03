import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class RuleCacheService {
  /**
   * Cache a response for a keyword
   * Cache expires after 24 hours by default
   */
  async cacheResponse(data: {
    vendorId: string;
    keyword: string;
    response: string;
    ttlHours?: number;
  }) {
    const ttlHours = data.ttlHours || 24;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + ttlHours);

    try {
      const cached = await prisma.responseCache.upsert({
        where: {
          vendorId_keyword: {
            vendorId: data.vendorId,
            keyword: data.keyword,
          },
        },
        update: {
          response: data.response,
          expiresAt,
          hitCount: 0,
          lastHitAt: null,
        },
        create: {
          vendorId: data.vendorId,
          keyword: data.keyword,
          response: data.response,
          expiresAt,
        },
      });

      return cached;
    } catch (error) {
      console.error('Error caching response:', error);
      throw error;
    }
  }

  /**
   * Get cached response for a keyword
   * Returns null if not found or expired
   */
  async getCachedResponse(vendorId: string, keyword: string) {
    try {
      const cached = await prisma.responseCache.findUnique({
        where: {
          vendorId_keyword: {
            vendorId,
            keyword,
          },
        },
      });

      // Check if cache is expired
      if (!cached || cached.expiresAt < new Date()) {
        // Delete expired cache entry
        if (cached) {
          await prisma.responseCache.delete({
            where: { id: cached.id },
          });
        }
        return null;
      }

      // Update hit count and last hit time
      await prisma.responseCache.update({
        where: { id: cached.id },
        data: {
          hitCount: {
            increment: 1,
          },
          lastHitAt: new Date(),
        },
      });

      return cached.response;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  /**
   * Check if a keyword is cached
   */
  async isCached(vendorId: string, keyword: string): Promise<boolean> {
    const response = await this.getCachedResponse(vendorId, keyword);
    return response !== null;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    try {
      const result = await prisma.responseCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      return { count: result.count };
    } catch (error) {
      console.error('Error clearing expired cache:', error);
      throw error;
    }
  }

  /**
   * Clear all cache for a vendor
   */
  async clearVendorCache(vendorId: string) {
    try {
      const result = await prisma.responseCache.deleteMany({
        where: { vendorId },
      });

      return { count: result.count };
    } catch (error) {
      console.error('Error clearing vendor cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics for a vendor
   */
  async getCacheStats(vendorId: string) {
    try {
      const total = await prisma.responseCache.count({
        where: { vendorId },
      });

      const cacheEntries = await prisma.responseCache.findMany({
        where: { vendorId },
        select: {
          hitCount: true,
          lastHitAt: true,
          expiresAt: true,
        },
      });

      const totalHits = cacheEntries.reduce((sum, entry) => sum + entry.hitCount, 0);
      const activeEntries = cacheEntries.filter((entry) => entry.expiresAt > new Date()).length;

      return {
        total,
        activeEntries,
        totalHits,
        avgHitsPerEntry: total > 0 ? totalHits / total : 0,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      throw error;
    }
  }

  /**
   * Get top cached keywords by hit count
   */
  async getTopCachedKeywords(vendorId: string, limit: number = 10) {
    try {
      const topKeywords = await prisma.responseCache.findMany({
        where: {
          vendorId,
          expiresAt: {
            gt: new Date(),
          },
        },
        orderBy: {
          hitCount: 'desc',
        },
        take: limit,
        select: {
          keyword: true,
          hitCount: true,
          lastHitAt: true,
        },
      });

      return topKeywords;
    } catch (error) {
      console.error('Error getting top cached keywords:', error);
      throw error;
    }
  }

  /**
   * Pre-cache common responses for a vendor
   * Based on their chatbot rules
   */
  async preCacheVendorResponses(vendorId: string, rules: Array<{ keyword: string; response: string }>) {
    const results = [];

    for (const rule of rules) {
      try {
        const cached = await this.cacheResponse({
          vendorId,
          keyword: rule.keyword,
          response: rule.response,
          ttlHours: 24,
        });
        results.push({ keyword: rule.keyword, success: true });
      } catch (error) {
        results.push({ keyword: rule.keyword, success: false, error });
      }
    }

    return results;
  }
}

export const ruleCacheService = new RuleCacheService();
