import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../lib/api';

interface VendorMeResponse {
  data: {
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
    businessName: string;
  };
}

export function usePendingVendor(enabled: boolean) {
  return useQuery({
    queryKey: ['pending-vendor'],
    queryFn: async () => {
      const response = (await vendorApi.me()) as VendorMeResponse;
      return response.data;
    },
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
