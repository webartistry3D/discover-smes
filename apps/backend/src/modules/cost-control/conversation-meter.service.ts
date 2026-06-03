import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ConversationMeterService {
  /**
   * Check if a conversation is active within the 24h window
   * WhatsApp bills per 24h conversation window
   */
  async isConversationActive(vendorId: string, customerPhone: string): Promise<boolean> {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
      const recentSession = await prisma.chatbotSession.findFirst({
        where: {
          vendorId,
          customerPhone,
          lastMessageAt: {
            gte: twentyFourHoursAgo,
          },
          sessionStatus: 'ACTIVE',
        },
      });

      return !!recentSession;
    } catch (error) {
      console.error('Error checking conversation status:', error);
      return false;
    }
  }

  /**
   * Get conversation window info
   */
  async getConversationWindow(vendorId: string, customerPhone: string) {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
      const session = await prisma.chatbotSession.findFirst({
        where: {
          vendorId,
          customerPhone,
          lastMessageAt: {
            gte: twentyFourHoursAgo,
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      if (!session) {
        return {
          active: false,
          windowStart: null,
          windowEnd: null,
          messagesInWindow: 0,
        };
      }

      const windowStart = session.lastMessageAt;
      const windowEnd = new Date(windowStart);
      windowEnd.setHours(windowEnd.getHours() + 24);

      // Count messages in this window
      const logs = await prisma.usageLog.findMany({
        where: {
          vendorId,
          sessionId: session.id,
          timestamp: {
            gte: windowStart,
            lte: windowEnd,
          },
        },
      });

      return {
        active: true,
        windowStart,
        windowEnd,
        messagesInWindow: logs.length,
        sessionId: session.id,
      };
    } catch (error) {
      console.error('Error getting conversation window:', error);
      throw error;
    }
  }

  /**
   * Check if we should merge messages into existing conversation
   * instead of starting a new one
   */
  async shouldMergeIntoConversation(vendorId: string, customerPhone: string): Promise<boolean> {
    const windowInfo = await this.getConversationWindow(vendorId, customerPhone);
    
    // If conversation is active and within 24h window, merge
    if (windowInfo.active && windowInfo.windowEnd && windowInfo.windowEnd > new Date()) {
      return true;
    }

    return false;
  }

  /**
   * Get all active conversations for a vendor
   */
  async getActiveConversations(vendorId: string) {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    try {
      const sessions = await prisma.chatbotSession.findMany({
        where: {
          vendorId,
          lastMessageAt: {
            gte: twentyFourHoursAgo,
          },
          sessionStatus: 'ACTIVE',
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      return sessions;
    } catch (error) {
      console.error('Error getting active conversations:', error);
      throw error;
    }
  }

  /**
   * Get conversation statistics for a vendor
   */
  async getConversationStats(vendorId: string) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    try {
      const todaySessions = await prisma.chatbotSession.count({
        where: {
          vendorId,
          createdAt: {
            gte: startOfDay,
          },
        },
      });

      const weekSessions = await prisma.chatbotSession.count({
        where: {
          vendorId,
          createdAt: {
            gte: startOfWeek,
          },
        },
      });

      const activeConversations = await this.getActiveConversations(vendorId);

      return {
        today: todaySessions,
        week: weekSessions,
        activeNow: activeConversations.length,
      };
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      throw error;
    }
  }

  /**
   * Bundle multiple messages into one to reduce API calls
   * This is for when multiple quick responses are needed
   */
  bundleMessages(messages: string[]): string {
    if (messages.length === 0) return '';
    if (messages.length === 1) return messages[0];

    // Combine messages with proper formatting
    return messages.join('\n\n');
  }

  /**
   * Check if message bundling is beneficial
   * Returns true if there are multiple similar messages to send
   */
  async shouldBundleMessages(vendorId: string, customerPhone: string, pendingMessages: string[]): Promise<boolean> {
    // Only bundle if we have multiple messages
    if (pendingMessages.length <= 1) {
      return false;
    }

    // Check if conversation is active (within 24h window)
    const shouldMerge = await this.shouldMergeIntoConversation(vendorId, customerPhone);
    
    // If merging, we can bundle to reduce message count
    return shouldMerge;
  }

  /**
   * Get conversation cost estimate
   * Based on message count in 24h window
   */
  async getConversationCost(vendorId: string, sessionId: string): Promise<number> {
    try {
      const logs = await prisma.usageLog.findMany({
        where: {
          vendorId,
          sessionId,
          cached: false,
        },
      });

      const totalCost = logs.reduce((sum, log) => sum + log.costEstimate, 0);
      return totalCost;
    } catch (error) {
      console.error('Error getting conversation cost:', error);
      return 0;
    }
  }

  /**
   * Get top conversations by cost for a vendor
   */
  async getTopCostlyConversations(vendorId: string, limit: number = 10) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    try {
      const sessions = await prisma.chatbotSession.findMany({
        where: {
          vendorId,
          createdAt: {
            gte: startOfMonth,
          },
        },
        take: limit,
        orderBy: {
          lastMessageAt: 'desc',
        },
      });

      const conversationsWithCost = await Promise.all(
        sessions.map(async (session) => {
          const cost = await this.getConversationCost(vendorId, session.id);
          return {
            sessionId: session.id,
            customerPhone: session.customerPhone,
            lastMessageAt: session.lastMessageAt,
            cost,
          };
        })
      );

      return conversationsWithCost.sort((a, b) => b.cost - a.cost);
    } catch (error) {
      console.error('Error getting top costly conversations:', error);
      throw error;
    }
  }
}

export const conversationMeterService = new ConversationMeterService();
