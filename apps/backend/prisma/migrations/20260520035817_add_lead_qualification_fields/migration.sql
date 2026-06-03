-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "leadScore" INTEGER,
ADD COLUMN     "leadStatus" TEXT,
ADD COLUMN     "leadTier" TEXT,
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "customers_leadTier_idx" ON "customers"("leadTier");
