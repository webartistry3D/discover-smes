import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, Search, Filter, FileText, DollarSign, AlertTriangle, TrendingUp, ArrowUp, ArrowDown, X, Edit, Trash2, MoreVertical, Clock, BarChart3, ChevronLeft, Receipt, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTaxRecords, useTaxRecord, useCreateTaxRecord, useUpdateTaxRecord, useDeleteTaxRecord, useTaxPayments, useCreateTaxPayment, useDeleteTaxPayment, useTaxCalculation, useVatTracking, useComplianceReports, useGenerateComplianceReport, useTaxSummary, useInvoices } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import type { TaxRecord, TaxPayment, TaxType, TaxStatus, Invoice } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { formatCurrencyCompact } from '../../lib/utils';

const TAX_TYPES: { value: TaxType; label: string; color: string }[] = [
  { value: 'VAT', label: 'VAT', color: 'bg-blue-500' },
  { value: 'INCOME_TAX', label: 'Income Tax', color: 'bg-green-500' },
  { value: 'SALES_TAX', label: 'Sales Tax', color: 'bg-purple-500' },
  { value: 'SERVICE_TAX', label: 'Service Tax', color: 'bg-orange-500' },
  { value: 'WITHHOLDING_TAX', label: 'Withholding Tax', color: 'bg-red-500' },
  { value: 'CUSTOMS_DUTY', label: 'Customs Duty', color: 'bg-yellow-500' },
  { value: 'EXCISE_DUTY', label: 'Excise Duty', color: 'bg-pink-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-500' },
];

const TAX_STATUS: { value: TaxStatus; label: string; color: string }[] = [
  { value: 'PENDING', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'PAID', label: 'Paid', color: 'bg-green-500' },
  { value: 'OVERDUE', label: 'Overdue', color: 'bg-red-500' },
  { value: 'PARTIALLY_PAID', label: 'Partially Paid', color: 'bg-orange-500' },
  { value: 'WAIVED', label: 'Waived', color: 'bg-blue-500' },
  { value: 'DISPUTED', label: 'Disputed', color: 'bg-purple-500' },
];

export default function TaxManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'payments' | 'vat' | 'reports'>('records');

  const { data: taxRecords, isLoading } = useTaxRecords(
    typeFilter !== 'all' || statusFilter !== 'all' ? { type: typeFilter !== 'all' ? typeFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined } : undefined
  );
  const { data: summary } = useTaxSummary();
  const { data: selectedRecord } = useTaxRecord(selectedRecordId || '');
  const { data: taxPayments } = useTaxPayments(selectedRecordId ? { taxRecordId: selectedRecordId } : undefined);
  const { data: vatTracking, isLoading: isVatTrackingLoading } = useVatTracking();
  const { data: paidInvoices, isLoading: isPaidInvoicesLoading } = useInvoices({ status: 'PAID' });
  const { data: complianceReports } = useComplianceReports();
  const { data: taxCalculation } = useTaxCalculation();
  const createTaxRecord = useCreateTaxRecord();
  const updateTaxRecord = useUpdateTaxRecord();
  const deleteTaxRecord = useDeleteTaxRecord();
  const createTaxPayment = useCreateTaxPayment();
  const deleteTaxPayment = useDeleteTaxPayment();
  const generateComplianceReport = useGenerateComplianceReport();

  const [formData, setFormData] = useState({
    type: 'VAT' as TaxType,
    period: '',
    description: '',
    baseAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    vatInput: 0,
    vatOutput: 0,
    dueDate: '',
    reference: '',
    notes: '',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: 0,
    paymentDate: '',
    paymentMethod: '',
    reference: '',
    notes: '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTaxRecord.mutateAsync(formData);
      toast.success('Tax record created');
      setIsAdding(false);
      setFormData({
        type: 'VAT',
        period: '',
        description: '',
        baseAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        vatInput: 0,
        vatOutput: 0,
        dueDate: '',
        reference: '',
        notes: '',
      });
    } catch {
      toast.error('Failed to create tax record');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      await updateTaxRecord.mutateAsync({ id: editingId, data: formData });
      toast.success('Tax record updated');
      setEditingId(null);
      setFormData({
        type: 'VAT',
        period: '',
        description: '',
        baseAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        vatInput: 0,
        vatOutput: 0,
        dueDate: '',
        reference: '',
        notes: '',
      });
    } catch {
      toast.error('Failed to update tax record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tax record?')) return;
    try {
      await deleteTaxRecord.mutateAsync(id);
      toast.success('Tax record deleted');
    } catch {
      toast.error('Failed to delete tax record');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    try {
      await createTaxPayment.mutateAsync({ taxRecordId: selectedRecordId, data: paymentFormData });
      toast.success('Payment recorded');
      setPaymentFormData({
        amount: 0,
        paymentDate: '',
        paymentMethod: '',
        reference: '',
        notes: '',
      });
    } catch {
      toast.error('Failed to record payment');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
      await deleteTaxPayment.mutateAsync(id);
      toast.success('Payment deleted');
    } catch {
      toast.error('Failed to delete payment');
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedRecordId) return;
    try {
      await generateComplianceReport.mutateAsync({ taxRecordId: selectedRecordId, reportType: 'COMPLIANCE' });
      toast.success('Compliance report generated');
    } catch {
      toast.error('Failed to generate report');
    }
  };

  const filteredRecords = taxRecords?.filter((record) => {
    if (searchQuery && !record.description?.toLowerCase().includes(searchQuery.toLowerCase()) && !record.reference?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  }) || [];

  // Compute VAT from paid invoices
  const invoiceVat = useMemo(() => {
    return (paidInvoices || []).reduce((sum: number, invoice: Invoice) => sum + Number(invoice.taxAmount || 0), 0);
  }, [paidInvoices]);

  // KPI augmentation: invoice VAT adds to total tax liability and is considered "paid" since invoices are PAID
  const kpiTotalLiability = (summary?.totalTaxLiability || 0) + invoiceVat;
  const kpiTotalPaid = (summary?.totalPaid || 0) + invoiceVat;
  const kpiTotalPending = summary?.totalPending || 0;
  const kpiTotalOverdue = summary?.totalOverdue || 0;

  // VAT Tracking computations
  const vatCollected = (vatTracking?.totalVatCollected ?? vatTracking?.vatCollected ?? 0) + invoiceVat;
  const vatPaid = vatTracking?.totalVatPaid ?? vatTracking?.vatPaid ?? 0;
  const netVat = vatCollected - vatPaid;
  const isVatLoading = isVatTrackingLoading || isPaidInvoicesLoading;

  const getStatusIcon = (status: TaxStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'OVERDUE':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'PARTIALLY_PAID':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'DISPUTED':
        return <XCircle className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Tax Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="p-2">
              <Plus size={20} />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <DollarSign size={20} className="text-blue-300" />
                  </div>
                  <p className="text-white/60 text-xs">Total Tax Liability</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{formatCurrencyCompact(kpiTotalLiability)}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle size={20} className="text-green-300" />
                  </div>
                  <p className="text-white/60 text-xs">Total Paid</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{formatCurrencyCompact(kpiTotalPaid)}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Clock size={20} className="text-yellow-300" />
                  </div>
                  <p className="text-white/60 text-xs">Pending</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{formatCurrencyCompact(kpiTotalPending)}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <AlertTriangle size={20} className="text-red-300" />
                  </div>
                  <p className="text-white/60 text-xs">Overdue</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">{formatCurrencyCompact(kpiTotalOverdue)}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className={clsx('overflow-x-auto mb-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
          <div className="flex gap-4 min-w-max">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'records' ? 'text-blue-600 border-b-2 border-blue-600' : isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Tax Records
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'payments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('vat')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'vat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              VAT Tracking
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 font-medium whitespace-nowrap ${activeTab === 'reports' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Compliance Reports
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tax records..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={clsx('px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
          >
            <option value="all">All Types</option>
            {TAX_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={clsx('px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
          >
            <option value="all">All Status</option>
            {TAX_STATUS.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tax Records Tab */}
        {activeTab === 'records' && (
          <div className={clsx('rounded-lg shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className={clsx('w-16 h-16 mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
                <h3 className={clsx('text-lg font-medium mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>No tax records found</h3>
                <p className={clsx('mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Get started by adding your first tax record</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex flex-col gap-4">
                  {filteredRecords.map((record) => (
                    <motion.div
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={clsx('w-full p-6 cursor-pointer', isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50')}
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(record.status)}
                            <h3 className={clsx('text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{record.description || record.type}</h3>
                            <Badge className={TAX_TYPES.find((t) => t.value === record.type)?.color || 'bg-gray-500'}>
                              {TAX_TYPES.find((t) => t.value === record.type)?.label}
                            </Badge>
                            <Badge className={TAX_STATUS.find((s) => s.value === record.status)?.color || 'bg-gray-500'}>
                              {TAX_STATUS.find((s) => s.value === record.status)?.label}
                            </Badge>
                          </div>
                          <div className={clsx('grid grid-cols-2 md:grid-cols-4 gap-4 text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                            <div>
                              <span className="font-medium">Period:</span> {record.period}
                            </div>
                            <div>
                              <span className="font-medium">Base Amount:</span> {formatCurrencyCompact(Number(record.baseAmount))}
                            </div>
                            <div>
                              <span className="font-medium">Tax Amount:</span> {formatCurrencyCompact(Number(record.taxAmount))}
                            </div>
                            <div>
                              <span className="font-medium">Due Date:</span> {record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(record.id);
                              setFormData({
                                type: record.type,
                                period: record.period,
                                description: record.description || '',
                                baseAmount: Number(record.baseAmount),
                                taxRate: Number(record.taxRate),
                                taxAmount: Number(record.taxAmount),
                                vatInput: record.vatInput ? Number(record.vatInput) : 0,
                                vatOutput: record.vatOutput ? Number(record.vatOutput) : 0,
                                dueDate: record.dueDate ? record.dueDate.split('T')[0] : '',
                                reference: record.reference || '',
                                notes: record.notes || '',
                              });
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(record.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && !selectedRecordId && (
          <div className={clsx('rounded-lg shadow-sm border p-12 text-center', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
            <Receipt className={clsx('w-16 h-16 mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
            <h3 className={clsx('text-lg font-medium mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>Select a Tax Record</h3>
            <p className={clsx('mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Go to the Tax Records tab and click on a record to view and manage payments</p>
            <Button onClick={() => setActiveTab('records')} variant="secondary">Go to Tax Records</Button>
          </div>
        )}
        {activeTab === 'payments' && selectedRecordId && (
          <div className="space-y-6">
            <div className={clsx('rounded-lg shadow-sm border p-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <h3 className={clsx('text-lg font-medium mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Record Payment</h3>
              <form onSubmit={handleCreatePayment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Amount</label>
                    <input
                      type="number"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                      className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                      required
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Payment Date</label>
                    <input
                      type="date"
                      value={paymentFormData.paymentDate}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                      className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                      required
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Payment Method</label>
                    <input
                      type="text"
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                      className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reference</label>
                    <input
                      type="text"
                      value={paymentFormData.reference}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                      className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    />
                  </div>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    rows={2}
                  />
                </div>
                <Button type="submit">Record Payment</Button>
              </form>
            </div>

            <div className={clsx('rounded-lg shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className={clsx('p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
                <h3 className={clsx('text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>Payment History</h3>
              </div>
              {taxPayments && taxPayments.length > 0 ? (
                <div className={clsx('divide-y', isDarkMode ? 'divide-gray-700' : 'divide-gray-200')}>
                  {taxPayments.map((payment) => (
                    <div key={payment.id} className="p-6 flex items-center justify-between">
                      <div>
                        <p className={clsx('font-medium font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{formatCurrencyCompact(Number(payment.amount))}</p>
                        <p className={clsx('text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>{new Date(payment.paymentDate).toLocaleDateString()}</p>
                        {payment.reference && <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Ref: {payment.reference}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePayment(payment.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Receipt className={clsx('w-16 h-16 mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
                  <h3 className={clsx('text-lg font-medium mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>No payments recorded</h3>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VAT Tracking Tab */}
        {activeTab === 'vat' && (
          <div className="space-y-6">
            <div className={clsx('rounded-lg shadow-sm border p-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <h3 className={clsx('text-lg font-medium mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>VAT Tracking</h3>
              {!isVatLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50')}>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>VAT Collected (Output)</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">{formatCurrencyCompact(vatCollected)}</p>
                  </div>
                  <div className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-50')}>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>VAT Paid (Input)</p>
                    <p className="text-2xl font-bold text-green-600 mt-1 font-mono">{formatCurrencyCompact(vatPaid)}</p>
                  </div>
                  <div className={clsx('p-4 rounded-lg', isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50')}>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>Net VAT Payable</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1 font-mono">{formatCurrencyCompact(netVat)}</p>
                  </div>
                </div>
              ) : (
                <Skeleton className="h-32 w-full" />
              )}
            </div>

            {/* Invoice VAT Breakdown */}
            {paidInvoices && paidInvoices.length > 0 && (
              <div className={clsx('rounded-lg shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
                <div className={clsx('p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
                  <h3 className={clsx('text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>VAT from Paid Invoices</h3>
                  <p className={clsx('text-sm mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{paidInvoices.length} paid invoice{paidInvoices.length !== 1 ? 's' : ''} contributing {formatCurrencyCompact(invoiceVat)} in VAT</p>
                </div>
                <div className={clsx('divide-y', isDarkMode ? 'divide-gray-700' : 'divide-gray-200')}>
                  {paidInvoices.slice(0, 10).map((invoice: Invoice) => (
                    <div key={invoice.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className={clsx('font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{invoice.customerName}</p>
                        <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>#{invoice.invoiceNumber} &middot; {invoice.paidDate ? new Date(invoice.paidDate).toLocaleDateString() : 'Paid'}</p>
                      </div>
                      <p className="font-mono font-medium text-blue-600">{formatCurrencyCompact(Number(invoice.taxAmount || 0))}</p>
                    </div>
                  ))}
                  {paidInvoices.length > 10 && (
                    <div className={clsx('p-4 text-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                      +{paidInvoices.length - 10} more invoices
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compliance Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              {!selectedRecordId && (
                <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Select a tax record from the Records tab to generate a new report</p>
              )}
              <Button onClick={handleGenerateReport} disabled={!selectedRecordId}>
                Generate Compliance Report
              </Button>
            </div>
            <div className={clsx('rounded-lg shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <div className={clsx('p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
                <h3 className={clsx('text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>Compliance Reports</h3>
              </div>
              {complianceReports && complianceReports.length > 0 ? (
                <div className={clsx('divide-y', isDarkMode ? 'divide-gray-700' : 'divide-gray-200')}>
                  {complianceReports.map((report) => (
                    <div key={report.id} className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={clsx('font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{report.reportType}</h4>
                        <Badge className={report.isCompliant ? 'bg-green-500' : 'bg-red-500'}>
                          {report.isCompliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Period:</span> {report.period}
                        </div>
                        <div>
                          <span className="font-medium">Total Tax:</span> {formatCurrencyCompact(Number(report.totalTax))}
                        </div>
                        <div>
                          <span className="font-medium">Total Paid:</span> {formatCurrencyCompact(Number(report.totalPaid))}
                        </div>
                        <div>
                          <span className="font-medium">Balance:</span> {formatCurrencyCompact(Number(report.balance))}
                        </div>
                      </div>
                      {report.complianceNotes && (
                        <p className="text-sm text-gray-500 mt-2">{report.complianceNotes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <BarChart3 className={clsx('w-16 h-16 mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
                  <h3 className={clsx('text-lg font-medium mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>No compliance reports generated</h3>
                  <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Select a tax record and generate a compliance report</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className={clsx('p-6 border-b flex items-center justify-between', isDarkMode ? 'border-gray-700' : 'border-gray-200')}>
              <h2 className={clsx('text-xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Tax Record' : 'Add Tax Record'}</h2>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className={clsx('hover:text-gray-600', isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400')}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Tax Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as TaxType })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    required
                  >
                    {TAX_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Period</label>
                  <input
                    type="text"
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                    placeholder="e.g., 2024-Q1"
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Base Amount</label>
                  <input
                    type="number"
                    value={formData.baseAmount}
                    onChange={(e) => setFormData({ ...formData, baseAmount: Number(e.target.value) })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    required
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Tax Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxRate}
                    onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    required
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Tax Amount</label>
                  <input
                    type="number"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    required
                  />
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                  />
                </div>
                {formData.type === 'VAT' && (
                  <>
                    <div>
                      <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>VAT Input</label>
                      <input
                        type="number"
                        value={formData.vatInput}
                        onChange={(e) => setFormData({ ...formData, vatInput: Number(e.target.value) })}
                        className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                      />
                    </div>
                    <div>
                      <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>VAT Output</label>
                      <input
                        type="number"
                        value={formData.vatOutput}
                        onChange={(e) => setFormData({ ...formData, vatOutput: Number(e.target.value) })}
                        className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                      />
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Reference</label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'border-gray-300')}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingId ? 'Update' : 'Create'}</Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

