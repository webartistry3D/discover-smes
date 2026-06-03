import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verificationApi } from '../lib/api';
import type { VerificationLevel, VerificationRequest, VerificationRequestStatus } from '../lib/shared';
import toast from 'react-hot-toast';

// Get vendor verification status
export function useVendorVerificationStatus() {
  return useQuery({
    queryKey: ['vendor', 'verification-status'],
    queryFn: async () => {
      const response = await verificationApi.getVendorVerificationStatus();
      return response.data.data;
    },
  });
}

// Get verification requests history
export function useVerificationRequests() {
  return useQuery({
    queryKey: ['vendor', 'verification-requests'],
    queryFn: async () => {
      const response = await verificationApi.getVerificationRequests();
      return response.data.data as VerificationRequest[];
    },
  });
}

// Submit verification request with file upload
export function useSubmitVerificationRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: FormData) => {
      const response = await verificationApi.submitVerificationRequest(data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Verification request submitted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification-status'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'verification-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit verification request');
    },
  });
}

// Helper to determine verification level status
export function getVerificationLevelStatus(
  currentLevel: VerificationLevel,
  targetLevel: VerificationLevel,
  requestStatus?: VerificationRequestStatus
): 'completed' | 'pending' | 'locked' | 'in_review' {
  const levelOrder: VerificationLevel[] = ['NONE', 'PHONE_VERIFIED', 'BUSINESS_VERIFIED', 'GOVERNMENT_ENDORSED'];
  const currentIndex = levelOrder.indexOf(currentLevel);
  const targetIndex = levelOrder.indexOf(targetLevel);

  if (targetIndex < currentIndex) {
    return 'completed';
  }

  if (targetIndex === currentIndex) {
    return 'completed';
  }

  // Phone verification is automatic, so if current is NONE or PHONE_VERIFIED,
  // BUSINESS_VERIFIED should be available
  if (targetLevel === 'BUSINESS_VERIFIED') {
    if (requestStatus === 'PENDING' || requestStatus === 'UNDER_REVIEW') {
      return 'in_review';
    }
    if (requestStatus === 'REJECTED') {
      return 'pending';
    }
    return 'pending';
  }

  // GOVERNMENT_ENDORSED is only available if current is BUSINESS_VERIFIED or higher
  if (targetLevel === 'GOVERNMENT_ENDORSED') {
    if (currentLevel === 'BUSINESS_VERIFIED' || currentLevel === 'GOVERNMENT_ENDORSED') {
      if (requestStatus === 'PENDING' || requestStatus === 'UNDER_REVIEW') {
        return 'in_review';
      }
      if (requestStatus === 'REJECTED') {
        return 'pending';
      }
      return 'pending';
    }
    return 'locked';
  }

  // Otherwise, only allow the immediate next level
  if (targetIndex === currentIndex + 1) {
    if (requestStatus === 'PENDING' || requestStatus === 'UNDER_REVIEW') {
      return 'in_review';
    }
    if (requestStatus === 'REJECTED') {
      return 'pending';
    }
    return 'pending';
  }

  return 'locked';
}
