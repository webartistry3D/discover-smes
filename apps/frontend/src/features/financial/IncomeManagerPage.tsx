import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, TrendingUp, Calendar, Filter, Search, Edit, Trash2, ArrowUpRight, ArrowDownRight, ChevronLeft } from 'lucide-react';
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, useFinancialSummary } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import type { Income, IncomeCategory } from '../../lib/shared';
import toast from 'react-hot-toast';

const INCOME_CATEGORIES: { value: IncomeCategory; label: string; color: string }[] = [
  { value: 'PRODUCT_SALE', label: 'Product Sale', color: 'bg-green-500' },
  { value: 'SERVICE_BOOKING', label: 'Service Booking', color: 'bg-blue-500' },
  { value: 'CONSULTATION', label: 'Consultation', color: 'bg-purple-500' },
  { value: 'COMMISSION', label: 'Commission', color: 'bg-orange-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-500' },
];

export default function IncomeManagerPage() {
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

  const { data: incomes, isLoading } = useIncomes({ category: categoryFilter !== 'all' ? categoryFilter : undefined });
  const { data: summary } = useFinancialSummary();
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const filteredIncomes = incomes?.filter((income: Income) =>
    income.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    income.source?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalIncome = filteredIncomes.reduce((sum: number, income: Income) => sum + Number(income.amount), 0);

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

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">Income Manager</h1>
              <p className="text-white/60 text-sm mt-1">Track and manage your business income</p>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary">
              <Plus size={18} className="mr-2" />
              Add
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Income</p>
                  <p className="text-white font-bold text-xl">
                    ₦{totalIncome.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Calendar size={20} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Records</p>
                  <p className="text-white font-bold text-xl">{filteredIncomes.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <ArrowUpRight size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">This Month</p>
                  <p className="text-white font-bold text-xl">
                    ₦{summary?.income?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </div>
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
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
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
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search income..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
            />
          </div>
        </div>
      </div>

      {/* Income List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center">
            <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No income records found</p>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="mt-4">
              Add Your First Income
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-col gap-4">
              {filteredIncomes.map((income: Income) => {
                const catInfo = getCategoryInfo(income.category);
                return (
                  <motion.div
                    key={income.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-row sm:flex-row sm:items-center sm:justify-between gap-12">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 ${catInfo.color} bg-opacity-10 rounded-lg`}>
                        <ArrowUpRight size={20} className={catInfo.color.replace('bg-', 'text-')} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{income.description || income.source}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="blue" className="text-xs">
                            {catInfo.label}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(income.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-green-600 text-lg">
                        +₦{Number(income.amount).toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(income)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <Edit size={18} className="text-gray-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">{editingId ? 'Edit Income' : 'Add Income'}</h2>
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
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as IncomeCategory })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green"
                  >
                    {INCOME_CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green"
                    placeholder="e.g., Product sale, Service fee"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green"
                    placeholder="e.g., Online, Walk-in"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green resize-none"
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
