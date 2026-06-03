import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { costControlApi, twilioApi } from '../lib/api';
import type { CostDashboardData, CostSavings } from '../lib/shared';
import toast from 'react-hot-toast';

// Dashboard
export function useCostDashboard() {
  return useQuery({
    queryKey: ['cost-control', 'dashboard'],
    queryFn: async () => {
      const response = await costControlApi.getDashboard();
      return response.data as CostDashboardData;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

// Cost Savings
export function useCostSavings() {
  return useQuery({
    queryKey: ['cost-control', 'savings'],
    queryFn: async () => {
      const response = await costControlApi.getCostSavings();
      return response.data as CostSavings;
    },
  });
}

// Daily Usage Trend
export function useDailyUsageTrend(days: number = 30) {
  return useQuery({
    queryKey: ['cost-control', 'usage-trend', days],
    queryFn: async () => {
      const response = await costControlApi.getDailyUsageTrend(days);
      return response.data;
    },
  });
}

// Top Cached Keywords
export function useTopCachedKeywords(limit: number = 10) {
  return useQuery({
    queryKey: ['cost-control', 'top-keywords', limit],
    queryFn: async () => {
      const response = await costControlApi.getTopCachedKeywords(limit);
      return response.data;
    },
  });
}

// Top Costly Conversations
export function useTopCostlyConversations(limit: number = 10) {
  return useQuery({
    queryKey: ['cost-control', 'top-conversations', limit],
    queryFn: async () => {
      const response = await costControlApi.getTopCostlyConversations(limit);
      return response.data;
    },
  });
}

// Spike History
export function useSpikeHistory(days: number = 7) {
  return useQuery({
    queryKey: ['cost-control', 'spike-history', days],
    queryFn: async () => {
      const response = await costControlApi.getSpikeHistory(days);
      return response.data;
    },
  });
}

// Enable Reduced Mode
export function useEnableReducedMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await costControlApi.enableReducedMode();
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reduced mode enabled');
      queryClient.invalidateQueries({ queryKey: ['cost-control', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to enable reduced mode');
    },
  });
}

// Disable Reduced Mode
export function useDisableReducedMode() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await costControlApi.disableReducedMode();
      return response.data;
    },
    onSuccess: () => {
      toast.success('Reduced mode disabled');
      queryClient.invalidateQueries({ queryKey: ['cost-control', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to disable reduced mode');
    },
  });
}

// Clear Cache
export function useClearCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const response = await costControlApi.clearCache();
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cache cleared successfully');
      queryClient.invalidateQueries({ queryKey: ['cost-control', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to clear cache');
    },
  });
}

// Pre-cache Responses
export function usePreCacheResponses() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (rules: Array<{ keyword: string; response: string }>) => {
      const response = await costControlApi.preCacheResponses(rules);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Responses pre-cached successfully');
      queryClient.invalidateQueries({ queryKey: ['cost-control', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to pre-cache responses');
    },
  });
}

// Update Vendor Tier
export function useUpdateVendorTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (tier: string) => {
      const response = await costControlApi.updateVendorTier(tier);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Vendor tier updated successfully');
      queryClient.invalidateQueries({ queryKey: ['cost-control', 'dashboard'] });
    },
    onError: () => {
      toast.error('Failed to update vendor tier');
    },
  });
}

// ─── TWILIO-SPECIFIC HOOKS ─────────────────────────────────────

// Twilio Circuit Status
export function useTwilioCircuitStatus() {
  return useQuery({
    queryKey: ['twilio', 'circuit-status'],
    queryFn: async () => {
      const response = await twilioApi.circuitStatus();
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Twilio Queue Status
export function useTwilioQueueStatus() {
  return useQuery({
    queryKey: ['twilio', 'queue-status'],
    queryFn: async () => {
      const response = await twilioApi.queueStatus();
      return response.data;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });
}

// Twilio Cost Dashboard
export function useTwilioCostDashboard() {
  return useQuery({
    queryKey: ['twilio', 'cost-dashboard'],
    queryFn: async () => {
      const response = await twilioApi.costDashboard();
      return response.data;
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
