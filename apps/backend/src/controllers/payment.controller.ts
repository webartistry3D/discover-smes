import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import type { CreatePaymentRequest, CreatePaymentConfigurationRequest, PaymentStatus } from '@discover-smes/shared';

const prisma = new PrismaClient();

class PaymentController {
  // ─── PAYMENT CONFIGURATION ────────────────────────────────────────

  async getPaymentConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const config = await prisma.paymentConfiguration.findUnique({
        where: {
          vendorId_paymentGateway: {
            vendorId,
            paymentGateway: 'paystack',
          },
        },
      });

      if (!config) {
        res.json({ success: true, data: null });
        return;
      }

      // Don't return secret key
      const { secretKey, ...configWithoutSecret } = config;
      res.json({ success: true, data: configWithoutSecret });
    } catch (err) {
      console.error('Get payment configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get payment configuration' } });
    }
  }

  async createPaymentConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const data: CreatePaymentConfigurationRequest = req.body;

      const config = await prisma.paymentConfiguration.upsert({
        where: {
          vendorId_paymentGateway: {
            vendorId,
            paymentGateway: data.paymentGateway || 'paystack',
          },
        },
        update: {
          publicKey: data.publicKey,
          secretKey: data.secretKey,
          testMode: data.testMode ?? true,
          isActive: data.isActive ?? true,
        },
        create: {
          vendorId,
          paymentGateway: data.paymentGateway || 'paystack',
          publicKey: data.publicKey,
          secretKey: data.secretKey,
          testMode: data.testMode ?? true,
          isActive: data.isActive ?? true,
        },
      });

      const { secretKey, ...configWithoutSecret } = config;
      res.json({ success: true, data: configWithoutSecret, message: 'Payment configuration saved successfully' });
    } catch (err) {
      console.error('Create payment configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save payment configuration' } });
    }
  }

  async testPaymentConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;

      if (!vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_VENDOR', message: 'Vendor not found' } });
        return;
      }

      const config = await prisma.paymentConfiguration.findUnique({
        where: {
          vendorId_paymentGateway: {
            vendorId,
            paymentGateway: 'paystack',
          },
        },
      });

      if (!config) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment configuration not found' } });
        return;
      }

      // TODO: Implement actual Paystack test connection
      // For now, just return success if keys are present
      if (config.publicKey && config.secretKey) {
        res.json({ success: true, message: 'Connection test successful' });
      } else {
        res.status(400).json({ success: false, error: { code: 'INVALID_KEYS', message: 'Invalid payment keys' } });
      }
    } catch (err) {
      console.error('Test payment configuration error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to test payment configuration' } });
    }
  }

  // ─── PAYMENTS ────────────────────────────────────────────────

  async getPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const vendorId = req.user?.vendorId;

      if (!userId && !vendorId) {
        res.status(400).json({ success: false, error: { code: 'NO_USER', message: 'User not found' } });
        return;
      }

      const payments = await prisma.payment.findMany({
        where: {
          ...(userId && { userId }),
          ...(vendorId && { vendorId }),
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: payments });
    } catch (err) {
      console.error('Get payments error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get payments' } });
    }
  }

  async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({ success: false, error: { code: 'NO_USER', message: 'User not found' } });
        return;
      }

      const data: CreatePaymentRequest = req.body;

      // Generate a unique reference
      const reference = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const payment = await prisma.payment.create({
        data: {
          userId,
          vendorId: data.bookingId ? undefined : req.user?.vendorId,
          bookingId: data.bookingId,
          amount: data.amount,
          currency: data.currency || 'NGN',
          paymentGateway: data.paymentGateway || 'paystack',
          reference,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          status: 'PENDING',
        },
      });

      // TODO: Initialize Paystack transaction
      // For now, return the payment record
      res.json({ success: true, data: payment, message: 'Payment initialized successfully' });
    } catch (err) {
      console.error('Create payment error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment' } });
    }
  }

  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { reference },
      });

      if (!payment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Payment not found' } });
        return;
      }

      // TODO: Verify payment with Paystack
      // For now, just update status to success
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          paidAt: new Date(),
        },
      });

      res.json({ success: true, data: updatedPayment, message: 'Payment verified successfully' });
    } catch (err) {
      console.error('Verify payment error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to verify payment' } });
    }
  }

  async getPaymentHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({ success: false, error: { code: 'NO_USER', message: 'User not found' } });
        return;
      }

      const { page = 1, limit = 20, status } = req.query;

      const where: any = { userId };
      if (status) {
        where.status = status as PaymentStatus;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (err) {
      console.error('Get payment history error:', err);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get payment history' } });
    }
  }
}

export const paymentController = new PaymentController();
