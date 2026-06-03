import OpenAI from 'openai';
import { config } from '../config/index.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { IntentType, VendorKnowledgeBase, AIResponse, DetectedIntent, LeadQualification } from '@discover-festac/shared';
import { formatNaira } from '@discover-festac/shared';

const openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;

export class AICommerceService {
  // ─── INTENT DETECTION ────────────────────────────────────

  async detectIntent(message: string): Promise<DetectedIntent> {
    const lower = message.toLowerCase();

    // Rule-based fast detection (saves API calls for common patterns)
    if (/\b(hi|hello|hey|good (morning|afternoon|evening))\b/.test(lower)) {
      return { type: 'GREETING', confidence: 0.95, entities: {} };
    }
    if (/\b(price|cost|how much|charge|rate|fee)\b/.test(lower)) {
      return { type: 'PRICING_INQUIRY', confidence: 0.9, entities: {} };
    }
    if (/\b(open|close|hour|time|when|available)\b/.test(lower)) {
      return { type: 'HOURS_INQUIRY', confidence: 0.85, entities: {} };
    }
    if (/\b(where|location|address|directions|find you|map)\b/.test(lower)) {
      return { type: 'LOCATION_INQUIRY', confidence: 0.9, entities: {} };
    }
    if (/\b(book|appointment|schedule|reserve|slot)\b/.test(lower)) {
      return { type: 'BOOKING_REQUEST', confidence: 0.88, entities: {} };
    }
    if (/\b(product|item|sell|stock|available|buy|order)\b/.test(lower)) {
      return { type: 'PRODUCT_INQUIRY', confidence: 0.8, entities: {} };
    }
    if (/\b(service|offer|provide|do you|can you)\b/.test(lower)) {
      return { type: 'SERVICE_INQUIRY', confidence: 0.75, entities: {} };
    }
    if (/\b(inventory|quantity|in stock|how many|do you have|availability)\b/.test(lower)) {
      return { type: 'INVENTORY_INQUIRY', confidence: 0.85, entities: {} };
    }
    if (/\b(interested|want to buy|need|looking for|quote|estimate)\b/.test(lower)) {
      return { type: 'LEAD_QUALIFICATION', confidence: 0.8, entities: {} };
    }
    if (/\b(complain|problem|issue|bad|wrong|not working|refund)\b/.test(lower)) {
      return { type: 'COMPLAINT', confidence: 0.85, entities: {} };
    }

    // AI classification for ambiguous messages
    if (openai) {
      return this.classifyWithAI(message);
    }

    return { type: 'UNKNOWN', confidence: 0.5, entities: {} };
  }

  private async classifyWithAI(message: string): Promise<DetectedIntent> {
    try {
      const response = await openai!.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 100,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `Classify this customer message into exactly one of these intents:
GREETING, PRICING_INQUIRY, HOURS_INQUIRY, LOCATION_INQUIRY, BOOKING_REQUEST, 
PRODUCT_INQUIRY, SERVICE_INQUIRY, INVENTORY_INQUIRY, LEAD_QUALIFICATION, FAQ_GENERAL, COMPLAINT, UNKNOWN.
Respond with JSON only: {"type": "INTENT_TYPE", "confidence": 0.0-1.0, "entities": {}}`,
          },
          { role: 'user', content: message },
        ],
      });

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content) as DetectedIntent;
    } catch (err) {
      logger.error('AI intent classification failed:', err);
      return { type: 'UNKNOWN', confidence: 0.5, entities: {} };
    }
  }

  // ─── KNOWLEDGE BASE ──────────────────────────────────────

  async buildVendorKnowledgeBase(vendorId: string): Promise<VendorKnowledgeBase> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        products: { where: { isAvailable: true } },
        services: { where: { isAvailable: true } },
        inventoryItems: { where: { isActive: true } },
        faqs: { orderBy: { sortOrder: 'asc' } },
        category: true,
      },
    });

    if (!vendor) throw new Error('Vendor not found');

    const openingHours = vendor.openingHours as Record<string, { open: string; close: string; isClosed?: boolean }> | null;
    const hoursText = openingHours
      ? Object.entries(openingHours)
          .map(([day, h]) => (h.isClosed ? `${day}: Closed` : `${day}: ${h.open} - ${h.close}`))
          .join(', ')
      : 'Not specified';

    const kb: VendorKnowledgeBase = {
      vendorId,
      businessName: vendor.businessName,
      description: vendor.description,
      address: `${vendor.address}, ${vendor.ward ? vendor.ward + ', ' : ''}${vendor.lga}, Lagos`,
      phone: vendor.phone,
      openingHours: hoursText,
      categories: [vendor.category.name],
      products: vendor.products.map((p) => ({
        name: p.name,
        price: formatNaira(Number(p.price)),
        description: p.description,
      })),
      services: vendor.services.map((s) => ({
        name: s.name,
        price: s.price ? formatNaira(Number(s.price)) : s.priceLabel ?? 'Contact for pricing',
        duration: s.durationMinutes ? `${s.durationMinutes} minutes` : undefined,
        description: s.description,
      })),
      inventory: vendor.inventoryItems.map((i) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit || undefined,
        unitCost: i.unitCost ? formatNaira(Number(i.unitCost)) : undefined,
        sellingPrice: i.sellingPrice ? formatNaira(Number(i.sellingPrice)) : undefined,
        category: i.category || undefined,
      })),
      faqs: vendor.faqs.map((f) => ({ question: f.question, answer: f.answer })),
    };

    // Cache the serialized knowledge base on the vendor record
    await prisma.vendor.update({
      where: { id: vendorId },
      data: { aiContext: JSON.stringify(kb) },
    });

    return kb;
  }

  async getOrBuildKnowledgeBase(vendorId: string): Promise<VendorKnowledgeBase> {
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { aiContext: true, updatedAt: true },
    });

    if (vendor?.aiContext) {
      // Use cached context if vendor was updated more than 1 hour ago
      const cacheAge = Date.now() - vendor.updatedAt.getTime();
      if (cacheAge < 60 * 60 * 1000) {
        return JSON.parse(vendor.aiContext) as VendorKnowledgeBase;
      }
    }

    return this.buildVendorKnowledgeBase(vendorId);
  }

  // ─── RESPONSE GENERATION ────────────────────────────────

  async generateResponse(
    vendorId: string,
    userMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  ): Promise<AIResponse> {
    const intent = await this.detectIntent(userMessage);
    const kb = await this.getOrBuildKnowledgeBase(vendorId);

    // Get vendor AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { vendorId },
    });

    // Check if AI is enabled
    if (aiConfig && !aiConfig.isEnabled) {
      return {
        message: `Our AI assistant is currently unavailable. Please call us at ${kb.phone} for assistance.`,
        intent: intent.type,
        requiresHumanFollowup: true,
      };
    }

    // Check if specific feature is disabled
    if (aiConfig) {
      if (intent.type === 'FAQ_GENERAL' && !aiConfig.faqEnabled) {
        return {
          message: `For FAQ assistance, please call us at ${kb.phone}.`,
          intent: intent.type,
          requiresHumanFollowup: true,
        };
      }
      if (intent.type === 'PRICING_INQUIRY' && !aiConfig.pricingInquiryEnabled) {
        return {
          message: `For pricing information, please call us at ${kb.phone}.`,
          intent: intent.type,
          requiresHumanFollowup: true,
        };
      }
      if (intent.type === 'BOOKING_REQUEST' && !aiConfig.bookingAssistanceEnabled) {
        return {
          message: `For booking assistance, please call us at ${kb.phone}.`,
          intent: intent.type,
          requiresHumanFollowup: true,
        };
      }
      if (intent.type === 'INVENTORY_INQUIRY' && !aiConfig.inventoryInquiryEnabled) {
        return {
          message: `For inventory information, please call us at ${kb.phone}.`,
          intent: intent.type,
          requiresHumanFollowup: true,
        };
      }
      if (intent.type === 'LEAD_QUALIFICATION' && !aiConfig.leadQualificationEnabled) {
        return {
          message: `Thank you for your interest. Please call us at ${kb.phone} to discuss your needs.`,
          intent: intent.type,
          requiresHumanFollowup: true,
        };
      }
    }

    // Use custom greeting if configured
    if (intent.type === 'GREETING' && intent.confidence > 0.9) {
      const greeting = aiConfig?.greetingMessage || `Hello! Welcome to ${kb.businessName} 👋 How can I help you today? You can ask about our products, services, prices, inventory, or location.`;
      return {
        message: greeting,
        intent: intent.type,
        requiresHumanFollowup: false,
        suggestedActions: [
          { type: 'VIEW_PRODUCTS', label: 'View Products/Services', data: {} },
          { type: 'GET_DIRECTIONS', label: 'Get Directions', data: {} },
        ],
      };
    }

    // Handle FAQ with exact match if possible
    if (intent.type === 'FAQ_GENERAL' && kb.faqs.length > 0) {
      const lowerMessage = userMessage.toLowerCase();
      const matchedFAQ = kb.faqs.find(faq =>
        faq.question.toLowerCase().includes(lowerMessage) ||
        lowerMessage.includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' '))
      );

      if (matchedFAQ) {
        return {
          message: matchedFAQ.answer,
          intent: intent.type,
          requiresHumanFollowup: false,
        };
      }
    }

    if (intent.type === 'HOURS_INQUIRY' && intent.confidence > 0.8) {
      return {
        message: `Our opening hours are: ${kb.openingHours}. We're located at ${kb.address}.`,
        intent: intent.type,
        requiresHumanFollowup: false,
      };
    }

    if (intent.type === 'LOCATION_INQUIRY' && intent.confidence > 0.8) {
      return {
        message: `You can find us at: ${kb.address}. Feel free to call us at ${kb.phone} for directions!`,
        intent: intent.type,
        requiresHumanFollowup: false,
        suggestedActions: [{ type: 'GET_DIRECTIONS', label: 'Get Directions', data: {} }],
      };
    }

    if (intent.type === 'INVENTORY_INQUIRY' && intent.confidence > 0.8) {
      return this.handleInventoryInquiry(kb, userMessage);
    }

    if (intent.type === 'LEAD_QUALIFICATION' && intent.confidence > 0.8) {
      return this.handleLeadQualification(kb, userMessage, vendorId);
    }

    if (intent.type === 'COMPLAINT') {
      return {
        message: `We're sorry to hear you're having an issue. A team member will reach out to you shortly. You can also call us directly at ${kb.phone}.`,
        intent: intent.type,
        requiresHumanFollowup: true,
      };
    }

    // For complex intents, use OpenAI
    if (!openai) {
      return this.fallbackResponse(intent.type, kb);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(kb);
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8), // last 8 messages for context
        { role: 'user', content: userMessage },
      ];

      const response = await openai.chat.completions.create({
        model: config.openai.model,
        max_tokens: config.openai.maxTokens,
        temperature: 0.3,
        messages,
      });

      const aiMessage = response.choices[0]?.message?.content ?? 'I apologize, I could not generate a response.';

      // Save to message log
      await this.saveMessage(vendorId, userMessage, aiMessage, intent.type);

      return {
        message: aiMessage,
        intent: intent.type,
        requiresHumanFollowup: intent.type === 'UNKNOWN',
        suggestedActions: this.suggestActions(intent.type),
      };
    } catch (err) {
      logger.error('OpenAI response generation failed:', err);
      return this.fallbackResponse(intent.type, kb);
    }
  }

  // ─── INVENTORY INQUIRY HANDLER ─────────────────────────────

  private handleInventoryInquiry(kb: VendorKnowledgeBase, userMessage: string): AIResponse {
    if (!kb.inventory || kb.inventory.length === 0) {
      return {
        message: `We don't have inventory information available at the moment. Please call us at ${kb.phone} to check availability.`,
        intent: 'INVENTORY_INQUIRY',
        requiresHumanFollowup: true,
        suggestedActions: [{ type: 'CALL_VENDOR', label: 'Call Us', data: {} }],
      };
    }

    // Check if user is asking about a specific item
    const lowerMessage = userMessage.toLowerCase();
    const matchedItem = kb.inventory.find((item) =>
      lowerMessage.includes(item.name.toLowerCase()) || (item.category && lowerMessage.includes(item.category.toLowerCase()))
    );

    if (matchedItem) {
      const stockStatus = matchedItem.quantity > 0
        ? `We have ${matchedItem.quantity} ${matchedItem.unit || 'units'} in stock.`
        : 'This item is currently out of stock.';

      const priceInfo = matchedItem.sellingPrice
        ? ` Price: ${matchedItem.sellingPrice}`
        : ' Please contact us for pricing.';

      return {
        message: `${matchedItem.name}: ${stockStatus}${priceInfo}`,
        intent: 'INVENTORY_INQUIRY',
        requiresHumanFollowup: false,
        suggestedActions: [{ type: 'REQUEST_QUOTE', label: 'Request Quote', data: {} }],
      };
    }

    // General inventory overview
    const inStockItems = kb.inventory.filter((i) => i.quantity > 0);
    const outOfStockItems = kb.inventory.filter((i) => i.quantity <= 0);

    let message = `Current Inventory Status:\n\n`;
    if (inStockItems.length > 0) {
      message += `✅ In Stock (${inStockItems.length} items):\n`;
      inStockItems.slice(0, 5).forEach((item) => {
        message += `• ${item.name}: ${item.quantity} ${item.unit || 'units'}\n`;
      });
    }
    if (outOfStockItems.length > 0) {
      message += `\n❌ Out of Stock (${outOfStockItems.length} items):\n`;
      outOfStockItems.slice(0, 3).forEach((item) => {
        message += `• ${item.name}\n`;
      });
    }

    return {
      message,
      intent: 'INVENTORY_INQUIRY',
      requiresHumanFollowup: false,
      suggestedActions: [{ type: 'CHECK_INVENTORY', label: 'Full Inventory', data: {} }],
    };
  }

  // ─── LEAD QUALIFICATION HANDLER ────────────────────────────

  private async handleLeadQualification(kb: VendorKnowledgeBase, userMessage: string, vendorId: string): Promise<AIResponse> {
    // Get vendor AI configuration for threshold
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { vendorId },
    });

    const threshold = aiConfig?.leadQualificationThreshold || 70;
    const qualification = this.qualifyLead(userMessage, threshold);

    let message = '';
    let requiresHumanFollowup = false;

    if (qualification.tier === 'HOT') {
      message = `Great! Based on your inquiry, you seem very interested. Our team will contact you within 2 hours to discuss your needs. You can also call us at ${kb.phone} for immediate assistance.`;
      requiresHumanFollowup = true;
    } else if (qualification.tier === 'WARM') {
      message = `Thanks for your interest! We'd love to help you. Our team will follow up within 24 hours. Feel free to call ${kb.phone} if you need immediate assistance.`;
      requiresHumanFollowup = false;
    } else {
      message = `Thank you for reaching out! We've noted your interest and will keep you updated about our offerings. Feel free to ask any questions or call ${kb.phone}.`;
      requiresHumanFollowup = false;
    }

    return {
      message,
      intent: 'LEAD_QUALIFICATION',
      requiresHumanFollowup,
      suggestedActions: [
        { type: 'CALL_VENDOR', label: 'Call Now', data: {} },
        { type: 'BOOK_APPOINTMENT', label: 'Book Appointment', data: {} },
      ],
      leadQualification: qualification,
    };
  }

  // ─── LEAD SCORING SYSTEM ────────────────────────────────────

  private qualifyLead(message: string, threshold: number = 70): LeadQualification {
    const lower = message.toLowerCase();
    let score = 0;
    const factors = {
      intentClarity: 0,
      purchaseReadiness: 0,
      budgetIndication: 0,
      timelineUrgency: 0,
      contactInformation: false,
    };

    // Intent clarity (0-25 points)
    if (/\b(want to buy|need|looking for|interested in)\b/.test(lower)) {
      factors.intentClarity = 25;
      score += 25;
    } else if (/\b(thinking about|considering)\b/.test(lower)) {
      factors.intentClarity = 15;
      score += 15;
    }

    // Purchase readiness (0-25 points)
    if (/\b(ready to buy|ready to purchase|want to order now|immediately)\b/.test(lower)) {
      factors.purchaseReadiness = 25;
      score += 25;
    } else if (/\b(soon|this week|today)\b/.test(lower)) {
      factors.purchaseReadiness = 15;
      score += 15;
    }

    // Budget indication (0-25 points)
    if (/\b(budget|price|how much|afford|willing to pay)\b/.test(lower)) {
      factors.budgetIndication = 25;
      score += 25;
    }

    // Timeline urgency (0-25 points)
    if (/\b(urgent|asap|immediately|right now)\b/.test(lower)) {
      factors.timelineUrgency = 25;
      score += 25;
    } else if (/\b(this week|this month|soon)\b/.test(lower)) {
      factors.timelineUrgency = 15;
      score += 15;
    }

    // Contact information (boolean)
    if (/\b(call me|my number is|reach me at|phone)\b/.test(lower)) {
      factors.contactInformation = true;
      score += 10;
    }

    // Determine tier
    let tier: 'HOT' | 'WARM' | 'COLD';
    let followUpPriority: 'IMMEDIATE' | 'WITHIN_24H' | 'WITHIN_WEEK' | 'LOW';
    let recommendedAction: string;

    if (score >= threshold) {
      tier = 'HOT';
      followUpPriority = 'IMMEDIATE';
      recommendedAction = 'Immediate follow-up required. High-priority lead with strong purchase intent.';
    } else if (score >= threshold * 0.6) {
      tier = 'WARM';
      followUpPriority = 'WITHIN_24H';
      recommendedAction = 'Follow up within 24 hours. Moderate interest shown.';
    } else {
      tier = 'COLD';
      followUpPriority = 'WITHIN_WEEK';
      recommendedAction = 'Add to nurture campaign. Low immediate purchase intent.';
    }

    return {
      score: Math.min(score, 100),
      tier,
      factors,
      recommendedAction,
      followUpPriority,
    };
  }

  // ─── HELPERS ────────────────────────────────────────────

  private buildSystemPrompt(kb: VendorKnowledgeBase): string {
    const productsText =
      kb.products.length > 0
        ? kb.products.map((p) => `- ${p.name}: ${p.price}${p.description ? ` (${p.description})` : ''}`).join('\n')
        : 'No products listed';

    const servicesText =
      kb.services.length > 0
        ? kb.services.map((s) => `- ${s.name}: ${s.price}${s.duration ? `, ${s.duration}` : ''}`).join('\n')
        : 'No services listed';

    const inventoryText =
      kb.inventory && kb.inventory.length > 0
        ? kb.inventory
            .filter((i) => i.quantity > 0)
            .map((i) => `- ${i.name}: ${i.quantity} ${i.unit || 'units'}${i.sellingPrice ? `, ${i.sellingPrice}` : ''}`)
            .join('\n')
        : 'No inventory data available';

    const faqsText =
      kb.faqs.length > 0
        ? kb.faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n')
        : 'No FAQs available';

    return `You are a friendly AI customer service assistant for ${kb.businessName}, a business in Festac Town, Lagos, Nigeria.

BUSINESS INFORMATION:
Name: ${kb.businessName}
Description: ${kb.description}
Address: ${kb.address}
Phone: ${kb.phone}
Opening Hours: ${kb.openingHours}

PRODUCTS:
${productsText}

SERVICES:
${servicesText}

INVENTORY (Current Stock):
${inventoryText}

FREQUENTLY ASKED QUESTIONS:
${faqsText}

INSTRUCTIONS:
- Answer questions only based on the business information provided above
- Be friendly, helpful and professional
- Use Nigerian-friendly language where appropriate
- If you don't know the answer, say "Please contact us directly at ${kb.phone}"
- Keep responses concise (2-3 sentences max for WhatsApp)
- For booking requests, ask for: preferred date/time, name, and phone number
- For inventory inquiries, provide stock status and pricing when available
- For lead qualification, assess purchase intent and urgency
- Never make up prices or information not provided above
- Respond in the same language as the customer (English or Pidgin English)`;
  }

  private fallbackResponse(intent: IntentType, kb: VendorKnowledgeBase): AIResponse {
    const responses: Partial<Record<IntentType, string>> = {
      PRICING_INQUIRY: `For pricing information, please contact us at ${kb.phone} or visit us at ${kb.address}.`,
      BOOKING_REQUEST: `To book an appointment, please call us at ${kb.phone} or message us your preferred date and time.`,
      PRODUCT_INQUIRY: `We offer a range of products. Please call ${kb.phone} for availability and pricing.`,
      SERVICE_INQUIRY: `We offer various services. Please contact us at ${kb.phone} to discuss your needs.`,
      INVENTORY_INQUIRY: `For inventory availability, please call us at ${kb.phone} or visit our store at ${kb.address}.`,
      LEAD_QUALIFICATION: `Thank you for your interest! Our team will follow up with you shortly. You can also call ${kb.phone} for immediate assistance.`,
      FAQ_GENERAL: `For more information about ${kb.businessName}, please call ${kb.phone} or visit us at ${kb.address}.`,
      UNKNOWN: `Thank you for your message! A team member will get back to you shortly. You can also call us at ${kb.phone}.`,
    };

    return {
      message: responses[intent] ?? `Thank you for contacting ${kb.businessName}! Please call ${kb.phone} for assistance.`,
      intent,
      requiresHumanFollowup: true,
    };
  }

  private suggestActions(intent: IntentType): AIResponse['suggestedActions'] {
    switch (intent) {
      case 'BOOKING_REQUEST':
        return [{ type: 'BOOK_APPOINTMENT', label: 'Book Appointment', data: {} }];
      case 'PRODUCT_INQUIRY':
        return [{ type: 'VIEW_PRODUCTS', label: 'View Products', data: {} }];
      case 'LOCATION_INQUIRY':
        return [{ type: 'GET_DIRECTIONS', label: 'Get Directions', data: {} }];
      default:
        return [{ type: 'VIEW_PROFILE', label: 'View Profile', data: {} }];
    }
  }

  private async saveMessage(
    vendorId: string,
    userMsg: string,
    aiMsg: string,
    intent: string,
  ): Promise<void> {
    // Save messages to DB for analytics and human review
    await prisma.message.createMany({
      data: [
        {
          vendorId,
          fromPhone: 'customer',
          toPhone: 'ai',
          direction: 'INBOUND',
          content: userMsg,
          intent,
        },
        {
          vendorId,
          fromPhone: 'ai',
          toPhone: 'customer',
          direction: 'OUTBOUND',
          content: aiMsg,
          isAiGenerated: true,
          intent,
        },
      ],
    });
  }
}

export const aiCommerceService = new AICommerceService();
