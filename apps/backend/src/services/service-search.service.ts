import Fuse from 'fuse.js';
import { prisma } from '../config/database.js';

export interface ServiceSearchResult {
  item: {
    id: string;
    vendorId: string;
    name: string;
    description: string | null;
    price: number | null;
    priceLabel: string | null;
    currency: string;
    durationMinutes: number | null;
    images: string[];
    isAvailable: boolean;
    bookingRequired: boolean;
  };
  score?: number;
}

// Helper to convert Prisma Decimal to number
function decimalToNumber(decimal: any): number {
  return decimal ? Number(decimal) : 0;
}

export class ServiceSearchService {
  /**
   * Search services with fuzzy matching
   * @param vendorId - Vendor ID for scoping
   * @param query - Search query
   * @param threshold - Fuzzy match threshold (0-1, default 0.3)
   * @returns Array of matching services with scores
   */
  async searchServices(
    vendorId: string,
    query: string,
    threshold: number = 0.3
  ): Promise<ServiceSearchResult[]> {
    const services = await prisma.service.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    if (services.length === 0) {
      return [];
    }

    const fuse = new Fuse(services, {
      keys: ['name', 'description'],
      threshold,
      includeScore: true,
      ignoreLocation: true,
    });

    const results = fuse.search(query);

    // Convert Decimal to number for price
    return results.map(result => ({
      item: {
        ...result.item,
        price: result.item.price ? decimalToNumber(result.item.price) : null,
      },
      score: result.score,
    }));
  }

  /**
   * Get service by exact name match
   * @param vendorId - Vendor ID for scoping
   * @param name - Exact service name
   * @returns Service or null
   */
  async getServiceByName(vendorId: string, name: string) {
    const normalizedName = name.toLowerCase().trim();

    const service = await prisma.service.findFirst({
      where: {
        vendorId,
        name: {
          contains: normalizedName,
          mode: 'insensitive',
        },
        isAvailable: true,
      },
    });

    return service;
  }

  /**
   * Get all available services for a vendor
   * @param vendorId - Vendor ID
   * @returns Array of all available services
   */
  async getAllServices(vendorId: string) {
    return prisma.service.findMany({
      where: {
        vendorId,
        isAvailable: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Get services that require booking
   * @param vendorId - Vendor ID
   * @returns Array of bookable services
   */
  async getBookableServices(vendorId: string) {
    return prisma.service.findMany({
      where: {
        vendorId,
        isAvailable: true,
        bookingRequired: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Format service for WhatsApp response
   * @param service - Service object
   * @returns Formatted string
   */
  formatServiceForWhatsApp(service: any): string {
    let response = `*${service.name}*\n`;
    
    if (service.description) {
      response += `${service.description}\n`;
    }
    
    if (service.priceLabel) {
      response += `Price: ${service.priceLabel}\n`;
    } else if (service.price) {
      response += `Price: ${service.currency} ${decimalToNumber(service.price)}\n`;
    }
    
    if (service.durationMinutes) {
      response += `Duration: ${service.durationMinutes} minutes\n`;
    }
    
    if (service.bookingRequired) {
      response += `⚠️ Booking required\n`;
    }
    
    return response;
  }
}

export default new ServiceSearchService();
