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
import { ChatbotRuleType } from '../../lib/shared';
import toast from 'react-hot-toast';

export default function FAQManager() {
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
      <div className="min-h-screen bg-gray-50">
        <div className="bg-gradient-hero text-white">
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
              <h1 className="font-display font-bold text-2xl">FAQ Manager</h1>
              <p className="text-white/60 text-sm mt-1">Manage your chatbot response rules</p>
            </div>
            <Button onClick={() => setIsAdding(true)} variant="primary">
              <Plus size={18} className="mr-2" />
              Add Rule
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare size={20} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Rules</p>
                  <p className="text-white font-bold text-xl">{rules?.length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Check size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Active</p>
                  <p className="text-white font-bold text-xl">{rules?.filter((r) => r.isActive).length || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">FAQ Type</p>
                  <p className="text-white font-bold text-xl">{rules?.filter((r) => r.ruleType === ChatbotRuleType.FAQ).length || 0}</p>
                </div>
              </div>
            </div>
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
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as ChatbotRuleType | 'ALL')}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
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
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Rule' : 'Add New Rule'}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rule Type</label>
                  <select
                    value={formData.ruleType}
                    onChange={(e) => setFormData({ ...formData, ruleType: e.target.value as ChatbotRuleType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., delivery, pricing, hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Pattern (Optional)</label>
                <input
                  type="text"
                  value={formData.questionPattern}
                  onChange={(e) => setFormData({ ...formData, questionPattern: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., how much, what is"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Response</label>
                <textarea
                  value={formData.response}
                  onChange={(e) => setFormData({ ...formData, response: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
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
            <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
              <MessageSquare size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">No Rules Found</h3>
              <p className="text-gray-600 mb-4">
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
                className={`bg-white rounded-xl shadow-sm p-4 border ${
                  !rule.isActive ? 'border-gray-200 opacity-60' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="blue">{rule.ruleType}</Badge>
                      <Badge variant={rule.isActive ? 'green' : 'gray'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {rule.priority > 0 && (
                        <span className="text-xs text-gray-500">Priority: {rule.priority}</span>
                      )}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold text-gray-900">Keyword:</span>{' '}
                      <span className="text-gray-700">{rule.keyword}</span>
                    </div>
                    {rule.questionPattern && (
                      <div className="mb-2">
                        <span className="font-semibold text-gray-900">Pattern:</span>{' '}
                        <span className="text-gray-700">{rule.questionPattern}</span>
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-gray-900">Response:</span>{' '}
                      <span className="text-gray-700">{rule.response}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(rule)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title={rule.isActive ? 'Disable' : 'Enable'}
                    >
                      {rule.isActive ? <Check size={18} className="text-green-600" /> : <X size={18} className="text-gray-400" />}
                    </button>
                    <button
                      onClick={() => startEdit(rule)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
