import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export class CRMController {
  // ─── CUSTOMER ─────────────────────────────────────────────

  async getCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { status, search } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
          { company: { contains: search, mode: 'insensitive' } },
        ];
      }

      const customers = await prisma.customer.findMany({
        where,
        include: {
          tags: true,
          _count: {
            select: {
              invoices: true,
              communications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, customers);
    } catch (err) {
      next(err);
    }
  }

  async getCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      const customer = await prisma.customer.findFirst({
        where: { id, vendorId },
        include: {
          tags: true,
          customerNotes: {
            orderBy: { createdAt: 'desc' },
          },
          communications: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
              lineItems: true,
            },
          },
        },
      });

      if (!customer) throw AppError.notFound('Customer not found');

      sendSuccess(res, customer);
    } catch (err) {
      next(err);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      // Enforce freemium customer limit
      const subscription = await prisma.subscription.findUnique({ where: { vendorId } });
      if (subscription && subscription.planType === 'FREEMIUM') {
        const customerCount = await prisma.customer.count({ where: { vendorId } });
        if (customerCount >= 6) throw AppError.badRequest('Freemium limit reached for customers (6)');
      }

      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        company,
        notes,
        status,
      } = req.body as Record<string, unknown>;

      const customer = await prisma.customer.create({
        data: {
          vendorId,
          name: name as string,
          email: email as string | undefined,
          phone: phone as string | undefined,
          address: address as string | undefined,
          city: city as string | undefined,
          state: state as string | undefined,
          company: company as string | undefined,
          notes: notes as string | undefined,
          status: (status as any) || 'ACTIVE',
        },
      });

      sendSuccess(res, customer, 'Customer created');
    } catch (err) {
      next(err);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;
      const {
        name,
        email,
        phone,
        address,
        city,
        state,
        company,
        notes,
        status,
      } = req.body as Record<string, unknown>;

      const customer = await prisma.customer.update({
        where: { id, vendorId },
        data: {
          name: name as string | undefined,
          email: email as string | undefined,
          phone: phone as string | undefined,
          address: address as string | undefined,
          city: city as string | undefined,
          state: state as string | undefined,
          company: company as string | undefined,
          notes: notes as string | undefined,
          status: status as any,
        },
      });

      sendSuccess(res, customer, 'Customer updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      await prisma.customer.delete({
        where: { id, vendorId },
      });

      sendSuccess(res, null, 'Customer deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── CUSTOMER NOTES ───────────────────────────────────────

  async getCustomerNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const notes = await prisma.customerNote.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, notes);
    } catch (err) {
      next(err);
    }
  }

  async createCustomerNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;
      const { content, isPrivate } = req.body as Record<string, unknown>;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const note = await prisma.customerNote.create({
        data: {
          customerId,
          content: content as string,
          isPrivate: (isPrivate as boolean) || false,
        },
      });

      sendSuccess(res, note, 'Note created');
    } catch (err) {
      next(err);
    }
  }

  async updateCustomerNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, id } = req.params;
      const { content, isPrivate } = req.body as Record<string, unknown>;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const note = await prisma.customerNote.update({
        where: { id },
        data: {
          content: content as string | undefined,
          isPrivate: isPrivate as boolean | undefined,
        },
      });

      sendSuccess(res, note, 'Note updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomerNote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, id } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      await prisma.customerNote.delete({
        where: { id },
      });

      sendSuccess(res, null, 'Note deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── CUSTOMER TAGS ────────────────────────────────────────

  async getCustomerTags(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const tags = await prisma.customerTag.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, tags);
    } catch (err) {
      next(err);
    }
  }

  async createCustomerTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;
      const { name, color } = req.body as Record<string, unknown>;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const tag = await prisma.customerTag.create({
        data: {
          customerId,
          name: name as string,
          color: (color as string) || '#6366f1',
        },
      });

      sendSuccess(res, tag, 'Tag created');
    } catch (err) {
      next(err);
    }
  }

  async deleteCustomerTag(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, id } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      await prisma.customerTag.delete({
        where: { id },
      });

      sendSuccess(res, null, 'Tag deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── COMMUNICATION LOG ────────────────────────────────────

  async getCommunications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, type } = req.query as Record<string, string>;

      const where: any = {};
      if (customerId) where.customerId = customerId;
      if (type) where.type = type;

      // If customerId is provided, verify customer belongs to vendor
      if (customerId) {
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, vendorId },
        });
        if (!customer) throw AppError.notFound('Customer not found');
      } else {
        // Filter by vendor's customers
        where.customer = { vendorId };
      }

      const communications = await prisma.communicationLog.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, communications);
    } catch (err) {
      next(err);
    }
  }

  async createCommunication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;
      const {
        type,
        direction,
        subject,
        content,
        status,
        metadata,
      } = req.body as Record<string, unknown>;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const communication = await prisma.communicationLog.create({
        data: {
          customerId,
          type: type as any,
          direction: direction as any,
          subject: subject as string | undefined,
          content: content as string,
          status: (status as any) || 'SENT',
          metadata: metadata as Record<string, any> | undefined,
        },
      });

      // Update customer's last contact date
      await prisma.customer.update({
        where: { id: customerId },
        data: { lastContactDate: new Date() },
      });

      sendSuccess(res, communication, 'Communication logged');
    } catch (err) {
      next(err);
    }
  }

  async updateCommunication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, id } = req.params;
      const { status, metadata } = req.body as Record<string, unknown>;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const communication = await prisma.communicationLog.update({
        where: { id },
        data: {
          status: status as any,
          metadata: metadata as Record<string, any> | undefined,
        },
      });

      sendSuccess(res, communication, 'Communication updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteCommunication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId, id } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      await prisma.communicationLog.delete({
        where: { id },
      });

      sendSuccess(res, null, 'Communication deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── CUSTOMER PURCHASE HISTORY ────────────────────────────

  async getCustomerPurchaseHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { customerId } = req.params;

      // Verify customer belongs to vendor
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, vendorId },
      });
      if (!customer) throw AppError.notFound('Customer not found');

      const invoices = await prisma.invoice.findMany({
        where: { customerId, vendorId },
        orderBy: { createdAt: 'desc' },
        include: {
          lineItems: true,
        },
      });

      const totalPurchases = invoices.length;
      const totalSpent = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const averageOrderValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
      const firstPurchaseDate = invoices[invoices.length - 1]?.createdAt;
      const lastPurchaseDate = invoices[0]?.createdAt;

      sendSuccess(res, {
        customerId,
        totalPurchases,
        totalSpent: Number(totalSpent),
        averageOrderValue: Number(averageOrderValue),
        firstPurchaseDate: firstPurchaseDate?.toISOString(),
        lastPurchaseDate: lastPurchaseDate?.toISOString(),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          total: Number(inv.total),
          status: inv.status,
          date: inv.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── CRM SUMMARY ──────────────────────────────────────────

  async getCRMSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const [totalCustomers, customersByStatus, recentCommunications] = await Promise.all([
        prisma.customer.count({ where: { vendorId } }),
        prisma.customer.groupBy({
          by: ['status'],
          where: { vendorId },
          _count: true,
        }),
        prisma.communicationLog.count({
          where: {
            customer: { vendorId },
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
        }),
      ]);

      const statusBreakdown = customersByStatus.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = stat._count;
        return acc;
      }, {} as Record<string, number>);

      sendSuccess(res, {
        totalCustomers,
        statusBreakdown,
        recentCommunications,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const crmController = new CRMController();
