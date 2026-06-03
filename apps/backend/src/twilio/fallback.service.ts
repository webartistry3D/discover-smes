import { logger } from '../utils/logger.js';
import { sendWhatsAppMessage as sendTwilioMessage } from './twilio.service.js';
import { sendWhatsAppMessage as sendFacebookMessage } from '../whatsapp/webhook.service.js';
import { config } from '../config/index.js';

export class FallbackService {
  private twilioFailureCount = 0;
  private facebookFailureCount = 0;
  private circuitOpen = false;
  private circuitOpenedAt?: Date;
  private readonly CIRCUIT_RESET_TIMEOUT = 300000; // 5 minutes

  async sendWithFallback(
    to: string,
    body: string,
    options?: {
      vendorId?: string;
      mediaUrl?: string;
    }
  ): Promise<{ success: boolean; provider: string; messageId?: string; error?: string }> {
    if (!config.twilio.fallbackEnabled) {
      const result = await sendTwilioMessage(to, body, options);
      return { ...result, provider: 'twilio' };
    }

    // Check circuit breaker
    if (this.circuitOpen && this.circuitOpenedAt) {
      const timeSinceOpen = Date.now() - this.circuitOpenedAt.getTime();
      if (timeSinceOpen < this.CIRCUIT_RESET_TIMEOUT) {
        logger.warn('Circuit breaker open, using fallback provider');
        const result = await this.sendViaFacebook(to, body, options);
        return { ...result, provider: 'facebook' };
      } else {
        // Reset circuit breaker
        this.circuitOpen = false;
        this.circuitOpenedAt = undefined;
        this.twilioFailureCount = 0;
      }
    }

    // Try Twilio first
    const twilioResult = await sendTwilioMessage(to, body, options);
    if (twilioResult.success) {
      this.twilioFailureCount = 0;
      return { ...twilioResult, provider: 'twilio' };
    }

    // Twilio failed, increment counter
    this.twilioFailureCount++;
    logger.error('Twilio send failed', { failureCount: this.twilioFailureCount });

    // Check if we should open circuit breaker
    if (this.twilioFailureCount >= 5) {
      this.circuitOpen = true;
      this.circuitOpenedAt = new Date();
      logger.error('Circuit breaker opened for Twilio');
    }

    // Fallback to Facebook
    const facebookResult = await this.sendViaFacebook(to, body, options);
    return { ...facebookResult, provider: 'facebook' };
  }

  private async sendViaFacebook(
    to: string,
    body: string,
    options?: {
      vendorId?: string;
      mediaUrl?: string;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      await sendFacebookMessage(to, body);
      return { success: true };
    } catch (error: any) {
      logger.error('Facebook fallback also failed', error);
      return { success: false, error: error.message };
    }
  }

  getCircuitStatus(): { open: boolean; failureCount: number; provider: string } {
    return {
      open: this.circuitOpen,
      failureCount: this.twilioFailureCount,
      provider: this.circuitOpen ? 'facebook' : 'twilio',
    };
  }

  resetCircuit(): void {
    this.circuitOpen = false;
    this.circuitOpenedAt = undefined;
    this.twilioFailureCount = 0;
    logger.info('Circuit breaker reset manually');
  }
}

export const fallbackService = new FallbackService();
