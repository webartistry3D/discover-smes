import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QuotaTier {
  name: string;
  monthlyLimit: number;
}

export const QUOTA_TIERS: Record<string, QuotaTier> = {
  FREEMIUM: {
    name: 'Freemium',
    monthlyLimit: 500,
  },
  GROWTH: {
    name: 'Growth',
    monthlyLimit: 5000,
  },
  PRO: {
    name: 'Pro',
    monthlyLimit: 20000,
  },
};

export class VendorQuotasService {
  /**
   * Create or update vendor quota
   */
  async setVendorQuota(vendorId: string, tier: string) {
    const tierConfig = QUOTA_TIERS[tier];
    if (!tierConfig) {
      throw new Error(`Invalid quota tier: ${tier}`);
    }

    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    try {
      const quota = await prisma.vendorQuota.upsert({
        where: { vendorId },
        update: {
          monthlyLimit: tierConfig.monthlyLimit,
          resetDate,
        },
        create: {
          vendorId,
          monthlyLimit: tierConfig.monthlyLimit,
          resetDate,
        },
      });

      return quota;
    } catch (error) {
      console.error('Error setting vendor quota:', error);
      throw error;
    }
  }

  /**
   * Get vendor quota status
   */
  async getVendorQuota(vendorId: string) {
    try {
      const quota = await prisma.vendorQuota.findUnique({
        where: { vendorId },
      });

      if (!quota) {
        // Create default quota for new vendor
        return await this.setVendorQuota(vendorId, 'FREEMIUM');
      }

      // Check if quota needs reset
      if (quota.resetDate < new Date()) {
        await this.resetVendorQuota(vendorId);
        return await this.getVendorQuota(vendorId);
      }

      return quota;
    } catch (error) {
      console.error('Error getting vendor quota:', error);
      throw error;
    }
  }

  /**
   * Reset vendor quota (monthly)
   */
  async resetVendorQuota(vendorId: string) {
    const now = new Date();
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    try {
      const quota = await prisma.vendorQuota.update({
        where: { vendorId },
        data: {
          currentUsage: 0,
          resetDate,
          reducedMode: false,
        },
      });

      return quota;
    } catch (error) {
      console.error('Error resetting vendor quota:', error);
      throw error;
    }
  }

  /**
   * Check if vendor has exceeded quota
   */
  async isQuotaExceeded(vendorId: string): Promise<boolean> {
    const quota = await this.getVendorQuota(vendorId);
    return quota.currentUsage >= quota.monthlyLimit;
  }

  /**
   * Check if vendor is in reduced mode
   */
  async isReducedMode(vendorId: string): Promise<boolean> {
    const quota = await this.getVendorQuota(vendorId);
    return quota.reducedMode;
  }

  /**
   * Enable reduced mode for vendor
   */
  async enableReducedMode(vendorId: string) {
    try {
      const quota = await prisma.vendorQuota.update({
        where: { vendorId },
        data: {
          reducedMode: true,
        },
      });

      return quota;
    } catch (error) {
      console.error('Error enabling reduced mode:', error);
      throw error;
    }
  }

  /**
   * Disable reduced mode for vendor
   */
  async disableReducedMode(vendorId: string) {
    try {
      const quota = await prisma.vendorQuota.update({
        where: { vendorId },
        data: {
          reducedMode: false,
        },
      });

      return quota;
    } catch (error) {
      console.error('Error disabling reduced mode:', error);
      throw error;
    }
  }

  /**
   * Get quota usage percentage
   */
  async getQuotaUsagePercentage(vendorId: string): Promise<number> {
    const quota = await this.getVendorQuota(vendorId);
    return (quota.currentUsage / quota.monthlyLimit) * 100;
  }

  /**
   * Get quota status with warnings
   */
  async getQuotaStatus(vendorId: string) {
    const quota = await this.getVendorQuota(vendorId);
    const usagePercentage = (quota.currentUsage / quota.monthlyLimit) * 100;

    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (usagePercentage >= 90) {
      status = 'CRITICAL';
    } else if (usagePercentage >= 75) {
      status = 'WARNING';
    }

    return {
      quota,
      usagePercentage,
      status,
      remaining: quota.monthlyLimit - quota.currentUsage,
    };
  }

  /**
   * Check if message should be allowed based on quota
   * Returns { allowed: boolean, reason?: string }
   */
  async checkMessageAllowance(vendorId: string): Promise<{ allowed: boolean; reason?: string }> {
    const quotaStatus = await this.getQuotaStatus(vendorId);

    // If quota exceeded, block message
    if (quotaStatus.remaining <= 0) {
      return {
        allowed: false,
        reason: 'Monthly message limit exceeded',
      };
    }

    // If in reduced mode, allow only cached responses
    if (quotaStatus.quota.reducedMode) {
      return {
        allowed: true,
        reason: 'reduced_mode',
      };
    }

    // If near limit (90%+), warn but allow
    if (quotaStatus.status === 'CRITICAL') {
      return {
        allowed: true,
        reason: 'near_limit',
      };
    }

    return {
      allowed: true,
    };
  }

  /**
   * Get all vendors approaching quota limit
   */
  async getVendorsApproachingLimit(threshold: number = 75) {
    try {
      const quotas = await prisma.vendorQuota.findMany();

      const approaching = quotas.filter((quota) => {
        const usagePercentage = (quota.currentUsage / quota.monthlyLimit) * 100;
        return usagePercentage >= threshold;
      });

      return approaching;
    } catch (error) {
      console.error('Error getting vendors approaching limit:', error);
      throw error;
    }
  }

  /**
   * Get all vendors in reduced mode
   */
  async getVendorsInReducedMode() {
    try {
      const quotas = await prisma.vendorQuota.findMany({
        where: {
          reducedMode: true,
        },
      });

      return quotas;
    } catch (error) {
      console.error('Error getting vendors in reduced mode:', error);
      throw error;
    }
  }

  /**
   * Update vendor tier
   */
  async updateVendorTier(vendorId: string, newTier: string) {
    return await this.setVendorQuota(vendorId, newTier);
  }
}

export const vendorQuotasService = new VendorQuotasService();
