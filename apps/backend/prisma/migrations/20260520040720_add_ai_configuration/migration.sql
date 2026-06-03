-- CreateTable
CREATE TABLE "ai_configurations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "greetingMessage" TEXT,
    "faqEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pricingInquiryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bookingAssistanceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inventoryInquiryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "leadQualificationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "leadQualificationThreshold" INTEGER DEFAULT 70,
    "customResponses" JSONB,
    "businessHoursOverride" TEXT,
    "outOfHoursMessage" TEXT,
    "escalationPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_configurations_vendorId_key" ON "ai_configurations"("vendorId");

-- AddForeignKey
ALTER TABLE "ai_configurations" ADD CONSTRAINT "ai_configurations_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
