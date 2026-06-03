import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  Bot, 
  Settings, 
  MessageSquare, 
  DollarSign, 
  Calendar, 
  Package, 
  Users, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw,
  Play,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  Lock,
  Plus,
  Edit,
  Trash2,
  GripVertical
} from 'lucide-react';
import { useAIConfiguration, useUpdateAIConfiguration, useTestAIConfiguration, useRebuildKnowledgeBase, useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ } from '../../hooks/useVendors';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

export default function AIEnginePage() {
  const { user } = useAuthStore();
  const { data: config, isLoading, error } = useAIConfiguration();
  const updateConfig = useUpdateAIConfiguration();
  const testConfig = useTestAIConfiguration();
  const rebuildKB = useRebuildKnowledgeBase();
  const { data: faqs, isLoading: faqsLoading } = useFAQs();
  const createFAQ = useCreateFAQ();
  const updateFAQ = useUpdateFAQ();
  const deleteFAQ = useDeleteFAQ();

  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isAddingFAQ, setIsAddingFAQ] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<string | null>(null);
  const [faqFormData, setFaqFormData] = useState({ question: '', answer: '', sortOrder: 0 });

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
          <p className="text-gray-600 mb-6">You need to be a vendor to access the AI Engine.</p>
          <Link href="/dashboard">
            <Button variant="primary">Return to Dashboard</Button>
          </Link>
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
            <AlertTriangle size={48} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Configuration</h1>
          <p className="text-gray-600 mb-6">Failed to load AI configuration. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const handleToggle = (field: string, value: boolean) => {
    updateConfig.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          toast.success('Configuration updated successfully');
        },
        onError: () => {
          toast.error('Failed to update configuration');
        },
      }
    );
  };

  const handleSave = (field: string, value: string | number) => {
    updateConfig.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          toast.success('Configuration updated successfully');
        },
        onError: () => {
          toast.error('Failed to update configuration');
        },
      }
    );
  };

  const handleTest = async () => {
    if (!testMessage.trim()) {
      toast.error('Please enter a test message');
      return;
    }

    setIsTesting(true);
    setTestResponse(null);

    try {
      const response = await testConfig.mutateAsync({ message: testMessage });
      setTestResponse(response.message);
      toast.success('Test completed successfully');
    } catch (error) {
      toast.error('Failed to test AI configuration');
    } finally {
      setIsTesting(false);
    }
  };

  const handleRebuildKB = async () => {
    try {
      await rebuildKB.mutateAsync();
      toast.success('Knowledge base rebuilt successfully');
    } catch (error) {
      toast.error('Failed to rebuild knowledge base');
    }
  };

  const handleAddFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createFAQ.mutateAsync(faqFormData);
      toast.success('FAQ added successfully');
      setIsAddingFAQ(false);
      setFaqFormData({ question: '', answer: '', sortOrder: 0 });
    } catch (error) {
      toast.error('Failed to add FAQ');
    }
  };

  const handleEditFAQ = (faq: any) => {
    setFaqFormData({ question: faq.question, answer: faq.answer, sortOrder: faq.sortOrder });
    setEditingFAQ(faq.id);
    setIsAddingFAQ(true);
  };

  const handleUpdateFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFAQ) return;
    try {
      await updateFAQ.mutateAsync({ id: editingFAQ, data: faqFormData });
      toast.success('FAQ updated successfully');
      setIsAddingFAQ(false);
      setEditingFAQ(null);
      setFaqFormData({ question: '', answer: '', sortOrder: 0 });
    } catch (error) {
      toast.error('Failed to update FAQ');
    }
  };

  const handleDeleteFAQ = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await deleteFAQ.mutateAsync(id);
      toast.success('FAQ deleted successfully');
    } catch (error) {
      toast.error('Failed to delete FAQ');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-gradient-hero text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
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
              <h1 className="font-display font-bold text-2xl">AI Engine</h1>
              <p className="text-white/60 text-sm mt-1">Configure WhatsApp chatbot</p>
            </div>
            <Button onClick={handleRebuildKB} variant="secondary" disabled={rebuildKB.isPending}>
              <RefreshCw size={18} className={`mr-2 ${rebuildKB.isPending ? 'animate-spin' : ''}`} />
              Rebuild Knowledge Base
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${config?.isEnabled ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  <Bot size={20} className={config?.isEnabled ? 'text-green-300' : 'text-red-300'} />
                </div>
                <div>
                  <p className="text-white/60 text-xs">AI Status</p>
                  <p className="text-white font-bold text-sm">{config?.isEnabled ? 'Active' : 'Disabled'}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MessageSquare size={20} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">WhatsApp</p>
                  <p className="text-white font-bold text-sm">Connected</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <AlertTriangle size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Lead Threshold</p>
                  <p className="text-white font-bold text-sm">{config?.leadQualificationThreshold || 70}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Master Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${config?.isEnabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <Bot size={24} className={config?.isEnabled ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">AI Chatbot Status</h2>
                <p className="text-sm text-gray-500">
                  {config?.isEnabled
                    ? 'Your AI chatbot is active and responding to WhatsApp messages'
                    : 'Your AI chatbot is disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleToggle('isEnabled', !config?.isEnabled)}
              className="relative"
            >
              {config?.isEnabled ? (
                <ToggleRight className="w-14 h-14 text-green-500" />
              ) : (
                <ToggleLeft className="w-14 h-14 text-gray-400" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Feature Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Feature Configuration</h2>

          <div className="space-y-3">
            {/* FAQ */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">FAQ Automation</h3>
                  <p className="text-xs text-gray-500">Automatically answer frequently asked questions</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('faqEnabled', !config?.faqEnabled)}
                disabled={!config?.isEnabled}
              >
                {config?.faqEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>

            {/* Pricing */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Pricing Inquiry</h3>
                  <p className="text-xs text-gray-500">Handle pricing questions automatically</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('pricingInquiryEnabled', !config?.pricingInquiryEnabled)}
                disabled={!config?.isEnabled}
              >
                {config?.pricingInquiryEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>

            {/* Booking */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar size={20} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Booking Assistance</h3>
                  <p className="text-xs text-gray-500">Help customers book appointments</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('bookingAssistanceEnabled', !config?.bookingAssistanceEnabled)}
                disabled={!config?.isEnabled}
              >
                {config?.bookingAssistanceEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>

            {/* Inventory */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package size={20} className="text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Inventory Inquiry</h3>
                  <p className="text-xs text-gray-500">Provide real-time stock availability</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('inventoryInquiryEnabled', !config?.inventoryInquiryEnabled)}
                disabled={!config?.isEnabled}
              >
                {config?.inventoryInquiryEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>

            {/* Lead Qualification */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Users size={20} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Lead Qualification</h3>
                  <p className="text-xs text-gray-500">Score and qualify incoming leads</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('leadQualificationEnabled', !config?.leadQualificationEnabled)}
                disabled={!config?.isEnabled}
              >
                {config?.leadQualificationEnabled ? (
                  <ToggleRight className="w-10 h-10 text-green-500" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Custom Messages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <h2 className="font-semibold text-gray-900 text-lg mb-4">Custom Messages</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Greeting Message
              </label>
              <textarea
                value={config?.greetingMessage || ''}
                onChange={(e) => handleSave('greetingMessage', e.target.value)}
                placeholder="Custom greeting message for new customers..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Out of Hours Message
              </label>
              <textarea
                value={config?.outOfHoursMessage || ''}
                onChange={(e) => handleSave('outOfHoursMessage', e.target.value)}
                placeholder="Message to show when business is closed..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escalation Phone
              </label>
              <input
                type="tel"
                value={config?.escalationPhone || ''}
                onChange={(e) => handleSave('escalationPhone', e.target.value)}
                placeholder="+234 XXX XXX XXXX"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
              />
            </div>
          </div>
        </motion.div>

        {/* FAQ Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <MessageSquare size={20} className="text-blue-500" />
              FAQ Management
            </h2>
            <Button onClick={() => setIsAddingFAQ(true)} variant="primary" size="sm">
              <Plus size={16} className="mr-2" />
              Add FAQ
            </Button>
          </div>

          {isAddingFAQ && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-4">
                {editingFAQ ? 'Edit FAQ' : 'Add New FAQ'}
              </h3>
              <form onSubmit={editingFAQ ? handleUpdateFAQ : handleAddFAQ} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question
                  </label>
                  <input
                    type="text"
                    value={faqFormData.question}
                    onChange={(e) => setFaqFormData({ ...faqFormData, question: e.target.value })}
                    placeholder="Enter the question..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Answer
                  </label>
                  <textarea
                    value={faqFormData.answer}
                    onChange={(e) => setFaqFormData({ ...faqFormData, answer: e.target.value })}
                    placeholder="Enter the answer..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={faqFormData.sortOrder}
                    onChange={(e) => setFaqFormData({ ...faqFormData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" variant="primary">
                    {editingFAQ ? 'Update' : 'Add'} FAQ
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsAddingFAQ(false);
                      setEditingFAQ(null);
                      setFaqFormData({ question: '', answer: '', sortOrder: 0 });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {faqsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : faqs && faqs.length > 0 ? (
            <div className="space-y-3">
              {faqs.map((faq: any) => (
                <div key={faq.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <GripVertical size={16} className="text-gray-400" />
                        <h4 className="font-medium text-gray-800">{faq.question}</h4>
                      </div>
                      <p className="text-sm text-gray-600 ml-6">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleEditFAQ(faq)}
                      >
                        <Edit size={14} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDeleteFAQ(faq.id)}
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare size={48} className="mx-auto mb-3 text-gray-300" />
              <p>No FAQs yet. Add your first FAQ to get started.</p>
            </div>
          )}
        </motion.div>

        {/* Lead Scoring & Testing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lead Scoring */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-orange-500" />
              Lead Scoring
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hot Lead Threshold (Score: 0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={config?.leadQualificationThreshold || 70}
                onChange={(e) => handleSave('leadQualificationThreshold', Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
              />
              <p className="text-xs text-gray-500 mt-2">
                Leads scoring above this threshold will be marked as HOT
              </p>
            </div>
          </motion.div>

          {/* AI Testing */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <h2 className="font-semibold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Play size={20} className="text-purple-500" />
              Test AI
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Message
                </label>
                <textarea
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type a message to test your AI..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green"
                  rows={4}
                />
              </div>

              <Button
                onClick={handleTest}
                disabled={isTesting || !testMessage.trim()}
                variant="primary"
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <RefreshCw size={18} className="mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" />
                    Test Response
                  </>
                )}
              </Button>

              {testResponse && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Bot size={18} className="text-purple-600 mt-0.5" />
                    <span className="font-medium text-gray-800 text-sm">AI Response:</span>
                  </div>
                  <p className="text-gray-700 text-sm">{testResponse}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
