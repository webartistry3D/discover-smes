import { MessageType } from '@prisma/client';
import { usageTrackerService } from './usage-tracker.service';
import { ruleCacheService } from './rule-cache.service';
import { conversationMeterService } from './conversation-meter.service';
import { vendorQuotasService } from './vendor-quotas.service';
import { spikeDetectorService } from './spike-detector.service';

export interface CostControlDecision {
  allowed: boolean;
  reason: string;
  cached: boolean;
  shouldDelay?: boolean;
  delayMs?: number;
  fallbackResponse?: string;
}

export interface MessageCostInfo {
  costEstimate: number;
  messageType: MessageType;
  conversationId?: string;
}

export class CostControlService {
  /**
   * Main decision engine - determines if message should be sent
   * Implements the smart routing decision engine:
   * 1. Cache check
   * 2. Rule match
   * 3. Conversation window check
   * 4. Cost check
   * 5. WhatsApp API call (ONLY if needed)
   */
  async shouldSendMessage(data: {
    vendorId: string;
    customerPhone: string;
    keyword?: string;
    sessionId?: string;
  }): Promise<{
    decision: CostControlDecision;
    cachedResponse?: string;
  }> {
    const { vendorId, customerPhone, keyword, sessionId } = data;

    // RULE 1: Cache-first replies (BIGGEST COST SAVER)
    if (keyword) {
      const cachedResponse = await ruleCacheService.getCachedResponse(vendorId, keyword);
      if (cachedResponse) {
        return {
          decision: {
            allowed: true,
            reason: 'cache_hit',
            cached: true,
          },
          cachedResponse,
        };
      }
    }

    // RULE 5: Vendor usage quotas - Check quota before sending
    const quotaCheck = await vendorQuotasService.checkMessageAllowance(vendorId);
    if (!quotaCheck.allowed) {
      return {
        decision: {
          allowed: false,
          reason: quotaCheck.reason || 'quota_exceeded',
          cached: false,
          fallbackResponse: 'Your chatbot is temporarily limited due to monthly usage limits.',
        },
      };
    }

    // RULE 6: Spike detection - Check for traffic spikes
    const throttleCheck = await spikeDetectorService.shouldThrottle(vendorId);
    if (throttleCheck.shouldThrottle) {
      return {
        decision: {
          allowed: true,
          reason: throttleCheck.reason,
          cached: false,
          shouldDelay: true,
          delayMs: throttleCheck.delayMs,
        },
      };
    }

    // RULE 2: Conversation grouping (24h window optimization)
    const shouldMerge = await conversationMeterService.shouldMergeIntoConversation(
      vendorId,
      customerPhone
    );

    // If reduced mode, only allow cached responses
    if (quotaCheck.reason === 'reduced_mode') {
      return {
        decision: {
          allowed: false,
          reason: 'reduced_mode_only_cached',
          cached: false,
          fallbackResponse: 'Your chatbot is in reduced mode. Please try again later.',
        },
      };
    }

    // All checks passed - allow message
    return {
      decision: {
        allowed: true,
        reason: shouldMerge ? 'merge_into_conversation' : 'new_conversation',
        cached: false,
      },
    };
  }

  /**
   * Log a message after it's sent
   */
  async logMessage(data: {
    vendorId: string;
    sessionId?: string;
    messageType: MessageType;
    conversationId?: string;
    costEstimate: number;
    cached: boolean;
  }) {
    return await usageTrackerService.logUsage(data);
  }

  /**
   * Cache a response for future use
   */
  async cacheResponse(data: {
    vendorId: string;
    keyword: string;
    response: string;
    ttlHours?: number;
  }) {
    return await ruleCacheService.cacheResponse(data);
  }

  /**
   * Get cost control dashboard data for a vendor
   */
  async getDashboardData(vendorId: string) {
    const [
      quotaStatus,
      usage,
      usageByType,
      cacheStats,
      cacheHitRate,
      conversationStats,
      spikeDetection,
    ] = await Promise.all([
      vendorQuotasService.getQuotaStatus(vendorId),
      usageTrackerService.getVendorUsage(vendorId),
      usageTrackerService.getUsageByType(vendorId),
      ruleCacheService.getCacheStats(vendorId),
      usageTrackerService.getCacheHitRate(vendorId),
      conversationMeterService.getConversationStats(vendorId),
      spikeDetectorService.detectSpike(vendorId),
    ]);

    return {
      quota: quotaStatus,
      usage,
      usageByType,
      cache: {
        stats: cacheStats,
        hitRate: cacheHitRate,
      },
      conversations: conversationStats,
      spike: spikeDetection,
    };
  }

  /**
   * Get cost savings from caching
   */
  async getCostSavings(vendorId: string) {
    const cacheHitRate = await usageTrackerService.getCacheHitRate(vendorId);
    const usage = await usageTrackerService.getVendorUsage(vendorId);

    const totalMessages = usage.totalMessages;
    const cachedMessages = Math.round(totalMessages * (cacheHitRate.hitRate / 100));
    const apiCalls = totalMessages - cachedMessages;

    // Estimate cost savings (assuming ₦0.05 per message)
    const costPerMessage = 0.05;
    const totalCost = totalMessages * costPerMessage;
    const actualCost = apiCalls * costPerMessage;
    const savings = totalCost - actualCost;

    return {
      totalMessages,
      cachedMessages,
      apiCalls,
      totalCost,
      actualCost,
      savings,
      savingsPercentage: totalCost > 0 ? (savings / totalCost) * 100 : 0,
    };
  }

  /**
   * Enable reduced mode for a vendor
   */
  async enableReducedMode(vendorId: string) {
    return await vendorQuotasService.enableReducedMode(vendorId);
  }

  /**
   * Disable reduced mode for a vendor
   */
  async disableReducedMode(vendorId: string) {
    return await vendorQuotasService.disableReducedMode(vendorId);
  }

  /**
   * Clear cache for a vendor
   */
  async clearCache(vendorId: string) {
    return await ruleCacheService.clearVendorCache(vendorId);
  }

  /**
   * Pre-cache responses for a vendor
   */
  async preCacheResponses(vendorId: string, rules: Array<{ keyword: string; response: string }>) {
    return await ruleCacheService.preCacheVendorResponses(vendorId, rules);
  }

  /**
   * Get daily usage trend
   */
  async getDailyUsageTrend(vendorId: string, days: number = 30) {
    return await usageTrackerService.getDailyUsageTrend(vendorId, days);
  }

  /**
   * Get top cached keywords
   */
  async getTopCachedKeywords(vendorId: string, limit: number = 10) {
    return await ruleCacheService.getTopCachedKeywords(vendorId, limit);
  }

  /**
   * Get top costly conversations
   */
  async getTopCostlyConversations(vendorId: string, limit: number = 10) {
    return await conversationMeterService.getTopCostlyConversations(vendorId, limit);
  }

  /**
   * Get spike history
   */
  async getSpikeHistory(vendorId: string, days: number = 7) {
    return await spikeDetectorService.getSpikeHistory(vendorId, days);
  }

  /**
   * Update vendor quota tier
   */
  async updateVendorTier(vendorId: string, tier: string) {
    return await vendorQuotasService.updateVendorTier(vendorId, tier);
  }

  /**
   * Estimate message cost based on type
   */
  estimateCost(messageType: MessageType): number {
    // WhatsApp Business API pricing (approximate)
    const costs: Record<MessageType, number> = {
      MARKETING: 0.05,
      UTILITY: 0.03,
      AUTHENTICATION: 0.02,
      SERVICE: 0.04,
      SESSION: 0.01,
    };

    return costs[messageType] || 0.03;
  }

  /**
   * Bundle messages to reduce API calls
   */
  bundleMessages(messages: string[]): string {
    return conversationMeterService.bundleMessages(messages);
  }

  /**
   * Check if message bundling is beneficial
   */
  async shouldBundleMessages(vendorId: string, customerPhone: string, pendingMessages: string[]) {
    return await conversationMeterService.shouldBundleMessages(vendorId, customerPhone, pendingMessages);
  }
}

export const costControlService = new CostControlService();
