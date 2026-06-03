import { Request, Response } from 'express';
import { PrismaClient, TaxType, TaxStatus } from '@prisma/client';

const prisma = new PrismaClient();

export class TaxController {
  // ─── TAX RECORD CRUD ─────────────────────────────────────────

  async getTaxRecords(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { type, status, period, year } = req.query;

      const where: any = { vendorId };

      if (type) where.type = type as TaxType;
      if (status) where.status = status as TaxStatus;
      if (period) where.period = period as string;
      if (year) where.period = { contains: year as string };

      const records = await prisma.taxRecord.findMany({
        where,
        include: {
          payments: true,
          reports: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: records });
    } catch (error) {
      console.error('Error fetching tax records:', error);
      res.status(500).json({ error: 'Failed to fetch tax records' });
    }
  }

  async getTaxRecord(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { id } = req.params;

      const record = await prisma.taxRecord.findFirst({
        where: { id, vendorId },
        include: {
          payments: { orderBy: { paymentDate: 'desc' } },
          reports: { orderBy: { generatedAt: 'desc' } },
        },
      });

      if (!record) {
        res.status(404).json({ error: 'Tax record not found' });
        return;
      }

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error fetching tax record:', error);
      res.status(500).json({ error: 'Failed to fetch tax record' });
    }
  }

  async createTaxRecord(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const {
        type,
        period,
        description,
        baseAmount,
        taxRate,
        taxAmount,
        vatInput,
        vatOutput,
        netVat,
        dueDate,
        reference,
        notes,
        metadata,
      } = req.body;

      // Calculate tax amount if not provided
      const calculatedTaxAmount = taxAmount || (Number(baseAmount) * Number(taxRate)) / 100;

      // Calculate net VAT if not provided
      const calculatedNetVat = netVat || (vatOutput && vatInput ? Number(vatOutput) - Number(vatInput) : null);

      const record = await prisma.taxRecord.create({
        data: {
          vendorId,
          type,
          period,
          description,
          baseAmount: Number(baseAmount),
          taxRate: Number(taxRate),
          taxAmount: calculatedTaxAmount,
          vatInput: vatInput ? Number(vatInput) : null,
          vatOutput: vatOutput ? Number(vatOutput) : null,
          netVat: calculatedNetVat,
          dueDate: dueDate ? new Date(dueDate) : null,
          reference,
          notes,
          metadata,
        },
        include: {
          payments: true,
          reports: true,
        },
      });

      res.status(201).json({ success: true, data: record });
    } catch (error) {
      console.error('Error creating tax record:', error);
      res.status(500).json({ error: 'Failed to create tax record' });
    }
  }

  async updateTaxRecord(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { id } = req.params;
      const {
        type,
        period,
        description,
        baseAmount,
        taxRate,
        taxAmount,
        vatInput,
        vatOutput,
        netVat,
        status,
        dueDate,
        paidDate,
        reference,
        notes,
        metadata,
      } = req.body;

      const record = await prisma.taxRecord.update({
        where: { id },
        data: {
          type,
          period,
          description,
          baseAmount: baseAmount ? Number(baseAmount) : undefined,
          taxRate: taxRate ? Number(taxRate) : undefined,
          taxAmount: taxAmount ? Number(taxAmount) : undefined,
          vatInput: vatInput ? Number(vatInput) : undefined,
          vatOutput: vatOutput ? Number(vatOutput) : undefined,
          netVat: netVat ? Number(netVat) : undefined,
          status,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          paidDate: paidDate ? new Date(paidDate) : undefined,
          reference,
          notes,
          metadata,
        },
        include: {
          payments: true,
          reports: true,
        },
      });

      res.json({ success: true, data: record });
    } catch (error) {
      console.error('Error updating tax record:', error);
      res.status(500).json({ error: 'Failed to update tax record' });
    }
  }

  async deleteTaxRecord(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { id } = req.params;

      await prisma.taxRecord.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Tax record deleted' });
    } catch (error) {
      console.error('Error deleting tax record:', error);
      res.status(500).json({ error: 'Failed to delete tax record' });
    }
  }

  // ─── TAX PAYMENT CRUD ────────────────────────────────────────

  async getTaxPayments(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { taxRecordId } = req.query;

      const where: any = { taxRecord: { vendorId } };
      if (taxRecordId) where.taxRecordId = taxRecordId as string;

      const payments = await prisma.taxPayment.findMany({
        where,
        include: {
          taxRecord: true,
        },
        orderBy: { paymentDate: 'desc' },
      });

      res.json({ success: true, data: payments });
    } catch (error) {
      console.error('Error fetching tax payments:', error);
      res.status(500).json({ error: 'Failed to fetch tax payments' });
    }
  }

  async createTaxPayment(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { taxRecordId, amount, paymentDate, paymentMethod, reference, notes } = req.body;

      // Verify tax record belongs to vendor
      const taxRecord = await prisma.taxRecord.findFirst({
        where: { id: taxRecordId, vendorId },
      });

      if (!taxRecord) {
        res.status(404).json({ error: 'Tax record not found' });
      }

      const payment = await prisma.taxPayment.create({
        data: {
          taxRecordId,
          amount: Number(amount),
          paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
          paymentMethod,
          reference,
          notes,
        },
      });

      // Update tax record status if fully paid
      const totalPaid = await prisma.taxPayment.aggregate({
        where: { taxRecordId },
        _sum: { amount: true },
      });

      if (totalPaid._sum.amount && totalPaid._sum.amount >= taxRecord.taxAmount) {
        await prisma.taxRecord.update({
          where: { id: taxRecordId },
          data: {
            status: 'PAID',
            paidDate: new Date(),
          },
        });
      } else if (totalPaid._sum.amount && Number(totalPaid._sum.amount) > 0) {
        await prisma.taxRecord.update({
          where: { id: taxRecordId },
          data: { status: 'PARTIALLY_PAID' },
        });
      }

      res.status(201).json({ success: true, data: payment });
    } catch (error) {
      console.error('Error creating tax payment:', error);
      res.status(500).json({ error: 'Failed to create tax payment' });
    }
  }

  async deleteTaxPayment(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { id } = req.params;

      const payment = await prisma.taxPayment.findFirst({
        where: { id },
        include: { taxRecord: true },
      });

      if (!payment || payment.taxRecord.vendorId !== vendorId) {
        res.status(404).json({ error: 'Tax payment not found' });
        return;
      }

      await prisma.taxPayment.delete({
        where: { id },
      });

      res.json({ success: true, message: 'Tax payment deleted' });
    } catch (error) {
      console.error('Error deleting tax payment:', error);
      res.status(500).json({ error: 'Failed to delete tax payment' });
    }
  }

  // ─── TAX CALCULATION & AGGREGATION ─────────────────────────────

  async getTaxCalculation(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { period, type } = req.query;

      const where: any = { vendorId };
      if (period) where.period = period as string;
      if (type) where.type = type as TaxType;

      const records = await prisma.taxRecord.findMany({
        where,
        orderBy: { period: 'desc' },
      });

      const calculation = {
        totalBaseAmount: records.reduce((sum, r) => sum + Number(r.baseAmount), 0),
        totalTaxAmount: records.reduce((sum, r) => sum + Number(r.taxAmount), 0),
        totalVatCollected: records.reduce((sum, r) => sum + (Number(r.vatOutput) || 0), 0),
        totalVatPaid: records.reduce((sum, r) => sum + (Number(r.vatInput) || 0), 0),
        netVat: records.reduce((sum, r) => sum + (Number(r.netVat) || 0), 0),
        byType: records.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + Number(r.taxAmount);
          return acc;
        }, {} as Record<string, number>),
        byPeriod: records.reduce((acc, r) => {
          acc[r.period] = (acc[r.period] || 0) + Number(r.taxAmount);
          return acc;
        }, {} as Record<string, number>),
      };

      res.json({ success: true, data: calculation });
    } catch (error) {
      console.error('Error fetching tax calculation:', error);
      res.status(500).json({ error: 'Failed to fetch tax calculation' });
    }
  }

  // ─── VAT TRACKING ────────────────────────────────────────────

  async getVatTracking(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { period } = req.query;

      const where: any = { vendorId, type: 'VAT' };
      if (period) where.period = period as string;

      const vatRecords = await prisma.taxRecord.findMany({
        where,
        orderBy: { period: 'desc' },
      });

      const tracking = {
        totalVatCollected: vatRecords.reduce((sum, r) => sum + (Number(r.vatOutput) || 0), 0),
        totalVatPaid: vatRecords.reduce((sum, r) => sum + (Number(r.vatInput) || 0), 0),
        netVatPayable: vatRecords.reduce((sum, r) => sum + (Number(r.netVat) || 0), 0),
        records: vatRecords.map((r) => ({
          id: r.id,
          period: r.period,
          vatOutput: Number(r.vatOutput),
          vatInput: Number(r.vatInput),
          netVat: Number(r.netVat),
          status: r.status,
        })),
      };

      res.json({ success: true, data: tracking });
    } catch (error) {
      console.error('Error fetching VAT tracking:', error);
      res.status(500).json({ error: 'Failed to fetch VAT tracking' });
    }
  }

  // ─── COMPLIANCE REPORTS ───────────────────────────────────────

  async getComplianceReports(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { reportType, period } = req.query;

      const where: any = { taxRecord: { vendorId } };
      if (reportType) where.reportType = reportType as string;
      if (period) where.period = period as string;

      const reports = await prisma.taxReport.findMany({
        where,
        include: {
          taxRecord: true,
        },
        orderBy: { generatedAt: 'desc' },
      });

      res.json({ success: true, data: reports });
    } catch (error) {
      console.error('Error fetching compliance reports:', error);
      res.status(500).json({ error: 'Failed to fetch compliance reports' });
    }
  }

  async generateComplianceReport(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { taxRecordId, reportType } = req.body;

      const taxRecord = await prisma.taxRecord.findFirst({
        where: { id: taxRecordId, vendorId },
        include: {
          payments: true,
        },
      });

      if (!taxRecord) {
        res.status(404).json({ error: 'Tax record not found' });
        return;
      }

      const totalPaid = taxRecord.payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const balance = Number(taxRecord.taxAmount) - totalPaid;

      const report = await prisma.taxReport.create({
        data: {
          taxRecordId,
          reportType,
          period: taxRecord.period,
          totalTax: Number(taxRecord.taxAmount),
          totalPaid,
          balance,
          isCompliant: balance <= 0,
        },
      });

      res.status(201).json({ success: true, data: report });
    } catch (error) {
      console.error('Error generating compliance report:', error);
      res.status(500).json({ error: 'Failed to generate compliance report' });
    }
  }

  // ─── TAX SUMMARY ─────────────────────────────────────────────

  async getTaxSummary(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const records = await prisma.taxRecord.findMany({
        where: { vendorId },
      });

      const totalTaxLiability = records.reduce((sum, r) => sum + Number(r.taxAmount), 0);
      const totalPaid = records
        .filter((r) => r.status === 'PAID')
        .reduce((sum, r) => sum + Number(r.taxAmount), 0);
      const totalPending = records
        .filter((r) => r.status === 'PENDING')
        .reduce((sum, r) => sum + Number(r.taxAmount), 0);
      const totalOverdue = records
        .filter((r) => r.status === 'OVERDUE')
        .reduce((sum, r) => sum + Number(r.taxAmount), 0);

      const vatRecords = records.filter((r) => r.type === 'VAT');
      const vatCollected = vatRecords.reduce((sum, r) => sum + (Number(r.vatOutput) || 0), 0);
      const vatPaid = vatRecords.reduce((sum, r) => sum + (Number(r.vatInput) || 0), 0);

      const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM

      const summary = {
        totalTaxLiability,
        totalPaid,
        totalPending,
        totalOverdue,
        vatCollected,
        vatPaid,
        netVat: vatCollected - vatPaid,
        pendingFilings: records.filter((r) => r.status === 'PENDING').length,
        overdueFilings: records.filter((r) => r.status === 'OVERDUE').length,
        currentPeriod,
      };

      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Error fetching tax summary:', error);
      res.status(500).json({ error: 'Failed to fetch tax summary' });
    }
  }
}

export const taxController = new TaxController();
