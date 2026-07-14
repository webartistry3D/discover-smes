import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, TrendingUp, Calendar, Filter, Search, Edit, Trash2, ArrowUpRight, ArrowDownRight, ChevronLeft } from 'lucide-react';
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, useInvoices } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { KPICard } from '../../components/ui/KPICard';
import { RecordListView, type ViewMode } from '../../components/ui/RecordListView';
import type { Income, IncomeCategory, Invoice } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { formatCurrencyCompact } from '../../lib/utils';

const INCOME_CATEGORIES: { value: IncomeCategory; label: string; color: string }[] = [
  { value: 'PRODUCT_SALE', label: 'Product Sale', color: 'bg-green-500' },
  { value: 'SERVICE_BOOKING', label: 'Service Booking', color: 'bg-blue-500' },
  { value: 'CONSULTATION', label: 'Consultation', color: 'bg-purple-500' },
  { value: 'COMMISSION', label: 'Commission', color: 'bg-orange-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-500' },
];

export default function IncomeManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    category: 'PRODUCT_SALE' as IncomeCategory,
    source: '',
    sourceId: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const { data: incomes, isLoading: isIncomesLoading } = useIncomes({ category: categoryFilter !== 'all' ? categoryFilter : undefined });
  const { data: paidInvoices, isLoading: isInvoicesLoading } = useInvoices({ status: 'PAID' });
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const isLoading = isIncomesLoading || isInvoicesLoading;

  const invoiceIncomeRecords = useMemo<Income[]>(() => {
    return (paidInvoices || []).map((invoice: Invoice) => ({
      id: invoice.id,
      vendorId: invoice.vendorId,
      amount: Number(invoice.total),
      currency: invoice.currency,
      category: 'PRODUCT_SALE' as IncomeCategory,
      source: 'Invoice',
      sourceId: invoice.id,
      description: `Payment from ${invoice.customerName} - ${invoice.invoiceNumber}`,
      date: invoice.paidDate || invoice.updatedAt || invoice.createdAt,
      notes: invoice.notes,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }));
  }, [paidInvoices]);

  const allIncomeRecords = useMemo<Income[]>(() => {
    const records = [...(incomes || []), ...invoiceIncomeRecords];
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return records;
  }, [incomes, invoiceIncomeRecords]);

  const filteredIncomes = allIncomeRecords.filter((income: Income) =>
    income.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    income.source?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    income.amount.toString().includes(searchQuery)
  );

  const totalIncome = filteredIncomes.reduce((sum: number, income: Income) => sum + Number(income.amount), 0);

  const thisMonth = allIncomeRecords
    .filter((income: Income) => {
      const incomeDate = new Date(income.date);
      const now = new Date();
      return incomeDate.getMonth() === now.getMonth() && incomeDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum: number, income: Income) => sum + Number(income.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateIncome.mutateAsync({ id: editingId, data: formData });
        toast.success('Income updated');
        setEditingId(null);
      } else {
        await createIncome.mutateAsync(formData);
        toast.success('Income recorded');
        setIsAdding(false);
      }
      setFormData({
        amount: '',
        category: 'PRODUCT_SALE',
        source: '',
        sourceId: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } catch {
      toast.error('Failed to save income');
    }
  };

  const handleEdit = (income: Income) => {
    setFormData({
      amount: String(income.amount),
      category: income.category,
      source: income.source || '',
      sourceId: income.sourceId || '',
      description: income.description || '',
      date: new Date(income.date).toISOString().split('T')[0],
      notes: income.notes || '',
    });
    setEditingId(income.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) return;
    try {
      await deleteIncome.mutateAsync(id);
      toast.success('Income deleted');
    } catch {
      toast.error('Failed to delete income');
    }
  };

  const getCategoryInfo = (category: IncomeCategory) => {
    return INCOME_CATEGORIES.find((c) => c.value === category) || INCOME_CATEGORIES[4];
  };

  const renderIncomeItem = (income: Income, viewMode: ViewMode) => {
    const catInfo = getCategoryInfo(income.category);
    const isInvoiceIncome = income.source === 'Invoice';
    if (viewMode === 'list') {
      return (
        <>
          <td className="px-4 py-3 whitespace-nowrap">{new Date(income.date).toLocaleDateString()}</td>
          <td className="px-4 py-3 min-w-[240px] max-w-[360px]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={clsx('font-medium line-clamp-2', isDarkMode ? 'text-white' : 'text-gray-900')}>{income.description || income.source}</span>
              {isInvoiceIncome && <Badge variant="green" className="text-xs">Invoice</Badge>}
            </div>
          </td>
          <td className="px-4 py-3 min-w-[140px]"><Badge variant="blue" className="text-xs">{catInfo.label}</Badge></td>
          <td className="px-4 py-3 text-right font-mono font-semibold text-green-600 min-w-[140px] text-base">+{formatCurrencyCompact(Number(income.amount))}</td>
        </>
      );
    }
    return (
      <motion.div
        key={income.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx('w-full rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-12">
          <div className="flex items-center gap-4">
            <div className={`p-3 ${catInfo.color} bg-opacity-10 rounded-lg`}>
              <ArrowUpRight size={20} className={catInfo.color.replace('bg-', 'text-')} />
            </div>
            <div>
              <p className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{income.description || income.source}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge variant="blue" className="text-xs">
                  {catInfo.label}
                </Badge>
                {isInvoiceIncome && (
                  <Badge variant="green" className="text-xs">
                    Invoice
                  </Badge>
                )}
                <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                  {new Date(income.date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <p className="font-bold text-green-600 text-lg font-mono">
              +{formatCurrencyCompact(Number(income.amount))}
            </p>
            {!isInvoiceIncome && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(income)}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                >
                  <Edit size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                </button>
                <button
                  onClick={() => handleDelete(income.id)}
                  className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            )}
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
              <h1 className="font-display font-bold text-2xl">Income Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="!p-2">
              <Plus size={20} />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <KPICard
              icon={<TrendingUp size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Total Income"
              value={formatCurrencyCompact(totalIncome)}
              isLoading={isLoading}
            />
            <KPICard
              icon={<Calendar size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-blue-900/20' : 'bg-blue-500/20')}
              label="Records"
              value={filteredIncomes.length}
              isLoading={isLoading}
              delay={0.1}
            />
            <KPICard
              icon={<ArrowUpRight size={20} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-purple-900/20' : 'bg-purple-500/20')}
              label="This Month"
              value={formatCurrencyCompact(thisMonth)}
              isLoading={isLoading}
              delay={0.2}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={clsx('px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            >
              <option value="all">All Categories</option>
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={18} className={clsx('absolute left-3 top-1/2 -translate-y-1/2', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
            <input
              type="text"
              placeholder="Search income..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            />
          </div>
        </div>
      </div>

      {/* Income List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <RecordListView
          items={filteredIncomes}
          isLoading={isLoading}
          keyExtractor={(income) => income.id}
          renderItem={renderIncomeItem}
          listHeader={(
            <tr>
              <th className="px-4 py-2 font-medium">Date</th>
              <th className="px-4 py-2 font-medium min-w-[240px]">Description</th>
              <th className="px-4 py-2 font-medium min-w-[140px]">Category</th>
              <th className="px-4 py-2 font-medium text-right min-w-[140px]">Amount</th>
            </tr>
          )}
          emptyState={(
            <div className={clsx('rounded-xl p-8 text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
              <TrendingUp size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No income records found</p>
              <Button onClick={() => setIsAdding(true)} variant="primary" className="mt-4">
                Add Your First Income
              </Button>
            </div>
          )}
        />
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={clsx('rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={clsx('text-xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Income' : 'Add Income'}</h2>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({
                      amount: '',
                      category: 'PRODUCT_SALE',
                      source: '',
                      sourceId: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      notes: '',
                    });
                  }}
                  className={clsx('p-2 rounded-lg', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IncomeCategory })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  >
                    {INCOME_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    placeholder="e.g., Product sale, Service fee"
                  />
                </div>

                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    placeholder="e.g., Online, Walk-in"
                  />
                </div>

                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  />
                </div>

                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green resize-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    rows={3}
                    placeholder="Additional notes..."
                  />
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
                    {editingId ? 'Update' : 'Save'}
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
