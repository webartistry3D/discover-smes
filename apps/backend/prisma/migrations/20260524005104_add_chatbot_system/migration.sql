-- CreateEnum
CREATE TYPE "ChatbotRuleType" AS ENUM ('FAQ', 'PRICING', 'DELIVERY', 'HOURS', 'PAYMENT', 'LOCATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ChatbotSessionStatus" AS ENUM ('ACTIVE', 'HUMAN_TAKEOVER', 'CLOSED');

-- CreateTable
CREATE TABLE "chatbot_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "chatbotEnabled" BOOLEAN NOT NULL DEFAULT true,
    "greetingMessage" TEXT,
    "fallbackMessage" TEXT,
    "humanHandoffMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_rules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "ruleType" "ChatbotRuleType" NOT NULL,
    "keyword" TEXT NOT NULL,
    "questionPattern" TEXT,
    "response" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vendorId" UUID NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "botActive" BOOLEAN NOT NULL DEFAULT true,
    "humanTakeover" BOOLEAN NOT NULL DEFAULT false,
    "sessionStatus" "ChatbotSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastMessage" TEXT,
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chatbot_settings_vendorId_idx" ON "chatbot_settings"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "chatbot_settings_vendorId_key" ON "chatbot_settings"("vendorId");

-- CreateIndex
CREATE INDEX "chatbot_rules_vendorId_idx" ON "chatbot_rules"("vendorId");

-- CreateIndex
CREATE INDEX "chatbot_rules_ruleType_idx" ON "chatbot_rules"("ruleType");

-- CreateIndex
CREATE INDEX "chatbot_rules_isActive_idx" ON "chatbot_rules"("isActive");

-- CreateIndex
CREATE INDEX "chatbot_sessions_vendorId_idx" ON "chatbot_sessions"("vendorId");

-- CreateIndex
CREATE INDEX "chatbot_sessions_customerPhone_idx" ON "chatbot_sessions"("customerPhone");

-- CreateIndex
CREATE INDEX "chatbot_sessions_sessionStatus_idx" ON "chatbot_sessions"("sessionStatus");

-- AddForeignKey
ALTER TABLE "chatbot_settings" ADD CONSTRAINT "chatbot_settings_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_rules" ADD CONSTRAINT "chatbot_rules_vendor_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_rules" ADD CONSTRAINT "chatbot_rules_settings_fkey" FOREIGN KEY ("vendorId") REFERENCES "chatbot_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_vendor_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_settings_fkey" FOREIGN KEY ("vendorId") REFERENCES "chatbot_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
