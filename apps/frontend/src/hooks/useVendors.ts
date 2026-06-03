import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { vendorApi, categoryApi, reviewApi, bookingApi, uploadApi, financialApi, crmApi, inventoryApi, taxApi, aiApi, marketingApi, paymentApi, subscriptionApi } from '../lib/api';
import type { SearchFilters, Income, Expense, Invoice, Customer, CustomerNote, CustomerTag, CommunicationLog, CustomerPurchaseHistory, InventoryItem, StockMovement, StockAlert, InventoryValuation, TaxRecord, TaxPayment, TaxReport, TaxSummary } from '../lib/shared';
import { useAuthStore } from '../stores/auth.store';

// ─── QUERY KEYS ─────────────────────────────────────────────

export const queryKeys = {
  vendors: {
    all: ['vendors'] as const,
    search: (filters: SearchFilters) => ['vendors', 'search', filters] as const,
    featured: ['vendors', 'featured'] as const,
    nearby: (lat: number, lng: number) => ['vendors', 'nearby', lat, lng] as const,
    detail: (slug: string) => ['vendors', 'detail', slug] as const,
    analytics: (period: string) => ['vendors', 'analytics', period] as const,
  },
  categories: ['categories'] as const,
  reviews: (vendorId: string) => ['reviews', vendorId] as const,
  bookings: {
    my: ['bookings', 'my'] as const,
    vendor: ['bookings', 'vendor'] as const,
  },
  financial: {
    incomes: ['financial', 'incomes'] as const,
    expenses: ['financial', 'expenses'] as const,
    invoices: ['financial', 'invoices'] as const,
    summary: ['financial', 'summary'] as const,
    reports: {
      profitLoss: (params?: Record<string, unknown>) => ['financial', 'reports', 'profit-loss', params] as const,
      cashFlow: (params?: Record<string, unknown>) => ['financial', 'reports', 'cash-flow', params] as const,
      salesAnalytics: (params?: Record<string, unknown>) => ['financial', 'reports', 'sales-analytics', params] as const,
      taxSummary: (params?: Record<string, unknown>) => ['financial', 'reports', 'tax-summary', params] as const,
      all: (params?: Record<string, unknown>) => ['financial', 'reports', params] as const,
    },
  },
  crm: {
    customers: ['crm', 'customers'] as const,
    customer: (id: string) => ['crm', 'customer', id] as const,
    customerNotes: (customerId: string) => ['crm', 'customer', customerId, 'notes'] as const,
    customerTags: (customerId: string) => ['crm', 'customer', customerId, 'tags'] as const,
    communications: ['crm', 'communications'] as const,
    purchaseHistory: (customerId: string) => ['crm', 'customer', customerId, 'purchase-history'] as const,
    summary: ['crm', 'summary'] as const,
  },
  ai: {
    configuration: ['ai', 'configuration'] as const,
  },
};

// ─── VENDORS ────────────────────────────────────────────────

export function useVendorSearch(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.vendors.search(filters),
    queryFn: () => vendorApi.search(filters as Record<string, unknown>).then((r) => r.data.data),
    enabled,
    staleTime: 30 * 1000, // 30s
    placeholderData: (prev) => prev,
  });
}

export function useFeaturedVendors(limit = 8) {
  return useQuery({
    queryKey: queryKeys.vendors.featured,
    queryFn: () => vendorApi.featured(limit).then((r) => r.data.data),
    staleTime: 2 * 60 * 1000, // 2 min
  });
}

export function useNearbyVendors(lat?: number, lng?: number, radius = 5) {
  return useQuery({
    queryKey: queryKeys.vendors.nearby(lat ?? 0, lng ?? 0),
    queryFn: () => vendorApi.nearby(lat!, lng!, radius).then((r) => r.data.data),
    enabled: !!lat && !!lng,
    staleTime: 60 * 1000,
  });
}

export function useVendorDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.vendors.detail(slug),
    queryFn: () => vendorApi.bySlug(slug).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

export function useTrackWhatsApp() {
  return useMutation({
    mutationFn: (vendorId: string) => vendorApi.trackWhatsApp(vendorId),
  });
}

export function useVendorAnalytics(period: 'week' | 'month' = 'month') {
  return useQuery({
    queryKey: queryKeys.vendors.analytics(period),
    queryFn: () => vendorApi.analytics(period).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useVendorProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: () => vendorApi.me().then((r) => r.data.data),
    enabled: !!user?.vendorId,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── CATEGORIES ──────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => categoryApi.all().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000, // 10 min — categories rarely change
  });
}

// ─── REVIEWS ─────────────────────────────────────────────────

export function useReviews(vendorId: string, page = 1) {
  return useQuery({
    queryKey: [...queryKeys.reviews(vendorId), page],
    queryFn: () => reviewApi.forVendor(vendorId, page).then((r) => r.data.data),
    enabled: !!vendorId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateReview(vendorId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; comment?: string }) => reviewApi.create(vendorId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reviews(vendorId) });
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

// ─── BOOKINGS ────────────────────────────────────────────────

export function useMyBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.my,
    queryFn: () => bookingApi.myBookings().then((r) => r.data.data),
  });
}

export function useVendorBookings() {
  return useQuery({
    queryKey: queryKeys.bookings.vendor,
    queryFn: () => bookingApi.vendorBookings().then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => bookingApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings.my }),
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, status }: { bookingId: string; status: string }) =>
      bookingApi.updateStatus(bookingId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.vendor });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => bookingApi.updateStatus(bookingId, 'CANCELLED'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bookings.my });
    },
  });
}

// ─── PRODUCTS ────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: string; data: unknown }) =>
      vendorApi.createProduct(vendorId, data).then((r) => r.data.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, productId, data }: { vendorId: string; productId: string; data: unknown }) =>
      vendorApi.updateProduct(vendorId, productId, data).then((r) => r.data.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, productId }: { vendorId: string; productId: string }) =>
      vendorApi.deleteProduct(vendorId, productId).then((r) => r.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

// ─── SERVICES ────────────────────────────────────────────────

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, data }: { vendorId: string; data: unknown }) =>
      vendorApi.createService(vendorId, data).then((r) => r.data.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, serviceId, data }: { vendorId: string; serviceId: string; data: unknown }) =>
      vendorApi.updateService(vendorId, serviceId, data).then((r) => r.data.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, serviceId }: { vendorId: string; serviceId: string }) =>
      vendorApi.deleteService(vendorId, serviceId).then((r) => r.data),
    onSuccess: (_, { vendorId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.vendors.detail(vendorId) });
    },
  });
}

// ─── UPLOADS ────────────────────────────────────────────────

export function useUploadProductImages() {
  return useMutation({
    mutationFn: (files: File[]) => uploadApi.productImages(files).then((r) => r.data.data.urls),
  });
}

// ─── FINANCIAL ──────────────────────────────────────────────

export function useIncomes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.financial.incomes, params],
    queryFn: () => financialApi.getIncomes(params).then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useCreateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => financialApi.createIncome(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.incomes }),
  });
}

export function useUpdateIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      financialApi.updateIncome(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.incomes }),
  });
}

export function useDeleteIncome() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.deleteIncome(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.incomes }),
  });
}

export function useExpenses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.financial.expenses, params],
    queryFn: () => financialApi.getExpenses(params).then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => financialApi.createExpense(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.expenses }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      financialApi.updateExpense(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.expenses }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.deleteExpense(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.financial.expenses }),
  });
}

export function useInvoices(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.financial.invoices, params],
    queryFn: () => financialApi.getInvoices(params).then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: [...queryKeys.financial.invoices, id],
    queryFn: () => financialApi.getInvoice(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => financialApi.createInvoice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.financial.invoices });
      qc.invalidateQueries({ queryKey: queryKeys.financial.summary });
    },
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      financialApi.updateInvoice(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.financial.invoices });
      qc.invalidateQueries({ queryKey: queryKeys.financial.summary });
    },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialApi.deleteInvoice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.financial.invoices });
      qc.invalidateQueries({ queryKey: queryKeys.financial.summary });
    },
  });
}

export function useFinancialSummary(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.financial.summary, params],
    queryFn: () => financialApi.getSummary(params).then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

// Financial Reports
export function useProfitLossReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.financial.reports.profitLoss(params),
    queryFn: () => financialApi.getProfitLossReport(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCashFlowReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.financial.reports.cashFlow(params),
    queryFn: () => financialApi.getCashFlowReport(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSalesAnalytics(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.financial.reports.salesAnalytics(params),
    queryFn: () => financialApi.getSalesAnalytics(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTaxSummaryReport(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.financial.reports.taxSummary(params),
    queryFn: () => financialApi.getTaxSummary(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFinancialReports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.financial.reports.all(params),
    queryFn: () => financialApi.getFinancialReports(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ─── CRM (Customer Relationship Management) ─────────────────────

export function useCustomers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.crm.customers, params],
    queryFn: () => crmApi.getCustomers(params).then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.crm.customer(id),
    queryFn: () => crmApi.getCustomer(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => crmApi.createCustomer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customers });
      qc.invalidateQueries({ queryKey: queryKeys.crm.summary });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => crmApi.updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customers });
      qc.invalidateQueries({ queryKey: queryKeys.crm.customer(id) });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crmApi.deleteCustomer(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customers });
      qc.invalidateQueries({ queryKey: queryKeys.crm.summary });
    },
  });
}

export function useCustomerNotes(customerId: string) {
  return useQuery({
    queryKey: queryKeys.crm.customerNotes(customerId),
    queryFn: () => crmApi.getCustomerNotes(customerId).then((r) => r.data.data),
    enabled: !!customerId,
  });
}

export function useCreateCustomerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: unknown }) =>
      crmApi.createCustomerNote(customerId, data),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customerNotes(customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.crm.customer(customerId) });
    },
  });
}

export function useUpdateCustomerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, id, data }: { customerId: string; id: string; data: unknown }) =>
      crmApi.updateCustomerNote(customerId, id, data),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customerNotes(customerId) });
    },
  });
}

export function useDeleteCustomerNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, id }: { customerId: string; id: string }) =>
      crmApi.deleteCustomerNote(customerId, id),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customerNotes(customerId) });
    },
  });
}

export function useCustomerTags(customerId: string) {
  return useQuery({
    queryKey: queryKeys.crm.customerTags(customerId),
    queryFn: () => crmApi.getCustomerTags(customerId).then((r) => r.data.data),
    enabled: !!customerId,
  });
}

export function useCreateCustomerTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: unknown }) =>
      crmApi.createCustomerTag(customerId, data),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customerTags(customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.crm.customer(customerId) });
    },
  });
}

export function useDeleteCustomerTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, id }: { customerId: string; id: string }) =>
      crmApi.deleteCustomerTag(customerId, id),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.customerTags(customerId) });
      qc.invalidateQueries({ queryKey: queryKeys.crm.customer(customerId) });
    },
  });
}

export function useCommunications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: [...queryKeys.crm.communications, params],
    queryFn: () => crmApi.getCommunications(params).then((r) => r.data.data),
    staleTime: 30 * 1000,
  });
}

export function useCreateCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, data }: { customerId: string; data: unknown }) =>
      crmApi.createCommunication(customerId, data),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.communications });
      qc.invalidateQueries({ queryKey: queryKeys.crm.customer(customerId) });
    },
  });
}

export function useUpdateCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, id, data }: { customerId: string; id: string; data: unknown }) =>
      crmApi.updateCommunication(customerId, id, data),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.communications });
    },
  });
}

export function useDeleteCommunication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, id }: { customerId: string; id: string }) =>
      crmApi.deleteCommunication(customerId, id),
    onSuccess: (_, { customerId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.crm.communications });
    },
  });
}

export function useCustomerPurchaseHistory(customerId: string) {
  return useQuery({
    queryKey: queryKeys.crm.purchaseHistory(customerId),
    queryFn: () => crmApi.getCustomerPurchaseHistory(customerId).then((r) => r.data.data),
    enabled: !!customerId,
  });
}

export function useCRMSummary() {
  return useQuery({
    queryKey: queryKeys.crm.summary,
    queryFn: () => crmApi.getSummary().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ─── INVENTORY HOOKS ─────────────────────────────────────────

export const inventoryQueryKeys = {
  inventory: {
    all: ['inventory'] as const,
    items: (params?: Record<string, unknown>) => ['inventory', 'items', params] as const,
    item: (id: string) => ['inventory', 'item', id] as const,
    movements: (params?: Record<string, unknown>) => ['inventory', 'movements', params] as const,
    alerts: (params?: Record<string, unknown>) => ['inventory', 'alerts', params] as const,
    valuation: ['inventory', 'valuation'] as const,
    summary: ['inventory', 'summary'] as const,
  },
};

export function useInventoryItems(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.items(params),
    queryFn: () => inventoryApi.getInventoryItems(params).then((r) => r.data.data),
  });
}

export function useInventoryItem(id: string) {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.item(id),
    queryFn: () => inventoryApi.getInventoryItem(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => inventoryApi.createInventoryItem(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.items() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.summary });
    },
  });
}

export function useUpdateInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      inventoryApi.updateInventoryItem(id, data).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.items() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.item(id) });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.summary });
    },
  });
}

export function useDeleteInventoryItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.deleteInventoryItem(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.items() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.summary });
    },
  });
}

export function useStockMovements(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.movements(params),
    queryFn: () => inventoryApi.getStockMovements(params).then((r) => r.data.data),
  });
}

export function useCreateStockMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, data }: { inventoryId: string; data: unknown }) =>
      inventoryApi.createStockMovement(inventoryId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.items() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.movements() });
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.valuation });
    },
  });
}

export function useStockAlerts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.alerts(params),
    queryFn: () => inventoryApi.getStockAlerts(params).then((r) => r.data.data),
  });
}

export function useResolveStockAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.resolveStockAlert(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryQueryKeys.inventory.alerts() });
    },
  });
}

export function useInventoryValuation() {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.valuation,
    queryFn: () => inventoryApi.getInventoryValuation().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: inventoryQueryKeys.inventory.summary,
    queryFn: () => inventoryApi.getInventorySummary().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ─── TAX HOOKS ───────────────────────────────────────────────

export const taxQueryKeys = {
  tax: {
    all: ['tax'] as const,
    records: (params?: Record<string, unknown>) => ['tax', 'records', params] as const,
    record: (id: string) => ['tax', 'record', id] as const,
    payments: (params?: Record<string, unknown>) => ['tax', 'payments', params] as const,
    calculation: (params?: Record<string, unknown>) => ['tax', 'calculation', params] as const,
    vatTracking: (params?: Record<string, unknown>) => ['tax', 'vat-tracking', params] as const,
    reports: (params?: Record<string, unknown>) => ['tax', 'reports', params] as const,
    summary: ['tax', 'summary'] as const,
  },
};

export function useTaxRecords(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: taxQueryKeys.tax.records(params),
    queryFn: () => taxApi.getTaxRecords(params).then((r) => r.data.data),
  });
}

export function useTaxRecord(id: string) {
  return useQuery({
    queryKey: taxQueryKeys.tax.record(id),
    queryFn: () => taxApi.getTaxRecord(id).then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateTaxRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => taxApi.createTaxRecord(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.records() });
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.summary });
    },
  });
}

export function useUpdateTaxRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      taxApi.updateTaxRecord(id, data).then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.records() });
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.record(id) });
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.summary });
    },
  });
}

export function useDeleteTaxRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxApi.deleteTaxRecord(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.records() });
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.summary });
    },
  });
}

export function useTaxPayments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: taxQueryKeys.tax.payments(params),
    queryFn: () => taxApi.getTaxPayments(params).then((r) => r.data.data),
  });
}

export function useCreateTaxPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taxRecordId, data }: { taxRecordId: string; data: unknown }) =>
      taxApi.createTaxPayment(taxRecordId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.records() });
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.payments() });
    },
  });
}

export function useDeleteTaxPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxApi.deleteTaxPayment(id).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.payments() });
    },
  });
}

export function useTaxCalculation(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: taxQueryKeys.tax.calculation(params),
    queryFn: () => taxApi.getTaxCalculation(params).then((r) => r.data.data),
  });
}

export function useVatTracking(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: taxQueryKeys.tax.vatTracking(params),
    queryFn: () => taxApi.getVatTracking(params).then((r) => r.data.data),
  });
}

export function useComplianceReports(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: taxQueryKeys.tax.reports(params),
    queryFn: () => taxApi.getComplianceReports(params).then((r) => r.data.data),
  });
}

export function useGenerateComplianceReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => taxApi.generateComplianceReport(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taxQueryKeys.tax.reports() });
    },
  });
}

export function useTaxSummary() {
  return useQuery({
    queryKey: taxQueryKeys.tax.summary,
    queryFn: () => taxApi.getTaxSummary().then((r) => r.data.data),
    staleTime: 60 * 1000,
  });
}

// ─── AI ENGINE ────────────────────────────────────────────────

export function useAIConfiguration() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: queryKeys.ai.configuration,
    queryFn: () => aiApi.getConfiguration().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useUpdateAIConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => aiApi.updateConfiguration(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ai.configuration });
    },
  });
}

export function useTestAIConfiguration() {
  return useMutation({
    mutationFn: (data: unknown) => aiApi.testConfiguration(data).then((r) => r.data.data),
  });
}

export function useRebuildKnowledgeBase() {
  return useMutation({
    mutationFn: () => aiApi.rebuildKnowledgeBase().then((r) => r.data.data),
  });
}

export function useFAQs() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['ai', 'faqs'],
    queryFn: () => aiApi.getFAQs().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => aiApi.createFAQ(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'faqs'] });
    },
  });
}

export function useUpdateFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => aiApi.updateFAQ(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'faqs'] });
    },
  });
}

export function useDeleteFAQ() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => aiApi.deleteFAQ(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'faqs'] });
    },
  });
}

// ─── MARKETING TOOLS ────────────────────────────────────────────────

// Promotions
export function usePromotions() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['marketing', 'promotions'],
    queryFn: () => marketingApi.getPromotions().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => marketingApi.createPromotion(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'promotions'] });
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => marketingApi.updatePromotion(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'promotions'] });
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketingApi.deletePromotion(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'promotions'] });
    },
  });
}

// Loyalty Programs
export function useLoyaltyPrograms() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['marketing', 'loyalty-programs'],
    queryFn: () => marketingApi.getLoyaltyPrograms().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreateLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => marketingApi.createLoyaltyProgram(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'loyalty-programs'] });
    },
  });
}

export function useUpdateLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => marketingApi.updateLoyaltyProgram(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'loyalty-programs'] });
    },
  });
}

export function useDeleteLoyaltyProgram() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketingApi.deleteLoyaltyProgram(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'loyalty-programs'] });
    },
  });
}

export function useLoyaltyMembers(programId: string) {
  return useQuery({
    queryKey: ['marketing', 'loyalty-programs', programId, 'members'],
    queryFn: () => marketingApi.getLoyaltyMembers(programId).then((r) => r.data.data),
    enabled: !!programId,
  });
}

// WhatsApp Campaigns
export function useWhatsAppCampaigns() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['marketing', 'whatsapp-campaigns'],
    queryFn: () => marketingApi.getWhatsAppCampaigns().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => marketingApi.createWhatsAppCampaign(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'whatsapp-campaigns'] });
    },
  });
}

export function useUpdateWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => marketingApi.updateWhatsAppCampaign(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'whatsapp-campaigns'] });
    },
  });
}

export function useDeleteWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketingApi.deleteWhatsAppCampaign(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'whatsapp-campaigns'] });
    },
  });
}

export function useSendWhatsAppCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => marketingApi.sendWhatsAppCampaign(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketing', 'whatsapp-campaigns'] });
    },
  });
}

// ─── PAYMENTS ─────────────────────────────────────────────────────

// Payment Configuration
export function usePaymentConfiguration() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['payments', 'configuration'],
    queryFn: () => paymentApi.getPaymentConfiguration().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreatePaymentConfiguration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => paymentApi.createPaymentConfiguration(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'configuration'] });
    },
  });
}

export function useTestPaymentConfiguration() {
  return useMutation({
    mutationFn: () => paymentApi.testPaymentConfiguration().then((r) => r.data),
  });
}

// ─── SUBSCRIPTIONS ─────────────────────────────────────────────────

export function useSubscription() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['subscription', 'detail'],
    queryFn: () => subscriptionApi.getSubscription().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

export function useCreateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => subscriptionApi.createSubscription(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', 'detail'] });
      qc.invalidateQueries({ queryKey: ['subscription', 'limits'] });
    },
  });
}

export function useUpgradeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => subscriptionApi.upgradeSubscription(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', 'detail'] });
      qc.invalidateQueries({ queryKey: ['subscription', 'limits'] });
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => subscriptionApi.cancelSubscription().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscription', 'detail'] });
      qc.invalidateQueries({ queryKey: ['subscription', 'limits'] });
    },
  });
}

export function useSubscriptionLimits() {
  const { isAuthenticated, user } = useAuthStore();
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';
  return useQuery({
    queryKey: ['subscription', 'limits'],
    queryFn: () => subscriptionApi.getSubscriptionLimits().then((r) => r.data.data),
    enabled: isAuthenticated && isVendor,
  });
}

// Payment History
export function usePaymentHistory(params?: Record<string, unknown>) {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ['payments', 'history', params],
    queryFn: () => paymentApi.getPaymentHistory(params).then((r) => r.data),
    enabled: isAuthenticated,
  });
}

// Payment Operations
export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => paymentApi.createPayment(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) => paymentApi.verifyPayment(reference).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments', 'history'] });
    },
  });
}

// (subscriptions hooks inserted earlier in file)
