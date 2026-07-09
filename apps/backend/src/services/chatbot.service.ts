import { PrismaClient, MessageType, ConversationState, ChatbotSettings, ChatbotRule, ChatbotSession, ChatbotRuleType, ChatbotSessionStatus } from '@prisma/client';
import { prisma } from '../config/database.js';
import { costControlService } from '../modules/cost-control/cost.service';
import faqSearchService from './faq-search.service.js';
import productSearchService from './product-search.service.js';
import serviceSearchService from './service-search.service.js';
import businessHoursService from './business-hours.service.js';

// Local type definitions (will be moved to shared package later)
interface UpdateChatbotSettingsRequest {
  chatbotEnabled?: boolean;
  greetingMessage?: string;
  fallbackMessage?: string;
  humanHandoffMessage?: string;
  offlineMessage?: string;
  handoffEnabled?: boolean;
  businessHoursEnabled?: boolean;
  businessHours?: any;
  fuzzyMatchingEnabled?: boolean;
  fuzzyThreshold?: number;
}

interface CreateChatbotRuleRequest {
  ruleType: ChatbotRuleType;
  keyword: string;
  questionPattern?: string;
  response: string;
  priority?: number;
}

interface UpdateChatbotRuleRequest {
  ruleType?: ChatbotRuleType;
  keyword?: string;
  questionPattern?: string;
  response?: string;
  priority?: number;
  isActive?: boolean;
}

interface TakeoverSessionRequest {
  sessionId: string;
  assignedOperatorId?: string;
}

interface ResumeSessionRequest {
  sessionId: string;
}

interface ProcessMessageRequest {
  vendorId: string;
  customerPhone: string;
  message: string;
}

interface ProcessMessageResponse {
  response: string;
  shouldHandoff: boolean;
  matchedRule?: ChatbotRule;
  newState?: ConversationState;
}

export class ChatbotService {
  // ─── CHATBOT SETTINGS ────────────────────────────────────────────────

  async getSettings(vendorId: string): Promise<ChatbotSettings | null> {
    let settings = await prisma.chatbotSettings.findUnique({
      where: { vendorId },
    });

    // Create default settings if none exists
    if (!settings) {
      settings = await prisma.chatbotSettings.create({
        data: {
          vendorId,
          chatbotEnabled: true,
          greetingMessage: 'Hello! Welcome to our business. How can I help you today?',
          fallbackMessage: 'Thank you for your message. A human agent will assist you shortly.',
          humanHandoffMessage: 'A human agent is now attending to you.',
        },
      });
    }

    return settings;
  }

  async updateSettings(vendorId: string, data: UpdateChatbotSettingsRequest): Promise<ChatbotSettings> {
    return prisma.chatbotSettings.upsert({
      where: { vendorId },
      update: data,
      create: {
        vendorId,
        chatbotEnabled: data.chatbotEnabled ?? true,
        greetingMessage: data.greetingMessage,
        fallbackMessage: data.fallbackMessage,
        humanHandoffMessage: data.humanHandoffMessage,
        offlineMessage: data.offlineMessage,
        handoffEnabled: data.handoffEnabled ?? true,
        businessHoursEnabled: data.businessHoursEnabled ?? false,
        businessHours: data.businessHours,
        fuzzyMatchingEnabled: data.fuzzyMatchingEnabled ?? true,
        fuzzyThreshold: data.fuzzyThreshold ?? 0.3,
      },
    });
  }

  // ─── CHATBOT RULES ──────────────────────────────────────────────────

  async getRules(vendorId: string): Promise<ChatbotRule[]> {
    return prisma.chatbotRule.findMany({
      where: { vendorId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createRule(vendorId: string, data: CreateChatbotRuleRequest): Promise<ChatbotRule> {
    return prisma.chatbotRule.create({
      data: {
        vendorId,
        ruleType: data.ruleType,
        keyword: data.keyword.toLowerCase().trim(),
        questionPattern: data.questionPattern,
        response: data.response,
        priority: data.priority ?? 0,
        isActive: true,
      },
    });
  }

  async updateRule(vendorId: string, ruleId: string, data: UpdateChatbotRuleRequest): Promise<ChatbotRule> {
    // Verify rule belongs to vendor
    const existingRule = await prisma.chatbotRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule || existingRule.vendorId !== vendorId) {
      throw new Error('Rule not found');
    }

    return prisma.chatbotRule.update({
      where: { id: ruleId },
      data: {
        ...(data.ruleType && { ruleType: data.ruleType }),
        ...(data.keyword && { keyword: data.keyword.toLowerCase().trim() }),
        ...(data.questionPattern !== undefined && { questionPattern: data.questionPattern }),
        ...(data.response && { response: data.response }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteRule(vendorId: string, ruleId: string): Promise<void> {
    // Verify rule belongs to vendor
    const existingRule = await prisma.chatbotRule.findUnique({
      where: { id: ruleId },
    });

    if (!existingRule || existingRule.vendorId !== vendorId) {
      throw new Error('Rule not found');
    }

    await prisma.chatbotRule.delete({
      where: { id: ruleId },
    });
  }

  // ─── CHATBOT SESSIONS ───────────────────────────────────────────────

  async getSessions(vendorId: string, limit: number = 50): Promise<ChatbotSession[]> {
    return prisma.chatbotSession.findMany({
      where: { vendorId },
      orderBy: { lastMessageAt: 'desc' },
      take: limit,
    });
  }

  async takeoverSession(vendorId: string, sessionId: string, assignedOperatorId?: string): Promise<ChatbotSession> {
    // Verify session belongs to vendor
    const existingSession = await prisma.chatbotSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession || existingSession.vendorId !== vendorId) {
      throw new Error('Session not found');
    }

    return prisma.chatbotSession.update({
      where: { id: sessionId },
      data: {
        botActive: false,
        humanTakeover: true,
        sessionStatus: 'HUMAN_TAKEOVER',
        currentState: 'HUMAN_CHAT',
        assignedOperatorId,
        updatedAt: new Date(),
      },
    });
  }

  async resumeSession(vendorId: string, sessionId: string): Promise<ChatbotSession> {
    // Verify session belongs to vendor
    const existingSession = await prisma.chatbotSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession || existingSession.vendorId !== vendorId) {
      throw new Error('Session not found');
    }

    return prisma.chatbotSession.update({
      where: { id: sessionId },
      data: {
        botActive: true,
        humanTakeover: false,
        sessionStatus: 'ACTIVE',
        currentState: 'BOT_RESUMED',
        assignedOperatorId: null,
        updatedAt: new Date(),
      },
    });
  }

  // ─── MESSAGE PROCESSING ───────────────────────────────────────────────

  async processMessage(vendorId: string, customerPhone: string, message: string): Promise<ProcessMessageResponse> {
    // Get vendor chatbot settings
    const settings = await prisma.chatbotSettings.findUnique({
      where: { vendorId },
    });

    if (!settings || !settings.chatbotEnabled) {
      return { response: '', shouldHandoff: true };
    }

    // Check business hours
    const isWithinHours = await businessHoursService.isWithinBusinessHours(vendorId);
    if (!isWithinHours) {
      const nextOpening = await businessHoursService.getNextOpeningTime(vendorId);
      const offlineMessage = settings.offlineMessage || 'We are currently closed. ';
      const response = nextOpening 
        ? `${offlineMessage} We'll be open ${nextOpening}.`
        : offlineMessage;
      return { response, shouldHandoff: false };
    }

    // Get or create session
    let session = await prisma.chatbotSession.findFirst({
      where: {
        vendorId,
        customerPhone,
        sessionStatus: { in: ['ACTIVE', 'HUMAN_TAKEOVER'] },
      },
    });

    if (!session) {
      session = await prisma.chatbotSession.create({
        data: {
          vendorId,
          customerPhone,
          botActive: true,
          humanTakeover: false,
          sessionStatus: 'ACTIVE',
          currentState: 'WELCOME',
          lastMessage: message,
          lastMessageAt: new Date(),
        },
      });
    } else {
      // Update session
      session = await prisma.chatbotSession.update({
        where: { id: session.id },
        data: {
          lastMessage: message,
          lastMessageAt: new Date(),
        },
      });
    }

    // Check if human takeover is active
    if (session.humanTakeover || !session.botActive) {
      return { response: '', shouldHandoff: true };
    }

    // Normalize message
    const normalizedMessage = message.toLowerCase().trim().replace(/[^\w\s]/g, '');

    // ─── STATE MACHINE LOGIC ───────────────────────────────────────────────
    
    let newState: ConversationState = session.currentState;
    let response = settings.fallbackMessage || 'Thank you for your message. A human agent will assist you shortly.';
    let matchedRule: ChatbotRule | null = null;
    let matchedKeyword: string | null = null;

    // Handle based on current state
    switch (session.currentState) {
      case 'WELCOME':
        // Send greeting and transition to MENU
        response = settings.greetingMessage || 'Hello! Welcome to our business. How can I help you today?';
        newState = 'MENU';
        break;

      case 'MENU':
        // Determine intent and transition to appropriate state
        if (normalizedMessage.includes('faq') || normalizedMessage.includes('question') || normalizedMessage.includes('help')) {
          newState = 'FAQ_SEARCH';
        } else if (normalizedMessage.includes('product') || normalizedMessage.includes('buy') || normalizedMessage.includes('price')) {
          newState = 'PRODUCT_SEARCH';
        } else if (normalizedMessage.includes('service') || normalizedMessage.includes('book') || normalizedMessage.includes('consultation')) {
          newState = 'SERVICE_SEARCH';
        } else if (normalizedMessage.includes('human') || normalizedMessage.includes('agent') || normalizedMessage.includes('person')) {
          newState = 'WAITING_FOR_OPERATOR';
        } else {
          // Try fuzzy matching with FAQs, products, and services
          const faqResults = settings.fuzzyMatchingEnabled 
            ? await faqSearchService.searchFaqs(vendorId, normalizedMessage, settings.fuzzyThreshold || 0.3)
            : [];
          
          if (faqResults.length > 0) {
            response = faqResults[0].item.answer;
            matchedRule = null;
            newState = 'MENU';
          } else {
            // Fall back to keyword matching
            const rules = await prisma.chatbotRule.findMany({
              where: { vendorId, isActive: true },
              orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
            });

            for (const rule of rules) {
              const keyword = rule.keyword.toLowerCase().trim();
              if (normalizedMessage === keyword || normalizedMessage.includes(keyword)) {
                matchedRule = rule;
                response = rule.response;
                matchedKeyword = keyword;
                break;
              }
            }
          }
        }
        break;

      case 'FAQ_SEARCH':
        // Search FAQs with fuzzy matching
        const faqResults = settings.fuzzyMatchingEnabled
          ? await faqSearchService.searchFaqs(vendorId, normalizedMessage, settings.fuzzyThreshold || 0.3)
          : await faqSearchService.getExactMatch(vendorId, normalizedMessage);

        if (Array.isArray(faqResults) && faqResults.length > 0) {
          response = faqResults[0].item.answer;
        } else if (faqResults && typeof faqResults === 'object' && 'answer' in faqResults) {
          response = faqResults.answer;
        } else {
          response = 'I couldn\'t find an answer to that question. Try asking differently or type "menu" to see options.';
        }
        newState = 'MENU';
        break;

      case 'PRODUCT_SEARCH':
        // Search products with fuzzy matching
        const productResults = settings.fuzzyMatchingEnabled
          ? await productSearchService.searchProducts(vendorId, normalizedMessage, settings.fuzzyThreshold || 0.3)
          : await productSearchService.getProductByName(vendorId, normalizedMessage);

        if (Array.isArray(productResults) && productResults.length > 0) {
          response = productSearchService.formatProductForWhatsApp(productResults[0].item);
        } else if (productResults) {
          response = productSearchService.formatProductForWhatsApp(productResults);
        } else {
          response = 'I couldn\'t find that product. Try a different search or type "menu" to see options.';
        }
        newState = 'MENU';
        break;

      case 'SERVICE_SEARCH':
        // Search services with fuzzy matching
        const serviceResults = settings.fuzzyMatchingEnabled
          ? await serviceSearchService.searchServices(vendorId, normalizedMessage, settings.fuzzyThreshold || 0.3)
          : await serviceSearchService.getServiceByName(vendorId, normalizedMessage);

        if (Array.isArray(serviceResults) && serviceResults.length > 0) {
          response = serviceSearchService.formatServiceForWhatsApp(serviceResults[0].item);
        } else if (serviceResults) {
          response = serviceSearchService.formatServiceForWhatsApp(serviceResults);
        } else {
          response = 'I couldn\'t find that service. Try a different search or type "menu" to see options.';
        }
        newState = 'MENU';
        break;

      case 'WAITING_FOR_OPERATOR':
        response = settings.humanHandoffMessage || 'A human agent is now attending to you.';
        newState = 'HUMAN_CHAT';
        
        // Trigger handoff
        await prisma.chatbotSession.update({
          where: { id: session.id },
          data: {
            botActive: false,
            humanTakeover: true,
            sessionStatus: 'HUMAN_TAKEOVER',
            currentState: 'HUMAN_CHAT',
          },
        });

        return { response, shouldHandoff: true, matchedRule, newState };

      case 'HUMAN_CHAT':
        return { response: '', shouldHandoff: true };

      case 'BOT_RESUMED':
        newState = 'MENU';
        response = 'I\'m back! How can I help you?';
        break;

      default:
        newState = 'MENU';
    }

    // Update session state
    await prisma.chatbotSession.update({
      where: { id: session.id },
      data: { currentState: newState },
    });

    // ─── COST CONTROL INTEGRATION ───────────────────────────────────────
    
    // Check cost control decision before sending
    const costDecision = await costControlService.shouldSendMessage({
      vendorId,
      customerPhone,
      keyword: matchedKeyword || undefined,
      sessionId: session.id,
    });

    // If cached response exists, return it immediately
    if (costDecision.cachedResponse) {
      // Log as cached hit
      await costControlService.logMessage({
        vendorId,
        sessionId: session.id,
        messageType: MessageType.SESSION,
        costEstimate: 0,
        cached: true,
      });

      return { response: costDecision.cachedResponse, shouldHandoff: false, matchedRule, newState };
    }

    // If not allowed, return fallback response
    if (!costDecision.decision.allowed) {
      return { 
        response: costDecision.decision.fallbackResponse || response, 
        shouldHandoff: false,
        matchedRule,
        newState
      };
    }

    // Apply delay if spike detected
    if (costDecision.decision.shouldDelay && costDecision.decision.delayMs) {
      await new Promise(resolve => setTimeout(resolve, costDecision.decision.delayMs));
    }

    // Cache the response for future use
    if (matchedKeyword) {
      await costControlService.cacheResponse({
        vendorId,
        keyword: matchedKeyword,
        response,
        ttlHours: 24,
      });
    }

    // Log the message usage
    await costControlService.logMessage({
      vendorId,
      sessionId: session.id,
      messageType: MessageType.SESSION,
      costEstimate: costControlService.estimateCost(MessageType.SESSION),
      cached: false,
    });

    return { response, shouldHandoff: false, matchedRule, newState };
  }
}

export default new ChatbotService();
