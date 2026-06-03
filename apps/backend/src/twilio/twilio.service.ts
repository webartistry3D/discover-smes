import twilio from 'twilio';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

// Initialize Twilio client
const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.auth_token
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
