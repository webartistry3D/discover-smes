import cron from 'node-cron';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { sendWhatsAppMessage } from '../whatsapp/webhook.service.js';

export function startCronJobs(): void {
  logger.info('Starting cron jobs...');

  // ─── Booking Reminders — runs every hour ───────────────────
  cron.schedule('0 * * * *', async () => {
    logger.debug('Running: booking reminder job');
    try {
      const reminderWindow = new Date();
      reminderWindow.setHours(reminderWindow.getHours() + 24);
      const reminderWindowStart = new Date();
      reminderWindowStart.setHours(reminderWindowStart.getHours() + 23);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          reminderSent: false,
          scheduledAt: {
            gte: reminderWindowStart,
            lte: reminderWindow,
          },
        },
        include: {
          vendor: { select: { businessName: true, address: true, whatsappPhone: true } },
        },
      });

      for (const booking of upcomingBookings) {
        const message =
          `Hello ${booking.customerName}! 👋\n\n` +
          `This is a reminder for your appointment at *${booking.vendor.businessName}* tomorrow.\n\n` +
          `📅 Date: ${booking.scheduledAt.toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })}\n` +
          `🕐 Time: ${booking.scheduledAt.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}\n` +
          `📍 Location: ${booking.vendor.address}\n\n` +
          `To reschedule or cancel, please contact the business directly.\n\n` +
          `_Discover SMEs — Connecting you to local businesses_`;

        try {
          await sendWhatsAppMessage(booking.customerPhone, message);
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent: true },
          });
          logger.info(`Reminder sent for booking ${booking.id}`);
        } catch (err) {
          logger.error(`Failed to send reminder for booking ${booking.id}:`, err);
        }
      }

      if (upcomingBookings.length > 0) {
        logger.info(`Sent ${upcomingBookings.length} booking reminder(s)`);
      }
    } catch (err) {
      logger.error('Booking reminder job failed:', err);
    }
  });

  // ─── Expired Token Cleanup — runs daily at 2am ─────────────
  cron.schedule('0 2 * * *', async () => {
    logger.debug('Running: token cleanup job');
    try {
      const { count } = await prisma.refreshToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { isRevoked: true, createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
          ],
        },
      });
      if (count > 0) logger.info(`Cleaned up ${count} expired/revoked token(s)`);
    } catch (err) {
      logger.error('Token cleanup job failed:', err);
    }
  });

  // ─── Used OTP Cleanup — runs daily at 3am ──────────────────
  cron.schedule('0 3 * * *', async () => {
    logger.debug('Running: OTP cleanup job');
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { count } = await prisma.otpCode.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: cutoff } },
            { isUsed: true, createdAt: { lt: cutoff } },
          ],
        },
      });
      if (count > 0) logger.info(`Cleaned up ${count} OTP record(s)`);
    } catch (err) {
      logger.error('OTP cleanup job failed:', err);
    }
  });

  // ─── Featured Vendor Expiry — runs daily at midnight ───────
  cron.schedule('0 0 * * *', async () => {
    logger.debug('Running: featured vendor expiry job');
    try {
      const { count } = await prisma.vendor.updateMany({
        where: {
          isFeatured: true,
          featuredUntil: { lt: new Date() },
        },
        data: { isFeatured: false, featuredUntil: null },
      });
      if (count > 0) logger.info(`Expired ${count} featured vendor listing(s)`);
    } catch (err) {
      logger.error('Featured expiry job failed:', err);
    }
  });

  // ─── Analytics Rollup — runs daily at 4am ──────────────────
  cron.schedule('0 4 * * *', async () => {
    logger.debug('Running: analytics rollup job');
    try {
      // Update vendor view counts from analytics events (last 30 days)
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const viewCounts = await prisma.analyticsEvent.groupBy({
        by: ['vendorId'],
        where: {
          eventType: 'VENDOR_VIEW',
          createdAt: { gte: since },
          vendorId: { not: null },
        },
        _count: { _all: true },
      });

      for (const row of viewCounts) {
        if (!row.vendorId) continue;
        await prisma.vendor.update({
          where: { id: row.vendorId },
          data: { totalViews: row._count._all },
        });
      }

      logger.info(`Analytics rollup complete for ${viewCounts.length} vendor(s)`);
    } catch (err) {
      logger.error('Analytics rollup job failed:', err);
    }
  });

  logger.info('✅ Cron jobs started (reminders, token cleanup, analytics)');
}
