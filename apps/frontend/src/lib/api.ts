import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/auth.store';

const BASE_URL = (import.meta as any).env['VITE_API_URL'] ?? '/api/v1';

let authToken: string | null = null;
let refreshTokenValue: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

function processQueue(error: Error | null, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

export function setAuthTokens(access: string, refresh: string) {
  authToken = access;
  refreshTokenValue = refresh;
  localStorage.setItem('df_access', access);
  localStorage.setItem('df_refresh', refresh);
}

export function clearAuthTokens() {
  authToken = null;
  refreshTokenValue = null;
  localStorage.removeItem('df_access');
  localStorage.removeItem('df_refresh');
}

export function loadStoredTokens() {
  refreshTokenValue = localStorage.getItem('df_refresh');
  authToken = localStorage.getItem('df_access') || null;
}

// Load tokens on module initialization
loadStoredTokens();

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor — handle 401, refresh tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && refreshTokenValue) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: refreshTokenValue,
        });
        const { accessToken, refreshToken } = response.data.data;
        setAuthTokens(accessToken, refreshToken);
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearAuthTokens();
        const { logout } = useAuthStore.getState();
        logout();
        window.location.href = '/';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-401 errors
    const message = error.response?.data?.error?.message ?? 'Something went wrong';
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again.');
    } else if (error.response?.status !== 401 && error.response?.status !== 404) {
      toast.error(message);
    }

    return Promise.reject(error);
  },
);

export default api;

// ─── Typed API methods ───────────────────────────────────────

export const authApi = {
  sendOtp: (phone: string) => api.post('/auth/otp/send', { phone }),
  verifyOtp: (phone: string, code: string) => api.post('/auth/otp/verify', { phone, code }),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const vendorApi = {
  search: (params: Record<string, unknown>) => api.get('/vendors', { params }),
  featured: (limit = 8) => api.get('/vendors/featured', { params: { limit } }),
  nearby: (lat: number, lng: number, radius = 5) => api.get('/vendors/nearby', { params: { lat, lng, radius } }),
  bySlug: (slug: string) => api.get(`/vendors/${slug}`),
  create: (data: unknown) => api.post('/vendors', data),
  update: (id: string, data: unknown) => api.patch(`/vendors/${id}`, data),
  trackWhatsApp: (id: string) => api.post(`/vendors/${id}/whatsapp-click`),
  analytics: (period: 'week' | 'month' = 'month') => api.get('/vendors/dashboard/analytics', { params: { period } }),
  me: () => api.get('/vendors/me'),
  // Products
  createProduct: (vendorId: string, data: unknown) => api.post(`/vendors/${vendorId}/products`, data),
  updateProduct: (vendorId: string, productId: string, data: unknown) => api.patch(`/vendors/${vendorId}/products/${productId}`, data),
  deleteProduct: (vendorId: string, productId: string) => api.delete(`/vendors/${vendorId}/products/${productId}`),
  // Services
  createService: (vendorId: string, data: unknown) => api.post(`/vendors/${vendorId}/services`, data),
  updateService: (vendorId: string, serviceId: string, data: unknown) => api.patch(`/vendors/${vendorId}/services/${serviceId}`, data),
  deleteService: (vendorId: string, serviceId: string) => api.delete(`/vendors/${vendorId}/services/${serviceId}`),
};

export const categoryApi = {
  all: () => api.get('/categories'),
  create: (data: { name: string; description?: string }) => api.post('/categories', data),
};

export const reviewApi = {
  forVendor: (vendorId: string, page = 1) => api.get(`/reviews/vendor/${vendorId}`, { params: { page } }),
  create: (vendorId: string, data: { rating: number; comment?: string }) =>
    api.post(`/reviews/vendor/${vendorId}`, data),
};

export const bookingApi = {
  create: (data: unknown) => api.post('/bookings', data),
  myBookings: () => api.get('/bookings/my'),
  vendorBookings: () => api.get('/bookings/vendor'),
  updateStatus: (id: string, status: string) => api.patch(`/bookings/${id}/status`, { status }),
};

export const adminApi = {
  vendors: (params?: Record<string, unknown>) => api.get('/admin/vendors', { params }),
  updateVendorStatus: (id: string, status: string) => api.patch(`/admin/vendors/${id}/status`, { status }),
  analytics: () => api.get('/admin/analytics'),
  verificationRequests: () => api.get('/admin/verification-requests'),
  reviewVerification: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.patch(`/admin/verification-requests/${id}`, data),
};

export const uploadApi = {
  productImages: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api.post('/uploads/product-images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const financialApi = {
  // Income
  getIncomes: (params?: Record<string, unknown>) => api.get('/financial/incomes', { params }),
  createIncome: (data: unknown) => api.post('/financial/incomes', data),
  updateIncome: (id: string, data: unknown) => api.patch(`/financial/incomes/${id}`, data),
  deleteIncome: (id: string) => api.delete(`/financial/incomes/${id}`),

  // Expense
  getExpenses: (params?: Record<string, unknown>) => api.get('/financial/expenses', { params }),
  createExpense: (data: unknown) => api.post('/financial/expenses', data),
  updateExpense: (id: string, data: unknown) => api.patch(`/financial/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/financial/expenses/${id}`),

  // Invoice
  getInvoices: (params?: Record<string, unknown>) => api.get('/financial/invoices', { params }),
  getInvoice: (id: string) => api.get(`/financial/invoices/${id}`),
  createInvoice: (data: unknown) => api.post('/financial/invoices', data),
  updateInvoice: (id: string, data: unknown) => api.patch(`/financial/invoices/${id}`, data),
  deleteInvoice: (id: string) => api.delete(`/financial/invoices/${id}`),

  // Summary
  getSummary: (params?: Record<string, unknown>) => api.get('/financial/summary', { params }),

  // Financial Reports
  getProfitLossReport: (params?: Record<string, unknown>) => api.get('/financial/reports/profit-loss', { params }),
  getCashFlowReport: (params?: Record<string, unknown>) => api.get('/financial/reports/cash-flow', { params }),
  getSalesAnalytics: (params?: Record<string, unknown>) => api.get('/financial/reports/sales-analytics', { params }),
  getTaxSummary: (params?: Record<string, unknown>) => api.get('/financial/reports/tax-summary', { params }),
  getFinancialReports: (params?: Record<string, unknown>) => api.get('/financial/reports', { params }),
};

export const crmApi = {
  // Customers
  getCustomers: (params?: Record<string, unknown>) => api.get('/crm/customers', { params }),
  getCustomer: (id: string) => api.get(`/crm/customers/${id}`),
  createCustomer: (data: unknown) => api.post('/crm/customers', data),
  updateCustomer: (id: string, data: unknown) => api.patch(`/crm/customers/${id}`, data),
  deleteCustomer: (id: string) => api.delete(`/crm/customers/${id}`),

  // Customer Notes
  getCustomerNotes: (customerId: string) => api.get(`/crm/customers/${customerId}/notes`),
  createCustomerNote: (customerId: string, data: unknown) => api.post(`/crm/customers/${customerId}/notes`, data),
  updateCustomerNote: (customerId: string, id: string, data: unknown) =>
    api.patch(`/crm/customers/${customerId}/notes/${id}`, data),
  deleteCustomerNote: (customerId: string, id: string) => api.delete(`/crm/customers/${customerId}/notes/${id}`),

  // Customer Tags
  getCustomerTags: (customerId: string) => api.get(`/crm/customers/${customerId}/tags`),
  createCustomerTag: (customerId: string, data: unknown) => api.post(`/crm/customers/${customerId}/tags`, data),
  deleteCustomerTag: (customerId: string, id: string) => api.delete(`/crm/customers/${customerId}/tags/${id}`),

  // Communication Log
  getCommunications: (params?: Record<string, unknown>) => api.get('/crm/communications', { params }),
  createCommunication: (customerId: string, data: unknown) => api.post(`/crm/customers/${customerId}/communications`, data),
  updateCommunication: (customerId: string, id: string, data: unknown) =>
    api.patch(`/crm/customers/${customerId}/communications/${id}`, data),
  deleteCommunication: (customerId: string, id: string) => api.delete(`/crm/customers/${customerId}/communications/${id}`),

  // Customer Purchase History
  getCustomerPurchaseHistory: (customerId: string) => api.get(`/crm/customers/${customerId}/purchase-history`),

  // CRM Summary
  getSummary: () => api.get('/crm/summary'),
};

export const inventoryApi = {
  // Inventory Items
  getInventoryItems: (params?: Record<string, unknown>) => api.get('/inventory/items', { params }),
  getInventoryItem: (id: string) => api.get(`/inventory/items/${id}`),
  createInventoryItem: (data: unknown) => api.post('/inventory/items', data),
  updateInventoryItem: (id: string, data: unknown) => api.patch(`/inventory/items/${id}`, data),
  deleteInventoryItem: (id: string) => api.delete(`/inventory/items/${id}`),

  // Stock Movements
  getStockMovements: (params?: Record<string, unknown>) => api.get('/inventory/movements', { params }),
  createStockMovement: (inventoryId: string, data: unknown) => api.post(`/inventory/items/${inventoryId}/movements`, data),

  // Stock Alerts
  getStockAlerts: (params?: Record<string, unknown>) => api.get('/inventory/alerts', { params }),
  resolveStockAlert: (id: string) => api.patch(`/inventory/alerts/${id}/resolve`),

  // Inventory Valuation
  getInventoryValuation: () => api.get('/inventory/valuation'),

  // Inventory Summary
  getInventorySummary: () => api.get('/inventory/summary'),
};

export const taxApi = {
  // Tax Records
  getTaxRecords: (params?: Record<string, unknown>) => api.get('/tax/records', { params }),
  getTaxRecord: (id: string) => api.get(`/tax/records/${id}`),
  createTaxRecord: (data: unknown) => api.post('/tax/records', data),
  updateTaxRecord: (id: string, data: unknown) => api.patch(`/tax/records/${id}`, data),
  deleteTaxRecord: (id: string) => api.delete(`/tax/records/${id}`),

  // Tax Payments
  getTaxPayments: (params?: Record<string, unknown>) => api.get('/tax/payments', { params }),
  createTaxPayment: (taxRecordId: string, data: unknown) => api.post(`/tax/records/${taxRecordId}/payments`, data),
  deleteTaxPayment: (id: string) => api.delete(`/tax/payments/${id}`),

  // Tax Calculation
  getTaxCalculation: (params?: Record<string, unknown>) => api.get('/tax/calculation', { params }),

  // VAT Tracking
  getVatTracking: (params?: Record<string, unknown>) => api.get('/tax/vat/tracking', { params }),

  // Compliance Reports
  getComplianceReports: (params?: Record<string, unknown>) => api.get('/tax/reports', { params }),
  generateComplianceReport: (data: unknown) => api.post('/tax/reports/generate', data),

  // Tax Summary
  getTaxSummary: () => api.get('/tax/summary'),
};

export const aiApi = {
  // AI Configuration
  getConfiguration: () => api.get('/ai/configuration'),
  updateConfiguration: (data: unknown) => api.patch('/ai/configuration', data),

  // AI Testing
  testConfiguration: (data: unknown) => api.post('/ai/test', data),

  // Knowledge Base
  rebuildKnowledgeBase: () => api.post('/ai/knowledge-base/rebuild'),

  // FAQs
  getFAQs: () => api.get('/ai/faqs'),
  createFAQ: (data: unknown) => api.post('/ai/faqs', data),
  updateFAQ: (id: string, data: unknown) => api.patch(`/ai/faqs/${id}`, data),
  deleteFAQ: (id: string) => api.delete(`/ai/faqs/${id}`),
};

export const marketingApi = {
  // Promotions
  getPromotions: () => api.get('/marketing/promotions'),
  createPromotion: (data: unknown) => api.post('/marketing/promotions', data),
  updatePromotion: (id: string, data: unknown) => api.patch(`/marketing/promotions/${id}`, data),
  deletePromotion: (id: string) => api.delete(`/marketing/promotions/${id}`),

  // Loyalty Programs
  getLoyaltyPrograms: () => api.get('/marketing/loyalty-programs'),
  createLoyaltyProgram: (data: unknown) => api.post('/marketing/loyalty-programs', data),
  updateLoyaltyProgram: (id: string, data: unknown) => api.patch(`/marketing/loyalty-programs/${id}`, data),
  deleteLoyaltyProgram: (id: string) => api.delete(`/marketing/loyalty-programs/${id}`),
  getLoyaltyMembers: (programId: string) => api.get(`/marketing/loyalty-programs/${programId}/members`),

  // WhatsApp Campaigns
  getWhatsAppCampaigns: () => api.get('/marketing/whatsapp-campaigns'),
  createWhatsAppCampaign: (data: unknown) => api.post('/marketing/whatsapp-campaigns', data),
  updateWhatsAppCampaign: (id: string, data: unknown) => api.patch(`/marketing/whatsapp-campaigns/${id}`, data),
  deleteWhatsAppCampaign: (id: string) => api.delete(`/marketing/whatsapp-campaigns/${id}`),
  sendWhatsAppCampaign: (id: string) => api.post(`/marketing/whatsapp-campaigns/${id}/send`),
};

export const paymentApi = {
  // Payment Configuration
  getPaymentConfiguration: () => api.get('/payments/configuration'),
  createPaymentConfiguration: (data: unknown) => api.post('/payments/configuration', data),
  testPaymentConfiguration: () => api.post('/payments/configuration/test'),

  // Payments
  getPaymentHistory: (params?: Record<string, unknown>) => api.get('/payments/history', { params }),
  createPayment: (data: unknown) => api.post('/payments/initialize', data),
  verifyPayment: (reference: string) => api.post(`/payments/verify/${reference}`),
};

export const subscriptionApi = {
  // Subscription
  getSubscription: () => api.get('/subscriptions'),
  createSubscription: (data: unknown) => api.post('/subscriptions', data),
  upgradeSubscription: (data: unknown) => api.patch('/subscriptions/upgrade', data),
  cancelSubscription: () => api.post('/subscriptions/cancel'),
  getSubscriptionLimits: () => api.get('/subscriptions/limits'),
};

export const chatbotApi = {
  // Chatbot Settings
  getSettings: () => api.get('/chatbot/settings'),
  updateSettings: (data: unknown) => api.put('/chatbot/settings', data),

  // Chatbot Rules
  getRules: () => api.get('/chatbot/rules'),
  createRule: (data: unknown) => api.post('/chatbot/rules', data),
  updateRule: (id: string, data: unknown) => api.put(`/chatbot/rules/${id}`, data),
  deleteRule: (id: string) => api.delete(`/chatbot/rules/${id}`),

  // Chatbot Sessions
  getSessions: () => api.get('/chatbot/sessions'),
  takeoverSession: (data: unknown) => api.post('/chatbot/session/takeover', data),
  resumeSession: (data: unknown) => api.post('/chatbot/session/resume', data),

  // Conversation Analytics
  getAnalytics: (period: string = 'all') => api.get('/chatbot/analytics', { params: { period } }),

  // Message Processing
  processMessage: (data: unknown) => api.post('/chatbot/process-message', data),
};

// Cost Control API
export const costControlApi = {
  getDashboard: () => api.get('/cost-control/dashboard'),
  getCostSavings: () => api.get('/cost-control/savings'),
  getDailyUsageTrend: (days: number = 30) => api.get(`/cost-control/usage-trend?days=${days}`),
  getTopCachedKeywords: (limit: number = 10) => api.get(`/cost-control/top-keywords?limit=${limit}`),
  getTopCostlyConversations: (limit: number = 10) => api.get(`/cost-control/top-conversations?limit=${limit}`),
  getSpikeHistory: (days: number = 7) => api.get(`/cost-control/spike-history?days=${days}`),
  enableReducedMode: () => api.post('/cost-control/reduced-mode/enable'),
  disableReducedMode: () => api.post('/cost-control/reduced-mode/disable'),
  clearCache: () => api.post('/cost-control/cache/clear'),
  preCacheResponses: (rules: Array<{ keyword: string; response: string }>) => 
    api.post('/cost-control/cache/preload', { rules }),
  updateVendorTier: (tier: string) => api.post('/cost-control/tier/update', { tier }),
};

// Verification API
export const verificationApi = {
  getVendorVerificationStatus: () => api.get('/vendors/me'),
  getVerificationRequests: () => api.get('/vendors/verification-requests'),
  submitVerificationRequest: (data: FormData) => 
    api.post('/uploads/verification', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Twilio API
export const twilioApi = {
  send: (data: { to: string; body: string; vendorId?: string }) =>
    api.post('/twilio/send', data),
  
  queue: (data: { to: string; body: string; vendorId?: string; priority?: 'low' | 'normal' | 'high' }) =>
    api.post('/twilio/queue', data),
  
  queueStatus: () => api.get('/twilio/queue/status'),
  
  costDashboard: () => api.get('/twilio/cost/dashboard'),
  
  circuitStatus: () => api.get('/twilio/circuit/status'),
};

