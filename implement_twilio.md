

```markdown
# Twilio WhatsApp Integration Implementation Guide

**Project:** Discover Festac  
**Version:** 1.0.0  
**Date:** 2026-05-26  
**Status:** Engineering Implementation Specification

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Current State Analysis](#current-state-analysis)
4. [Twilio Integration Architecture](#twilio-integration-architecture)
5. [Prerequisites](#prerequisites)
6. [Implementation Phases](#implementation-phases)
7. [Phase 1: Twilio Account Setup](#phase-1-twilio-account-setup)
8. [Phase 2: Backend Implementation](#phase-2-backend-implementation)
9. [Phase 3: Database Schema Updates](#phase-3-database-schema-updates)
10. [Phase 4: Frontend Integration](#phase-4-frontend-integration)
11. [Phase 5: Testing & Validation](#phase-5-testing--validation)
12. [Phase 6: Deployment](#phase-6-deployment)
13. [Monitoring & Maintenance](#monitoring--maintenance)
14. [Troubleshooting Guide](#troubleshooting-guide)
15. [Appendix](#appendix)

---

## Executive Summary

This document provides a comprehensive, executable implementation guide for integrating Twilio as a middleware layer for WhatsApp messaging in the Discover Festac project. The integration will replace or augment the existing Facebook WhatsApp Business API implementation with Twilio's Programmable Messaging API, providing enhanced reliability, better cost control, and improved scalability.

**Key Objectives:**
- Replace Facebook WhatsApp Cloud API with Twilio Programmable Messaging
- Maintain backward compatibility with existing AI commerce service
- Implement robust middleware for message queuing and rate limiting
- Integrate with existing cost control system (WCCS)
- Ensure zero downtime during migration
- Provide fallback mechanism for service continuity

---

## Architecture Overview

### Current Architecture

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│   Backend   │
│  (Express)  │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐  ┌─────────────┐
│  Facebook   │  │   AI        │
│  WhatsApp   │  │  Commerce   │
│  Cloud API  │  │  Service   │
└─────────────┘  └─────────────┘
```

### Target Architecture with Twilio

```
┌─────────────┐
│   Frontend  │
│  (React)    │
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────────────────────┐
│         Backend             │
│        (Express)            │
├─────────────────────────────┤
│  ┌─────────────────────┐   │
│  │  Twilio Middleware  │   │
│  │  - Message Queue   │   │
│  │  - Rate Limiter    │   │
│  │  - Cost Control    │   │
│  │  - Fallback Logic  │   │
│  └──────────┬──────────┘   │
└─────────────┼───────────────┘
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
      ┌─────────────┐  ┌─────────────┐
      │   Twilio    │  │   AI        │
      │   WhatsApp  │  │  Commerce   │
      │   API       │  │  Service   │
      └─────────────┘  └─────────────┘
```

---

## Current State Analysis

### Existing WhatsApp Implementation

**Location:** [apps/backend/src/whatsapp/webhook.service.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/src/whatsapp/webhook.service.ts:0:0-0:0)

**Current Features:**
- Facebook WhatsApp Cloud API integration
- Webhook verification and signature validation
- Incoming message handling
- AI-powered response generation
- Lead qualification and tracking
- Message logging to database

**Database Schema:**
- `Message` model stores WhatsApp conversations
- `Vendor` model includes `whatsappPhone` field
- [Customer](cci:2://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/lib/shared.ts:87:0-113:1) model includes lead qualification data

**Frontend Integration:**
- WhatsApp URL generation in [lib/shared.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/lib/shared.ts:0:0-0:0)
- WhatsApp buttons in VendorCard, MapPage, etc.
- Cost control system in [features/chatbot/CostMonitor.tsx](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/features/chatbot/CostMonitor.tsx:0:0-0:0)

**Limitations of Current Implementation:**
- Dependency on Facebook platform
- Limited rate control capabilities
- No message queuing mechanism
- Single point of failure
- Cost control system exists but not integrated with API layer

---

## Twilio Integration Architecture

### Middleware Layer Design

**Purpose:** Abstract Twilio API complexity, provide queuing, rate limiting, and cost control.

**Components:**

1. **Twilio Service** (`apps/backend/src/twilio/twilio.service.ts`)
   - Send/receive messages via Twilio API
   - Handle webhooks
   - Manage media uploads

2. **Message Queue** (`apps/backend/src/twilio/messageQueue.service.ts`)
   - Queue outgoing messages
   - Retry logic with exponential backoff
   - Priority queue for urgent messages

3. **Rate Limiter** (`apps/backend/src/twilio/rateLimiter.middleware.ts`)
   - Per-vendor rate limiting
   - Global rate limiting
   - Burst protection

4. **Cost Controller** (`apps/backend/src/twilio/costController.service.ts`)
   - Integration with existing WCCS
   - Real-time cost estimation
   - Budget enforcement

5. **Fallback Manager** (`apps/backend/src/twilio/fallback.service.ts`)
   - Automatic fallback to Facebook API if Twilio fails
   - Health monitoring
   - Circuit breaker pattern

### Data Flow

```
Incoming Message Flow:
1. Twilio Webhook → Backend
2. Signature Verification
3. Rate Limit Check
4. Message Queue Processing
5. AI Commerce Service
6. Response Generation
7. Cost Control Check
8. Twilio Send (or Fallback)
9. Database Logging
```

---

## Prerequisites

### Required Accounts & Services

1. **Twilio Account**
   - Sign up at https://www.twilio.com/
   - Verify phone number
   - Obtain Account SID and Auth Token

2. **Twilio WhatsApp Sandbox**
   - Enable WhatsApp sandbox
   - Obtain WhatsApp phone number
   - Configure webhook URL

3. **Existing Project Dependencies**
   - Node.js 18+
   - PostgreSQL database
   - Redis (optional, for distributed queue)

### Required npm Packages

```bash
# Backend
npm install twilio
npm install @twilio/voice-sdk
npm install bull # For Redis-based job queue (optional)
npm install ioredis # Redis client (optional)
```

### Environment Variables

Add to [apps/backend/.env](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/.env:0:0-0:0):

```env
# ─── TWILIO CONFIGURATION ─────────────────────────────
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-domain.com/api/twilio/webhook
TWILIO_WEBHOOK_SECRET=your_webhook_secret

# ─── TWILIO MIDDLEWARE CONFIGURATION ─────────────────
TWILIO_MESSAGE_QUEUE_ENABLED=true
TWILIO_RATE_LIMIT_ENABLED=true
TWILIO_RATE_LIMIT_MAX_PER_MINUTE=60
TWILIO_RATE_LIMIT_MAX_PER_HOUR=1000
TWILIO_COST_CONTROL_ENABLED=true
TWILIO_FALLBACK_ENABLED=true
TWILIO_FALLBACK_PROVIDER=facebook

# ─── REDIS (for distributed queue - optional) ─────────
REDIS_URL=redis://localhost:6379
TWILIO_QUEUE_REDIS_ENABLED=false
```

---

## Implementation Phases

### Phase Overview

| Phase | Description | Duration | Dependencies |
|-------|-------------|----------|--------------|
| 1 | Twilio Account Setup | 1 day | None |
| 2 | Backend Implementation | 3-4 days | Phase 1 |
| 3 | Database Schema Updates | 1 day | Phase 1 |
| 4 | Frontend Integration | 2 days | Phase 2 |
| 5 | Testing & Validation | 2 days | Phase 2, 3, 4 |
| 6 | Deployment | 1 day | Phase 5 |

**Total Estimated Time:** 10-11 days

---

## Phase 1: Twilio Account Setup

### Step 1.1: Create Twilio Account

1. Navigate to https://www.twilio.com/
2. Click "Sign Up"
3. Fill in registration details
4. Verify email address
5. Verify phone number

### Step 1.2: Enable WhatsApp Sandbox

1. Log in to Twilio Console
2. Navigate to Messaging → Try it out → Send a WhatsApp message
3. Follow instructions to join sandbox:
   - Send "join <keyword>" to the sandbox number from WhatsApp
4. Note your sandbox WhatsApp number

### Step 1.3: Configure Webhook

1. In Twilio Console, navigate to Messaging → Settings → WhatsApp sandbox settings
2. Set webhook URL: `https://your-domain.com/api/twilio/webhook`
3. Set webhook method: `POST`
4. Enable webhook signature verification
5. Note the webhook secret

### Step 1.4: Obtain Credentials

1. Navigate to Console → Settings → General
2. Copy Account SID
3. Copy Auth Token (only shown once)
4. Store credentials securely

### Step 1.5: Test Sandbox Connection

```bash
# Test webhook endpoint (after implementing Phase 2)
curl -X POST https://your-domain.com/api/twilio/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Phase 2: Backend Implementation

### Step 2.1: Create Twilio Directory Structure

```bash
cd apps/backend/src
mkdir -p twilio
```

### Step 2.2: Implement Twilio Service

**File:** `apps/backend/src/twilio/twilio.service.ts`

```typescript
import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

// Initialize Twilio client
const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

// ─── SEND MESSAGE ─────────────────────────────────────

export async function sendWhatsAppMessage(
  to: string,
  body: string,
  options?: {
    mediaUrl?: string;
    vendorId?: string;
    priority?: 'low' | 'normal' | 'high';
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate phone number format
    const formattedTo = formatPhoneNumber(to);
    
    const messageParams: any = {
      from: `whatsapp:${config.twilio.whatsappNumber}`,
      to: `whatsapp:${formattedTo}`,
      body,
    };

    if (options?.mediaUrl) {
      messageParams.mediaUrl = [options.mediaUrl];
    }

    const message = await twilioClient.messages.create(messageParams);

    logger.info('Twilio message sent', { 
      messageId: message.sid, 
      to: formattedTo,
      vendorId: options?.vendorId 
    });

    return { success: true, messageId: message.sid };
  } catch (error: any) {
    logger.error('Twilio send error:', error);
    return { success: false, error: error.message };
  }
}

// ─── RECEIVE WEBHOOK ───────────────────────────────────

export async function handleTwilioWebhook(
  body: any,
  signature?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify webhook signature if configured
    if (config.twilio.webhookSecret && signature) {
      const isValid = verifyTwilioSignature(
        JSON.stringify(body),
        signature,
        config.twilio.webhookSecret
      );
      if (!isValid) {
        logger.warn('Invalid Twilio webhook signature');
        return { success: false, error: 'Invalid signature' };
      }
    }

    // Process incoming message
    for (const message of body) {
      if (message.EventType === 'message_status') {
        await handleMessageStatus(message);
      } else if (message.EventType === 'message') {
        await handleIncomingMessage(message);
      }
    }

    return { success: true };
  } catch (error: any) {
    logger.error('Twilio webhook error:', error);
    return { success: false, error: error.message };
  }
}

// ─── HELPER FUNCTIONS ───────────────────────────────────

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

function verifyTwilioSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

async function handleMessageStatus(message: any): Promise<void> {
  // Update message status in database
  await prisma.message.updateMany({
    where: { whatsappMsgId: message.MessageSid },
    data: { status: message.MessageStatus },
  });
}

async function handleIncomingMessage(message: any): Promise<void> {
  // Import AI commerce service dynamically to avoid circular dependency
  const { aiCommerceService } = await import('../ai/aiCommerce.service.js');
  
  const fromPhone = message.From.replace('whatsapp:', '');
  const text = message.Body;
  const toPhone = message.To.replace('whatsapp:', '');

  // Find vendor associated with this WhatsApp number
  const vendor = await prisma.vendor.findFirst({
    where: { whatsappPhone: { contains: toPhone } },
  });

  if (!vendor) {
    logger.warn(`No vendor found for WA number ${toPhone}`);
    return;
  }

  // Get conversation history
  const history = await prisma.message.findMany({
    where: { vendorId: vendor.id, fromPhone },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const conversationHistory = history
    .reverse()
    .map((m) => ({ 
      role: m.direction === 'INBOUND' ? 'user' as const : 'assistant' as const, 
      content: m.content 
    }));

  // Generate AI response
  const aiResponse = await aiCommerceService.generateResponse(
    vendor.id,
    text,
    conversationHistory
  );

  // Send reply via Twilio
  await sendWhatsAppMessage(fromPhone, aiResponse.message, { vendorId: vendor.id });

  // Log lead if booking or inquiry
  if (['BOOKING_REQUEST', 'PRICING_INQUIRY', 'SERVICE_INQUIRY', 'LEAD_QUALIFICATION'].includes(aiResponse.intent)) {
    await prisma.vendor.update({
      where: { id: vendor.id },
      data: { totalLeads: { increment: 1 } },
    });

    // Save lead qualification data if available
    if (aiResponse.leadQualification) {
      await prisma.customer.create({
        data: {
          vendorId: vendor.id,
          name: 'WhatsApp Lead',
          phone: fromPhone,
          leadScore: aiResponse.leadQualification.score,
          leadTier: aiResponse.leadQualification.tier,
          leadStatus: aiResponse.leadQualification.tier === 'HOT' ? 'NEW' : 'NURTURE',
          source: 'WHATSAPP_TWILIO',
        },
      });
    }
  }
}
```

### Step 2.3: Implement Message Queue Service

**File:** `apps/backend/src/twilio/messageQueue.service.ts`

```typescript
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
```

### Step 2.4: Implement Rate Limiter Middleware

**File:** `apps/backend/src/twilio/rateLimiter.middleware.ts`

```typescript
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

interface RateLimitEntry {
  count: number;
  resetAt: Date;
}

// In-memory rate limit store (use Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export function twilioRateLimiter(
  maxPerMinute: number = 60,
  maxPerHour: number = 1000
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!config.twilio.rateLimitEnabled) {
      return next();
    }

    const vendorId = req.user?.vendorId || req.body?.vendorId || 'global';
    const now = new Date();
    const minuteKey = `${vendorId}:minute`;
    const hourKey = `${vendorId}:hour`;

    // Check minute limit
    let minuteEntry = rateLimitStore.get(minuteKey);
    if (!minuteEntry || minuteEntry.resetAt < now) {
      minuteEntry = { count: 0, resetAt: new Date(Date.now() + 60000) };
      rateLimitStore.set(minuteKey, minuteEntry);
    }

    if (minuteEntry.count >= maxPerMinute) {
      logger.warn('Rate limit exceeded (minute)', { vendorId });
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' }
      });
    }

    // Check hour limit
    let hourEntry = rateLimitStore.get(hourKey);
    if (!hourEntry || hourEntry.resetAt < now) {
      hourEntry = { count: 0, resetAt: new Date(Date.now() + 3600000) };
      rateLimitStore.set(hourKey, hourEntry);
    }

    if (hourEntry.count >= maxPerHour) {
      logger.warn('Rate limit exceeded (hour)', { vendorId });
      return res.status(429).json({
        success: false,
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Hourly limit exceeded' }
      });
    }

    // Increment counters
    minuteEntry.count++;
    hourEntry.count++;

    next();
  };
}

// Cleanup expired entries periodically
setInterval(() => {
  const now = new Date();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
```

### Step 2.5: Implement Cost Controller Service

**File:** `apps/backend/src/twilio/costController.service.ts`

```typescript
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

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
```

### Step 2.6: Implement Fallback Service

**File:** `apps/backend/src/twilio/fallback.service.ts`

```typescript
import { logger } from '../utils/logger.js';
import { sendWhatsAppMessage as sendTwilioMessage } from './twilio.service.js';
import { sendWhatsAppMessage as sendFacebookMessage } from '../whatsapp/webhook.service.js';

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
```

### Step 2.7: Update Configuration

**File:** [apps/backend/src/config/index.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/src/config/index.ts:0:0-0:0)

Add to the config object:

```typescript
export const config = {
  // ... existing config ...

  twilio: {
    accountSid: optionalEnv('TWILIO_ACCOUNT_SID', ''),
    auth_token: optionalEnv('TWILIO_AUTH_TOKEN', ''),
    whatsappNumber: optionalEnv('TWILIO_WHATSAPP_NUMBER', ''),
    webhookUrl: optionalEnv('TWILIO_WEBHOOK_URL', ''),
    webhookSecret: optionalEnv('TWILIO_WEBHOOK_SECRET', ''),
    messageQueueEnabled: optionalEnv('TWILIO_MESSAGE_QUEUE_ENABLED', 'true') === 'true',
    rateLimitEnabled: optionalEnv('TWILIO_RATE_LIMIT_ENABLED', 'true') === 'true',
    rateLimitMaxPerMinute: parseInt(optionalEnv('TWILIO_RATE_LIMIT_MAX_PER_MINUTE', '60'), 10),
    rateLimitMaxPerHour: parseInt(optionalEnv('TWILIO_RATE_LIMIT_MAX_PER_HOUR', '1000'), 10),
    costControlEnabled: optionalEnv('TWILIO_COST_CONTROL_ENABLED', 'true') === 'true',
    fallbackEnabled: optionalEnv('TWILIO_FALLBACK_ENABLED', 'true') === 'true',
    fallbackProvider: optionalEnv('TWILIO_FALLBACK_PROVIDER', 'facebook'),
  },
} as const;
```

### Step 2.8: Add Twilio Routes

**File:** [apps/backend/src/routes/index.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/src/routes/index.ts:0:0-0:0)

Add after WhatsApp routes:

```typescript
// ─── TWILIO WEBHOOK ───────────────────────────────────────
const twilio = Router();
import { handleTwilioWebhook } from '../twilio/twilio.service.js';
import { messageQueue } from '../twilio/messageQueue.service.js';
import { costController } from '../twilio/costController.service.js';
import { fallbackService } from '../twilio/fallback.service.js';
import { twilioRateLimiter } from '../twilio/rateLimiter.middleware.js';

twilio.get('/webhook', (req, res) => {
  // Twilio webhook verification (if needed)
  res.sendStatus(200);
});

twilio.post('/webhook', twilioRateLimiter(), async (req, res, next) => {
  const signature = req.headers['x-twilio-signature'] as string;
  const result = await handleTwilioWebhook(req.body, signature);
  if (result.success) {
    res.sendStatus(200);
  } else {
    res.status(400).json({ error: result.error });
  }
});

// Send message endpoint (for testing)
twilio.post('/send', authenticate, async (req, res, next) => {
  try {
    const { to, body, vendorId } = req.body as { to: string; body: string; vendorId?: string };
    
    // Check budget
    const budgetCheck = await costController.checkBudget(vendorId || req.user!.vendorId);
    if (!budgetCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: { code: 'BUDGET_EXCEEDED', message: budgetCheck.reason } 
      });
    }

    // Send with fallback
    const result = await fallbackService.sendWithFallback(to, body, { vendorId });
    
    if (result.success) {
      await costController.recordUsage(vendorId || req.user!.vendorId);
      sendSuccess(res, { messageId: result.messageId, provider: result.provider });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) { next(err); }
});

// Queue message endpoint
twilio.post('/queue', authenticate, async (req, res, next) => {
  try {
    const { to, body, vendorId, priority } = req.body as { 
      to: string; 
      body: string; 
      vendorId?: string; 
      priority?: 'low' | 'normal' | 'high' 
    };
    
    const messageId = await messageQueue.enqueue(to, body, { vendorId, priority });
    sendSuccess(res, { messageId });
  } catch (err) { next(err); }
});

// Queue status endpoint
twilio.get('/queue/status', authenticate, async (req, res, next) => {
  try {
    const status = messageQueue.getQueueStatus();
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

// Cost dashboard endpoint
twilio.get('/cost/dashboard', authenticate, async (req, res, next) => {
  try {
    const dashboard = await costController.getCostDashboard(req.user!.vendorId);
    sendSuccess(res, dashboard);
  } catch (err) { next(err); }
});

// Circuit status endpoint
twilio.get('/circuit/status', authenticate, async (req, res, next) => {
  try {
    const status = fallbackService.getCircuitStatus();
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

// Reset circuit endpoint (admin only)
twilio.post('/circuit/reset', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    fallbackService.resetCircuit();
    sendSuccess(res, { message: 'Circuit breaker reset' });
  } catch (err) { next(err); }
});

router.use('/twilio', twilio);
```

---

## Phase 3: Database Schema Updates

### Step 3.1: Add Twilio-Specific Fields

**File:** [apps/backend/prisma/schema.prisma](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/prisma/schema.prisma:0:0-0:0)

Update the Message model to add Twilio-specific fields:

```prisma
model Message {
  id             String        @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  vendorId       String        @db.Uuid
  fromPhone      String
  toPhone        String
  direction      MessageDirection
  content        String
  messageType    String        @default("text")
  whatsappMsgId  String?       @unique
  status         MessageStatus @default(SENT)
  isAiGenerated  Boolean       @default(false)
  intent         String?
  
  // Twilio-specific fields
  provider       MessageProvider @default(FACEBOOK)
  twilioSid      String?       @unique
  twilioStatus   String?
  twilioErrorCode  String?
  twilioErrorMessage  String?
  priority       MessagePriority @default(NORMAL)
  queuedAt       DateTime?
  sentAt         DateTime?
  deliveredAt    DateTime?
  readAt         DateTime?
  
  createdAt      DateTime      @default(now())

  vendor Vendor @relation(fields: [vendorId], references: [id])

  @@index([vendorId, createdAt])
  @@index([fromPhone])
  @@index([twilioSid])
  @@map("messages")
}

// Add enums
enum MessageProvider {
  FACEBOOK
  TWILIO
}

enum MessagePriority {
  LOW
  NORMAL
  HIGH
}
```

### Step 3.2: Run Migration

```bash
cd apps/backend
npx prisma migrate dev --name add_twilio_fields
```

### Step 3.3: Update Shared Types

**File:** [apps/frontend/src/lib/shared.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/lib/shared.ts:0:0-0:0)

Add Twilio-related types:

```typescript
export enum MessageProvider {
  FACEBOOK = 'FACEBOOK',
  TWILIO = 'TWILIO',
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export interface TwilioMessageStatus {
  provider: MessageProvider;
  twilioSid?: string;
  twilioStatus?: string;
  priority: MessagePriority;
  queuedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}
```

---

## Phase 4: Frontend Integration

### Step 4.1: Update API Client

**File:** [apps/frontend/src/lib/api.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/lib/api.ts:0:0-0:0)

Add Twilio endpoints:

```typescript
// Twilio endpoints
export const twilioApi = {
  send: (data: { to: string; body: string; vendorId?: string }) =>
    api.post('/twilio/send', data),
  
  queue: (data: { to: string; body: string; vendorId?: string; priority?: 'low' | 'normal' | 'high' }) =>
    api.post('/twilio/queue', data),
  
  queueStatus: () => api.get('/twilio/queue/status'),
  
  costDashboard: () => api.get('/twilio/cost/dashboard'),
  
  circuitStatus: () => api.get('/twilio/circuit/status'),
};
```

### Step 4.2: Update WhatsApp URL Generation

**File:** [apps/frontend/src/lib/shared.ts](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/frontend/src/lib/shared.ts:0:0-0:0)

Update to support both providers:

```typescript
export function generateWhatsAppUrl(
  phone: string, 
  message?: string,
  provider: 'facebook' | 'twilio' = 'facebook'
): string {
  const formatted = formatPhoneNumber(phone).replace('+', '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  
  if (provider === 'twilio') {
    // For Twilio, we use the backend to send messages
    return `/api/twilio/send?to=${formatted}${encodedMessage ? `&text=${encodedMessage}` : ''}`;
  }
  
  // Default to Facebook WhatsApp
  return `https://wa.me/${formatted}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}
```

### Step 4.3: Add Twilio Cost Monitor Component

**File:** `apps/frontend/src/features/twilio/TwilioCostMonitor.tsx`

```typescript
import { useEffect, useState } from 'react';
import { twilioApi } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export function TwilioCostMonitor() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.vendorId) {
      loadDashboard();
    }
  }, [user]);

  const loadDashboard = async () => {
    try {
      const response = await twilioApi.costDashboard();
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to load cost dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!dashboard) return null;

  const { quota } = dashboard;
  const statusColor = quota.status === 'OK' ? 'text-green-600' : quota.status === 'WARNING' ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">WhatsApp Usage</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Messages Used</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {quota.quota.currentUsage} / {quota.quota.monthlyLimit}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${statusColor.replace('text-', 'bg-')}`}
            style={{ width: `${quota.usagePercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Status: {quota.status}</span>
          <span>{quota.remaining} remaining</span>
        </div>
      </div>
    </div>
  );
}
```

### Step 4.4: Update Vendor Dashboard

Add Twilio cost monitor to vendor dashboard:

```typescript
import { TwilioCostMonitor } from '../../features/twilio/TwilioCostMonitor';

// Add to dashboard layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* ... existing cards ... */}
  <TwilioCostMonitor />
</div>
```

---

## Phase 5: Testing & Validation

### Step 5.1: Unit Tests

Create test file: `apps/backend/src/twilio/__tests__/twilio.service.test.ts`

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { sendWhatsAppMessage } from '../twilio.service.js';

describe('Twilio Service', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.TWILIO_ACCOUNT_SID = 'test_sid';
    process.env.TWILIO_AUTH_TOKEN = 'test_token';
    process.env.TWILIO_WHATSAPP_NUMBER = '+1234567890';
  });

  it('should format phone numbers correctly', () => {
    // Test phone number formatting
  });

  it('should send message successfully', async () => {
    // Mock Twilio client and test send
  });

  it('should handle send failures', async () => {
    // Test error handling
  });
});
```

### Step 5.2: Integration Tests

Test webhook endpoint:

```bash
# Test webhook with curl
curl -X POST http://localhost:4000/api/twilio/webhook \
  -H "Content-Type: application/json" \
  -H "X-Twilio-Signature: test_signature" \
  -d '[
    {
      "EventType": "message",
      "From": "whatsapp:+2348012345678",
      "To": "whatsapp:+1234567890",
      "Body": "Hello, I want to inquire about your services"
    }
  ]'
```

### Step 5.3: Manual Testing Checklist

- [ ] Twilio account setup complete
- [ ] Sandbox connection verified
- [ ] Webhook endpoint accessible
- [ ] Message sending works
- [ ] Message receiving works
- [ ] AI integration works
- [ ] Rate limiting works
- [ ] Cost control works
- [ ] Fallback to Facebook works
- [ ] Circuit breaker works
- [ ] Database logging works
- [ ] Frontend integration works

### Step 5.4: Load Testing

Use Apache Bench or similar:

```bash
# Test rate limiting
ab -n 100 -c 10 -p message.json -T application/json http://localhost:4000/api/twilio/send
```

---

## Phase 6: Deployment

### Step 6.1: Environment Configuration

Update production [.env](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/.env:0:0-0:0):

```env
TWILIO_ACCOUNT_SID=production_account_sid
TWILIO_AUTH_TOKEN=production_auth_token
TWILIO_WHATSAPP_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://discover-festac.com/api/twilio/webhook
TWILIO_WEBHOOK_SECRET=secure_random_secret
TWILIO_MESSAGE_QUEUE_ENABLED=true
TWILIO_RATE_LIMIT_ENABLED=true
TWILIO_COST_CONTROL_ENABLED=true
TWILIO_FALLBACK_ENABLED=true
```

### Step 6.2: Database Migration

```bash
cd apps/backend
npx prisma migrate deploy
```

### Step 6.3: Build and Deploy

```bash
# Backend
cd apps/backend
npm run build
# Deploy to your hosting platform

# Frontend
cd apps/frontend
npm run build
# Deploy to your hosting platform
```

### Step 6.4: Webhook Configuration

1. Update Twilio webhook URL to production endpoint
2. Verify webhook signature is configured
3. Test webhook with production endpoint

### Step 6.5: Monitoring Setup

Set up monitoring for:
- Twilio API error rates
- Message queue size
- Circuit breaker status
- Cost control alerts
- Rate limit violations

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Message Delivery Rate**
   - Target: >95%
   - Alert if: <90%

2. **API Response Time**
   - Target: <500ms
   - Alert if: >2s

3. **Queue Size**
   - Target: <100 messages
   - Alert if: >500 messages

4. **Cost per Vendor**
   - Target: Within budget
   - Alert if: >80% of budget

5. **Circuit Breaker Status**
   - Alert if: Circuit opens

### Logging

Ensure logs include:
- Message ID
- Vendor ID
- Provider used (Twilio/Facebook)
- Success/failure status
- Error messages
- Timing information

### Maintenance Tasks

**Daily:**
- Check error logs
- Verify circuit breaker status
- Review cost dashboard

**Weekly:**
- Review message delivery rates
- Check rate limit violations
- Analyze cost trends

**Monthly:**
- Review and adjust rate limits
- Update cost quotas
- Review fallback effectiveness

---

## Troubleshooting Guide

### Issue: Messages Not Sending

**Possible Causes:**
1. Invalid Twilio credentials
2. Webhook not configured
3. Rate limit exceeded
4. Budget exceeded

**Solutions:**
1. Verify credentials in [.env](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/.env:0:0-0:0)
2. Check Twilio console webhook configuration
3. Check rate limit status via `/api/twilio/circuit/status`
4. Check cost dashboard for budget status

### Issue: Webhook Not Receiving Messages

**Possible Causes:**
1. Webhook URL not accessible
2. Firewall blocking requests
3. Signature verification failing

**Solutions:**
1. Verify webhook URL is publicly accessible
2. Check firewall rules
3. Temporarily disable signature verification for testing

### Issue: Circuit Breaker Keeps Opening

**Possible Causes:**
1. Twilio API issues
2. Network connectivity problems
3. Rate limit too aggressive

**Solutions:**
1. Check Twilio status page
2. Verify network connectivity
3. Adjust rate limit parameters
4. Manually reset circuit breaker via `/api/twilio/circuit/reset`

### Issue: High Costs

**Possible Causes:**
1. Spam messages
2. Bot activity
3. Inefficient AI responses

**Solutions:**
1. Implement CAPTCHA for unknown numbers
2. Add spam detection
3. Optimize AI response length
4. Enable aggressive caching

---

## Appendix

### A. API Reference

#### POST /api/twilio/send

Send a WhatsApp message via Twilio.

**Request Body:**
```json
{
  "to": "+2348012345678",
  "body": "Hello from Discover Festac!",
  "vendorId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "twilio_sid",
    "provider": "twilio"
  }
}
```

#### POST /api/twilio/queue

Queue a WhatsApp message for later sending.

**Request Body:**
```json
{
  "to": "+2348012345678",
  "body": "Hello from Discover Festac!",
  "vendorId": "uuid",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "queue_message_id"
  }
}
```

#### GET /api/twilio/cost/dashboard

Get cost dashboard for current vendor.

**Response:**
```json
{
  "success": true,
  "data": {
    "quota": {
      "quota": { ... },
      "usagePercentage": 45.5,
      "status": "OK",
      "remaining": 545
    }
  }
}
```

### B. Configuration Reference

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| TWILIO_ACCOUNT_SID | Twilio Account SID | - |
| TWILIO_AUTH_TOKEN | Twilio Auth Token | - |
| TWILIO_WHATSAPP_NUMBER | Twilio WhatsApp number | - |
| TWILIO_WEBHOOK_URL | Webhook endpoint URL | - |
| TWILIO_WEBHOOK_SECRET | Webhook signature secret | - |
| TWILIO_MESSAGE_QUEUE_ENABLED | Enable message queue | true |
| TWILIO_RATE_LIMIT_ENABLED | Enable rate limiting | true |
| TWILIO_RATE_LIMIT_MAX_PER_MINUTE | Max messages per minute | 60 |
| TWILIO_RATE_LIMIT_MAX_PER_HOUR | Max messages per hour | 1000 |
| TWILIO_COST_CONTROL_ENABLED | Enable cost control | true |
| TWILIO_FALLBACK_ENABLED | Enable fallback to Facebook | true |

### C. Migration Checklist

- [ ] Backup database
- [ ] Run schema migration
- [ ] Update environment variables
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] Configure Twilio webhook
- [ ] Test sandbox connection
- [ ] Test with production credentials
- [ ] Monitor for 24 hours
- [ ] Enable fallback to Facebook
- [ ] Update documentation

### D. Rollback Plan

If issues occur during migration:

1. **Immediate Rollback:**
   - Set `TWILIO_FALLBACK_ENABLED=false`
   - Set `TWILIO_MESSAGE_QUEUE_ENABLED=false`
   - Restart backend service

2. **Full Rollback:**
   - Revert to previous backend commit
   - Revert database migration
   - Restore previous [.env](cci:7://file:///c:/Users/ADMIN/Documents/webprojects/discover-festac/apps/backend/.env:0:0-0:0) configuration

3. **Data Recovery:**
   - Database changes are additive, no data loss expected
   - Message logs remain intact

---

## Conclusion

This implementation guide provides a comprehensive, engineering-focused approach to integrating Twilio as a middleware layer for WhatsApp messaging in the Discover Festac project. The architecture ensures:

- **Reliability:** Message queuing, retry logic, and fallback mechanisms
- **Scalability:** Rate limiting and cost control
- **Maintainability:** Modular design with clear separation of concerns
- **Observability:** Comprehensive logging and monitoring
- **Safety:** Circuit breaker pattern and gradual rollout

Follow this guide step-by-step to ensure a successful integration with minimal disruption to existing services.

---

**Document Version:** 1.0.0  
**Last Updated:** 2026-05-26  
**Author:** Engineering Team  
**Review Status:** Ready for Implementation
```