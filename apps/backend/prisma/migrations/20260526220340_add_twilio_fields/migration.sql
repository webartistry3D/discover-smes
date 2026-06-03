/*
  Warnings:

  - A unique constraint covering the columns `[twilioSid]` on the table `messages` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "MessageProvider" AS ENUM ('FACEBOOK', 'TWILIO');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "priority" "MessagePriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "provider" "MessageProvider" NOT NULL DEFAULT 'FACEBOOK',
ADD COLUMN     "queuedAt" TIMESTAMP(3),
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3),
ADD COLUMN     "twilioErrorCode" TEXT,
ADD COLUMN     "twilioErrorMessage" TEXT,
ADD COLUMN     "twilioSid" TEXT,
ADD COLUMN     "twilioStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "messages_twilioSid_key" ON "messages"("twilioSid");

-- CreateIndex
CREATE INDEX "messages_twilioSid_idx" ON "messages"("twilioSid");
