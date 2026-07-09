import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { AIConfiguration, CreateAIConfigurationRequest } from '@discover-smes/shared';

export class AIController {
  // Get AI configuration for a vendor
  async getAIConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      let config = await prisma.aIConfiguration.findUnique({
        where: { vendorId },
      });

      // Create default configuration if not exists
      if (!config) {
        config = await prisma.aIConfiguration.create({
          data: {
            vendorId,
            isEnabled: true,
            faqEnabled: true,
            pricingInquiryEnabled: true,
            bookingAssistanceEnabled: true,
            inventoryInquiryEnabled: true,
            leadQualificationEnabled: true,
            leadQualificationThreshold: 70,
          },
        });
      }

      const aiConfig: AIConfiguration = {
        id: config.id,
        vendorId: config.vendorId,
        isEnabled: config.isEnabled,
        greetingMessage: config.greetingMessage ?? undefined,
        faqEnabled: config.faqEnabled,
        pricingInquiryEnabled: config.pricingInquiryEnabled,
        bookingAssistanceEnabled: config.bookingAssistanceEnabled,
        inventoryInquiryEnabled: config.inventoryInquiryEnabled,
        leadQualificationEnabled: config.leadQualificationEnabled,
        leadQualificationThreshold: config.leadQualificationThreshold ?? undefined,
        outOfHoursMessage: config.outOfHoursMessage ?? undefined,
        escalationPhone: config.escalationPhone ?? undefined,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.json({ success: true, data: aiConfig });
    } catch (err) {
      logger.error('Get AI configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get AI configuration' } });
    }
  }

  // Update AI configuration for a vendor
  async updateAIConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreateAIConfigurationRequest = req.body;

      const config = await prisma.aIConfiguration.upsert({
        where: { vendorId },
        update: {
          ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
          ...(data.greetingMessage !== undefined && { greetingMessage: data.greetingMessage }),
          ...(data.faqEnabled !== undefined && { faqEnabled: data.faqEnabled }),
          ...(data.pricingInquiryEnabled !== undefined && { pricingInquiryEnabled: data.pricingInquiryEnabled }),
          ...(data.bookingAssistanceEnabled !== undefined && { bookingAssistanceEnabled: data.bookingAssistanceEnabled }),
          ...(data.inventoryInquiryEnabled !== undefined && { inventoryInquiryEnabled: data.inventoryInquiryEnabled }),
          ...(data.leadQualificationEnabled !== undefined && { leadQualificationEnabled: data.leadQualificationEnabled }),
          ...(data.leadQualificationThreshold !== undefined && { leadQualificationThreshold: data.leadQualificationThreshold }),
          ...(data.outOfHoursMessage !== undefined && { outOfHoursMessage: data.outOfHoursMessage }),
          ...(data.escalationPhone !== undefined && { escalationPhone: data.escalationPhone }),
        },
        create: {
          vendorId,
          isEnabled: data.isEnabled ?? true,
          greetingMessage: data.greetingMessage,
          faqEnabled: data.faqEnabled ?? true,
          pricingInquiryEnabled: data.pricingInquiryEnabled ?? true,
          bookingAssistanceEnabled: data.bookingAssistanceEnabled ?? true,
          inventoryInquiryEnabled: data.inventoryInquiryEnabled ?? true,
          leadQualificationEnabled: data.leadQualificationEnabled ?? true,
          leadQualificationThreshold: data.leadQualificationThreshold ?? 70,
          outOfHoursMessage: data.outOfHoursMessage,
          escalationPhone: data.escalationPhone,
        },
      });

      const aiConfig: AIConfiguration = {
        id: config.id,
        vendorId: config.vendorId,
        isEnabled: config.isEnabled,
        greetingMessage: config.greetingMessage ?? undefined,
        faqEnabled: config.faqEnabled,
        pricingInquiryEnabled: config.pricingInquiryEnabled,
        bookingAssistanceEnabled: config.bookingAssistanceEnabled,
        inventoryInquiryEnabled: config.inventoryInquiryEnabled,
        leadQualificationEnabled: config.leadQualificationEnabled,
        leadQualificationThreshold: config.leadQualificationThreshold ?? undefined,
        outOfHoursMessage: config.outOfHoursMessage ?? undefined,
        escalationPhone: config.escalationPhone ?? undefined,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt,
      };

      res.json({ success: true, data: aiConfig, message: 'AI configuration updated successfully' });
    } catch (err) {
      logger.error('Update AI configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update AI configuration' } });
    }
  }

  // Test AI configuration with a sample message
  async testAIConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { message } = req.body;

      if (!message) {
        res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Message is required' } });
        return;
      }

      const { aiCommerceService } = await import('../ai/aiCommerce.service.js');

      const response = await aiCommerceService.generateResponse(vendorId, message, []);

      res.json({ success: true, data: response });
    } catch (err) {
      logger.error('Test AI configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to test AI configuration' } });
    }
  }

  // Rebuild AI knowledge base for a vendor
  async rebuildKnowledgeBase(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { aiCommerceService } = await import('../ai/aiCommerce.service.js');

      const knowledgeBase = await aiCommerceService.buildVendorKnowledgeBase(vendorId);

      res.json({ success: true, data: knowledgeBase, message: 'Knowledge base rebuilt successfully' });
    } catch (err) {
      logger.error('Rebuild knowledge base error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to rebuild knowledge base' } });
    }
  }

  // Get FAQs for a vendor
  async getFAQs(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const faqs = await prisma.vendorFaq.findMany({
        where: { vendorId },
        orderBy: { sortOrder: 'asc' },
      });

      res.json({ success: true, data: faqs });
    } catch (err) {
      logger.error('Get FAQs error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get FAQs' } });
    }
  }

  // Create FAQ
  async createFAQ(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { question, answer, sortOrder } = req.body;

      const faq = await prisma.vendorFaq.create({
        data: {
          vendorId,
          question,
          answer,
          sortOrder: sortOrder || 0,
        },
      });

      res.json({ success: true, data: faq, message: 'FAQ created successfully' });
    } catch (err) {
      logger.error('Create FAQ error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create FAQ' } });
    }
  }

  // Update FAQ
  async updateFAQ(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;
      const { question, answer, sortOrder } = req.body;

      // Verify FAQ belongs to vendor
      const existingFAQ = await prisma.vendorFaq.findUnique({
        where: { id },
      });

      if (!existingFAQ || existingFAQ.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found' } });
        return;
      }

      const faq = await prisma.vendorFaq.update({
        where: { id },
        data: {
          ...(question !== undefined && { question }),
          ...(answer !== undefined && { answer }),
          ...(sortOrder !== undefined && { sortOrder }),
        },
      });

      res.json({ success: true, data: faq, message: 'FAQ updated successfully' });
    } catch (err) {
      logger.error('Update FAQ error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update FAQ' } });
    }
  }

  // Delete FAQ
  async deleteFAQ(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;

      // Verify FAQ belongs to vendor
      const existingFAQ = await prisma.vendorFaq.findUnique({
        where: { id },
      });

      if (!existingFAQ || existingFAQ.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'FAQ not found' } });
        return;
      }

      await prisma.vendorFaq.delete({
        where: { id },
      });

      res.json({ success: true, message: 'FAQ deleted successfully' });
    } catch (err) {
      logger.error('Delete FAQ error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete FAQ' } });
    }
  }
}

export const aiController = new AIController();
