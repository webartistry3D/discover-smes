import { PrismaClient, MessageType } from '@prisma/client';

const prisma = new PrismaClient();

export class UsageTrackerService {
  /**
   * Log a WhatsApp API call for cost tracking
   */
  async logUsage(data: {
    vendorId: string;
    sessionId?: string;
    messageType: MessageType;
    conversationId?: string;
    costEstimate: number;
    cached: boolean;
  }) {
    try {
      const log = await prisma.usageLog.create({
        data: {
          vendorId: data.vendorId,
          sessionId: data.sessionId,
          messageType: data.messageType,
          conversationId: data.conversationId,
          costEstimate: data.costEstimate,
          cached: data.cached,
        },
      });

      // Update vendor quota usage if not cached
      if (!data.cached) {
        await this.updateVendorUsage(data.vendorId, 1);
      }

      return log;
    } catch (error) {
      console.error('Error logging usage:', error);
      throw error;
    }
  }

  /**
   * Get vendor usage for current month
   */
  async getVendorUsage(vendorId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await prisma.usageLog.findMany({
      where: {
        vendorId,
        timestamp: {
          gte: startOfMonth,
        },
        cached: false,
      },
    });

    const totalCost = logs.reduce((sum, log) => sum + log.costEstimate, 0);
    const totalMessages = logs.length;

    return {
      totalMessages,
      totalCost,
      logs,
    };
  }

  /**
   * Get usage breakdown by message type
   */
  async getUsageByType(vendorId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await prisma.usageLog.groupBy({
      by: ['messageType'],
      where: {
        vendorId,
        timestamp: {
          gte: startOfMonth,
        },
        cached: false,
      },
      _count: true,
      _sum: {
        costEstimate: true,
      },
    });

    return logs.map((log) => ({
      messageType: log.messageType,
      count: log._count,
      cost: log._sum.costEstimate || 0,
    }));
  }

  /**
   * Get cache hit rate
   */
  async getCacheHitRate(vendorId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const logs = await prisma.usageLog.findMany({
      where: {
        vendorId,
        timestamp: {
          gte: startOfMonth,
        },
      },
    });

    const total = logs.length;
    const cached = logs.filter((log) => log.cached).length;
    const hitRate = total > 0 ? (cached / total) * 100 : 0;

    return {
      total,
      cached,
      hitRate,
    };
  }

  /**
   * Update vendor usage counter
   */
  private async updateVendorUsage(vendorId: string, increment: number) {
    const quota = await prisma.vendorQuota.findUnique({
      where: { vendorId },
    });

    if (quota) {
      await prisma.vendorQuota.update({
        where: { vendorId },
        data: {
          currentUsage: {
            increment,
          },
        },
      });
    }
  }

  /**
   * Get daily usage trend
   */
  async getDailyUsageTrend(vendorId: string, days: number = 30) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    const logs = await prisma.usageLog.findMany({
      where: {
        vendorId,
        timestamp: {
          gte: startDate,
        },
        cached: false,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Group by day
    const dailyUsage: Record<string, number> = {};
    logs.forEach((log) => {
      const date = log.timestamp.toISOString().split('T')[0];
      dailyUsage[date] = (dailyUsage[date] || 0) + 1;
    });

    return Object.entries(dailyUsage).map(([date, count]) => ({
      date,
      count,
    }));
  }
}

export const usageTrackerService = new UsageTrackerService();
