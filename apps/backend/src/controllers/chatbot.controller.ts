import { Request, Response } from 'express';
import { PrismaClient, ChatbotSettings, ChatbotRule, ChatbotSession, ChatbotRuleType, ChatbotSessionStatus } from '@prisma/client';
import conversationAnalyticsService from '../services/conversation-analytics.service.js';

const prisma = new PrismaClient();

// Local type definitions
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
  newState?: string;
}

class ChatbotController {
  // ─── CHATBOT SETTINGS ────────────────────────────────────────────────

  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

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

      res.json({ success: true, data: settings });
    } catch (err) {
      console.error('Get chatbot settings error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get chatbot settings' } });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: UpdateChatbotSettingsRequest = req.body;

      const settings = await prisma.chatbotSettings.upsert({
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

      res.json({ success: true, data: settings });
    } catch (err) {
      console.error('Update chatbot settings error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update chatbot settings' } });
    }
  }

  // ─── CHATBOT RULES ──────────────────────────────────────────────────

  async getRules(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const rules = await prisma.chatbotRule.findMany({
        where: { vendorId },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      });

      res.json({ success: true, data: rules });
    } catch (err) {
      console.error('Get chatbot rules error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get chatbot rules' } });
    }
  }

  async createRule(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreateChatbotRuleRequest = req.body;

      const rule = await prisma.chatbotRule.create({
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

      res.json({ success: true, data: rule });
    } catch (err) {
      console.error('Create chatbot rule error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create chatbot rule' } });
    }
  }

  async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      const { id } = req.params;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      // Verify rule belongs to vendor
      const existingRule = await prisma.chatbotRule.findUnique({
        where: { id },
      });

      if (!existingRule || existingRule.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule not found' } });
        return;
      }

      const data: UpdateChatbotRuleRequest = req.body;

      const rule = await prisma.chatbotRule.update({
        where: { id },
        data: {
          ...(data.ruleType && { ruleType: data.ruleType }),
          ...(data.keyword && { keyword: data.keyword.toLowerCase().trim() }),
          ...(data.questionPattern !== undefined && { questionPattern: data.questionPattern }),
          ...(data.response && { response: data.response }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      res.json({ success: true, data: rule });
    } catch (err) {
      console.error('Update chatbot rule error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update chatbot rule' } });
    }
  }

  async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      const { id } = req.params;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      // Verify rule belongs to vendor
      const existingRule = await prisma.chatbotRule.findUnique({
        where: { id },
      });

      if (!existingRule || existingRule.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Rule not found' } });
        return;
      }

      await prisma.chatbotRule.delete({
        where: { id },
      });

      res.json({ success: true, data: { message: 'Rule deleted successfully' } });
    } catch (err) {
      console.error('Delete chatbot rule error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete chatbot rule' } });
    }
  }

  // ─── CHATBOT SESSIONS ───────────────────────────────────────────────

  async getSessions(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const sessions = await prisma.chatbotSession.findMany({
        where: { vendorId },
        orderBy: { lastMessageAt: 'desc' },
        take: 50,
      });

      res.json({ success: true, data: sessions });
    } catch (err) {
      console.error('Get chatbot sessions error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get chatbot sessions' } });
    }
  }

  async takeoverSession(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      const { sessionId } = req.body as TakeoverSessionRequest;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      // Verify session belongs to vendor
      const existingSession = await prisma.chatbotSession.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession || existingSession.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
        return;
      }

      const session = await prisma.chatbotSession.update({
        where: { id: sessionId },
        data: {
          botActive: false,
          humanTakeover: true,
          sessionStatus: 'HUMAN_TAKEOVER',
          updatedAt: new Date(),
        },
      });

      res.json({ success: true, data: session });
    } catch (err) {
      console.error('Takeover session error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to takeover session' } });
    }
  }

  async resumeSession(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      const { sessionId } = req.body as ResumeSessionRequest;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      // Verify session belongs to vendor
      const existingSession = await prisma.chatbotSession.findUnique({
        where: { id: sessionId },
      });

      if (!existingSession || existingSession.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } });
        return;
      }

      const session = await prisma.chatbotSession.update({
        where: { id: sessionId },
        data: {
          botActive: true,
          humanTakeover: false,
          sessionStatus: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      res.json({ success: true, data: session });
    } catch (err) {
      console.error('Resume session error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to resume session' } });
    }
  }

  // ─── MESSAGE PROCESSING ───────────────────────────────────────────────

  async processMessage(req: Request, res: Response): Promise<void> {
    try {
      const { vendorId, customerPhone, message } = req.body as ProcessMessageRequest;

      if (!vendorId || !customerPhone || !message) {
        res.status(400).json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Missing required fields' } });
        return;
      }

      // Get vendor chatbot settings
      const settings = await prisma.chatbotSettings.findUnique({
        where: { vendorId },
      });

      if (!settings || !settings.chatbotEnabled) {
        res.json({ success: true, data: { response: '', shouldHandoff: true } as ProcessMessageResponse });
        return;
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
        res.json({ success: true, data: { response: '', shouldHandoff: true } as ProcessMessageResponse });
        return;
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

      for (const rule of rules) {
        const keyword = rule.keyword.toLowerCase().trim();
        
        // Exact match
        if (normalizedMessage === keyword) {
          matchedRule = rule;
          response = rule.response;
          break;
        }

        // Partial match
        if (normalizedMessage.includes(keyword)) {
          matchedRule = rule;
          response = rule.response;
          break;
        }

        // Pattern match (if question pattern is set)
        if (rule.questionPattern) {
          const pattern = rule.questionPattern.toLowerCase().trim();
          if (normalizedMessage.includes(pattern)) {
            matchedRule = rule;
            response = rule.response;
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

        res.json({ success: true, data: { response, shouldHandoff: true, matchedRule } as ProcessMessageResponse });
        return;
      }

      res.json({ success: true, data: { response, shouldHandoff: false, matchedRule } as ProcessMessageResponse });
    } catch (err) {
      console.error('Process message error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process message' } });
    }
  }

  // ─── CONVERSATION ANALYTICS ─────────────────────────────────────────────

  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      const period = (req.query.period as string) || 'all';

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const metrics = await conversationAnalyticsService.getVendorMetrics(vendorId, period);
      res.json({ success: true, data: metrics });
    } catch (err) {
      console.error('Get analytics error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get analytics' } });
    }
  }

  async getGlobalAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as string) || 'all';

      // Only allow admins to access global analytics
      if (req.user?.role !== 'SUPER_ADMIN' && req.user?.role !== 'MODERATOR') {
        res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
        return;
      }

      const metrics = await conversationAnalyticsService.getGlobalMetrics(period);
      res.json({ success: true, data: metrics });
    } catch (err) {
      console.error('Get global analytics error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get global analytics' } });
    }
  }
}

export default new ChatbotController();
