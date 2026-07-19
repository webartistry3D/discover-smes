import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export class FinancialController {
  // ─── INCOME ─────────────────────────────────────────────

  async getIncomes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, category } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }
      if (category) where.category = category;

      const incomes = await prisma.income.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      sendSuccess(res, incomes);
    } catch (err) {
      next(err);
    }
  }

  async createIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      // Enforce freemium limits
      const subscription = await prisma.subscription.findUnique({ where: { vendorId } });
      if (subscription && subscription.planType === 'FREEMIUM') {
        const incomeCount = await prisma.income.count({ where: { vendorId } });
        if (incomeCount >= 6) throw AppError.badRequest('Freemium limit reached for incomes (6)');
      }

      const { amount, category, source, sourceId, description, date, notes } = req.body as Record<string, unknown>;

      const income = await prisma.income.create({
        data: {
          vendorId,
          amount: Number(amount),
          category: category as any,
          source: source as string | undefined,
          sourceId:
            typeof sourceId === 'string' && sourceId.trim() !== ''
              ? sourceId
              : undefined,
          description: description as string | undefined,
          date: date ? new Date(date as string) : new Date(),
          notes: notes as string | undefined,
        },
      });

      sendSuccess(res, income, 'Income recorded');
    } catch (err) {
      next(err);
    }
  }

  async updateIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;
      const { amount, category, source, sourceId, description, date, notes } = req.body as Record<string, unknown>;

      const income = await prisma.income.update({
        where: { id, vendorId },
        data: {
          amount: amount !== undefined ? Number(amount) : undefined,
          category,
          source: source as string | undefined,
          sourceId:
            typeof sourceId === 'string' && sourceId.trim() !== ''
              ? sourceId
              : undefined,
          description: description as string | undefined,
          date: date ? new Date(date as string) : undefined,
          notes: notes as string | undefined,
        },
      });

      sendSuccess(res, income, 'Income updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteIncome(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      await prisma.income.delete({
        where: { id, vendorId },
      });

      sendSuccess(res, null, 'Income deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── EXPENSE ────────────────────────────────────────────

  async getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, category } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = new Date(startDate);
        if (endDate) where.date.lte = new Date(endDate);
      }
      if (category) where.category = category;

      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'desc' },
      });

      sendSuccess(res, expenses);
    } catch (err) {
      next(err);
    }
  }

  async createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      // Enforce freemium limits
      const subscription = await prisma.subscription.findUnique({ where: { vendorId } });
      if (subscription && subscription.planType === 'FREEMIUM') {
        const expenseCount = await prisma.expense.count({ where: { vendorId } });
        if (expenseCount >= 6) throw AppError.badRequest('Freemium limit reached for expenses (6)');
      }

      const { amount, category, description, date, receiptUrl, notes } = req.body as Record<string, unknown>;

      const expense = await prisma.expense.create({
        data: {
          vendorId,
          amount: Number(amount),
          category: category as any,
          description: description as string | undefined,
          date: date ? new Date(date as string) : new Date(),
          receiptUrl: receiptUrl as string | undefined,
          notes: notes as string | undefined,
        },
      });

      sendSuccess(res, expense, 'Expense recorded');
    } catch (err) {
      next(err);
    }
  }

  async updateExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;
      const { amount, category, description, date, receiptUrl, notes } = req.body as Record<string, unknown>;

      const expense = await prisma.expense.update({
        where: { id, vendorId },
        data: {
          amount: amount !== undefined ? Number(amount) : undefined,
          category,
          description: description as string | undefined,
          date: date ? new Date(date as string) : undefined,
          receiptUrl: receiptUrl as string | undefined,
          notes: notes as string | undefined,
        },
      });

      sendSuccess(res, expense, 'Expense updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      await prisma.expense.delete({
        where: { id, vendorId },
      });

      sendSuccess(res, null, 'Expense deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── INVOICE ────────────────────────────────────────────

  async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { status } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (status) where.status = status;

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          lineItems: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, invoices);
    } catch (err) {
      next(err);
    }
  }

  async getInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      const invoice = await prisma.invoice.findFirst({
        where: { id, vendorId },
        include: {
          lineItems: true,
        },
      });

      if (!invoice) throw AppError.notFound('Invoice not found');

      sendSuccess(res, invoice);
    } catch (err) {
      next(err);
    }
  }

  async createInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      // Enforce freemium limits
      const subscription = await prisma.subscription.findUnique({ where: { vendorId } });
      if (subscription && subscription.planType === 'FREEMIUM') {
        const invoiceCount = await prisma.invoice.count({ where: { vendorId } });
        if (invoiceCount >= 6) throw AppError.badRequest('Freemium limit reached for invoices (6)');
      }

      const {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        lineItems,
        taxRate,
        discountAmount,
        dueDate,
        notes,
      } = req.body as Record<string, unknown>;

      // Calculate subtotal
      const items = lineItems as Array<{ description: string; quantity: number; unitPrice: number }>;
      const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      
      // Calculate tax
      const taxRateNum = Number(taxRate) || 0;
      const taxAmount = subtotal * (taxRateNum / 100);
      
      // Calculate total
      const discountAmountNum = Number(discountAmount) || 0;
      const total = subtotal + taxAmount - discountAmountNum;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const invoice = await prisma.invoice.create({
        data: {
          vendorId,
          invoiceNumber,
          customerName: customerName as string,
          customerEmail: customerEmail as string | undefined,
          customerPhone: customerPhone as string | undefined,
          customerAddress: customerAddress as string | undefined,
          subtotal,
          taxRate: taxRateNum,
          taxAmount,
          discountAmount: discountAmountNum,
          total,
          dueDate: dueDate ? new Date(dueDate as string) : undefined,
          notes: notes as string | undefined,
          lineItems: {
            create: items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.quantity * item.unitPrice,
            })),
          },
        },
        include: {
          lineItems: true,
        },
      });

      sendSuccess(res, invoice, 'Invoice created');
    } catch (err) {
      next(err);
    }
  }

  async updateInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;
      const {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        taxRate,
        discountAmount,
        dueDate,
        status,
        notes,
      } = req.body as Record<string, unknown>;

      const invoice = await prisma.invoice.update({
        where: { id, vendorId },
        data: {
          customerName: customerName as string | undefined,
          customerEmail: customerEmail as string | undefined,
          customerPhone: customerPhone as string | undefined,
          customerAddress: customerAddress as string | undefined,
          taxRate: taxRate !== undefined ? Number(taxRate) : undefined,
          discountAmount: discountAmount !== undefined ? Number(discountAmount) : undefined,
          dueDate: dueDate ? new Date(dueDate as string) : undefined,
          status: status as any,
          notes: notes as string | undefined,
          paidDate: status === 'PAID' ? new Date() : undefined,
        },
        include: {
          lineItems: true,
        },
      });

      sendSuccess(res, invoice, 'Invoice updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteInvoice(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      await prisma.invoice.delete({
        where: { id, vendorId },
      });

      sendSuccess(res, null, 'Invoice deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── FINANCIAL SUMMARY ───────────────────────────────────

  async getFinancialSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate } = req.query as Record<string, string>;

      const dateFilter: any = {};
      if (startDate || endDate) {
        dateFilter.date = {};
        if (startDate) dateFilter.date.gte = new Date(startDate);
        if (endDate) dateFilter.date.lte = new Date(endDate);
      }

      const [totalIncome, totalExpense, invoiceStats, paidInvoiceTotal] = await Promise.all([
        prisma.income.aggregate({
          where: { vendorId, ...dateFilter },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: { vendorId, ...dateFilter },
          _sum: { amount: true },
        }),
        prisma.invoice.groupBy({
          by: ['status'],
          where: { vendorId },
          _sum: { total: true },
          _count: true,
        }),
        prisma.invoice.aggregate({
          where: { vendorId, status: 'PAID' },
          _sum: { total: true },
        }),
      ]);

      const incomeFromRecords = Number(totalIncome._sum.amount || 0);
      const incomeFromInvoices = Number(paidInvoiceTotal._sum.total || 0);
      const income = incomeFromRecords + incomeFromInvoices;
      const expense = Number(totalExpense._sum.amount || 0);
      const profit = income - expense;

      const invoiceSummary = invoiceStats.reduce((acc, stat) => {
        acc[stat.status.toLowerCase()] = {
          total: Number(stat._sum.total) || 0,
          count: stat._count,
        };
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      sendSuccess(res, {
        income,
        expense,
        profit,
        invoiceSummary,
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── FINANCIAL REPORTS ───────────────────────────────────

  async getProfitLossReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, period } = req.query as Record<string, string>;
      
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      if (startDate) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      if (endDate) end.setHours(23, 59, 59, 999);

      // Get income, expense and paid invoice data
      const [incomes, expenses, paidInvoices] = await Promise.all([
        prisma.income.findMany({
          where: { vendorId, date: { gte: start, lte: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.expense.findMany({
          where: { vendorId, date: { gte: start, lte: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.invoice.findMany({
          where: { vendorId, status: 'PAID', paidDate: { gte: start, lte: end } },
          orderBy: { paidDate: 'asc' },
        }),
      ]);

      // Calculate totals by category
      const incomeByCategory = incomes.reduce((acc, inc) => {
        const category = inc.category;
        acc[category] = (acc[category] || 0) + Number(inc.amount);
        return acc;
      }, {} as Record<string, number>);

      const invoiceTotal = paidInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      if (invoiceTotal > 0) {
        incomeByCategory['Invoice Payments'] = (incomeByCategory['Invoice Payments'] || 0) + invoiceTotal;
      }

      const expenseByCategory = expenses.reduce((acc, exp) => {
        const category = exp.category;
        acc[category] = (acc[category] || 0) + Number(exp.amount);
        return acc;
      }, {} as Record<string, number>);

      const totalRevenue = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0) + invoiceTotal;
      const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      const grossProfit = totalRevenue - totalExpenses;

      // Calculate margins
      const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

      const reportData = {
        period: period || 'custom',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalRevenue,
        totalExpenses,
        grossProfit,
        grossMargin,
        incomeByCategory,
        expenseByCategory,
        incomes: incomes.map(inc => ({
          id: inc.id,
          date: inc.date.toISOString(),
          category: inc.category,
          amount: Number(inc.amount),
          description: inc.description,
        })),
        expenses: expenses.map(exp => ({
          id: exp.id,
          date: exp.date.toISOString(),
          category: exp.category,
          amount: Number(exp.amount),
          description: exp.description,
        })),
      };

      // Save report to database
      await prisma.financialReport.create({
        data: {
          vendorId,
          reportType: 'PROFIT_LOSS',
          period: period || 'custom',
          startDate: start,
          endDate: end,
          data: reportData,
          totalRevenue,
          totalExpenses,
          netProfit: grossProfit,
          grossMargin,
        },
      });

      sendSuccess(res, reportData);
    } catch (err) {
      next(err);
    }
  }

  async getCashFlowReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, period } = req.query as Record<string, string>;
      
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      if (startDate) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      if (endDate) end.setHours(23, 59, 59, 999);

      // Get income (cash inflows) and expenses (cash outflows)
      const [incomes, expenses, invoices] = await Promise.all([
        prisma.income.findMany({
          where: { vendorId, date: { gte: start, lte: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.expense.findMany({
          where: { vendorId, date: { gte: start, lte: end } },
          orderBy: { date: 'asc' },
        }),
        prisma.invoice.findMany({
          where: { vendorId, createdAt: { gte: start, lte: end } },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      // Calculate cash flows
      const operatingCashIn = incomes
        .filter(inc => ['PRODUCT_SALE', 'SERVICE_BOOKING'].includes(inc.category))
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      
      const operatingCashOut = expenses
        .filter(exp => !['TAXES'].includes(exp.category))
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      const investingCashFlow = expenses
        .filter(exp => ['EQUIPMENT', 'MAINTENANCE'].includes(exp.category))
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      const financingCashFlow = expenses
        .filter(exp => ['TAXES'].includes(exp.category))
        .reduce((sum, exp) => sum + Number(exp.amount), 0);

      const operatingCashFlow = operatingCashIn - operatingCashOut;
      const netCashFlow = operatingCashFlow - investingCashFlow - financingCashFlow;

      const reportData = {
        period: period || 'custom',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        operatingCashFlow,
        investingCashFlow,
        financingCashFlow,
        netCashFlow,
        operatingCashIn,
        operatingCashOut,
        cashFlows: [
          ...incomes.map(inc => ({
            date: inc.date.toISOString(),
            type: 'INFLOW',
            category: inc.category,
            amount: Number(inc.amount),
            description: inc.description,
          })),
          ...expenses.map(exp => ({
            date: exp.date.toISOString(),
            type: 'OUTFLOW',
            category: exp.category,
            amount: Number(exp.amount),
            description: exp.description,
          })),
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      };

      // Save report to database
      await prisma.financialReport.create({
        data: {
          vendorId,
          reportType: 'CASH_FLOW',
          period: period || 'custom',
          startDate: start,
          endDate: end,
          data: reportData,
          netCashFlow,
          operatingCashFlow,
          investingCashFlow,
          financingCashFlow,
        },
      });

      sendSuccess(res, reportData);
    } catch (err) {
      next(err);
    }
  }

  async getSalesAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, period } = req.query as Record<string, string>;
      
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      if (startDate) start.setHours(0, 0, 0, 0);
      const end = endDate ? new Date(endDate) : new Date();
      if (endDate) end.setHours(23, 59, 59, 999);

      // Get sales data from income and invoices
      const [salesIncomes, invoices, bookings] = await Promise.all([
        prisma.income.findMany({
          where: { 
            vendorId, 
            date: { gte: start, lte: end },
            category: { in: ['PRODUCT_SALE', 'SERVICE_BOOKING'] },
          },
          orderBy: { date: 'asc' },
        }),
        prisma.invoice.findMany({
          where: { 
            vendorId, 
            createdAt: { gte: start, lte: end },
            status: { in: ['PAID', 'SENT'] },
          },
          include: { lineItems: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.booking.findMany({
          where: { 
            vendorId, 
            createdAt: { gte: start, lte: end },
            status: { in: ['CONFIRMED', 'COMPLETED'] },
          },
          orderBy: { createdAt: 'asc' },
        }),
      ]);

      const incomeSales = salesIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0);
      const totalInvoiceSales = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const totalBookingSales = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
      const totalSales = incomeSales + totalInvoiceSales + totalBookingSales;
      const totalOrders = invoices.length + bookings.length;
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Calculate conversion rate (bookings / views - simplified)
      const conversionRate = 0; // Would need analytics data

      // Sales by category
      const salesByCategory = salesIncomes.reduce((acc, inc) => {
        acc[inc.category] = (acc[inc.category] || 0) + Number(inc.amount);
        return acc;
      }, {} as Record<string, number>);
      if (totalInvoiceSales > 0) {
        salesByCategory['Invoice Payments'] = (salesByCategory['Invoice Payments'] || 0) + totalInvoiceSales;
      }
      if (totalBookingSales > 0) {
        salesByCategory['Service Bookings'] = (salesByCategory['Service Bookings'] || 0) + totalBookingSales;
      }

      const reportData = {
        period: period || 'custom',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalSales,
        totalOrders,
        averageOrderValue,
        conversionRate,
        salesByCategory,
        salesTrend: [
          ...salesIncomes.map(inc => ({
            date: inc.date.toISOString(),
            amount: Number(inc.amount),
            category: inc.category,
          })),
          ...invoices.map(inv => ({
            date: inv.createdAt.toISOString(),
            amount: Number(inv.total),
            category: 'PRODUCT_SALE' as const,
          })),
          ...bookings.map(b => ({
            date: (b.createdAt ?? b.scheduledAt).toISOString(),
            amount: Number(b.price || 0),
            category: 'SERVICE_BOOKING' as const,
          })),
        ],
        topProducts: invoices
          .flatMap(inv => inv.lineItems)
          .reduce((acc, item) => {
            acc[item.description] = (acc[item.description] || 0) + Number(item.total);
            return acc;
          }, {} as Record<string, number>),
      };

      // Save report to database
      await prisma.financialReport.create({
        data: {
          vendorId,
          reportType: 'SALES_ANALYTICS',
          period: period || 'custom',
          startDate: start,
          endDate: end,
          data: reportData,
          totalSales,
          averageOrderValue,
          totalOrders,
          conversionRate,
        },
      });

      sendSuccess(res, reportData);
    } catch (err) {
      next(err);
    }
  }

  async getTaxSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { startDate, endDate, period } = req.query as Record<string, string>;
      
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate) : new Date();

      // Get tax records and tax-related expenses
      const [taxRecords, taxExpenses] = await Promise.all([
        prisma.taxRecord.findMany({
          where: { 
            vendorId,
            createdAt: { gte: start, lte: end },
          },
          include: { payments: true },
          orderBy: { createdAt: 'asc' },
        }),
        prisma.expense.findMany({
          where: { 
            vendorId, 
            date: { gte: start, lte: end },
            category: 'TAXES',
          },
          orderBy: { date: 'asc' },
        }),
      ]);

      const totalTaxLiability = taxRecords.reduce((sum, record) => sum + Number(record.taxAmount), 0);
      const totalTaxPaid = taxRecords.reduce((sum, record) => {
        return sum + record.payments.reduce((pSum, payment) => pSum + Number(payment.amount), 0);
      }, 0);
      const taxBalance = totalTaxLiability - totalTaxPaid;

      // VAT calculations
      const vatCollected = taxRecords
        .filter(r => r.type === 'VAT')
        .reduce((sum, r) => sum + (Number(r.vatOutput) || 0), 0);
      const vatPaid = taxRecords
        .filter(r => r.type === 'VAT')
        .reduce((sum, r) => sum + (Number(r.vatInput) || 0), 0);
      const netVat = vatCollected - vatPaid;

      const pendingFilings = taxRecords.filter(r => r.status === 'PENDING').length;
      const overdueFilings = taxRecords.filter(r => r.status === 'OVERDUE').length;

      const reportData = {
        period: period || 'custom',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        totalTaxLiability,
        totalTaxPaid,
        taxBalance,
        vatCollected,
        vatPaid,
        netVat,
        pendingFilings,
        overdueFilings,
        taxRecords: taxRecords.map(record => ({
          id: record.id,
          type: record.type,
          period: record.period,
          taxAmount: Number(record.taxAmount),
          status: record.status,
          dueDate: record.dueDate?.toISOString(),
          paidDate: record.paidDate?.toISOString(),
        })),
      };

      // Save report to database
      await prisma.financialReport.create({
        data: {
          vendorId,
          reportType: 'TAX_SUMMARY',
          period: period || 'custom',
          startDate: start,
          endDate: end,
          data: reportData,
          totalTaxLiability,
          totalTaxPaid,
          taxBalance,
        },
      });

      sendSuccess(res, reportData);
    } catch (err) {
      next(err);
    }
  }

  async getFinancialReports(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { reportType, period } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (reportType) where.reportType = reportType;
      if (period) where.period = period;

      const reports = await prisma.financialReport.findMany({
        where,
        orderBy: { generatedAt: 'desc' },
        take: 50,
      });

      sendSuccess(res, reports);
    } catch (err) {
      next(err);
    }
  }
}

export const financialController = new FinancialController();
