import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { CreateWhatsAppCampaignRequest, CreateLoyaltyProgramRequest, CreatePromotionRequest } from '@discover-festac/shared';

const prisma = new PrismaClient();

class MarketingController {
  // ─── PROMOTIONS ────────────────────────────────────────────────

  async getPromotions(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const promotions = await prisma.promotion.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: promotions });
    } catch (err) {
      console.error('Get promotions error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get promotions' } });
    }
  }

  async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreatePromotionRequest = req.body;

      const promotion = await prisma.promotion.create({
        data: {
          ...data,
          vendorId,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
        },
      });

      res.json({ success: true, data: promotion, message: 'Promotion created successfully' });
    } catch (err) {
      console.error('Create promotion error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create promotion' } });
    }
  }

  async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;
      const data: Partial<CreatePromotionRequest> = req.body;

      const existingPromotion = await prisma.promotion.findUnique({
        where: { id },
      });

      if (!existingPromotion || existingPromotion.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Promotion not found' } });
        return;
      }

      const promotion = await prisma.promotion.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
          ...(data.discount !== undefined && { discount: data.discount }),
          ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
          ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      res.json({ success: true, data: promotion, message: 'Promotion updated successfully' });
    } catch (err) {
      console.error('Update promotion error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update promotion' } });
    }
  }

  async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;

      const existingPromotion = await prisma.promotion.findUnique({
        where: { id },
      });

      if (!existingPromotion || existingPromotion.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Promotion not found' } });
        return;
      }

      await prisma.promotion.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Promotion deleted successfully' });
    } catch (err) {
      console.error('Delete promotion error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete promotion' } });
    }
  }

  // ─── LOYALTY PROGRAMS ───────────────────────────────────────────

  async getLoyaltyPrograms(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const programs = await prisma.loyaltyProgram.findMany({
        where: { vendorId },
        include: {
          loyaltyTiers: {
            orderBy: { minPoints: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: programs });
    } catch (err) {
      console.error('Get loyalty programs error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get loyalty programs' } });
    }
  }

  async createLoyaltyProgram(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreateLoyaltyProgramRequest = req.body;

      const program = await prisma.loyaltyProgram.create({
        data: {
          ...data,
          vendorId,
        },
      });

      res.json({ success: true, data: program, message: 'Loyalty program created successfully' });
    } catch (err) {
      console.error('Create loyalty program error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create loyalty program' } });
    }
  }

  async updateLoyaltyProgram(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;
      const data: Partial<CreateLoyaltyProgramRequest> = req.body;

      const existingProgram = await prisma.loyaltyProgram.findUnique({
        where: { id },
      });

      if (!existingProgram || existingProgram.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loyalty program not found' } });
        return;
      }

      const program = await prisma.loyaltyProgram.update({
        where: { id },
        data,
      });

      res.json({ success: true, data: program, message: 'Loyalty program updated successfully' });
    } catch (err) {
      console.error('Update loyalty program error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update loyalty program' } });
    }
  }

  async deleteLoyaltyProgram(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;

      const existingProgram = await prisma.loyaltyProgram.findUnique({
        where: { id },
      });

      if (!existingProgram || existingProgram.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Loyalty program not found' } });
        return;
      }

      await prisma.loyaltyProgram.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Loyalty program deleted successfully' });
    } catch (err) {
      console.error('Delete loyalty program error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete loyalty program' } });
    }
  }

  async getLoyaltyMembers(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { programId } = req.params;

      const members = await prisma.customerLoyalty.findMany({
        where: { programId },
        include: {
          customer: true,
          tier: true,
        },
        orderBy: { points: 'desc' },
      });

      res.json({ success: true, data: members });
    } catch (err) {
      console.error('Get loyalty members error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get loyalty members' } });
    }
  }

  // ─── WHATSAPP CAMPAIGNS ─────────────────────────────────────────

  async getWhatsAppCampaigns(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const campaigns = await prisma.whatsAppCampaign.findMany({
        where: { vendorId },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: campaigns });
    } catch (err) {
      console.error('Get WhatsApp campaigns error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get WhatsApp campaigns' } });
    }
  }

  async createWhatsAppCampaign(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreateWhatsAppCampaignRequest = req.body;

      const campaign = await prisma.whatsAppCampaign.create({
        data: {
          ...data,
          vendorId,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content),
        },
      });

      res.json({ success: true, data: campaign, message: 'WhatsApp campaign created successfully' });
    } catch (err) {
      console.error('Create WhatsApp campaign error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create WhatsApp campaign' } });
    }
  }

  async updateWhatsAppCampaign(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;
      const data: Partial<CreateWhatsAppCampaignRequest> = req.body;

      const existingCampaign = await prisma.whatsAppCampaign.findUnique({
        where: { id },
      });

      if (!existingCampaign || existingCampaign.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'WhatsApp campaign not found' } });
        return;
      }

      const campaign = await prisma.whatsAppCampaign.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.content !== undefined && { content: typeof data.content === 'string' ? data.content : JSON.stringify(data.content) }),
          ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
        },
      });

      res.json({ success: true, data: campaign, message: 'WhatsApp campaign updated successfully' });
    } catch (err) {
      console.error('Update WhatsApp campaign error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update WhatsApp campaign' } });
    }
  }

  async deleteWhatsAppCampaign(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;

      const existingCampaign = await prisma.whatsAppCampaign.findUnique({
        where: { id },
      });

      if (!existingCampaign || existingCampaign.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'WhatsApp campaign not found' } });
        return;
      }

      await prisma.whatsAppCampaign.delete({
        where: { id },
      });

      res.json({ success: true, message: 'WhatsApp campaign deleted successfully' });
    } catch (err) {
      console.error('Delete WhatsApp campaign error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to delete WhatsApp campaign' } });
    }
  }

  async sendWhatsAppCampaign(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const { id } = req.params;

      const campaign = await prisma.whatsAppCampaign.findUnique({
        where: { id },
      });

      if (!campaign || campaign.vendorId !== vendorId) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'WhatsApp campaign not found' } });
        return;
      }

      // Update campaign status
      await prisma.whatsAppCampaign.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // TODO: Implement actual WhatsApp sending logic here
      // This would integrate with the WhatsApp Business API

      res.json({ success: true, message: 'WhatsApp campaign sent successfully' });
    } catch (err) {
      console.error('Send WhatsApp campaign error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to send WhatsApp campaign' } });
    }
  }
}

export const marketingController = new MarketingController();
