import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, FileText, Calendar, Filter, Search, Edit, Trash2, Send, Download, CheckCircle, Clock, AlertCircle, XCircle, ChevronLeft } from 'lucide-react';
import { useInvoices, useCreateInvoice, useUpdateInvoice, useDeleteInvoice } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { RecordListView, type ViewMode } from '../../components/ui/RecordListView';
import type { Invoice, InvoiceStatus } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { formatCurrencyCompact } from '../../lib/utils';

const INVOICE_STATUS: { value: InvoiceStatus; label: string; color: string; icon: any }[] = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-gray-500', icon: FileText },
  { value: 'SENT', label: 'Sent', color: 'bg-blue-500', icon: Send },
  { value: 'PAID', label: 'Paid', color: 'bg-green-500', icon: CheckCircle },
  { value: 'OVERDUE', label: 'Overdue', color: 'bg-red-500', icon: AlertCircle },
  { value: 'CANCELLED', label: 'Cancelled', color: 'bg-gray-400', icon: XCircle },
];

export default function InvoiceManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    taxRate: 0,
    discountAmount: 0,
    dueDate: '',
    notes: '',
  });

  const { data: invoices, isLoading } = useInvoices({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const deleteInvoice = useDeleteInvoice();

  const filteredInvoices = invoices?.filter((invoice: Invoice) =>
    invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalInvoiced = filteredInvoices.reduce((sum: number, invoice: Invoice) => sum + Number(invoice.total), 0);
  const totalPaid = filteredInvoices
    .filter((i: Invoice) => i.status === 'PAID')
    .reduce((sum: number, invoice: Invoice) => sum + Number(invoice.total), 0);

  const handleAddLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { description: '', quantity: 1, unitPrice: 0 }],
    });
  };

  const handleRemoveLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleLineItemChange = (index: number, field: string, value: string | number) => {
    const newLineItems = [...formData.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    setFormData({ ...formData, lineItems: newLineItems });
  };

  const calculateSubtotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * (formData.taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() - formData.discountAmount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subtotal = calculateSubtotal();
      const taxAmount = calculateTax();
      const total = calculateTotal();

      const data = {
        ...formData,
        subtotal,
        taxAmount,
        total,
      };

      if (editingId) {
        await updateInvoice.mutateAsync({ id: editingId, data });
        toast.success('Invoice updated');
        setEditingId(null);
      } else {
        await createInvoice.mutateAsync(data);
        toast.success('Invoice created');
        setIsAdding(false);
      }
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        customerAddress: '',
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
        taxRate: 0,
        discountAmount: 0,
        dueDate: '',
        notes: '',
      });
    } catch {
      toast.error('Failed to save invoice');
    }
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    try {
      await updateInvoice.mutateAsync({ id, data: { status } });
      toast.success('Invoice status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Invoice deleted');
    } catch {
      toast.error('Failed to delete invoice');
    }
  };

  const getStatusInfo = (status: InvoiceStatus) => {
    return INVOICE_STATUS.find((s) => s.value === status) || INVOICE_STATUS[0];
  };

  const startEdit = (invoice: Invoice) => {
    setFormData({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail || '',
      customerPhone: invoice.customerPhone || '',
      customerAddress: invoice.customerAddress || '',
      lineItems: invoice.lineItems.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      taxRate: invoice.taxRate,
      discountAmount: Number(invoice.discountAmount),
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      notes: invoice.notes || '',
    });
    setEditingId(invoice.id);
    setIsAdding(true);
  };

  const renderInvoiceItem = (invoice: Invoice, viewMode: ViewMode) => {
    const statusInfo = getStatusInfo(invoice.status);
    const StatusIcon = statusInfo.icon;

    if (viewMode === 'list') {
      return (
        <>
          <td className="px-4 py-3 whitespace-nowrap">{new Date(invoice.createdAt).toLocaleDateString()}</td>
          <td className="px-4 py-3 min-w-[120px] font-mono text-xs">{invoice.invoiceNumber}</td>
          <td className="px-4 py-3 min-w-[200px] max-w-[300px]">
            <span className={clsx('font-medium line-clamp-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {invoice.customerName}
            </span>
          </td>
          <td className="px-4 py-3 min-w-[100px]">
            <Badge variant={invoice.status === 'PAID' ? 'green' : invoice.status === 'OVERDUE' ? 'red' : 'blue'} className="text-xs">
              {statusInfo.label}
            </Badge>
          </td>
          <td className="px-4 py-3 text-right font-mono font-semibold min-w-[120px]">{formatCurrencyCompact(Number(invoice.total))}</td>
          <td className="px-4 py-3 text-right min-w-[120px]">
            <div className="flex items-center justify-end gap-2">
              {invoice.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange(invoice.id, 'SENT')}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-50')}
                  title="Mark as Sent"
                >
                  <Send size={18} className="text-blue-600" />
                </button>
              )}
              {invoice.status === 'SENT' && (
                <button
                  onClick={() => handleStatusChange(invoice.id, 'PAID')}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50')}
                  title="Mark as Paid"
                >
                  <CheckCircle size={18} className="text-green-600" />
                </button>
              )}
              <button
                onClick={() => startEdit(invoice)}
                className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
              >
                <Edit size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
              <button
                onClick={() => handleDelete(invoice.id)}
                className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
              >
                <Trash2 size={18} className="text-red-600" />
              </button>
            </div>
          </td>
        </>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('w-full rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${statusInfo.color} bg-opacity-10 rounded-lg`}>
              <StatusIcon size={20} className={statusInfo.color.replace('bg-', 'text-')} />
            </div>
            <div>
              <p className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{invoice.customerName}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant={invoice.status === 'PAID' ? 'green' : invoice.status === 'OVERDUE' ? 'red' : 'blue'} className="text-xs">
                  {statusInfo.label}
                </Badge>
                <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{invoice.invoiceNumber}</span>
                <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:gap-4">
            <div className="text-right sm:text-left">
              <p className={clsx('font-bold text-lg font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {formatCurrencyCompact(Number(invoice.total))}
              </p>
              <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{invoice.lineItems.length} items</p>
            </div>
            <div className="flex gap-2">
              {invoice.status === 'DRAFT' && (
                <button
                  onClick={() => handleStatusChange(invoice.id, 'SENT')}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-blue-900/30' : 'hover:bg-blue-50')}
                  title="Mark as Sent"
                >
                  <Send size={18} className="text-blue-600" />
                </button>
              )}
              {invoice.status === 'SENT' && (
                <button
                  onClick={() => handleStatusChange(invoice.id, 'PAID')}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-green-900/30' : 'hover:bg-green-50')}
                  title="Mark as Paid"
                >
                  <CheckCircle size={18} className="text-green-600" />
                </button>
              )}
              <button
                onClick={() => startEdit(invoice)}
                className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
              >
                <Edit size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
              </button>
              <button
                onClick={() => handleDelete(invoice.id)}
                className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
              >
                <Trash2 size={18} className="text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Invoice Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="!p-2">
              <Plus size={20} />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <FileText size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Invoiced</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {formatCurrencyCompact(totalInvoiced)}
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <CheckCircle size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Paid</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {formatCurrencyCompact(totalPaid)}
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Clock size={20} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Pending</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {formatCurrencyCompact(totalInvoiced - totalPaid)}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={clsx('px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            >
              <option value="all">All Status</option>
              {INVOICE_STATUS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={18} className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <RecordListView
          items={filteredInvoices}
          isLoading={isLoading}
          keyExtractor={(invoice) => invoice.id}
          renderItem={renderInvoiceItem}
          listHeader={(
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium min-w-[120px]">Invoice #</th>
              <th className="px-4 py-2 font-medium min-w-[200px]">Customer</th>
              <th className="px-4 py-2 font-medium min-w-[100px]">Status</th>
              <th className="px-4 py-2 font-medium text-right min-w-[120px]">Amount</th>
              <th className="px-4 py-2 font-medium text-right min-w-[120px]">Actions</th>
            </tr>
          )}
          emptyState={(
            <div className={clsx('rounded-xl p-8 text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              <FileText size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No invoices found</p>
              <Button onClick={() => setIsAdding(true)} variant="primary" className="mt-4">
                Create Your First Invoice
              </Button>
            </div>
          )}
        />
      </div>

      {/* Create/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('rounded-2xl w-full max-w-2xl max-h-[67.5vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={clsx('text-xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Invoice' : 'Create Invoice'}</h2>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({
                      customerName: '',
                      customerEmail: '',
                      customerPhone: '',
                      customerAddress: '',
                      lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
                      taxRate: 0,
                      discountAmount: 0,
                      dueDate: '',
                      notes: '',
                    });
                  }}
                  className={clsx('p-2 rounded-lg', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Email</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Phone</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                      placeholder="+234..."
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Address</label>
                    <input
                      type="text"
                      value={formData.customerAddress}
                      onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                      placeholder="Full address"
                    />
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className={clsx('block text-sm font-medium', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Line Items</label>
                    <button type="button" onClick={handleAddLineItem} className="text-sm text-festac-green hover:underline">
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {formData.lineItems.map((item, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                            className={clsx('w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                            placeholder="Description"
                          />
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleLineItemChange(index, 'quantity', Number(e.target.value))}
                            className={clsx('w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-28">
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleLineItemChange(index, 'unitPrice', Number(e.target.value))}
                            className={clsx('w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                            placeholder="Price"
                          />
                        </div>
                        {formData.lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            className={clsx('p-2 rounded-lg', isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
                          >
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div className={clsx('rounded-lg p-4 space-y-2', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                  <div className="flex justify-between text-sm">
                    <span className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Subtotal</span>
                    <span className="font-medium font-mono">{formatCurrencyCompact(calculateSubtotal())}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Tax Rate</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
                      className={clsx('w-20 px-2 py-1 rounded text-sm text-right', isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Tax Amount</span>
                    <span className="font-medium font-mono">{formatCurrencyCompact(calculateTax())}</span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Discount</span>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                      className={clsx('w-28 px-2 py-1 rounded text-sm text-right', isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className={isDarkMode ? 'text-white' : ''}>Total</span>
                    <span className="text-festac-green font-mono">{formatCurrencyCompact(calculateTotal())}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Due Date</label>
                    <input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    />
                  </div>
                  <div>
                    <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                    <input
                      type="text"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                      placeholder="Payment terms..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAdding(false);
                      setEditingId(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" className="flex-1">
                    {editingId ? 'Update' : 'Create Invoice'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
