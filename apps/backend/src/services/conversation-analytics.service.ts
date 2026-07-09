import { prisma } from '../config/database.js';

export interface ConversationMetrics {
  totalConversations: number;
  botResolutionRate: number;
  humanHandoffRate: number;
  averageResponseTime: number;
  mostAskedQuestions: Array<{ question: string; count: number }>;
  mostViewedProducts: Array<{ productName: string; count: number }>;
  mostRequestedServices: Array<{ serviceName: string; count: number }>;
  dailyConversations: Array<{ date: string; count: number }>;
  monthlyConversations: Array<{ month: string; count: number }>;
  activeSessions: number;
  closedSessions: number;
  averageSessionDuration: number;
}

export class ConversationAnalyticsService {
  /**
   * Get comprehensive conversation metrics for a vendor
   * @param vendorId - Vendor ID
   * @param period - Period for metrics ('day', 'week', 'month', 'year', 'all')
   * @returns Conversation metrics
   */
  async getVendorMetrics(vendorId: string, period: string = 'all'): Promise<ConversationMetrics> {
    const dateFilter = this.getDateFilter(period);

    // Get total conversations
    const totalConversations = await prisma.chatbotSession.count({
      where: {
        vendorId,
        createdAt: dateFilter,
      },
    });

    // Get bot resolution rate (sessions that never had human takeover)
    const botResolvedSessions = await prisma.chatbotSession.count({
      where: {
        vendorId,
        humanTakeover: false,
        createdAt: dateFilter,
      },
    });
    const botResolutionRate = totalConversations > 0 ? (botResolvedSessions / totalConversations) * 100 : 0;

    // Get human handoff rate
    const humanHandoffSessions = await prisma.chatbotSession.count({
      where: {
        vendorId,
        humanTakeover: true,
        createdAt: dateFilter,
      },
    });
    const humanHandoffRate = totalConversations > 0 ? (humanHandoffSessions / totalConversations) * 100 : 0;

    // Get average response time (from message timestamps)
    const messages = await prisma.message.findMany({
      where: {
        vendorId,
        createdAt: dateFilter,
      },
      orderBy: { createdAt: 'asc' },
    });

    let averageResponseTime = 0;
    if (messages.length > 1) {
      const responseTimes: number[] = [];
      for (let i = 1; i < messages.length; i++) {
        const diff = messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime();
        responseTimes.push(diff);
      }
      averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    // Get most asked questions (from chatbot rules with FAQ type)
    const faqRules = await prisma.chatbotRule.findMany({
      where: {
        vendorId,
        ruleType: 'FAQ',
        isActive: true,
      },
    });

    const mostAskedQuestions = faqRules.map(rule => ({
      question: rule.keyword,
      count: 0, // Would need to track actual FAQ hits in a separate table
    }));

    // Get most viewed products (from product searches - would need to track search history)
    const mostViewedProducts: Array<{ productName: string; count: number }> = [];

    // Get most requested services (from service searches - would need to track search history)
    const mostRequestedServices: Array<{ serviceName: string; count: number }> = [];

    // Get daily conversations
    const dailyConversations = await this.getDailyConversations(vendorId, dateFilter);

    // Get monthly conversations
    const monthlyConversations = await this.getMonthlyConversations(vendorId, dateFilter);

    // Get active sessions
    const activeSessions = await prisma.chatbotSession.count({
      where: {
        vendorId,
        sessionStatus: 'ACTIVE',
      },
    });

    // Get closed sessions
    const closedSessions = await prisma.chatbotSession.count({
      where: {
        vendorId,
        sessionStatus: 'CLOSED',
        createdAt: dateFilter,
      },
    });

    // Calculate average session duration
    const sessionsWithDuration = await prisma.chatbotSession.findMany({
      where: {
        vendorId,
        sessionStatus: 'CLOSED',
        createdAt: dateFilter,
        lastMessageAt: { not: null },
      },
    });

    let averageSessionDuration = 0;
    if (sessionsWithDuration.length > 0) {
      const durations = sessionsWithDuration
        .filter(session => session.lastMessageAt)
        .map(session => session.lastMessageAt!.getTime() - session.createdAt.getTime());
      averageSessionDuration = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
    }

    return {
      totalConversations,
      botResolutionRate,
      humanHandoffRate,
      averageResponseTime,
      mostAskedQuestions,
      mostViewedProducts,
      mostRequestedServices,
      dailyConversations,
      monthlyConversations,
      activeSessions,
      closedSessions,
      averageSessionDuration,
    };
  }

  /**
   * Get conversation metrics for all vendors (admin view)
   * @param period - Period for metrics
   * @returns Aggregated metrics across all vendors
   */
  async getGlobalMetrics(period: string = 'all'): Promise<ConversationMetrics> {
    const dateFilter = this.getDateFilter(period);

    const totalConversations = await prisma.chatbotSession.count({
      where: { createdAt: dateFilter },
    });

    const botResolvedSessions = await prisma.chatbotSession.count({
      where: {
        humanTakeover: false,
        createdAt: dateFilter,
      },
    });
    const botResolutionRate = totalConversations > 0 ? (botResolvedSessions / totalConversations) * 100 : 0;

    const humanHandoffSessions = await prisma.chatbotSession.count({
      where: {
        humanTakeover: true,
        createdAt: dateFilter,
      },
    });
    const humanHandoffRate = totalConversations > 0 ? (humanHandoffSessions / totalConversations) * 100 : 0;

    const messages = await prisma.message.findMany({
      where: { createdAt: dateFilter },
      orderBy: { createdAt: 'asc' },
    });

    let averageResponseTime = 0;
    if (messages.length > 1) {
      const responseTimes: number[] = [];
      for (let i = 1; i < messages.length; i++) {
        const diff = messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime();
        responseTimes.push(diff);
      }
      averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    }

    const activeSessions = await prisma.chatbotSession.count({
      where: { sessionStatus: 'ACTIVE' },
    });

    const closedSessions = await prisma.chatbotSession.count({
      where: {
        sessionStatus: 'CLOSED',
        createdAt: dateFilter,
      },
    });

    return {
      totalConversations,
      botResolutionRate,
      humanHandoffRate,
      averageResponseTime,
      mostAskedQuestions: [],
      mostViewedProducts: [],
      mostRequestedServices: [],
      dailyConversations: [],
      monthlyConversations: [],
      activeSessions,
      closedSessions,
      averageSessionDuration: 0,
    };
  }

  /**
   * Get daily conversation counts
   * @param vendorId - Vendor ID
   * @param dateFilter - Date filter object
   * @returns Array of daily conversation counts
   */
  private async getDailyConversations(vendorId: string, dateFilter: any): Promise<Array<{ date: string; count: number }>> {
    const sessions = await prisma.chatbotSession.findMany({
      where: {
        vendorId,
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
      },
    });

    const dailyMap = new Map<string, number>();
    sessions.forEach(session => {
      const date = session.createdAt.toISOString().split('T')[0];
      dailyMap.set(date, (dailyMap.get(date) || 0) + 1);
    });

    return Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));
  }

  /**
   * Get monthly conversation counts
   * @param vendorId - Vendor ID
   * @param dateFilter - Date filter object
   * @returns Array of monthly conversation counts
   */
  private async getMonthlyConversations(vendorId: string, dateFilter: any): Promise<Array<{ month: string; count: number }>> {
    const sessions = await prisma.chatbotSession.findMany({
      where: {
        vendorId,
        createdAt: dateFilter,
      },
      select: {
        createdAt: true,
      },
    });

    const monthlyMap = new Map<string, number>();
    sessions.forEach(session => {
      const month = session.createdAt.toISOString().substring(0, 7); // YYYY-MM
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + 1);
    });

    return Array.from(monthlyMap.entries()).map(([month, count]) => ({ month, count }));
  }

  /**
   * Get date filter based on period
   * @param period - Period string
   * @returns Date filter object for Prisma
   */
  private getDateFilter(period: string): any {
    const now = new Date();
    switch (period) {
      case 'day':
        return { gte: new Date(now.setHours(0, 0, 0, 0)) };
      case 'week':
        return { gte: new Date(now.setDate(now.getDate() - 7)) };
      case 'month':
        return { gte: new Date(now.setMonth(now.getMonth() - 1)) };
      case 'year':
        return { gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      case 'all':
      default:
        return {};
    }
  }

  /**
   * Track FAQ search hit (for analytics)
   * @param vendorId - Vendor ID
   * @param question - Question asked
   */
  async trackFaqSearch(vendorId: string, question: string): Promise<void> {
    // This would require a separate analytics table to track search hits
    // For now, this is a placeholder for future implementation
  }

  /**
   * Track product search hit (for analytics)
   * @param vendorId - Vendor ID
   * @param productName - Product name searched
   */
  async trackProductSearch(vendorId: string, productName: string): Promise<void> {
    // This would require a separate analytics table to track search hits
    // For now, this is a placeholder for future implementation
  }

  /**
   * Track service search hit (for analytics)
   * @param vendorId - Vendor ID
   * @param serviceName - Service name searched
   */
  async trackServiceSearch(vendorId: string, serviceName: string): Promise<void> {
    // This would require a separate analytics table to track search hits
    // For now, this is a placeholder for future implementation
  }
}

export default new ConversationAnalyticsService();
