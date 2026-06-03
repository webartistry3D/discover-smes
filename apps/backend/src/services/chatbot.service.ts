import { PrismaClient, MessageType } from '@prisma/client';
import type {
  ChatbotSettings,
  ChatbotRule,
  ChatbotSession,
  ChatbotRuleType,
  ChatbotSessionStatus,
  UpdateChatbotSettingsRequest,
  CreateChatbotRuleRequest,
  UpdateChatbotRuleRequest,
  TakeoverSessionRequest,
  ResumeSessionRequest,
  ProcessMessageRequest,
  ProcessMessageResponse,
} from '@discover-festac/shared';
import { prisma } from '../config/database.js';
import { costControlService } from '../modules/cost-control/cost.service';

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

  async takeoverSession(vendorId: string, sessionId: string): Promise<ChatbotSession> {
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

    // Get active rules
    const rules = await prisma.chatbotRule.findMany({
      where: {
        vendorId,
        isActive: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Find matching rule
    let matchedRule: ChatbotRule | null = null;
    let response = settings.fallbackMessage || 'Thank you for your message. A human agent will assist you shortly.';
    let matchedKeyword: string | null = null;

    for (const rule of rules) {
      const keyword = rule.keyword.toLowerCase().trim();
      
      // Exact match
      if (normalizedMessage === keyword) {
        matchedRule = rule;
        response = rule.response;
        matchedKeyword = keyword;
        break;
      }

      // Partial match
      if (normalizedMessage.includes(keyword)) {
        matchedRule = rule;
        response = rule.response;
        matchedKeyword = keyword;
        break;
      }

      // Pattern match (if question pattern is set)
      if (rule.questionPattern) {
        const pattern = rule.questionPattern.toLowerCase().trim();
        if (normalizedMessage.includes(pattern)) {
          matchedRule = rule;
          response = rule.response;
          matchedKeyword = keyword;
          break;
        }
      }
    }

    // Check if customer requested human
    if (normalizedMessage.includes('human') || normalizedMessage.includes('agent') || normalizedMessage.includes('person')) {
      response = settings.humanHandoffMessage || 'A human agent is now attending to you.';
      
      // Trigger handoff
      await prisma.chatbotSession.update({
        where: { id: session.id },
        data: {
          botActive: false,
          humanTakeover: true,
          sessionStatus: 'HUMAN_TAKEOVER',
        },
      });

      return { response, shouldHandoff: true, matchedRule };
    }

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

      return { response: costDecision.cachedResponse, shouldHandoff: false, matchedRule };
    }

    // If not allowed, return fallback response
    if (!costDecision.decision.allowed) {
      return { 
        response: costDecision.decision.fallbackResponse || response, 
        shouldHandoff: false,
        matchedRule 
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

    return { response, shouldHandoff: false, matchedRule };
  }
}

export default new ChatbotService();
