-- CreateEnum
CREATE TYPE "TaxType" AS ENUM ('VAT', 'INCOME_TAX', 'SALES_TAX', 'SERVICE_TAX', 'WITHHOLDING_TAX', 'CUSTOMS_DUTY', 'EXCISE_DUTY', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'PARTIALLY_PAID', 'WAIVED', 'DISPUTED');

-- CreateTable
CREATE TABLE "TaxRecord" (
    "id" TEXT NOT NULL,
    "vendorId" UUID NOT NULL,
    "type" "TaxType" NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT,
    "baseAmount" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "vatInput" DECIMAL(15,2),
    "vatOutput" DECIMAL(15,2),
    "netVat" DECIMAL(15,2),
    "status" "TaxStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxPayment" (
    "id" TEXT NOT NULL,
    "taxRecordId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxReport" (
    "id" TEXT NOT NULL,
    "taxRecordId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalTax" DECIMAL(15,2) NOT NULL,
    "totalPaid" DECIMAL(15,2) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "isCompliant" BOOLEAN NOT NULL DEFAULT true,
    "complianceNotes" TEXT,
    "fileUrl" TEXT,
    "fileName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaxReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaxRecord_vendorId_idx" ON "TaxRecord"("vendorId");

-- CreateIndex
CREATE INDEX "TaxRecord_type_idx" ON "TaxRecord"("type");

-- CreateIndex
CREATE INDEX "TaxRecord_status_idx" ON "TaxRecord"("status");

-- CreateIndex
CREATE INDEX "TaxRecord_dueDate_idx" ON "TaxRecord"("dueDate");

-- CreateIndex
CREATE INDEX "TaxPayment_taxRecordId_idx" ON "TaxPayment"("taxRecordId");

-- CreateIndex
CREATE INDEX "TaxPayment_paymentDate_idx" ON "TaxPayment"("paymentDate");

-- CreateIndex
CREATE INDEX "TaxReport_taxRecordId_idx" ON "TaxReport"("taxRecordId");

-- CreateIndex
CREATE INDEX "TaxReport_reportType_idx" ON "TaxReport"("reportType");

-- CreateIndex
CREATE INDEX "TaxReport_period_idx" ON "TaxReport"("period");

-- AddForeignKey
ALTER TABLE "TaxRecord" ADD CONSTRAINT "TaxRecord_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxPayment" ADD CONSTRAINT "TaxPayment_taxRecordId_fkey" FOREIGN KEY ("taxRecordId") REFERENCES "TaxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaxReport" ADD CONSTRAINT "TaxReport_taxRecordId_fkey" FOREIGN KEY ("taxRecordId") REFERENCES "TaxRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
