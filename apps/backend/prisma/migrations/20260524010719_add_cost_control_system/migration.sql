-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE', 'SESSION');

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "sessionId" UUID,
    "messageType" "MessageType" NOT NULL,
    "conversationId" TEXT,
    "costEstimate" DOUBLE PRECISION NOT NULL,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_quotas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "monthlyLimit" INTEGER NOT NULL,
    "currentUsage" INTEGER NOT NULL DEFAULT 0,
    "resetDate" TIMESTAMP(3) NOT NULL,
    "reducedMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_quotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "response_cache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "keyword" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "hitCount" INTEGER NOT NULL DEFAULT 0,
    "lastHitAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "response_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "usage_logs_vendorId_idx" ON "usage_logs"("vendorId");

-- CreateIndex
CREATE INDEX "usage_logs_timestamp_idx" ON "usage_logs"("timestamp");

-- CreateIndex
CREATE INDEX "usage_logs_messageType_idx" ON "usage_logs"("messageType");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_quotas_vendorId_key" ON "vendor_quotas"("vendorId");

-- CreateIndex
CREATE INDEX "vendor_quotas_vendorId_idx" ON "vendor_quotas"("vendorId");

-- CreateIndex
CREATE INDEX "response_cache_vendorId_idx" ON "response_cache"("vendorId");

-- CreateIndex
CREATE INDEX "response_cache_keyword_idx" ON "response_cache"("keyword");

-- CreateIndex
CREATE INDEX "response_cache_expiresAt_idx" ON "response_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "response_cache_vendorId_keyword_key" ON "response_cache"("vendorId", "keyword");

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_vendor_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_quotas" ADD CONSTRAINT "vendor_quotas_vendor_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "response_cache" ADD CONSTRAINT "response_cache_vendor_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
