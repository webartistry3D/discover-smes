-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN "barcode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_barcode_key" ON "inventory_items"("barcode");
