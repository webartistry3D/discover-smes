import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Lock,
  AlertCircle,
  Check,
  X,
  ChevronLeft,
  TrendingUp,
  Calendar,
  Zap
} from 'lucide-react';
import { useChatbotRules, useCreateChatbotRule, useUpdateChatbotRule, useDeleteChatbotRule } from '../../hooks/useChatbot';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { ChatbotRuleType } from '../../lib/shared';
import toast from 'react-hot-toast';

export default function FAQManager() {
  const { isDarkMode } = useUIStore();
  const { user } = useAuthStore();
  const { data: rules, isLoading, error } = useChatbotRules();
  const createRule = useCreateChatbotRule();
  const updateRule = useUpdateChatbotRule();
  const deleteRule = useDeleteChatbotRule();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ChatbotRuleType | 'ALL'>('ALL');
  
  const [formData, setFormData] = useState({
    ruleType: ChatbotRuleType.FAQ,
    keyword: '',
    questionPattern: '',
    response: '',
    priority: 0,
  });

  // Check if user is a vendor or super admin
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';

  // Show access denied if not a vendor
  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <Lock size={48} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be a vendor to access FAQ Manager.</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full inline-flex mb-4">
            <AlertCircle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Rules</h1>
          <p className="text-gray-600 mb-6">Failed to load chatbot rules. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const filteredRules = rules?.filter((rule) => {
    const matchesSearch = rule.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.response.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || rule.ruleType === filterType;
    return matchesSearch && matchesType;
  }) || [];

  const handleCreate = () => {
    if (!formData.keyword || !formData.response) {
      toast.error('Keyword and response are required');
      return;
    }

    createRule.mutate(formData, {
      onSuccess: () => {
        toast.success('Rule created successfully');
        setIsAdding(false);
        setFormData({
          ruleType: ChatbotRuleType.FAQ,
          keyword: '',
          questionPattern: '',
          response: '',
          priority: 0,
        });
      },
      onError: () => {
        toast.error('Failed to create rule');
      },
    });
  };

  const handleUpdate = (id: string) => {
    if (!formData.keyword || !formData.response) {
      toast.error('Keyword and response are required');
      return;
    }

    updateRule.mutate(
      { id, data: formData },
      {
        onSuccess: () => {
          toast.success('Rule updated successfully');
          setEditingId(null);
          setFormData({
            ruleType: ChatbotRuleType.FAQ,
            keyword: '',
            questionPattern: '',
            response: '',
            priority: 0,
          });
        },
        onError: () => {
          toast.error('Failed to update rule');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      deleteRule.mutate(id, {
        onSuccess: () => {
          toast.success('Rule deleted successfully');
        },
        onError: () => {
          toast.error('Failed to delete rule');
        },
      });
    }
  };

  const handleToggleActive = (rule: any) => {
    updateRule.mutate(
      { id: rule.id, data: { isActive: !rule.isActive } },
      {
        onSuccess: () => {
          toast.success(`Rule ${rule.isActive ? 'disabled' : 'enabled'} successfully`);
        },
        onError: () => {
          toast.error('Failed to update rule');
        },
      }
    );
  };

  const startEdit = (rule: any) => {
    setEditingId(rule.id);
    setFormData({
      ruleType: rule.ruleType,
      keyword: rule.keyword,
      questionPattern: rule.questionPattern || '',
      response: rule.response,
      priority: rule.priority,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      ruleType: ChatbotRuleType.FAQ,
      keyword: '',
      questionPattern: '',
      response: '',
      priority: 0,
    });
  };

  if (isLoading) {
    return (
      <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
        <div className={clsx('rounded-b-2xl shadow-sm', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

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
              <h1 className="font-display font-bold text-2xl whitespace-nowrap">FAQ Manager</h1>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary" size="sm" icon={<Plus size={16} />}>
              Rule
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <MessageSquare size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Rules</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{rules?.length || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Check size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Active</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{rules?.filter((r) => r.isActive).length || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap size={20} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>FAQ Type</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{rules?.filter((r) => r.ruleType === ChatbotRuleType.FAQ).length || 0}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={clsx('w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ChatbotRuleType | 'ALL')}
              className={clsx('px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green', isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200')}
            >
              <option value="ALL">All Types</option>
              <option value={ChatbotRuleType.FAQ}>FAQ</option>
              <option value={ChatbotRuleType.PRICING}>Pricing</option>
              <option value={ChatbotRuleType.DELIVERY}>Delivery</option>
              <option value={ChatbotRuleType.HOURS}>Hours</option>
              <option value={ChatbotRuleType.PAYMENT}>Payment</option>
              <option value={ChatbotRuleType.LOCATION}>Location</option>
              <option value={ChatbotRuleType.CUSTOM}>Custom</option>
            </select>
          </div>
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className={clsx('rounded-xl shadow-sm p-6 border mb-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
            <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {editingId ? 'Edit Rule' : 'Add New Rule'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Rule Type</label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as ChatbotRuleType })}
                    className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300')}
                  >
                    <option value={ChatbotRuleType.FAQ}>FAQ</option>
                    <option value={ChatbotRuleType.PRICING}>Pricing</option>
                    <option value={ChatbotRuleType.DELIVERY}>Delivery</option>
                    <option value={ChatbotRuleType.HOURS}>Hours</option>
                    <option value={ChatbotRuleType.PAYMENT}>Payment</option>
                    <option value={ChatbotRuleType.LOCATION}>Location</option>
                    <option value={ChatbotRuleType.CUSTOM}>Custom</option>
                  </select>
                </div>
                <div>
                  <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Priority</label>
                  <input
                    type="number"
                    value={formData.priority || ''}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className={clsx(
                      'w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                      isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300',
                      '[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]'
                    )}
                  />
                </div>
              </div>
              <div>
                <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Keyword</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300')}
                  placeholder="e.g., delivery, pricing, hours"
                />
              </div>
              <div>
                <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Question Pattern (Optional)</label>
                <input
                  type="text"
                  value={formData.questionPattern}
                  onChange={(e) => setFormData({ ...formData, questionPattern: e.target.value })}
                  className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300')}
                  placeholder="e.g., how much, what is"
                />
              </div>
              <div>
                <label className={clsx('block text-sm font-medium mb-1', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>Response</label>
                <textarea
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  rows={3}
                  className={clsx('w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none', isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300')}
                  placeholder="The response the chatbot will send"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => {
                    setIsAdding(false);
                    cancelEdit();
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => editingId ? handleUpdate(editingId) : handleCreate()}
                  variant="primary"
                  disabled={createRule.isPending || updateRule.isPending}
                >
                  {createRule.isPending || updateRule.isPending ? 'Saving...' : 'Save Rule'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="space-y-3">
          {filteredRules.length === 0 ? (
            <div className={clsx('rounded-xl shadow-sm p-12 border text-center', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}>
              <MessageSquare size={48} className={clsx('mx-auto mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
              <h3 className={clsx('font-semibold mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>No Rules Found</h3>
              <p className={clsx('mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                {searchTerm || filterType !== 'ALL'
                  ? 'Try adjusting your search or filter'
                  : 'Create your first chatbot rule to get started'}
              </p>
              {!searchTerm && filterType === 'ALL' && (
                <Button onClick={() => setIsAdding(true)} variant="primary">
                  Add Your First Rule
                </Button>
              )}
            </div>
          ) : (
            filteredRules.map((rule) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('rounded-xl shadow-sm p-4 border', !rule.isActive ? 'opacity-60' : '', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="blue">{rule.ruleType}</Badge>
                      <Badge variant={rule.isActive ? 'green' : 'gray'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {rule.priority > 0 && (
                        <span className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Priority: {rule.priority}</span>
                      )}
                    </div>
                    <div className="mb-2">
                      <span className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Keyword:</span>{' '}
                      <span className={clsx(isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{rule.keyword}</span>
                    </div>
                    {rule.questionPattern && (
                      <div className="mb-2">
                        <span className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Pattern:</span>{' '}
                        <span className={clsx(isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{rule.questionPattern}</span>
                      </div>
                    )}
                    <div>
                      <span className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Response:</span>{' '}
                      <span className={clsx(isDarkMode ? 'text-gray-300' : 'text-gray-700')}>{rule.response}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                      title={rule.isActive ? 'Disable' : 'Enable'}
                    >
                      {rule.isActive ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => startEdit(rule)}
                      className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                      title="Edit"
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className={clsx('p-2 rounded-lg transition-colors', isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}
                      title="Delete"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
