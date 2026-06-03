// Local shared utilities for frontend
// Copied from @discover-festac/shared to avoid build issues

// Financial Types
export type IncomeCategory = 'PRODUCT_SALE' | 'SERVICE_BOOKING' | 'CONSULTATION' | 'COMMISSION' | 'OTHER';
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'SALARIES' | 'SUPPLIES' | 'MARKETING' | 'TRANSPORT' | 'EQUIPMENT' | 'MAINTENANCE' | 'INSURANCE' | 'TAXES' | 'OTHER';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Income {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  category: IncomeCategory;
  source?: string;
  sourceId?: string;
  description?: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description?: string;
  date: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lineItems: InvoiceLineItem[];
}

export interface FinancialSummary {
  income: number;
  expense: number;
  profit: number;
  invoiceSummary: Record<string, { total: number; count: number }>;
}

// ============================================================
// CRM TYPES
// ============================================================

export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'VIP' | 'LEAD';
export type CommunicationType = 'EMAIL' | 'PHONE_CALL' | 'SMS' | 'WHATSAPP' | 'IN_PERSON' | 'OTHER';
export type CommunicationDirection = 'INBOUND' | 'OUTBOUND';
export type CommunicationStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'PENDING';

export interface Customer {
  id: string;
  vendorId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  company?: string;
  notes?: string;
  status: CustomerStatus;
  totalPurchases: number;
  totalSpent: number;
  lastContactDate?: string;
  lastPurchaseDate?: string;
  createdAt: string;
  updatedAt: string;
  tags?: CustomerTag[];
  customerNotes?: CustomerNote[];
  communications?: CommunicationLog[];
  invoices?: Invoice[];
  _count?: {
    invoices: number;
    communications: number;
  };
}

export interface CustomerNote {
  id: string;
  customerId: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerTag {
  id: string;
  customerId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface CommunicationLog {
  id: string;
  customerId: string;
  type: CommunicationType;
  direction: CommunicationDirection;
  subject?: string;
  content: string;
  status: CommunicationStatus;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CustomerPurchaseHistory {
  customerId: string;
  totalPurchases: number;
  totalSpent: number;
  averageOrderValue: number;
  firstPurchaseDate?: string;
  lastPurchaseDate?: string;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    total: number;
    status: string;
    date: string;
  }>;
}

// ============================================================
// INVENTORY TYPES
// ============================================================

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER' | 'RETURN' | 'DAMAGE' | 'LOSS';
export type AlertType = 'LOW_STOCK' | 'OUT_OF_STOCK' | 'OVERSTOCK' | 'EXPIRED' | 'REORDER_NEEDED';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InventoryItem {
  id: string;
  vendorId: string;
  sku?: string;
  name: string;
  description?: string;
  category?: string;
  unit?: string;
  quantity: number;
  minStock: number;
  maxStock?: number;
  unitCost: number;
  sellingPrice: number;
  location?: string;
  supplier?: string;
  reorderPoint: number;
  reorderQty?: number;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  stockMovements?: StockMovement[];
  stockAlerts?: StockAlert[];
  _count?: {
    stockMovements: number;
    stockAlerts: number;
  };
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  vendorId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface StockAlert {
  id: string;
  inventoryId: string;
  vendorId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  quantity: number;
  threshold: number;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface InventoryValuation {
  totalItems: number;
  totalValue: number;
  totalCost: number;
  lowStockItems: number;
  outOfStockItems: number;
  categories: Record<string, { count: number; value: number; cost: number }>;
}

// ============================================================
// TAX TYPES
// ============================================================

export type TaxType = 'VAT' | 'INCOME_TAX' | 'SALES_TAX' | 'SERVICE_TAX' | 'WITHHOLDING_TAX' | 'CUSTOMS_DUTY' | 'EXCISE_DUTY' | 'OTHER';
export type TaxStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'WAIVED' | 'DISPUTED';

export interface TaxRecord {
  id: string;
  vendorId: string;
  type: TaxType;
  period: string;
  description?: string;
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  vatInput?: number;
  vatOutput?: number;
  netVat?: number;
  status: TaxStatus;
  dueDate?: string;
  paidDate?: string;
  reference?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  payments?: TaxPayment[];
  reports?: TaxReport[];
}

export interface TaxPayment {
  id: string;
  taxRecordId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface TaxReport {
  id: string;
  taxRecordId: string;
  reportType: string;
  period: string;
  generatedAt: string;
  totalTax: number;
  totalPaid: number;
  balance: number;
  isCompliant: boolean;
  complianceNotes?: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
}

export interface TaxSummary {
  totalTaxLiability: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  vatCollected: number;
  vatPaid: number;
  netVat: number;
  pendingFilings: number;
  overdueFilings: number;
  currentPeriod: string;
}

// ============================================================
// VENDOR & DOMAIN TYPES
// ============================================================
export type VerificationLevel = 'NONE' | 'PHONE_VERIFIED' | 'BUSINESS_VERIFIED' | 'GOVERNMENT_ENDORSED';

export interface VendorSummary {
  id: string;
  businessName: string;
  slug: string;
  description: string;
  address: string;
  ward?: string;
  lga: string;
  coverImage?: string;
  logo?: string;
  categoryId: string;
  category?: { id: string; name: string; icon?: string };
  businessType: 'PRODUCT' | 'SERVICE' | 'HYBRID';
  priceRange: 'BUDGET' | 'MID_RANGE' | 'PREMIUM';
  deliveryAvailable?: boolean;
  averageRating: number;
  totalReviews: number;
  isFeatured: boolean;
  verificationLevel: VerificationLevel;
  distance?: number;
  coordinates?: { lat: number; lng: number } | null;
  whatsappPhone?: string;
  isOpenNow?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  slug: string;
  color?: string;
  vendorCount?: number;
}

export interface SearchFilters {
  query?: string;
  categoryId?: string;
  lga?: string;
  ward?: string;
  minRating?: number;
  verificationLevel?: VerificationLevel;
  isOpenNow?: boolean;
  deliveryAvailable?: boolean;
  businessType?: 'PRODUCT' | 'SERVICE' | 'HYBRID';
  priceRange?: 'BUDGET' | 'MID_RANGE' | 'PREMIUM';
  lat?: number;
  lng?: number;
  radiusKm?: number;
  isFeatured?: boolean;
  sortBy?: 'relevance' | 'rating' | 'distance' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface User {
  id: string;
  phone: string;
  role: 'USER' | 'VENDOR' | 'ADMIN' | 'SUPER_ADMIN' | 'MODERATOR';
  vendorId?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

// ============================================================
// CONSTANTS
// ============================================================
export const FESTAC_WARDS = [
  "Amuwo-Odofin Ward A",
  "Amuwo-Odofin Ward B",
  "Festac Town",
  "Mile 2",
  "Satellite Town",
  "Apple Junction",
  "Agboju",
  "Alakija",
  "Kirikiri",
  "Ojo"
];

export const FESTAC_CENTER = { lat: 6.4646, lng: 3.2823 };
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// ============================================================
// UTILITIES
// ============================================================
export function calculateDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}

export type OpeningHours = Record<string, { open: string; close: string; isClosed: boolean }>;

export function isVendorOpenNow(openingHours: OpeningHours | null | undefined): boolean {
  if (!openingHours) return false;

  const now = new Date();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
  const currentDay = dayNames[now.getDay()];
  
  if (!currentDay) return false;
  
  const dayHours = openingHours[currentDay];
  if (!dayHours || dayHours.isClosed) return false;

  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= dayHours.open && currentTime <= dayHours.close;
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    return `+234${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('234')) {
    return `+${cleaned}`;
  }
  return `+${cleaned}`;
}

export function generateWhatsAppUrl(phone: string, message?: string): string {
  const formatted = formatPhoneNumber(phone).replace('+', '');
  const encodedMessage = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${formatted}${encodedMessage ? `?text=${encodedMessage}` : ''}`;
}

export function generateWhatsAppGreeting(businessName: string): string {
  return `Hello! I found ${businessName} on Discover Festac and I'd like to know more about your products/services.`;
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(0[789][01]\d{8}|234[789][01]\d{8})$/.test(cleaned);
}

// ============================================================
// SUBSCRIPTION TYPES
// ============================================================

export enum SubscriptionPlan {
  FREEMIUM = 'FREEMIUM',
  GROWTH = 'GROWTH',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIAL = 'TRIAL',
  PENDING = 'PENDING',
}

export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export interface Subscription {
  id: string;
  vendorId: string;
  planType: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: Date;
  endDate?: Date;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionLimits {
  maxIncome: number;
  maxInvoices: number;
  maxExpenses: number;
  maxCustomers: number;
  maxInventoryItems: number;
  aiEngineAccess: boolean;
}

export const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  [SubscriptionPlan.FREEMIUM]: {
    maxIncome: 6,
    maxInvoices: 6,
    maxExpenses: 6,
    maxCustomers: 6,
    maxInventoryItems: 6,
    aiEngineAccess: false,
  },
  [SubscriptionPlan.GROWTH]: {
    maxIncome: Infinity,
    maxInvoices: Infinity,
    maxExpenses: Infinity,
    maxCustomers: Infinity,
    maxInventoryItems: Infinity,
    aiEngineAccess: true,
  },
};

export const PRICING = {
  [SubscriptionPlan.GROWTH]: {
    monthly: 5000,
    yearly: 48000, // 20% discount: 5000 * 12 * 0.8 = 48000
  },
};

// ============================================================
// CHATBOT TYPES
// ============================================================

export enum ChatbotRuleType {
  FAQ = 'FAQ',
  PRICING = 'PRICING',
  DELIVERY = 'DELIVERY',
  HOURS = 'HOURS',
  PAYMENT = 'PAYMENT',
  LOCATION = 'LOCATION',
  CUSTOM = 'CUSTOM',
}

export enum ChatbotSessionStatus {
  ACTIVE = 'ACTIVE',
  HUMAN_TAKEOVER = 'HUMAN_TAKEOVER',
  CLOSED = 'CLOSED',
}

export interface ChatbotSettings {
  id: string;
  vendorId: string;
  chatbotEnabled: boolean;
  greetingMessage: string | null;
  fallbackMessage: string | null;
  humanHandoffMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotRule {
  id: string;
  vendorId: string;
  ruleType: ChatbotRuleType;
  keyword: string;
  questionPattern: string | null;
  response: string;
  priority: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatbotSession {
  id: string;
  vendorId: string;
  customerPhone: string;
  botActive: boolean;
  humanTakeover: boolean;
  sessionStatus: ChatbotSessionStatus;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChatbotRuleRequest {
  ruleType: ChatbotRuleType;
  keyword: string;
  questionPattern?: string;
  response: string;
  priority?: number;
}

export interface UpdateChatbotRuleRequest {
  ruleType?: ChatbotRuleType;
  keyword?: string;
  questionPattern?: string;
  response?: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateChatbotSettingsRequest {
  chatbotEnabled?: boolean;
  greetingMessage?: string;
  fallbackMessage?: string;
  humanHandoffMessage?: string;
}

export interface TakeoverSessionRequest {
  sessionId: string;
}

export interface ResumeSessionRequest {
  sessionId: string;
}

export interface ProcessMessageRequest {
  vendorId: string;
  customerPhone: string;
  message: string;
}

export interface ProcessMessageResponse {
  response: string;
  shouldHandoff: boolean;
  matchedRule?: ChatbotRule;
}

// ============================================================
// WHATSAPP COST CONTROL SYSTEM (WCCS) TYPES
// ============================================================

export enum MessageType {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
  SERVICE = 'SERVICE',
  SESSION = 'SESSION',
}

export interface UsageLog {
  id: string;
  vendorId: string;
  sessionId?: string;
  messageType: MessageType;
  conversationId?: string;
  costEstimate: number;
  cached: boolean;
  timestamp: Date;
}

export interface VendorQuota {
  id: string;
  vendorId: string;
  monthlyLimit: number;
  currentUsage: number;
  resetDate: Date;
  reducedMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResponseCache {
  id: string;
  vendorId: string;
  keyword: string;
  response: string;
  hitCount: number;
  lastHitAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

export interface CostControlDecision {
  allowed: boolean;
  reason: string;
  cached: boolean;
  shouldDelay?: boolean;
  delayMs?: number;
  fallbackResponse?: string;
}

export interface CostDashboardData {
  quota: {
    quota: VendorQuota;
    usagePercentage: number;
    status: 'OK' | 'WARNING' | 'CRITICAL';
    remaining: number;
  };
  usage: {
    totalMessages: number;
    totalCost: number;
    logs: UsageLog[];
  };
  usageByType: Array<{
    messageType: MessageType;
    count: number;
    cost: number;
  }>;
  cache: {
    stats: {
      total: number;
      activeEntries: number;
      totalHits: number;
      avgHitsPerEntry: number;
    };
    hitRate: {
      total: number;
      cached: number;
      hitRate: number;
    };
  };
  conversations: {
    today: number;
    week: number;
    activeNow: number;
  };
  spike: {
    spikeDetected: boolean;
    baseline: number;
    current: number;
    multiplier: number;
    recommendation: string;
  };
}

export interface CostSavings {
  totalMessages: number;
  cachedMessages: number;
  apiCalls: number;
  totalCost: number;
  actualCost: number;
  savings: number;
  savingsPercentage: number;
}

// ============================================================
// VERIFICATION TYPES
// ============================================================

export type VerificationRequestStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export interface VerificationRequest {
  id: string;
  vendorId: string;
  requestedLevel: 'BUSINESS_VERIFIED' | 'GOVERNMENT_ENDORSED';
  status: VerificationRequestStatus;
  documents: string[];
  notes?: string | null;
  reviewedById?: string | null;
  reviewedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// TWILIO WHATSAPP TYPES
// ============================================================

export enum MessageProvider {
  FACEBOOK = 'FACEBOOK',
  TWILIO = 'TWILIO',
}

export enum MessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export interface TwilioMessageStatus {
  provider: MessageProvider;
  twilioSid?: string;
  twilioStatus?: string;
  priority: MessagePriority;
  queuedAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
}
