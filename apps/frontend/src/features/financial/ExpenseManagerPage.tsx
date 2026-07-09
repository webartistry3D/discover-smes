import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Plus, TrendingDown, Calendar, Filter, Search, Edit, Trash2, ArrowDownRight, Receipt, ChevronLeft } from 'lucide-react';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useFinancialSummary } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import type { Expense, ExpenseCategory } from '../../lib/shared';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { formatCurrencyCompact } from '../../lib/utils';

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'RENT', label: 'Rent', color: 'bg-red-500' },
  { value: 'UTILITIES', label: 'Utilities', color: 'bg-yellow-500' },
  { value: 'SALARIES', label: 'Salaries', color: 'bg-blue-500' },
  { value: 'SUPPLIES', label: 'Supplies', color: 'bg-green-500' },
  { value: 'MARKETING', label: 'Marketing', color: 'bg-purple-500' },
  { value: 'TRANSPORT', label: 'Transport', color: 'bg-orange-500' },
  { value: 'EQUIPMENT', label: 'Equipment', color: 'bg-indigo-500' },
  { value: 'MAINTENANCE', label: 'Maintenance', color: 'bg-pink-500' },
  { value: 'INSURANCE', label: 'Insurance', color: 'bg-cyan-500' },
  { value: 'TAXES', label: 'Taxes', color: 'bg-gray-500' },
  { value: 'OTHER', label: 'Other', color: 'bg-gray-400' },
];

export default function ExpenseManagerPage() {
  const { isDarkMode } = useUIStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    category: 'RENT' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().split('T')[0],
    receiptUrl: '',
    notes: '',
  });

  const { data: expenses, isLoading } = useExpenses({ category: categoryFilter !== 'all' ? categoryFilter : undefined });
  const { data: summary } = useFinancialSummary();
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const filteredExpenses = expenses?.filter((expense: Expense) =>
    expense.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalExpense = filteredExpenses.reduce((sum: number, expense: Expense) => sum + Number(expense.amount), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateExpense.mutateAsync({ id: editingId, data: formData });
        toast.success('Expense updated');
        setEditingId(null);
      } else {
        await createExpense.mutateAsync(formData);
        toast.success('Expense recorded');
        setIsAdding(false);
      }
      setFormData({
        amount: '',
        category: 'RENT',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receiptUrl: '',
        notes: '',
      });
    } catch {
      toast.error('Failed to save expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setFormData({
      amount: String(expense.amount),
      category: expense.category,
      description: expense.description || '',
      date: new Date(expense.date).toISOString().split('T')[0],
      receiptUrl: expense.receiptUrl || '',
      notes: expense.notes || '',
    });
    setEditingId(expense.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) return;
    try {
      await deleteExpense.mutateAsync(id);
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const getCategoryInfo = (category: ExpenseCategory) => {
    return EXPENSE_CATEGORIES.find((c) => c.value === category) || EXPENSE_CATEGORIES[10];
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
              <h1 className="font-display font-bold text-2xl">Expenses Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="p-2">
              <Plus size={20} />
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <TrendingDown size={20} className="text-red-300" />
                  </div>
                  <p className="text-white/60 text-xs">Total Expenses</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">
                  {formatCurrencyCompact(totalExpense)}
                </p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar size={20} className="text-blue-300" />
                  </div>
                  <p className="text-white/60 text-xs">Records</p>
                </div>
                <p className="text-white font-bold text-6xl">{filteredExpenses.length}</p>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <ArrowDownRight size={20} className="text-purple-300" />
                  </div>
                  <p className="text-white/60 text-xs">This Month</p>
                </div>
                <p className="text-white font-bold text-6xl font-mono">
                  {formatCurrencyCompact(summary?.expense || 0)}
                </p>
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
              className={clsx('px-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
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
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            />
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className={clsx('rounded-xl p-8 text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <TrendingDown size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
            <p className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No expense records found</p>
            <Button onClick={() => setIsAdding(true)} variant="primary" className="mt-4">
              Add Your First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex flex-col gap-4">
              {filteredExpenses.map((expense: Expense) => {
                const catInfo = getCategoryInfo(expense.category);

                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx('w-full rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 ${catInfo.color} bg-opacity-10 rounded-lg`}>
                          <ArrowDownRight
                            size={20}
                            className={catInfo.color.replace('bg-', 'text-')}
                          />
                        </div>

                        <div>
                          <p className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                            {expense.description}
                          </p>

                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="red" className="text-xs">
                              {catInfo.label}
                            </Badge>

                            <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                              {new Date(expense.date).toLocaleDateString()}
                            </span>

                            {expense.receiptUrl && (
                              <a
                                href={expense.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Receipt size={12} />
                                Receipt
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:gap-4">
                        <p className="font-bold text-red-600 text-lg font-mono">
                          -{formatCurrencyCompact(Number(expense.amount))}
                        </p>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(expense)}
                            className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                          >
                            <Edit size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-600'} />
                          </button>

                          <button
                            onClick={() => handleDelete(expense.id)}
                            className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-red-900/30' : 'hover:bg-red-50')}
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
            className={clsx('rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto', isDarkMode ? 'bg-gray-800' : 'bg-white')}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className={clsx('text-xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setFormData({
                      amount: '',
                      category: 'RENT',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      receiptUrl: '',
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
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
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
                    placeholder="e.g., Office rent, Utility bill"
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
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Receipt URL</label>
                  <input
                    type="url"
                    value={formData.receiptUrl}
                    onChange={(e) => setFormData({ ...formData, receiptUrl: e.target.value })}
                    className={clsx('w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-200')}
                    placeholder="https://..."
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
