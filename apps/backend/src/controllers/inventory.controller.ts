import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database.js';
import { AppError, sendSuccess } from '../utils/errors.js';

export class InventoryController {
  // ─── INVENTORY ITEMS ───────────────────────────────────────

  async getInventoryItems(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { category, categoryId, search, lowStock } = req.query as Record<string, string>;

      const where: any = { vendorId, isActive: true };
      if (categoryId) {
        where.categoryId = categoryId;
      } else if (category) {
        where.OR = [
          { category: { equals: category, mode: 'insensitive' } },
          { categoryRel: { name: { equals: category, mode: 'insensitive' } } },
        ];
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (lowStock === 'true') {
        where.quantity = { lte: prisma.inventoryItem.fields.minStock };
      }

      const items = await prisma.inventoryItem.findMany({
        where,
        include: {
          categoryRel: true,
          _count: {
            select: {
              stockMovements: true,
              stockAlerts: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, items);
    } catch (err) {
      next(err);
    }
  }

  async getInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      const item = await prisma.inventoryItem.findFirst({
        where: { id, vendorId },
        include: {
          stockMovements: {
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          stockAlerts: {
            where: { isResolved: false },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!item) throw AppError.notFound('Inventory item not found');

      sendSuccess(res, item);
    } catch (err) {
      next(err);
    }
  }

  async createInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      // Enforce freemium inventory limit
      const subscription = await prisma.subscription.findUnique({ where: { vendorId } });
      if (subscription && subscription.planType === 'FREEMIUM') {
        const inventoryCount = await prisma.inventoryItem.count({ where: { vendorId } });
        if (inventoryCount >= 6) throw AppError.badRequest('Freemium limit reached for inventory items (6)');
      }

      const {
        sku,
        name,
        description,
        category,
        categoryId,
        unit,
        quantity,
        minStock,
        maxStock,
        unitCost,
        sellingPrice,
        location,
        supplier,
        reorderPoint,
        reorderQty,
        notes,
      } = req.body as Record<string, unknown>;

      const resolvedCategory = await this.resolveCategory(categoryId as string | undefined, category as string | undefined);

      const item = await prisma.inventoryItem.create({
        data: {
          vendorId,
          sku: sku as string | undefined,
          name: name as string,
          description: description as string | undefined,
          category: resolvedCategory.name,
          categoryId: resolvedCategory.id,
          unit: unit as string | undefined,
          quantity: Number(quantity) || 0,
          minStock: Number(minStock) || 0,
          maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
          unitCost: Number(unitCost) || 0,
          sellingPrice: Number(sellingPrice) || 0,
          location: location as string | undefined,
          supplier: supplier as string | undefined,
          reorderPoint: Number(reorderPoint) || 0,
          reorderQty: reorderQty !== undefined ? Number(reorderQty) : undefined,
          notes: notes as string | undefined,
        },
      });

      // Create initial stock movement if quantity > 0
      if (quantity && Number(quantity) > 0) {
        await prisma.stockMovement.create({
          data: {
            inventoryId: item.id,
            vendorId,
            type: 'IN',
            quantity: Number(quantity),
            unitCost: Number(unitCost) || 0,
            reason: 'Initial stock',
          },
        });
      }

      sendSuccess(res, item, 'Inventory item created');
    } catch (err) {
      next(err);
    }
  }

  async updateInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;
      const {
        sku,
        name,
        description,
        category,
        categoryId,
        unit,
        quantity,
        minStock,
        maxStock,
        unitCost,
        sellingPrice,
        location,
        supplier,
        reorderPoint,
        reorderQty,
        isActive,
        notes,
      } = req.body as Record<string, unknown>;

      const resolvedCategory = await this.resolveCategory(categoryId as string | undefined, category as string | undefined);

      const item = await prisma.inventoryItem.update({
        where: { id, vendorId },
        data: {
          sku: sku as string | undefined,
          name: name as string | undefined,
          description: description as string | undefined,
          category: resolvedCategory.name,
          categoryId: resolvedCategory.id,
          unit: unit as string | undefined,
          quantity: quantity !== undefined ? Number(quantity) : undefined,
          minStock: minStock !== undefined ? Number(minStock) : undefined,
          maxStock: maxStock !== undefined ? Number(maxStock) : undefined,
          unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
          sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined,
          location: location as string | undefined,
          supplier: supplier as string | undefined,
          reorderPoint: reorderPoint !== undefined ? Number(reorderPoint) : undefined,
          reorderQty: reorderQty !== undefined ? Number(reorderQty) : undefined,
          isActive: isActive as boolean | undefined,
          notes: notes as string | undefined,
        },
      });

      sendSuccess(res, item, 'Inventory item updated');
    } catch (err) {
      next(err);
    }
  }

  async deleteInventoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      await prisma.inventoryItem.delete({
        where: { id, vendorId },
      });

      sendSuccess(res, null, 'Inventory item deleted');
    } catch (err) {
      next(err);
    }
  }

  // ─── STOCK MOVEMENTS ───────────────────────────────────────

  async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { inventoryId, type } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (inventoryId) where.inventoryId = inventoryId;
      if (type) where.type = type;

      const movements = await prisma.stockMovement.findMany({
        where,
        include: {
          inventory: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, movements);
    } catch (err) {
      next(err);
    }
  }

  async createStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { inventoryId } = req.params;
      const { type, quantity, unitCost, reference, reason, notes } = req.body as Record<string, unknown>;

      // Verify inventory item belongs to vendor
      const inventory = await prisma.inventoryItem.findFirst({
        where: { id: inventoryId, vendorId },
      });
      if (!inventory) throw AppError.notFound('Inventory item not found');

      const movement = await prisma.stockMovement.create({
        data: {
          inventoryId,
          vendorId,
          type: type as any,
          quantity: Number(quantity),
          unitCost: unitCost !== undefined ? Number(unitCost) : undefined,
          reference: reference as string | undefined,
          reason: reason as string | undefined,
          notes: notes as string | undefined,
        },
      });

      // Update inventory quantity based on movement type
      const quantityChange = type === 'OUT' || type === 'DAMAGE' || type === 'LOSS' ? -Number(quantity) : Number(quantity);
      await prisma.inventoryItem.update({
        where: { id: inventoryId },
        data: {
          quantity: { increment: quantityChange },
        },
      });

      // Check for low stock alerts
      const updatedItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryId },
      });
      if (updatedItem && Number(updatedItem.quantity) <= Number(updatedItem.minStock)) {
        await prisma.stockAlert.create({
          data: {
            inventoryId,
            vendorId,
            type: Number(updatedItem.quantity) === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            severity: Number(updatedItem.quantity) === 0 ? 'CRITICAL' : 'MEDIUM',
            message: `${updatedItem.name} is ${Number(updatedItem.quantity) === 0 ? 'out of stock' : 'running low on stock'}`,
            quantity: Number(updatedItem.quantity),
            threshold: Number(updatedItem.minStock),
          },
        });
      }

      sendSuccess(res, movement, 'Stock movement recorded');
    } catch (err) {
      next(err);
    }
  }

  // ─── STOCK ALERTS ──────────────────────────────────────────

  async getStockAlerts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { isResolved, severity } = req.query as Record<string, string>;

      const where: any = { vendorId };
      if (isResolved !== undefined) where.isResolved = isResolved === 'true';
      if (severity) where.severity = severity;

      const alerts = await prisma.stockAlert.findMany({
        where,
        include: {
          inventory: {
            select: {
              id: true,
              name: true,
              sku: true,
              quantity: true,
              minStock: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      sendSuccess(res, alerts);
    } catch (err) {
      next(err);
    }
  }

  async resolveStockAlert(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const { id } = req.params;

      const alert = await prisma.stockAlert.update({
        where: { id },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      });

      sendSuccess(res, alert, 'Alert resolved');
    } catch (err) {
      next(err);
    }
  }

  // ─── INVENTORY VALUATION ────────────────────────────────────

  async getInventoryValuation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const items = await prisma.inventoryItem.findMany({
        where: { vendorId, isActive: true },
      });

      const totalItems = items.length;
      const totalValue = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.sellingPrice), 0);
      const totalCost = items.reduce((sum, item) => sum + Number(item.quantity) * Number(item.unitCost), 0);
      const lowStockItems = items.filter((item) => Number(item.quantity) <= Number(item.minStock)).length;
      const outOfStockItems = items.filter((item) => Number(item.quantity) === 0).length;

      // Group by category
      const categories: Record<string, { count: number; value: number; cost: number }> = {};
      items.forEach((item) => {
        const cat = item.category || 'Uncategorized';
        if (!categories[cat]) {
          categories[cat] = { count: 0, value: 0, cost: 0 };
        }
        categories[cat].count += 1;
        categories[cat].value += Number(item.quantity) * Number(item.sellingPrice);
        categories[cat].cost += Number(item.quantity) * Number(item.unitCost);
      });

      sendSuccess(res, {
        totalItems,
        totalValue,
        totalCost,
        lowStockItems,
        outOfStockItems,
        categories,
      });
    } catch (err) {
      next(err);
    }
  }

  // ─── INVENTORY SUMMARY ──────────────────────────────────────

  private async resolveCategory(
    categoryId?: string,
    categoryName?: string,
  ): Promise<{ id?: string; name?: string }> {
    if (categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (cat) return { id: cat.id, name: cat.name };
    }
    if (categoryName) {
      const cat = await prisma.category.findFirst({
        where: { name: { equals: categoryName.trim(), mode: 'insensitive' }, isActive: true },
      });
      if (cat) return { id: cat.id, name: cat.name };
      return { name: categoryName.trim() };
    }
    return {};
  }

  async getInventorySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const vendorId = req.user!.vendorId;
      if (!vendorId) throw AppError.forbidden('Vendor account required');

      const [totalItems, lowStockCount, outOfStockCount, recentMovements, activeAlerts] = await Promise.all([
        prisma.inventoryItem.count({ where: { vendorId, isActive: true } }),
        prisma.inventoryItem.count({
          where: {
            vendorId,
            isActive: true,
            quantity: { lte: prisma.inventoryItem.fields.minStock },
          },
        }),
        prisma.inventoryItem.count({
          where: {
            vendorId,
            isActive: true,
            quantity: 0,
          },
        }),
        prisma.stockMovement.count({
          where: {
            vendorId,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
        }),
        prisma.stockAlert.count({
          where: {
            vendorId,
            isResolved: false,
          },
        }),
      ]);

      sendSuccess(res, {
        totalItems,
        lowStockCount,
        outOfStockCount,
        recentMovements,
        activeAlerts,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const inventoryController = new InventoryController();
