import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Save,
  Lock,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { useChatbotSettings, useUpdateChatbotSettings } from '../../hooks/useChatbot';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import toast from 'react-hot-toast';

export default function ChatbotSettings() {
  const { user } = useAuthStore();
  const { data: settings, isLoading, error } = useChatbotSettings();
  const updateSettings = useUpdateChatbotSettings();

  const [greetingMessage, setGreetingMessage] = useState('');
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [humanHandoffMessage, setHumanHandoffMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Check if user is a vendor or super admin
  const isVendor = user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN';

  // Initialize form when settings load
  if (settings && !greetingMessage) {
    setGreetingMessage(settings.greetingMessage || '');
    setFallbackMessage(settings.fallbackMessage || '');
    setHumanHandoffMessage(settings.humanHandoffMessage || '');
  }

  // Show access denied if not a vendor
  if (!isVendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-gray-100 rounded-full inline-flex mb-4">
            <Lock size={48} className="text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">You need to be a vendor to access Chatbot Settings.</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Settings</h1>
          <p className="text-gray-600 mb-6">Failed to load chatbot settings. Please try again.</p>
          <Button onClick={() => window.location.reload()} variant="primary">Retry</Button>
        </div>
      </div>
    );
  }

  const handleToggle = (field: 'chatbotEnabled', value: boolean) => {
    updateSettings.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          toast.success('Chatbot settings updated successfully');
        },
        onError: () => {
          toast.error('Failed to update chatbot settings');
        },
      }
    );
  };

  const handleSaveMessages = () => {
    setIsSaving(true);
    updateSettings.mutate(
      {
        greetingMessage,
        fallbackMessage,
        humanHandoffMessage,
      },
      {
        onSuccess: () => {
          toast.success('Messages saved successfully');
          setIsSaving(false);
        },
        onError: () => {
          toast.error('Failed to save messages');
          setIsSaving(false);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="text-blue-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Chatbot Settings</h1>
              <p className="text-sm text-gray-600">Configure your rule-based chatbot responses</p>
            </div>
          </div>
          <Badge variant={settings?.chatbotEnabled ? 'green' : 'gray'}>
            {settings?.chatbotEnabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Chatbot */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Enable Chatbot</h3>
                  <p className="text-sm text-gray-600">Turn on automatic responses for customer messages</p>
                </div>
              </div>
              <button
                onClick={() => handleToggle('chatbotEnabled', !settings?.chatbotEnabled)}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                style={{ backgroundColor: settings?.chatbotEnabled ? '#2563eb' : '#d1d5db' }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings?.chatbotEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Greeting Message */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="text-green-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Greeting Message</h3>
                <p className="text-sm text-gray-600">First message sent to new customers</p>
              </div>
            </div>
            <textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              placeholder="Hello! Welcome to our business. How can I help you today?"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Fallback Message */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="text-orange-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Fallback Message</h3>
                <p className="text-sm text-gray-600">Message sent when no rule matches</p>
              </div>
            </div>
            <textarea
              value={fallbackMessage}
              onChange={(e) => setFallbackMessage(e.target.value)}
              placeholder="Thank you for your message. A human agent will assist you shortly."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Human Handoff Message */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="text-blue-600" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Human Handoff Message</h3>
                <p className="text-sm text-gray-600">Message sent when transferring to human agent</p>
              </div>
            </div>
            <textarea
              value={humanHandoffMessage}
              onChange={(e) => setHumanHandoffMessage(e.target.value)}
              placeholder="A human agent is now attending to you."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSaveMessages}
              disabled={isSaving}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Save size={18} />
              {isSaving ? 'Saving...' : 'Save Messages'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
