import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { aiCommerceService } from '../ai/aiCommerce.service.js';
import { prisma } from '../config/database.js';
import type { WhatsAppIncomingMessage } from '@discover-festac/shared';

const WA_API_URL = `https://graph.facebook.com/${config.whatsapp.apiVersion}`;

// ─── WEBHOOK VERIFICATION ────────────────────────────────────

export function verifyWebhook(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('WhatsApp webhook verified');
    res.status(200).send(challenge);
  } else {
    logger.warn('WhatsApp webhook verification failed');
    res.sendStatus(403);
  }
}

// ─── INCOMING MESSAGE HANDLER ────────────────────────────────

export async function handleIncomingMessage(
  req: Request,
  res: Response,
): Promise<void> {
  // Respond 200 immediately — WhatsApp requires quick acknowledgment
  res.sendStatus(200);

  try {
    const body = req.body as WhatsAppIncomingMessage;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        const value = change.value;
        if (!value.messages?.length) continue;

        for (const message of value.messages) {
          if (message.type !== 'text') continue;

          const fromPhone = message.from;
          const text = message.text?.body ?? '';

          logger.info(`WhatsApp message from ${fromPhone}: ${text}`);

          // Find vendor associated with this WhatsApp number
          const vendor = await prisma.vendor.findFirst({
            where: { whatsappPhone: { contains: value.metadata.display_phone_number } },
          });

          if (!vendor) {
            logger.warn(`No vendor found for WA number ${value.metadata.display_phone_number}`);
            continue;
          }

          // Get conversation history
          const history = await prisma.message.findMany({
            where: { vendorId: vendor.id, fromPhone },
            orderBy: { createdAt: 'desc' },
            take: 10,
          });

          const conversationHistory = history
            .reverse()
            .map((m) => ({ role: m.direction === 'INBOUND' ? 'user' as const : 'assistant' as const, content: m.content }));

          // Generate AI response
          const aiResponse = await aiCommerceService.generateResponse(
            vendor.id,
            text,
            conversationHistory,
          );

          // Send reply
          await sendWhatsAppMessage(fromPhone, aiResponse.message);

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
                  source: 'WHATSAPP_AI',
                },
              });
            }
          }
        }
      }
    }
  } catch (err) {
    logger.error('WhatsApp webhook processing error:', err);
  }
}

// ─── SEND MESSAGE ─────────────────────────────────────────────

export async function sendWhatsAppMessage(to: string, text: string): Promise<void> {
  if (!config.whatsapp.accessToken || !config.whatsapp.phoneNumberId) {
    logger.warn('WhatsApp not configured. Message not sent:', { to, text: text.slice(0, 50) });
    return;
  }

  try {
    const response = await fetch(
      `${WA_API_URL}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.whatsapp.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text },
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      logger.error('WhatsApp send error:', error);
    }
  } catch (err) {
    logger.error('WhatsApp send failed:', err);
  }
}

// ─── SIGNATURE VERIFICATION MIDDLEWARE ───────────────────────

export function verifyWhatsAppSignature(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!config.whatsapp.appSecret) { next(); return; }

  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature) { res.sendStatus(401); return; }

  const expectedSignature = `sha256=${crypto
    .createHmac('sha256', config.whatsapp.appSecret)
    .update(JSON.stringify(req.body))
    .digest('hex')}`;

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    res.sendStatus(401);
    return;
  }
  next();
}
