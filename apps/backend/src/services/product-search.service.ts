import Fuse from 'fuse.js';
import { prisma } from '../config/database.js';

export interface ProductSearchResult {
  item: {
    id: string;
    vendorId: string;
    name: string;
    description: string | null;
    price: number;
    currency: string;
    images: string[];
    isAvailable: boolean;
    stock: number | null;
    unit: string | null;
  };
  score?: number;
}

// Helper to convert Prisma Decimal to number
function decimalToNumber(decimal: any): number {
  return decimal ? Number(decimal) : 0;
}

export class ProductSearchService {
  /**
   * Search products with fuzzy matching
   * @param vendorId - Vendor ID for scoping
   * @param query - Search query
   * @param threshold - Fuzzy match threshold (0-1, default 0.3)
   * @returns Array of matching products with scores
   */
  async searchProducts(
    vendorId: string,
    query: string,
    threshold: number = 0.3
  ): Promise<ProductSearchResult[]> {
    const products = await prisma.product.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (products.length === 0) {
      return [];
    }

    const fuse = new Fuse(products, {
      keys: ['name', 'description', 'unit'],
      threshold,
      includeScore: true,
      ignoreLocation: true,
    });

    const results = fuse.search(query);

    // Convert Decimal to number for price
    return results.map(result => ({
      item: {
        ...result.item,
        price: decimalToNumber(result.item.price),
      },
      score: result.score,
    }));
  }

  /**
   * Get products by category/tag
   * @param vendorId - Vendor ID for scoping
   * @param category - Category name
   * @returns Array of products in category
   */
  async getProductsByCategory(vendorId: string, category: string) {
    // Note: Products don't have direct category in schema
    // This would need to be implemented via tags or vendor category
    return prisma.product.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
    });
  }

  /**
   * Get product by exact name match
   * @param vendorId - Vendor ID for scoping
   * @param name - Exact product name
   * @returns Product or null
   */
  async getProductByName(vendorId: string, name: string) {
    const normalizedName = name.toLowerCase().trim();

    const product = await prisma.product.findFirst({
      where: {
        vendorId,
        name: {
          contains: normalizedName,
          mode: 'insensitive',
        },
        isAvailable: true,
      },
    });

    return product;
  }

  /**
   * Get all available products for a vendor
   * @param vendorId - Vendor ID
   * @returns Array of all available products
   */
  async getAllProducts(vendorId: string) {
    return prisma.product.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Format product for WhatsApp response
   * @param product - Product object
   * @returns Formatted string
   */
  formatProductForWhatsApp(product: any): string {
    const availability = product.stock && product.stock > 0 ? 'In Stock' : 'Out of Stock';
    const price = `${product.currency} ${product.price}`;
    
    let response = `*${product.name}*\n`;
    response += `Price: ${price}\n`;
    
    if (product.description) {
      response += `${product.description}\n`;
    }
    
    response += `Availability: ${availability}`;
    
    if (product.unit) {
      response += ` (${product.unit})`;
    }
    
    return response;
  }
}

export default new ProductSearchService();
