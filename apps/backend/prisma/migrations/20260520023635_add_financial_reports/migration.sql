-- CreateEnum
CREATE TYPE "FinancialReportType" AS ENUM ('PROFIT_LOSS', 'CASH_FLOW', 'SALES_ANALYTICS', 'TAX_SUMMARY');

-- CreateTable
CREATE TABLE "financial_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "reportType" "FinancialReportType" NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "totalRevenue" DECIMAL(15,2),
    "totalExpenses" DECIMAL(15,2),
    "netProfit" DECIMAL(15,2),
    "grossMargin" DECIMAL(5,2),
    "operatingMargin" DECIMAL(5,2),
    "netCashFlow" DECIMAL(15,2),
    "operatingCashFlow" DECIMAL(15,2),
    "investingCashFlow" DECIMAL(15,2),
    "financingCashFlow" DECIMAL(15,2),
    "totalSales" DECIMAL(15,2),
    "averageOrderValue" DECIMAL(12,2),
    "totalOrders" INTEGER,
    "conversionRate" DECIMAL(5,2),
    "totalTaxLiability" DECIMAL(15,2),
    "totalTaxPaid" DECIMAL(15,2),
    "taxBalance" DECIMAL(15,2),
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_reports_vendorId_reportType_idx" ON "financial_reports"("vendorId", "reportType");

-- CreateIndex
CREATE INDEX "financial_reports_vendorId_period_idx" ON "financial_reports"("vendorId", "period");

-- CreateIndex
CREATE INDEX "financial_reports_generatedAt_idx" ON "financial_reports"("generatedAt");

-- AddForeignKey
ALTER TABLE "financial_reports" ADD CONSTRAINT "financial_reports_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
