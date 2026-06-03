import { logger } from '../utils/logger.js';
import { sendWhatsAppMessage } from './twilio.service.js';

interface QueuedMessage {
  id: string;
  to: string;
  body: string;
  vendorId?: string;
  priority: 'low' | 'normal' | 'high';
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  createdAt: Date;
}

class MessageQueue {
  private queue: Map<string, QueuedMessage> = new Map();
  private processing = false;
  private intervalId?: NodeJS.Timeout;

  constructor() {
    this.startProcessing();
  }

  async enqueue(
    to: string,
    body: string,
    options?: {
      vendorId?: string;
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<string> {
    const id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: QueuedMessage = {
      id,
      to,
      body,
      vendorId: options?.vendorId,
      priority: options?.priority || 'normal',
      attempts: 0,
      maxAttempts: 3,
      nextAttemptAt: new Date(),
      createdAt: new Date(),
    };

    this.queue.set(id, message);
    logger.info('Message queued', { id, to, priority: message.priority });
    
    return id;
  }

  private startProcessing(): void {
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, 1000); // Process every second
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const now = new Date();
      const readyMessages = Array.from(this.queue.values())
        .filter(m => m.nextAttemptAt <= now)
        .sort((a, b) => {
          // Sort by priority (high > normal > low)
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          return a.nextAttemptAt.getTime() - b.nextAttemptAt.getTime();
        });

      for (const message of readyMessages.slice(0, 10)) { // Process 10 at a time
        await this.processMessage(message);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processMessage(message: QueuedMessage): Promise<void> {
    try {
      const result = await sendWhatsAppMessage(
        message.to,
        message.body,
        { vendorId: message.vendorId }
      );

      if (result.success) {
        this.queue.delete(message.id);
        logger.info('Message sent successfully', { id: message.id });
      } else {
        message.attempts++;
        if (message.attempts >= message.maxAttempts) {
          this.queue.delete(message.id);
          logger.error('Message failed after max attempts', { id: message.id });
        } else {
          // Exponential backoff: 2^attempts seconds
          const backoffSeconds = Math.pow(2, message.attempts);
          message.nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);
          logger.warn('Message retry scheduled', { 
            id: message.id, 
            attempt: message.attempts,
            nextAttempt: message.nextAttemptAt 
          });
        }
      }
    } catch (error) {
      logger.error('Error processing message', { id: message.id, error });
    }
  }

  getQueueStatus(): { total: number; byPriority: Record<string, number> } {
    const messages = Array.from(this.queue.values());
    const byPriority = messages.reduce((acc, m) => {
      acc[m.priority] = (acc[m.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: messages.length,
      byPriority,
    };
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Singleton instance
export const messageQueue = new MessageQueue();
