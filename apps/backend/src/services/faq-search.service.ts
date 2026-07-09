import Fuse from 'fuse.js';
import { prisma } from '../config/database.js';

export interface FaqSearchResult {
  item: {
    id: string;
    vendorId: string;
    question: string;
    answer: string;
    sortOrder: number;
  };
  score?: number;
}

export class FaqSearchService {
  /**
   * Search FAQs with fuzzy matching
   * @param vendorId - Vendor ID for scoping
   * @param query - Search query
   * @param threshold - Fuzzy match threshold (0-1, default 0.3)
   * @returns Array of matching FAQs with scores
   */
  async searchFaqs(
    vendorId: string,
    query: string,
    threshold: number = 0.3
  ): Promise<FaqSearchResult[]> {
    const faqs = await prisma.vendorFaq.findMany({
      where: { vendorId },
      orderBy: { sortOrder: 'asc' },
    });

    if (faqs.length === 0) {
      return [];
    }

    const fuse = new Fuse(faqs, {
      keys: ['question', 'answer'],
      threshold,
      includeScore: true,
      ignoreLocation: true,
    });

    const results = fuse.search(query);
    return results;
  }

  /**
   * Get exact FAQ match by keyword
   * @param vendorId - Vendor ID for scoping
   * @param keyword - Exact keyword to match
   * @returns FAQ or null
   */
  async getExactMatch(vendorId: string, keyword: string) {
    const normalizedKeyword = keyword.toLowerCase().trim();

    const faq = await prisma.vendorFaq.findFirst({
      where: {
        vendorId,
        question: {
          contains: normalizedKeyword,
          mode: 'insensitive',
        },
      },
    });

    return faq;
  }

  /**
   * Get all FAQs for a vendor
   * @param vendorId - Vendor ID
   * @returns Array of all FAQs
   */
  async getAllFaqs(vendorId: string) {
    return prisma.vendorFaq.findMany({
      where: { vendorId },
      orderBy: { sortOrder: 'asc' },
    });
  }
}

export default new FaqSearchService();
