// ============================================================
// BOOKING TYPES
// ============================================================

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

export interface Booking {
  id: string;
  vendorId: string;
  userId: string;
  serviceId?: string | null;
  scheduledAt: Date;
  durationMinutes?: number | null;
  status: BookingStatus;
  notes?: string | null;
  customerName: string;
  customerPhone: string;
  reminderSent: boolean;
  price?: number | null;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBookingRequest {
  vendorId: string;
  serviceId?: string;
  scheduledAt: string; // ISO string
  notes?: string;
  customerName: string;
  customerPhone: string;
}

// ============================================================
// WHATSAPP TYPES
// ============================================================

export type WhatsAppMessageType = 'text' | 'image' | 'audio' | 'document' | 'interactive' | 'button';

export interface WhatsAppIncomingMessage {
  object: string;
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export interface WhatsAppValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export interface WhatsAppContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: { body: string };
  image?: { id: string; mime_type: string; sha256: string; caption?: string };
  audio?: { id: string; mime_type: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

// ============================================================
// AI TYPES
// ============================================================

export type IntentType =
  | 'FAQ_GENERAL'
  | 'PRICING_INQUIRY'
  | 'HOURS_INQUIRY'
  | 'LOCATION_INQUIRY'
  | 'BOOKING_REQUEST'
  | 'PRODUCT_INQUIRY'
  | 'SERVICE_INQUIRY'
  | 'INVENTORY_INQUIRY'
  | 'LEAD_QUALIFICATION'
  | 'COMPLAINT'
  | 'GREETING'
  | 'UNKNOWN';

export interface DetectedIntent {
  type: IntentType;
  confidence: number;
  entities: Record<string, string>;
}

export interface VendorKnowledgeBase {
  vendorId: string;
  businessName: string;
  description: string;
  address: string;
  phone: string;
  openingHours: string;
  categories: string[];
  products: Array<{ name: string; price: string; description?: string }>;
  services: Array<{ name: string; price?: string; duration?: string; description?: string }>;
  inventory?: Array<{ name: string; quantity: number; unit?: string; unitCost?: string; sellingPrice?: string; category?: string }>;
  faqs: Array<{ question: string; answer: string }>;
  policies?: string;
  additionalInfo?: string;
}

export interface AIResponse {
  message: string;
  intent: IntentType;
  suggestedActions?: AIAction[];
  requiresHumanFollowup: boolean;
  leadQualification?: LeadQualification;
}

export interface AIAction {
  type: 'BOOK_APPOINTMENT' | 'VIEW_PRODUCTS' | 'GET_DIRECTIONS' | 'CALL_VENDOR' | 'VIEW_PROFILE' | 'CHECK_INVENTORY' | 'REQUEST_QUOTE';
  label: string;
  data?: Record<string, string>;
}

export interface LeadQualification {
  score: number; // 0-100
  tier: 'HOT' | 'WARM' | 'COLD';
  factors: {
    intentClarity: number;
    purchaseReadiness: number;
    budgetIndication: number;
    timelineUrgency: number;
    contactInformation: boolean;
  };
  recommendedAction: string;
  followUpPriority: 'IMMEDIATE' | 'WITHIN_24H' | 'WITHIN_WEEK' | 'LOW';
}

export interface AIConfiguration {
  id: string;
  vendorId: string;
  isEnabled: boolean;
  faqEnabled: boolean;
  pricingInquiryEnabled: boolean;
  bookingAssistanceEnabled: boolean;
  inventoryInquiryEnabled: boolean;
  leadQualificationEnabled: boolean;
  leadQualificationThreshold: number;
  greetingMessage: string;
  outOfHoursMessage: string;
  escalationPhone: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAIConfigurationRequest {
  isEnabled?: boolean;
  faqEnabled?: boolean;
  pricingInquiryEnabled?: boolean;
  bookingAssistanceEnabled?: boolean;
  inventoryInquiryEnabled?: boolean;
  leadQualificationEnabled?: boolean;
  leadQualificationThreshold?: number;
  greetingMessage?: string;
  outOfHoursMessage?: string;
  escalationPhone?: string;
}

// ─── MARKETING TOOLS ────────────────────────────────────────────────

export enum WhatsAppCampaignType {
  BROADCAST = 'BROADCAST',
  STATUS_UPDATE = 'STATUS_UPDATE',
  PROMOTION = 'PROMOTION',
  REMINDER = 'REMINDER',
}

export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export interface WhatsAppCampaign {
  id: string;
  vendorId: string;
  name: string;
  type: WhatsAppCampaignType;
  status: CampaignStatus;
  content: string; // JSON string
  scheduledAt?: Date;
  sentAt?: Date;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWhatsAppCampaignRequest {
  name: string;
  type: WhatsAppCampaignType;
  content: string;
  scheduledAt?: Date;
}

export enum LoyaltyTransactionType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  ADJUSTED = 'ADJUSTED',
  EXPIRED = 'EXPIRED',
}

export interface LoyaltyTier {
  id: string;
  programId: string;
  name: string;
  minPoints: number;
  discountPercent?: number;
  benefits?: string; // JSON string
  createdAt: Date;
  updatedAt: Date;
}

export interface LoyaltyProgram {
  id: string;
  vendorId: string;
  name: string;
  description?: string;
  pointsPerNaira: number;
  redemptionRate: number;
  minPointsToRedeem: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  loyaltyTiers?: LoyaltyTier[];
}

export interface CreateLoyaltyProgramRequest {
  name: string;
  description?: string;
  pointsPerNaira?: number;
  redemptionRate?: number;
  minPointsToRedeem?: number;
  isActive?: boolean;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  programId: string;
  tierId?: string;
  points: number;
  totalSpent: number;
  joinedAt: Date;
  updatedAt: Date;
}

export interface LoyaltyTransaction {
  id: string;
  loyaltyId: string;
  type: LoyaltyTransactionType;
  points: number;
  description?: string;
  metadata?: string; // JSON string
  createdAt: Date;
}

export interface Promotion {
  id: string;
  vendorId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  discount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePromotionRequest {
  title: string;
  description?: string;
  imageUrl?: string;
  discount?: number;
  startDate: Date;
  endDate: Date;
  isActive?: boolean;
}

// ─────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PROCESSING = 'PROCESSING',
}

export interface Payment {
  id: string;
  userId: string;
  vendorId?: string;
  bookingId?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentGateway: string;
  reference?: string;
  metadata?: string; // JSON string
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  amount: number;
  currency?: string;
  paymentGateway?: string;
  bookingId?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentConfiguration {
  id: string;
  vendorId: string;
  paymentGateway: string;
  publicKey: string;
  secretKey: string;
  testMode: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentConfigurationRequest {
  paymentGateway?: string;
  publicKey: string;
  secretKey: string;
  testMode?: boolean;
  isActive?: boolean;
}

// ─────────────────────────────────────────────
// SUBSCRIPTIONS
// ─────────────────────────────────────────────

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

export interface SubscriptionPayment {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentGateway: string;
  reference?: string;
  paidAt?: Date;
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

export interface CreateSubscriptionRequest {
  planType: SubscriptionPlan;
  billingCycle: BillingCycle;
}

export interface UpgradeSubscriptionRequest {
  planType: SubscriptionPlan;
  billingCycle: BillingCycle;
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
// ANALYTICS TYPES
// ============================================================

export interface VendorAnalytics {
  vendorId: string;
  period: 'day' | 'week' | 'month' | 'year';
  profileViews: number;
  whatsappClicks: number;
  leadsGenerated: number;
  bookingRequests: number;
  bookingConversions: number;
  searchAppearances: number;
  averageRating: number;
  newReviews: number;
  topSearchTerms: Array<{ term: string; count: number }>;
}

export interface PlatformAnalytics {
  totalVendors: number;
  activeVendors: number;
  totalUsers: number;
  activeUsers: number;
  totalSearches: number;
  totalWhatsappClicks: number;
  totalBookings: number;
  categoryDistribution: Array<{ categoryId: string; name: string; count: number }>;
  wardDistribution: Array<{ ward: string; count: number }>;
  verificationDistribution: Record<string, number>;
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

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
