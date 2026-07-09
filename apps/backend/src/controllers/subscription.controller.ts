import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionStatus, 
  BillingCycle,
  CreateSubscriptionRequest,
  UpgradeSubscriptionRequest 
} from '@discover-smes/shared';
import { PRICING } from '@discover-smes/shared';

const prisma = new PrismaClient();

class SubscriptionController {
  // ─── SUBSCRIPTION MANAGEMENT ────────────────────────────────────────

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      let subscription = await prisma.subscription.findUnique({
        where: { vendorId },
        include: {
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      // Create freemium subscription if none exists
      if (!subscription) {
        subscription = await prisma.subscription.create({
          data: {
            vendorId,
            planType: 'FREEMIUM',
            status: 'ACTIVE',
            billingCycle: 'MONTHLY',
            autoRenew: false,
          },
          include: {
            payments: true,
          },
        });
      }

      res.json({ success: true, data: subscription });
    } catch (err) {
      console.error('Get subscription error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get subscription' } });
    }
  }

  async createSubscription(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreateSubscriptionRequest = req.body;

      // Check if subscription already exists
      const existing = await prisma.subscription.findUnique({
        where: { vendorId },
      });

      if (existing && existing.status === 'ACTIVE') {
        res.status(400).json({ success: false, error: { code: 'ALREADY_SUBSCRIBED', message: 'You already have an active subscription' } });
        return;
      }

      // Calculate amount based on plan and billing cycle
      let amount = 0;
      if (data.planType === 'GROWTH') {
        amount = data.billingCycle === 'YEARLY' ? PRICING.GROWTH.yearly : PRICING.GROWTH.monthly;
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (data.billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Create subscription
      const subscription = await prisma.subscription.create({
        data: {
          vendorId,
          planType: data.planType,
          status: amount > 0 ? 'PENDING' : 'ACTIVE',
          startDate,
          endDate,
          billingCycle: data.billingCycle,
          autoRenew: true,
        },
      });

      // If paid plan, create payment
      if (amount > 0) {
        const reference = `SUB-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await prisma.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            amount,
            currency: 'NGN',
            status: 'PENDING',
            paymentGateway: 'paystack',
            reference,
          },
        });

        res.json({ 
          success: true, 
          data: { 
            subscription, 
            amount, 
            reference,
            paymentRequired: true 
          },
          message: 'Subscription created. Please complete payment to activate.' 
        });
      } else {
        res.json({ success: true, data: { subscription, paymentRequired: false }, message: 'Freemium subscription activated' });
      }
    } catch (err) {
      console.error('Create subscription error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create subscription' } });
    }
  }

  async upgradeSubscription(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: UpgradeSubscriptionRequest = req.body;

      const existing = await prisma.subscription.findUnique({
        where: { vendorId },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'No existing subscription found' } });
        return;
      }

      // Calculate amount
      let amount = 0;
      if (data.planType === 'GROWTH') {
        amount = data.billingCycle === 'YEARLY' ? PRICING.GROWTH.yearly : PRICING.GROWTH.monthly;
      }

      // Calculate end date
      const startDate = new Date();
      const endDate = new Date(startDate);
      if (data.billingCycle === 'YEARLY') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      // Update subscription
      const subscription = await prisma.subscription.update({
        where: { vendorId },
        data: {
          planType: data.planType,
          status: amount > 0 ? 'PENDING' : 'ACTIVE',
          startDate,
          endDate,
          billingCycle: data.billingCycle,
          autoRenew: true,
          cancelledAt: null,
        },
      });

      // If paid plan, create payment
      if (amount > 0) {
        const reference = `UPG-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        await prisma.subscriptionPayment.create({
          data: {
            subscriptionId: subscription.id,
            amount,
            currency: 'NGN',
            status: 'PENDING',
            paymentGateway: 'paystack',
            reference,
          },
        });

        res.json({ 
          success: true, 
          data: { 
            subscription, 
            amount, 
            reference,
            paymentRequired: true 
          },
          message: 'Subscription upgrade initiated. Please complete payment to activate.' 
        });
      } else {
        res.json({ success: true, data: { subscription, paymentRequired: false }, message: 'Subscription downgraded to freemium' });
      }
    } catch (err) {
      console.error('Upgrade subscription error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to upgrade subscription' } });
    }
  }

  async cancelSubscription(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { vendorId },
      });

      if (!subscription) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } });
        return;
      }

      // Update subscription to cancelled
      const updated = await prisma.subscription.update({
        where: { vendorId },
        data: {
          status: 'CANCELLED',
          autoRenew: false,
          cancelledAt: new Date(),
        },
      });

      res.json({ success: true, data: updated, message: 'Subscription cancelled successfully' });
    } catch (err) {
      console.error('Cancel subscription error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel subscription' } });
    }
  }

  async getSubscriptionLimits(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const subscription = await prisma.subscription.findUnique({
        where: { vendorId },
      });

      if (!subscription) {
        // Return freemium limits by default
        res.json({ 
          success: true, 
          data: {
            planType: 'FREEMIUM',
            limits: {
              maxIncome: 6,
              maxInvoices: 6,
              maxExpenses: 6,
              maxCustomers: 6,
              maxInventoryItems: 6,
              aiEngineAccess: false,
            },
          }
        });
        return;
      }

      // Get current counts
      const [incomeCount, invoiceCount, expenseCount, customerCount, inventoryCount] = await Promise.all([
        prisma.income.count({ where: { vendorId } }),
        prisma.invoice.count({ where: { vendorId } }),
        prisma.expense.count({ where: { vendorId } }),
        prisma.customer.count({ where: { vendorId } }),
        prisma.inventoryItem.count({ where: { vendorId } }),
      ]);

      // Get limits based on plan
      const limits = subscription.planType === 'GROWTH' ? {
        maxIncome: Infinity,
        maxInvoices: Infinity,
        maxExpenses: Infinity,
        maxCustomers: Infinity,
        maxInventoryItems: Infinity,
        aiEngineAccess: true,
      } : {
        maxIncome: 6,
        maxInvoices: 6,
        maxExpenses: 6,
        maxCustomers: 6,
        maxInventoryItems: 6,
        aiEngineAccess: false,
      };

      res.json({ 
        success: true, 
        data: {
          planType: subscription.planType,
          status: subscription.status,
          limits,
          usage: {
            income: incomeCount,
            invoices: invoiceCount,
            expenses: expenseCount,
            customers: customerCount,
            inventory: inventoryCount,
          },
        }
      });
    } catch (err) {
      console.error('Get subscription limits error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get subscription limits' } });
    }
  }
}

export const subscriptionController = new SubscriptionController();
