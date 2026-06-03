import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SpikeDetectionConfig {
  baselineWindowMinutes: number;
  spikeWindowMinutes: number;
  spikeMultiplier: number;
  minMessagesForDetection: number;
}

export const DEFAULT_SPIKE_CONFIG: SpikeDetectionConfig = {
  baselineWindowMinutes: 60,
  spikeWindowMinutes: 5,
  spikeMultiplier: 5,
  minMessagesForDetection: 10,
};

export class SpikeDetectorService {
  private config: SpikeDetectionConfig = DEFAULT_SPIKE_CONFIG;

  /**
   * Detect traffic spike for a vendor
   * Returns true if spike detected
   */
  async detectSpike(vendorId: string, customConfig?: Partial<SpikeDetectionConfig>): Promise<{
    spikeDetected: boolean;
    baseline: number;
    current: number;
    multiplier: number;
    recommendation: string;
  }> {
    const config = { ...this.config, ...customConfig };

    const now = new Date();
    const baselineStart = new Date(now);
    baselineStart.setMinutes(baselineStart.getMinutes() - config.baselineWindowMinutes);

    const spikeStart = new Date(now);
    spikeStart.setMinutes(spikeStart.getMinutes() - config.spikeWindowMinutes);

    try {
      // Get baseline message count
      const baselineLogs = await prisma.usageLog.count({
        where: {
          vendorId,
          timestamp: {
            gte: baselineStart,
            lt: spikeStart,
          },
          cached: false,
        },
      });

      // Get current spike window message count
      const spikeLogs = await prisma.usageLog.count({
        where: {
          vendorId,
          timestamp: {
            gte: spikeStart,
          },
          cached: false,
        },
      });

      // Calculate baseline rate (messages per minute)
      const baselineRate = baselineLogs / config.baselineWindowMinutes;
      const currentRate = spikeLogs / config.spikeWindowMinutes;

      // Calculate multiplier
      const multiplier = baselineRate > 0 ? currentRate / baselineRate : 0;

      // Detect spike
      const spikeDetected = 
        spikeLogs >= config.minMessagesForDetection &&
        multiplier >= config.spikeMultiplier;

      let recommendation = 'normal';
      if (spikeDetected) {
        recommendation = this.getRecommendation(multiplier);
      }

      return {
        spikeDetected,
        baseline: baselineLogs,
        current: spikeLogs,
        multiplier,
        recommendation,
      };
    } catch (error) {
      console.error('Error detecting spike:', error);
      throw error;
    }
  }

  /**
   * Get recommendation based on spike severity
   */
  private getRecommendation(multiplier: number): string {
    if (multiplier >= 20) {
      return 'emergency_throttle';
    } else if (multiplier >= 10) {
      return 'severe_throttle';
    } else if (multiplier >= 5) {
      return 'moderate_throttle';
    }
    return 'monitor';
  }

  /**
   * Get traffic pattern for a vendor
   */
  async getTrafficPattern(vendorId: string, hours: number = 24) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(startDate.getHours() - hours);

    try {
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

      // Group by hour
      const hourlyData: Record<number, number> = {};
      logs.forEach((log) => {
        const hour = log.timestamp.getHours();
        hourlyData[hour] = (hourlyData[hour] || 0) + 1;
      });

      // Calculate average and peak
      const values = Object.values(hourlyData);
      const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      const peak = values.length > 0 ? Math.max(...values) : 0;

      return {
        hourlyData,
        average,
        peak,
        totalMessages: logs.length,
      };
    } catch (error) {
      console.error('Error getting traffic pattern:', error);
      throw error;
    }
  }

  /**
   * Check if vendor should be throttled
   */
  async shouldThrottle(vendorId: string): Promise<{
    shouldThrottle: boolean;
    reason: string;
    delayMs?: number;
  }> {
    const detection = await this.detectSpike(vendorId);

    if (!detection.spikeDetected) {
      return {
        shouldThrottle: false,
        reason: 'normal_traffic',
      };
    }

    // Calculate delay based on severity
    let delayMs = 0;
    if (detection.recommendation === 'emergency_throttle') {
      delayMs = 5000; // 5 second delay
    } else if (detection.recommendation === 'severe_throttle') {
      delayMs = 2000; // 2 second delay
    } else if (detection.recommendation === 'moderate_throttle') {
      delayMs = 500; // 0.5 second delay
    }

    return {
      shouldThrottle: true,
      reason: detection.recommendation,
      delayMs,
    };
  }

  /**
   * Get spike history for a vendor
   */
  async getSpikeHistory(vendorId: string, days: number = 7) {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);

    try {
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

      // Detect spikes for each day
      const spikes: Array<{
        date: string;
        spikeDetected: boolean;
        multiplier: number;
      }> = [];

      for (let i = 0; i < days; i++) {
        const dayStart = new Date(now);
        dayStart.setDate(dayStart.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const dayLogs = logs.filter(
          (log) => log.timestamp >= dayStart && log.timestamp <= dayEnd
        );

        // Simple spike detection for the day
        const hourlyCounts: Record<number, number> = {};
        dayLogs.forEach((log) => {
          const hour = log.timestamp.getHours();
          hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
        });

        const values = Object.values(hourlyCounts);
        const average = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
        const peak = values.length > 0 ? Math.max(...values) : 0;
        const multiplier = average > 0 ? peak / average : 0;

        spikes.push({
          date: dayStart.toISOString().split('T')[0],
          spikeDetected: multiplier >= 5,
          multiplier,
        });
      }

      return spikes.reverse();
    } catch (error) {
      console.error('Error getting spike history:', error);
      throw error;
    }
  }

  /**
   * Get vendors with active spikes
   */
  async getVendorsWithActiveSpikes() {
    try {
      const quotas = await prisma.vendorQuota.findMany({
        include: {
          vendor: {
            select: {
              businessName: true,
            },
          },
        },
      });

      const activeSpikes = [];

      for (const quota of quotas) {
        const detection = await this.detectSpike(quota.vendorId);
        if (detection.spikeDetected) {
          activeSpikes.push({
            vendorId: quota.vendorId,
            businessName: quota.vendor.businessName,
            detection,
          });
        }
      }

      return activeSpikes;
    } catch (error) {
      console.error('Error getting vendors with active spikes:', error);
      throw error;
    }
  }

  /**
   * Set custom spike detection config
   */
  setConfig(config: Partial<SpikeDetectionConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset to default config
   */
  resetConfig() {
    this.config = DEFAULT_SPIKE_CONFIG;
  }
}

export const spikeDetectorService = new SpikeDetectorService();
