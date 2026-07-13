import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { vendorController } from '../controllers/vendor.controller.js';
import { uploadController } from '../controllers/upload.controller.js';
import { financialController } from '../controllers/financial.controller.js';
import { crmController } from '../controllers/crm.controller.js';
import { inventoryController } from '../controllers/inventory.controller.js';
import { taxController } from '../controllers/tax.controller.js';
import { aiController } from '../controllers/ai.controller.js';
import { marketingController } from '../controllers/marketing.controller.js';
import { paymentController } from '../controllers/payment.controller.js';
import { subscriptionController } from '../controllers/subscription.controller.js';
import chatbotController from '../controllers/chatbot.controller.js';
import costControlController from '../controllers/cost-control.controller.js';
import { authenticate, requireRole, requireVendor, optionalAuth } from '../middleware/auth.js';
import { authRateLimit, otpRateLimit, searchRateLimit, whatsappRateLimit } from '../middleware/rateLimiter.js';
import { wrapMulter, uploadImage, uploadImages, uploadLogo, uploadDocuments, uploadReceipt } from '../middleware/upload.js';
import {
  verifyWebhook,
  handleIncomingMessage,
  verifyWhatsAppSignature,
} from '../whatsapp/webhook.service.js';
import { prisma } from '../config/database.js';
import { sendSuccess, sendCreated, AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { redisService } from '../services/redis.service.js';

const router = Router();

// ─── HEALTH ─────────────────────────────────────────────────
router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const redisStatus = redisService.isReady() ? 'connected' : 'disconnected';
    sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0', services: { database: 'connected', redis: redisStatus } });
  } catch {
    res.status(503).json({ success: false, error: { code: 'DB_ERROR', message: 'Database unavailable' } });
  }
});

// ─── AUTH ────────────────────────────────────────────────────
const auth = Router();
auth.post('/register', authRateLimit, authController.register.bind(authController));
auth.post('/login', authRateLimit, authController.login.bind(authController));
auth.post('/refresh', authController.refresh.bind(authController));
auth.post('/logout', authenticate, authController.logout.bind(authController));
auth.get('/me', authenticate, authController.me.bind(authController));
router.use('/auth', auth);

// ─── VENDORS (PUBLIC) ────────────────────────────────────────
const vendors = Router();
vendors.get('/', searchRateLimit, optionalAuth, vendorController.search.bind(vendorController));
vendors.get('/featured', optionalAuth, vendorController.getFeatured.bind(vendorController));
vendors.get('/nearby', optionalAuth, vendorController.getNearby.bind(vendorController));

// VENDOR (AUTHENTICATED) - Specific routes must come before parameterized routes
vendors.post('/', authenticate, vendorController.create.bind(vendorController));
vendors.get('/me', authenticate, requireVendor, async (req, res, next) => {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: req.user!.vendorId },
      include: {
        category: true,
        subCategory: true,
        products: true,
        services: true,
      },
    });
    if (!vendor) throw AppError.notFound('Vendor not found');
    sendSuccess(res, vendor);
  } catch (err) { next(err); }
});
vendors.get('/verification-requests', authenticate, requireVendor, async (req, res, next) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { vendorId: req.user!.vendorId },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, requests);
  } catch (err) { next(err); }
});
vendors.patch('/:id', authenticate, requireVendor, vendorController.update.bind(vendorController));
vendors.get('/dashboard/analytics', authenticate, requireVendor, vendorController.getAnalytics.bind(vendorController));

// Parameterized routes must come last
vendors.get('/:slug', vendorController.getBySlug.bind(vendorController));
vendors.post('/:id/whatsapp-click', vendorController.trackWhatsApp.bind(vendorController));

// PRODUCTS
vendors.post('/:id/products', authenticate, requireVendor, vendorController.createProduct.bind(vendorController));
vendors.patch('/:id/products/:productId', authenticate, requireVendor, vendorController.updateProduct.bind(vendorController));
vendors.delete('/:id/products/:productId', authenticate, requireVendor, vendorController.deleteProduct.bind(vendorController));

// SERVICES
vendors.post('/:id/services', authenticate, requireVendor, vendorController.createService.bind(vendorController));
vendors.patch('/:id/services/:serviceId', authenticate, requireVendor, vendorController.updateService.bind(vendorController));
vendors.delete('/:id/services/:serviceId', authenticate, requireVendor, vendorController.deleteService.bind(vendorController));

router.use('/vendors', vendors);

// ─── CATEGORIES ──────────────────────────────────────────────
router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        subCategories: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        _count: { select: { vendors: { where: { status: 'ACTIVE' } } } },
      },
    });
    sendSuccess(res, categories.map((c) => ({ ...c, vendorCount: c._count.vendors })));
  } catch (err) { next(err); }
});

// ─── MAP TILE PROXY ──────────────────────────────────────────
// Proxies map tiles through our own domain to avoid client DNS/ad-blocker issues
const TILE_PROVIDERS = [
  'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
];

router.get('/tiles/:z/:x/:y', async (req, res, next) => {
  try {
    const { z, x, y } = req.params;
    const dpr = req.query['dpr'] === '2' ? '@2x' : '';

    for (let i = 0; i < TILE_PROVIDERS.length; i++) {
      const url = TILE_PROVIDERS[i]
        .replace('{s}', ['a', 'b', 'c', 'd'][i] ?? 'a')
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y)
        .replace('{r}', dpr);

      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Discover-SMEs/1.0' },
        });

        if (!response.ok) continue;

        const contentType = response.headers.get('content-type') ?? 'image/png';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');

        if (response.body) {
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
        }
        return res.end();
      } catch (err) {
        logger.warn(`Tile provider ${i + 1} failed for ${z}/${x}/${y}: ${(err as Error).message}`);
        continue;
      }
    }

    return res.status(502).json({ success: false, error: { message: 'All tile providers failed' } });
  } catch (err) {
    return next(err);
  }
});

// ─── REVIEWS ─────────────────────────────────────────────────
const reviews = Router();
reviews.get('/vendor/:vendorId', async (req, res, next) => {
  try {
    const page = +(req.query['page'] ?? 1);
    const limit = 10;
    const [data, total] = await Promise.all([
      prisma.review.findMany({
        where: { vendorId: req.params['vendorId'] },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      }),
      prisma.review.count({ where: { vendorId: req.params['vendorId'] } }),
    ]);
    sendSuccess(res, { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
});

reviews.post('/vendor/:vendorId', authenticate, async (req, res, next) => {
  try {
    const { rating, comment } = req.body as { rating: number; comment?: string };
    if (!rating || rating < 1 || rating > 5) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Rating must be 1-5' } });
      return;
    }
    const review = await prisma.review.create({
      data: { vendorId: req.params['vendorId']!, userId: req.user!.id, rating, comment },
    });
    // Update vendor average rating
    const { _avg } = await prisma.review.aggregate({
      where: { vendorId: req.params['vendorId'] },
      _avg: { rating: true },
      _count: true,
    });
    await prisma.vendor.update({
      where: { id: req.params['vendorId'] },
      data: { averageRating: _avg.rating ?? 0, totalReviews: { increment: 1 } },
    });
    sendSuccess(res, review, 'Review submitted');
  } catch (err) { next(err); }
});
router.use('/reviews', reviews);

// ─── BOOKINGS ────────────────────────────────────────────────
const bookings = Router();
bookings.post('/', authenticate, async (req, res, next) => {
  try {
    const { vendorId, serviceId, scheduledAt, notes, customerName, customerPhone } = req.body as Record<string, string>;
    const booking = await prisma.booking.create({
      data: {
        vendorId,
        userId: req.user!.id,
        serviceId: serviceId ?? undefined,
        scheduledAt: new Date(scheduledAt ?? ''),
        notes,
        customerName,
        customerPhone,
      },
    });
    sendSuccess(res, booking, 'Booking created');
  } catch (err) { next(err); }
});

bookings.get('/my', authenticate, async (req, res, next) => {
  try {
    const bookingList = await prisma.booking.findMany({
      where: { userId: req.user!.id },
      include: { vendor: { select: { businessName: true, slug: true, logo: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
    sendSuccess(res, bookingList);
  } catch (err) { next(err); }
});

bookings.get('/vendor', authenticate, requireVendor, async (req, res, next) => {
  try {
    const bookingList = await prisma.booking.findMany({
      where: { vendorId: req.user!.vendorId },
      include: { user: { select: { firstName: true, lastName: true, phone: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
    sendSuccess(res, bookingList);
  } catch (err) { next(err); }
});

bookings.patch('/:id/status', authenticate, requireVendor, async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    const booking = await prisma.booking.update({
      where: { id: req.params['id'] },
      data: { status: status as any },
    });
    sendSuccess(res, booking, 'Booking updated');
  } catch (err) { next(err); }
});
router.use('/bookings', bookings);

// ─── WHATSAPP WEBHOOK ────────────────────────────────────────
const wa = Router();
wa.get('/webhook', verifyWebhook);
wa.post('/webhook', whatsappRateLimit, verifyWhatsAppSignature, handleIncomingMessage);

// AI chat endpoint for testing
wa.post('/ai-chat', async (req, res, next) => {
  try {
    const { vendorId, message, history } = req.body as { vendorId: string; message: string; history?: Array<{role: 'user'|'assistant'; content: string}> };
    const { aiCommerceService } = await import('../ai/aiCommerce.service.js');
    const response = await aiCommerceService.generateResponse(vendorId, message, history);
    sendSuccess(res, response);
  } catch (err) { next(err); }
});
router.use('/whatsapp', wa);

// ─── TWILIO WEBHOOK ───────────────────────────────────────
const twilio = Router();
import { handleTwilioWebhook } from '../twilio/twilio.service.js';
import { messageQueue } from '../twilio/messageQueue.service.js';
import { costController } from '../twilio/costController.service.js';
import { fallbackService } from '../twilio/fallback.service.js';
import { twilioRateLimiter } from '../twilio/rateLimiter.middleware.js';

twilio.get('/webhook', (req, res) => {
  // Twilio webhook verification (if needed)
  res.sendStatus(200);
});

twilio.post('/webhook', twilioRateLimiter(), async (req, res, next) => {
  const signature = req.headers['x-twilio-signature'] as string;
  const result = await handleTwilioWebhook(req.body, signature);
  if (result.success) {
    res.sendStatus(200);
  } else {
    res.status(400).json({ error: result.error });
  }
});

// Send message endpoint (for testing)
twilio.post('/send', authenticate, async (req, res, next): Promise<void> => {
  try {
    const { to, body, vendorId } = req.body as { to: string; body: string; vendorId?: string };
    
    // Check budget
    const budgetCheck = await costController.checkBudget(vendorId || req.user!.vendorId);
    if (!budgetCheck.allowed) {
      res.status(429).json({ 
        success: false, 
        error: { code: 'BUDGET_EXCEEDED', message: budgetCheck.reason } 
      });
      return;
    }

    // Send with fallback
    const result = await fallbackService.sendWithFallback(to, body, { vendorId });
    
    if (result.success) {
      await costController.recordUsage(vendorId || req.user!.vendorId);
      sendSuccess(res, { messageId: result.messageId, provider: result.provider });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (err) { next(err); }
});

// Queue message endpoint
twilio.post('/queue', authenticate, async (req, res, next) => {
  try {
    const { to, body, vendorId, priority } = req.body as { 
      to: string; 
      body: string; 
      vendorId?: string; 
      priority?: 'low' | 'normal' | 'high' 
    };
    
    const messageId = await messageQueue.enqueue(to, body, { vendorId, priority });
    sendSuccess(res, { messageId });
  } catch (err) { next(err); }
});

// Queue status endpoint
twilio.get('/queue/status', authenticate, async (req, res, next) => {
  try {
    const status = messageQueue.getQueueStatus();
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

// Cost dashboard endpoint
twilio.get('/cost/dashboard', authenticate, async (req, res, next) => {
  try {
    const dashboard = await costController.getCostDashboard(req.user!.vendorId);
    sendSuccess(res, dashboard);
  } catch (err) { next(err); }
});

// Circuit status endpoint
twilio.get('/circuit/status', authenticate, async (req, res, next) => {
  try {
    const status = fallbackService.getCircuitStatus();
    sendSuccess(res, status);
  } catch (err) { next(err); }
});

// Reset circuit endpoint (admin only)
twilio.post('/circuit/reset', authenticate, requireRole('SUPER_ADMIN'), async (req, res, next) => {
  try {
    fallbackService.resetCircuit();
    sendSuccess(res, { message: 'Circuit breaker reset' });
  } catch (err) { next(err); }
});

router.use('/twilio', twilio);

// ─── ADMIN ───────────────────────────────────────────────────
const admin = Router();
admin.use(authenticate, requireRole('SUPER_ADMIN', 'MODERATOR'));

admin.get('/vendors', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query as Record<string, string>;
    const [data, total] = await Promise.all([
      prisma.vendor.findMany({
        where: status ? { status: status as any } : undefined,
        skip: (+page - 1) * +limit,
        take: +limit,
        include: { owner: { select: { firstName: true, lastName: true, phone: true } }, category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.vendor.count({ where: status ? { status: status as any } : undefined }),
    ]);
    sendSuccess(res, { data, meta: { total, page: +page, limit: +limit } });
  } catch (err) { next(err); }
});

admin.patch('/vendors/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body as { status: string };
    const vendor = await prisma.vendor.update({
      where: { id: req.params['id'] },
      data: { status: status as any },
    });
    sendSuccess(res, vendor, `Vendor ${status.toLowerCase()}`);
  } catch (err) { next(err); }
});

admin.get('/analytics', async (_req, res, next) => {
  try {
    const [totalVendors, activeVendors, totalUsers, categoryDist] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count(),
      prisma.vendor.groupBy({ by: ['categoryId'], _count: { _all: true }, where: { status: 'ACTIVE' } }),
    ]);
    sendSuccess(res, { totalVendors, activeVendors, totalUsers, categoryDistribution: categoryDist });
  } catch (err) { next(err); }
});

// Conversation Analytics (Global)
admin.get('/conversation-analytics', chatbotController.getGlobalAnalytics.bind(chatbotController));

admin.get('/verification-requests', async (_req, res, next) => {
  try {
    const requests = await prisma.verificationRequest.findMany({
      where: { status: 'PENDING' },
      include: { 
        vendor: { select: { businessName: true, lga: true } } 
      },
      orderBy: { createdAt: 'asc' },
    });
    sendSuccess(res, requests);
  } catch (err) { next(err); }
});

admin.patch('/verification-requests/:id', async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body as { status: string; rejectionReason?: string };
    const request = await prisma.verificationRequest.update({
      where: { id: req.params['id'] },
      data: {
        status: status as any,
        reviewedById: req.user!.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });
    if (status === 'APPROVED') {
      await prisma.vendor.update({
        where: { id: request.vendorId },
        data: { verificationLevel: request.requestedLevel },
      });
    }
    sendSuccess(res, request, 'Verification request updated');
  } catch (err) { next(err); }
});
router.use('/admin', admin);

// ─── UPLOADS ─────────────────────────────────────────────────
const uploads = Router();
uploads.use(authenticate, requireVendor);
uploads.post('/cover', wrapMulter(uploadImage as any), uploadController.uploadCoverImage.bind(uploadController));
uploads.post('/logo', wrapMulter(uploadLogo as any), uploadController.uploadLogo.bind(uploadController));
uploads.post('/gallery', wrapMulter(uploadImages as any), uploadController.uploadGallery.bind(uploadController));
uploads.post('/verification', wrapMulter(uploadDocuments as any), uploadController.uploadVerificationDocs.bind(uploadController));
uploads.post('/product-images', wrapMulter(uploadImages as any), uploadController.uploadProductImages.bind(uploadController));
uploads.post('/receipt', wrapMulter(uploadReceipt as any), uploadController.uploadReceipt.bind(uploadController));
router.use('/uploads', uploads);

// ─── FINANCIAL MANAGEMENT ───────────────────────────────────
const financial = Router();
financial.use(authenticate, requireVendor);

// Income
financial.get('/incomes', financialController.getIncomes.bind(financialController));
financial.post('/incomes', financialController.createIncome.bind(financialController));
financial.patch('/incomes/:id', financialController.updateIncome.bind(financialController));
financial.delete('/incomes/:id', financialController.deleteIncome.bind(financialController));

// Expense
financial.get('/expenses', financialController.getExpenses.bind(financialController));
financial.post('/expenses', financialController.createExpense.bind(financialController));
financial.patch('/expenses/:id', financialController.updateExpense.bind(financialController));
financial.delete('/expenses/:id', financialController.deleteExpense.bind(financialController));

// Invoice
financial.get('/invoices', financialController.getInvoices.bind(financialController));
financial.get('/invoices/:id', financialController.getInvoice.bind(financialController));
financial.post('/invoices', financialController.createInvoice.bind(financialController));
financial.patch('/invoices/:id', financialController.updateInvoice.bind(financialController));
financial.delete('/invoices/:id', financialController.deleteInvoice.bind(financialController));

// Summary
financial.get('/summary', financialController.getFinancialSummary.bind(financialController));

// Financial Reports
financial.get('/reports/profit-loss', financialController.getProfitLossReport.bind(financialController));
financial.get('/reports/cash-flow', financialController.getCashFlowReport.bind(financialController));
financial.get('/reports/sales-analytics', financialController.getSalesAnalytics.bind(financialController));
financial.get('/reports/tax-summary', financialController.getTaxSummary.bind(financialController));
financial.get('/reports', financialController.getFinancialReports.bind(financialController));

router.use('/financial', financial);

// ─── CRM (Customer Relationship Management) ───────────────
const crm = Router();
crm.use(authenticate, requireVendor);

// Customers
crm.get('/customers', crmController.getCustomers.bind(crmController));
crm.get('/customers/:id', crmController.getCustomer.bind(crmController));
crm.post('/customers', crmController.createCustomer.bind(crmController));
crm.patch('/customers/:id', crmController.updateCustomer.bind(crmController));
crm.delete('/customers/:id', crmController.deleteCustomer.bind(crmController));

// Customer Notes
crm.get('/customers/:customerId/notes', crmController.getCustomerNotes.bind(crmController));
crm.post('/customers/:customerId/notes', crmController.createCustomerNote.bind(crmController));
crm.patch('/customers/:customerId/notes/:id', crmController.updateCustomerNote.bind(crmController));
crm.delete('/customers/:customerId/notes/:id', crmController.deleteCustomerNote.bind(crmController));

// Customer Tags
crm.get('/customers/:customerId/tags', crmController.getCustomerTags.bind(crmController));
crm.post('/customers/:customerId/tags', crmController.createCustomerTag.bind(crmController));
crm.delete('/customers/:customerId/tags/:id', crmController.deleteCustomerTag.bind(crmController));

// Communication Log
crm.get('/communications', crmController.getCommunications.bind(crmController));
crm.post('/customers/:customerId/communications', crmController.createCommunication.bind(crmController));
crm.patch('/customers/:customerId/communications/:id', crmController.updateCommunication.bind(crmController));
crm.delete('/customers/:customerId/communications/:id', crmController.deleteCommunication.bind(crmController));

// Customer Purchase History
crm.get('/customers/:customerId/purchase-history', crmController.getCustomerPurchaseHistory.bind(crmController));

// CRM Summary
crm.get('/summary', crmController.getCRMSummary.bind(crmController));

router.use('/crm', crm);

// ─── INVENTORY MANAGEMENT ───────────────────────────────────
const inventory = Router();
inventory.use(authenticate, requireVendor);

// Inventory Items
inventory.get('/items', inventoryController.getInventoryItems.bind(inventoryController));
inventory.get('/items/:id', inventoryController.getInventoryItem.bind(inventoryController));
inventory.post('/items', inventoryController.createInventoryItem.bind(inventoryController));
inventory.patch('/items/:id', inventoryController.updateInventoryItem.bind(inventoryController));
inventory.delete('/items/:id', inventoryController.deleteInventoryItem.bind(inventoryController));

// Stock Movements
inventory.get('/movements', inventoryController.getStockMovements.bind(inventoryController));
inventory.post('/items/:inventoryId/movements', inventoryController.createStockMovement.bind(inventoryController));

// Stock Alerts
inventory.get('/alerts', inventoryController.getStockAlerts.bind(inventoryController));
inventory.patch('/alerts/:id/resolve', inventoryController.resolveStockAlert.bind(inventoryController));

// Inventory Valuation
inventory.get('/valuation', inventoryController.getInventoryValuation.bind(inventoryController));

// Inventory Summary
inventory.get('/summary', inventoryController.getInventorySummary.bind(inventoryController));

router.use('/inventory', inventory);

// ─── TAX MANAGEMENT ─────────────────────────────────────────
const tax = Router();
tax.use(authenticate, requireVendor);

// Tax Records
tax.get('/records', taxController.getTaxRecords.bind(taxController));
tax.get('/records/:id', taxController.getTaxRecord.bind(taxController));
tax.post('/records', taxController.createTaxRecord.bind(taxController));
tax.patch('/records/:id', taxController.updateTaxRecord.bind(taxController));
tax.delete('/records/:id', taxController.deleteTaxRecord.bind(taxController));

// Tax Payments
tax.get('/payments', taxController.getTaxPayments.bind(taxController));
tax.post('/records/:taxRecordId/payments', taxController.createTaxPayment.bind(taxController));
tax.delete('/payments/:id', taxController.deleteTaxPayment.bind(taxController));

// Tax Calculation
tax.get('/calculation', taxController.getTaxCalculation.bind(taxController));

// VAT Tracking
tax.get('/vat/tracking', taxController.getVatTracking.bind(taxController));

// Compliance Reports
tax.get('/reports', taxController.getComplianceReports.bind(taxController));
tax.post('/reports/generate', taxController.generateComplianceReport.bind(taxController));

// Tax Summary
tax.get('/summary', taxController.getTaxSummary.bind(taxController));

router.use('/tax', tax);

// ─── AI ENGINE ───────────────────────────────────────────────
const ai = Router();
ai.use(authenticate, requireVendor);

// AI Configuration
ai.get('/configuration', aiController.getAIConfiguration.bind(aiController));
ai.patch('/configuration', aiController.updateAIConfiguration.bind(aiController));

// AI Testing
ai.post('/test', aiController.testAIConfiguration.bind(aiController));

// Knowledge Base
ai.post('/knowledge-base/rebuild', aiController.rebuildKnowledgeBase.bind(aiController));

// FAQs
ai.get('/faqs', aiController.getFAQs.bind(aiController));
ai.post('/faqs', aiController.createFAQ.bind(aiController));
ai.patch('/faqs/:id', aiController.updateFAQ.bind(aiController));
ai.delete('/faqs/:id', aiController.deleteFAQ.bind(aiController));

router.use('/ai', ai);

// ─── MARKETING TOOLS ─────────────────────────────────────────────
const marketing = Router();
marketing.use(authenticate, requireVendor);

// Promotions
marketing.get('/promotions', marketingController.getPromotions.bind(marketingController));
marketing.post('/promotions', marketingController.createPromotion.bind(marketingController));
marketing.patch('/promotions/:id', marketingController.updatePromotion.bind(marketingController));
marketing.delete('/promotions/:id', marketingController.deletePromotion.bind(marketingController));

// Loyalty Programs
marketing.get('/loyalty-programs', marketingController.getLoyaltyPrograms.bind(marketingController));
marketing.post('/loyalty-programs', marketingController.createLoyaltyProgram.bind(marketingController));
marketing.patch('/loyalty-programs/:id', marketingController.updateLoyaltyProgram.bind(marketingController));
marketing.delete('/loyalty-programs/:id', marketingController.deleteLoyaltyProgram.bind(marketingController));
marketing.get('/loyalty-programs/:programId/members', marketingController.getLoyaltyMembers.bind(marketingController));

// WhatsApp Campaigns
marketing.get('/whatsapp-campaigns', marketingController.getWhatsAppCampaigns.bind(marketingController));
marketing.post('/whatsapp-campaigns', marketingController.createWhatsAppCampaign.bind(marketingController));
marketing.patch('/whatsapp-campaigns/:id', marketingController.updateWhatsAppCampaign.bind(marketingController));
marketing.delete('/whatsapp-campaigns/:id', marketingController.deleteWhatsAppCampaign.bind(marketingController));
marketing.post('/whatsapp-campaigns/:id/send', marketingController.sendWhatsAppCampaign.bind(marketingController));

router.use('/marketing', marketing);

// ─── PAYMENTS ─────────────────────────────────────────────────────
const payment = Router();
payment.use(authenticate);

// Payment Configuration
payment.get('/configuration', paymentController.getPaymentConfiguration.bind(paymentController));
payment.post('/configuration', paymentController.createPaymentConfiguration.bind(paymentController));
payment.post('/configuration/test', paymentController.testPaymentConfiguration.bind(paymentController));

// Payments
payment.get('/history', paymentController.getPaymentHistory.bind(paymentController));
payment.post('/initialize', paymentController.createPayment.bind(paymentController));
payment.post('/verify/:reference', paymentController.verifyPayment.bind(paymentController));

router.use('/payments', payment);

// ─── SUBSCRIPTIONS ─────────────────────────────────────────────────
const subscription = Router();
subscription.use(authenticate);
subscription.use(requireVendor);

subscription.get('/', subscriptionController.getSubscription.bind(subscriptionController));
subscription.post('/', subscriptionController.createSubscription.bind(subscriptionController));
subscription.patch('/upgrade', subscriptionController.upgradeSubscription.bind(subscriptionController));
subscription.post('/cancel', subscriptionController.cancelSubscription.bind(subscriptionController));
subscription.get('/limits', subscriptionController.getSubscriptionLimits.bind(subscriptionController));

router.use('/subscriptions', subscription);

// ─── CHATBOT ─────────────────────────────────────────────────────
const chatbot = Router();
chatbot.use(authenticate, requireVendor);

// Chatbot Settings
chatbot.get('/settings', chatbotController.getSettings.bind(chatbotController));
chatbot.put('/settings', chatbotController.updateSettings.bind(chatbotController));

// Chatbot Rules
chatbot.get('/rules', chatbotController.getRules.bind(chatbotController));
chatbot.post('/rules', chatbotController.createRule.bind(chatbotController));
chatbot.put('/rules/:id', chatbotController.updateRule.bind(chatbotController));
chatbot.delete('/rules/:id', chatbotController.deleteRule.bind(chatbotController));

// Chatbot Sessions
chatbot.get('/sessions', chatbotController.getSessions.bind(chatbotController));
chatbot.post('/session/takeover', chatbotController.takeoverSession.bind(chatbotController));
chatbot.post('/session/resume', chatbotController.resumeSession.bind(chatbotController));

// Conversation Analytics
chatbot.get('/analytics', chatbotController.getAnalytics.bind(chatbotController));

// Message Processing (public endpoint for WhatsApp webhook)
chatbot.post('/process-message', chatbotController.processMessage.bind(chatbotController));

router.use('/chatbot', chatbot);

// ─── COST CONTROL (WCCS) ─────────────────────────────────────────
const costControl = Router();
costControl.use(authenticate);
costControl.use(requireVendor);

// Dashboard
costControl.get('/dashboard', costControlController.getDashboard.bind(costControlController));
costControl.get('/savings', costControlController.getCostSavings.bind(costControlController));
costControl.get('/usage-trend', costControlController.getDailyUsageTrend.bind(costControlController));
costControl.get('/top-keywords', costControlController.getTopCachedKeywords.bind(costControlController));
costControl.get('/top-conversations', costControlController.getTopCostlyConversations.bind(costControlController));
costControl.get('/spike-history', costControlController.getSpikeHistory.bind(costControlController));

// Controls
costControl.post('/reduced-mode/enable', costControlController.enableReducedMode.bind(costControlController));
costControl.post('/reduced-mode/disable', costControlController.disableReducedMode.bind(costControlController));
costControl.post('/cache/clear', costControlController.clearCache.bind(costControlController));
costControl.post('/cache/preload', costControlController.preCacheResponses.bind(costControlController));
costControl.post('/tier/update', costControlController.updateVendorTier.bind(costControlController));

router.use('/cost-control', costControl);

export { router as apiRouter };
