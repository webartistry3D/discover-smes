-- CreateEnum
CREATE TYPE "ConversationState" AS ENUM ('WELCOME', 'MENU', 'FAQ_SEARCH', 'PRODUCT_SEARCH', 'SERVICE_SEARCH', 'WAITING_FOR_OPERATOR', 'HUMAN_CHAT', 'BOT_RESUMED', 'CLOSED');

-- AlterTable
ALTER TABLE "chatbot_sessions" ADD COLUMN     "assignedOperatorId" UUID,
ADD COLUMN     "conversationContext" JSONB,
ADD COLUMN     "currentState" "ConversationState" NOT NULL DEFAULT 'WELCOME';

-- AlterTable
ALTER TABLE "chatbot_settings" ADD COLUMN     "businessHours" JSONB,
ADD COLUMN     "businessHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fuzzyMatchingEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "fuzzyThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
ADD COLUMN     "handoffEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "offlineMessage" TEXT;

-- CreateIndex
CREATE INDEX "chatbot_sessions_currentState_idx" ON "chatbot_sessions"("currentState");

-- CreateIndex
CREATE INDEX "chatbot_sessions_assignedOperatorId_idx" ON "chatbot_sessions"("assignedOperatorId");

-- AddForeignKey
ALTER TABLE "chatbot_sessions" ADD CONSTRAINT "chatbot_sessions_assignedOperatorId_fkey" FOREIGN KEY ("assignedOperatorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
