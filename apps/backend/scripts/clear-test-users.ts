import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  // Delete in order of dependency (most dependent first)
  await prisma.loyaltyTransaction.deleteMany({});
  await prisma.customerLoyalty.deleteMany({});
  await prisma.loyaltyTier.deleteMany({});
  await prisma.loyaltyProgram.deleteMany({});
  await prisma.whatsAppCampaign.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.verificationRequest.deleteMany({});
  await prisma.invoiceLineItem.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.stockAlert.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.taxRecord.deleteMany({});
  await prisma.financialReport.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.income.deleteMany({});
  await prisma.communicationLog.deleteMany({});
  await prisma.customerTag.deleteMany({});
  await prisma.customerNote.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.promotion.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.vendorFaq.deleteMany({});
  await prisma.vendor.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('All data cleared');
  await prisma.$disconnect();
}

clearAllData().catch(console.error);
