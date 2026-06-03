import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';

// Twilio WhatsApp pricing (approximate, update with actual rates)
const TWILIO_WHATSAPP_COST_PER_MESSAGE = 0.0055; // $0.0055 per message

export class CostController {
  async checkBudget(vendorId: string, messageCount: number = 1): Promise<{ allowed: boolean; reason?: string }> {
    if (!config.twilio.costControlEnabled) {
      return { allowed: true };
    }

    // Get vendor's monthly quota from existing WCCS
    const quota = await prisma.vendorQuota.findUnique({
      where: { vendorId },
    });

    if (!quota) {
      // Create default quota if not exists
      await prisma.vendorQuota.create({
        data: {
          vendorId,
          monthlyLimit: 1000, // Default 1000 messages
          currentUsage: 0,
          resetDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          reducedMode: false,
        },
      });
      return { allowed: true };
    }

    // Check if quota is reset
    if (quota.resetDate < new Date()) {
      await prisma.vendorQuota.update({
        where: { vendorId },
        data: {
          currentUsage: 0,
          resetDate: new Date(new Date().setDate(new Date().getDate() + 30)),
          reducedMode: false,
        },
      });
      return { allowed: true };
    }

    // Check if within limit
    const estimatedCost = messageCount * TWILIO_WHATSAPP_COST_PER_MESSAGE;
    const newUsage = quota.currentUsage + messageCount;

    if (newUsage > quota.monthlyLimit) {
      logger.warn('Budget exceeded', { vendorId, currentUsage: quota.currentUsage, limit: quota.monthlyLimit });
      return { allowed: false, reason: 'Monthly message quota exceeded' };
    }

    return { allowed: true };
  }

  async recordUsage(vendorId: string, messageCount: number = 1, messageType: string = 'SERVICE'): Promise<void> {
    // Update quota
    await prisma.vendorQuota.updateMany({
      where: { vendorId },
      data: { currentUsage: { increment: messageCount } },
    });

    // Log usage for analytics
    await prisma.usageLog.create({
      data: {
        vendorId,
        messageType: messageType as any,
        costEstimate: messageCount * TWILIO_WHATSAPP_COST_PER_MESSAGE,
        cached: false,
        timestamp: new Date(),
      },
    });

    logger.info('Usage recorded', { vendorId, messageCount, messageType });
  }

  async getCostDashboard(vendorId: string): Promise<any> {
    const quota = await prisma.vendorQuota.findUnique({
      where: { vendorId },
    });

    if (!quota) {
      return null;
    }

    const usagePercentage = (quota.currentUsage / quota.monthlyLimit) * 100;
    const remaining = quota.monthlyLimit - quota.currentUsage;

    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (usagePercentage >= 90) status = 'CRITICAL';
    else if (usagePercentage >= 70) status = 'WARNING';

    return {
      quota: {
        quota,
        usagePercentage,
        status,
        remaining,
      },
    };
  }
}

export const costController = new CostController();
