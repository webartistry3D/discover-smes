// ============================================================
// FINANCIAL TYPES
// ============================================================

export type IncomeCategory = 'PRODUCT_SALE' | 'SERVICE_BOOKING' | 'CONSULTATION' | 'COMMISSION' | 'OTHER';
export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'SALARIES' | 'SUPPLIES' | 'MARKETING' | 'TRANSPORT' | 'EQUIPMENT' | 'MAINTENANCE' | 'INSURANCE' | 'TAXES' | 'OTHER';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type FinancialReportType = 'PROFIT_LOSS' | 'CASH_FLOW' | 'SALES_ANALYTICS' | 'TAX_SUMMARY';

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

export interface FinancialReport {
  id: string;
  vendorId: string;
  reportType: FinancialReportType;
  period: string;
  startDate: string;
  endDate: string;
  data: Record<string, any>;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netCashFlow?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  totalSales?: number;
  averageOrderValue?: number;
  totalOrders?: number;
  conversionRate?: number;
  totalTaxLiability?: number;
  totalTaxPaid?: number;
  taxBalance?: number;
  generatedAt: string;
  createdAt: string;
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
  categoryId?: string;
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
