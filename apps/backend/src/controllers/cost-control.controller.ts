import { Request, Response } from 'express';
import { costControlService } from '../modules/cost-control/cost.service';

export class CostControlController {
  // Get cost control dashboard data
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const dashboardData = await costControlService.getDashboardData(vendorId);
      res.json({ data: dashboardData });
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      res.status(500).json({ error: 'Failed to get dashboard data' });
    }
  }

  // Get cost savings
  async getCostSavings(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const savings = await costControlService.getCostSavings(vendorId);
      res.json({ data: savings });
    } catch (error) {
      console.error('Error getting cost savings:', error);
      res.status(500).json({ error: 'Failed to get cost savings' });
    }
  }

  // Get daily usage trend
  async getDailyUsageTrend(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const days = parseInt(req.query.days as string) || 30;
      const trend = await costControlService.getDailyUsageTrend(vendorId, days);
      res.json({ data: trend });
    } catch (error) {
      console.error('Error getting daily usage trend:', error);
      res.status(500).json({ error: 'Failed to get daily usage trend' });
    }
  }

  // Get top cached keywords
  async getTopCachedKeywords(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const keywords = await costControlService.getTopCachedKeywords(vendorId, limit);
      res.json({ data: keywords });
    } catch (error) {
      console.error('Error getting top cached keywords:', error);
      res.status(500).json({ error: 'Failed to get top cached keywords' });
    }
  }

  // Get top costly conversations
  async getTopCostlyConversations(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const conversations = await costControlService.getTopCostlyConversations(vendorId, limit);
      res.json({ data: conversations });
    } catch (error) {
      console.error('Error getting top costly conversations:', error);
      res.status(500).json({ error: 'Failed to get top costly conversations' });
    }
  }

  // Get spike history
  async getSpikeHistory(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const days = parseInt(req.query.days as string) || 7;
      const history = await costControlService.getSpikeHistory(vendorId, days);
      res.json({ data: history });
    } catch (error) {
      console.error('Error getting spike history:', error);
      res.status(500).json({ error: 'Failed to get spike history' });
    }
  }

  // Enable reduced mode
  async enableReducedMode(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const quota = await costControlService.enableReducedMode(vendorId);
      res.json({ data: quota });
    } catch (error) {
      console.error('Error enabling reduced mode:', error);
      res.status(500).json({ error: 'Failed to enable reduced mode' });
    }
  }

  // Disable reduced mode
  async disableReducedMode(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const quota = await costControlService.disableReducedMode(vendorId);
      res.json({ data: quota });
    } catch (error) {
      console.error('Error disabling reduced mode:', error);
      res.status(500).json({ error: 'Failed to disable reduced mode' });
    }
  }

  // Clear cache
  async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const result = await costControlService.clearCache(vendorId);
      res.json({ data: result });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  }

  // Pre-cache responses
  async preCacheResponses(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { rules } = req.body;
      if (!Array.isArray(rules)) {
        res.status(400).json({ error: 'Rules must be an array' });
        return;
      }

      const results = await costControlService.preCacheResponses(vendorId, rules);
      res.json({ data: results });
    } catch (error) {
      console.error('Error pre-caching responses:', error);
      res.status(500).json({ error: 'Failed to pre-cache responses' });
    }
  }

  // Update vendor tier
  async updateVendorTier(req: Request, res: Response): Promise<void> {
    try {
      const vendorId = req.user?.vendorId;
      if (!vendorId) {
        res.status(403).json({ error: 'Vendor not found' });
        return;
      }

      const { tier } = req.body;
      if (!tier) {
        res.status(400).json({ error: 'Tier is required' });
        return;
      }

      const quota = await costControlService.updateVendorTier(vendorId, tier);
      res.json({ data: quota });
    } catch (error) {
      console.error('Error updating vendor tier:', error);
      res.status(500).json({ error: 'Failed to update vendor tier' });
    }
  }
}

export default new CostControlController();
