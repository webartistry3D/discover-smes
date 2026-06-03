import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  ChevronLeft,
  Settings as SettingsIcon,
  CreditCard,
  History,
  Key,
  Shield,
  Bell,
  Globe,
  Lock,
  User,
  Bot
} from 'lucide-react';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import ChatbotSettings from '../chatbot/ChatbotSettings';
import { 
  usePaymentConfiguration, 
  useCreatePaymentConfiguration, 
  useTestPaymentConfiguration,
  usePaymentHistory,
  useSubscription,
  useCreateSubscription,
  useUpgradeSubscription,
  useCancelSubscription,
  useSubscriptionLimits
} from '../../hooks/useVendors';
import toast from 'react-hot-toast';
import { SubscriptionPlan, BillingCycle, PRICING, SUBSCRIPTION_LIMITS } from '../../lib/shared';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<'payment' | 'subscription' | 'chatbot' | 'account' | 'security' | 'notifications'>('payment');
  
  // Payment hooks
  const { data: paymentConfig, isLoading: configLoading } = usePaymentConfiguration();
  const createPaymentConfig = useCreatePaymentConfiguration();
  const testPaymentConfig = useTestPaymentConfiguration();
  const { data: paymentHistory, isLoading: historyLoading } = usePaymentHistory();
  
  // Subscription hooks
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription();
  const { data: subscriptionLimits } = useSubscriptionLimits();
  const createSubscription = useCreateSubscription();
  const upgradeSubscription = useUpgradeSubscription();
  const cancelSubscription = useCancelSubscription();
  
  // Form state
  const [publicKey, setPublicKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [testMode, setTestMode] = useState(true);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<BillingCycle>(BillingCycle.MONTHLY);

  // Initialize form with existing config
  useEffect(() => {
    if (paymentConfig) {
      setPublicKey(paymentConfig.publicKey);
      setSecretKey(''); // Don't pre-fill secret key for security
      setTestMode(paymentConfig.testMode);
    }
  }, [paymentConfig]);

  const handleSaveConfig = () => {
    if (!publicKey || !secretKey) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    createPaymentConfig.mutate(
      { publicKey, secretKey, testMode },
      {
        onSuccess: () => toast.success('Payment configuration saved'),
        onError: () => toast.error('Failed to save configuration')
      }
    );
  };

  const handleTestConnection = () => {
    testPaymentConfig.mutate(undefined, {
      onSuccess: () => toast.success('Connection test successful'),
      onError: () => toast.error('Connection test failed')
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ChevronLeft size={20} />
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Settings</h1>
          </div>
          <p className="text-white/80 text-sm sm:text-base">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            {/* Tab Navigation */}
            <div className="flex gap-2 bg-white rounded-lg p-2 shadow-sm border border-gray-100 overflow-x-auto">
              <button
                onClick={() => setActiveSection('payment')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'payment'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Payment Integration
              </button>
              <button
                onClick={() => setActiveSection('subscription')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'subscription'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Subscription
              </button>
              <button
                onClick={() => setActiveSection('chatbot')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'chatbot'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Chatbot
              </button>
              <button
                onClick={() => setActiveSection('account')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'account'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Account
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'security'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveSection('notifications')}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  activeSection === 'notifications'
                    ? 'bg-festac-green text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Notifications
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Payment Integration Section */}
            {activeSection === 'payment' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Paystack Integration */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Key size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg">Paystack Integration</h2>
                        <p className="text-sm text-gray-600">Configure your Paystack payment gateway</p>
                      </div>
                    </div>
                    {paymentConfig && <Badge variant="green">Active</Badge>}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
                      <input
                        type="text"
                        value={publicKey}
                        onChange={(e) => setPublicKey(e.target.value)}
                        placeholder="pk_test_xxxxxxxxxxxxx"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                      <input
                        type="password"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        placeholder="sk_test_xxxxxxxxxxxxx"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-festac-green/20 focus:border-festac-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Test Mode</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="testMode" 
                          checked={testMode}
                          onChange={(e) => setTestMode(e.target.checked)}
                          className="w-4 h-4 text-festac-green rounded border-gray-300" 
                        />
                        <label htmlFor="testMode" className="text-sm text-gray-600">Enable test mode for development</label>
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="primary" 
                        onClick={handleSaveConfig}
                        disabled={createPaymentConfig.isPending}
                      >
                        {createPaymentConfig.isPending ? 'Saving...' : 'Save Configuration'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        onClick={handleTestConnection}
                        disabled={testPaymentConfig.isPending}
                      >
                        {testPaymentConfig.isPending ? 'Testing...' : 'Test Connection'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-green-100 rounded-lg">
                        <History size={20} className="text-green-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg">Payment History</h2>
                        <p className="text-sm text-gray-600">View your transaction history</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm">Export</Button>
                  </div>

                  {historyLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                  ) : paymentHistory && paymentHistory.data && paymentHistory.data.length > 0 ? (
                    <div className="space-y-3">
                      {paymentHistory.data.map((payment: any) => (
                        <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-gray-800 text-sm">
                                  {payment.metadata ? JSON.parse(payment.metadata).description || 'Payment' : 'Payment'}
                                </h4>
                                <Badge variant={
                                  payment.status === 'SUCCESS' ? 'green' :
                                  payment.status === 'PENDING' ? 'amber' :
                                  payment.status === 'FAILED' ? 'red' : 'gray'
                                }>
                                  {payment.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500">{payment.reference} • {new Date(payment.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">₦{payment.amount.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <History size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>No payment history yet.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Subscription Section */}
            {activeSection === 'subscription' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 rounded-lg">
                        <SettingsIcon size={20} className="text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900 text-lg">Subscription</h2>
                        <p className="text-sm text-gray-600">Manage your subscription plan and billing</p>
                      </div>
                    </div>
                    {subscription && <Badge>{subscription.planType}</Badge>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Freemium */}
                    <div className="p-4 sm:p-6 border rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <div>
                          <h3 className="font-semibold">Freemium</h3>
                          <p className="text-xs text-gray-500">Limited features for trial users</p>
                        </div>
                        <div className="text-sm text-gray-700 font-medium">Free</div>
                      </div>
                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 mb-4">
                        <li>Max incomes: {SUBSCRIPTION_LIMITS.FREEMIUM.maxIncome}</li>
                        <li>Max invoices: {SUBSCRIPTION_LIMITS.FREEMIUM.maxInvoices}</li>
                        <li>Max expenses: {SUBSCRIPTION_LIMITS.FREEMIUM.maxExpenses}</li>
                        <li>Max customers: {SUBSCRIPTION_LIMITS.FREEMIUM.maxCustomers}</li>
                        <li>Max inventory items: {SUBSCRIPTION_LIMITS.FREEMIUM.maxInventoryItems}</li>
                        <li>AI engine access: {SUBSCRIPTION_LIMITS.FREEMIUM.aiEngineAccess ? 'Yes' : 'No'}</li>
                      </ul>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => createSubscription.mutate({ planType: SubscriptionPlan.FREEMIUM, billingCycle: selectedBillingCycle })}
                        disabled={createSubscription.isPending}
                      >
                        {createSubscription.isPending ? 'Saving...' : 'Activate Freemium'}
                      </Button>
                    </div>

                    {/* Growth */}
                    <div className="p-4 sm:p-6 border-2 border-festac-green rounded-lg bg-gradient-to-br from-festac-green/5 to-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                        <div>
                          <h3 className="font-semibold">Growth</h3>
                          <p className="text-xs text-gray-500">Full privileges, no limits</p>
                        </div>
                        <div className="text-sm sm:text-base text-festac-green font-bold">₦{PRICING.GROWTH.monthly.toLocaleString()}/mo</div>
                      </div>

                      <ul className="text-xs sm:text-sm text-gray-600 space-y-1.5 mb-5">
                        <li>✓ Unlimited incomes</li>
                        <li>✓ Unlimited invoices</li>
                        <li>✓ Unlimited expenses</li>
                        <li>✓ Unlimited customers</li>
                        <li>✓ Unlimited inventory</li>
                        <li>✓ AI engine access</li>
                      </ul>

                      <div className="flex flex-col gap-2">
                        <select
                          value={selectedBillingCycle}
                          onChange={(e) => setSelectedBillingCycle(e.target.value as any)}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-festac-green/20"
                        >
                          <option value={BillingCycle.MONTHLY}>Monthly (₦{PRICING.GROWTH.monthly.toLocaleString()})</option>
                          <option value={BillingCycle.YEARLY}>Yearly (₦{PRICING.GROWTH.yearly.toLocaleString()}) — 20% off</option>
                        </select>

                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={() => {
                            if (subscription && subscription.planType === SubscriptionPlan.GROWTH) return;
                            if (subscription) {
                              upgradeSubscription.mutate({ planType: SubscriptionPlan.GROWTH, billingCycle: selectedBillingCycle });
                            } else {
                              createSubscription.mutate({ planType: SubscriptionPlan.GROWTH, billingCycle: selectedBillingCycle });
                            }
                          }}
                          disabled={upgradeSubscription.isPending || createSubscription.isPending}
                        >
                          {upgradeSubscription.isPending || createSubscription.isPending ? 'Processing...' : 'Subscribe Now'}
                        </Button>

                        {subscription && subscription.planType === SubscriptionPlan.GROWTH && (
                          <Button 
                            variant="ghost" 
                            className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => cancelSubscription.mutate()} 
                            disabled={cancelSubscription.isPending}
                          >
                            {cancelSubscription.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Chatbot Section */}
            {activeSection === 'chatbot' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <ChatbotSettings />
              </motion.div>
            )}

            {/* Account Section */}
            {activeSection === 'account' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <User size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">Account Settings</h2>
                      <p className="text-sm text-gray-600">Manage your account information</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={`${user?.firstName} ${user?.lastName}` || ''}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your name</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="text"
                        value={user?.phone || ''}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your phone number</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={(user as any)?.email || 'Not set'}
                        disabled
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">Contact support to change your email</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Status</label>
                      <div className="flex items-center gap-2">
                        <Badge variant={(user as any)?.isActive ? 'green' : 'red'}>
                          {(user as any)?.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="blue">{user?.role}</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Business Profile</h3>
                  <Link href="/profile">
                    <Button variant="secondary" className="w-full">
                      Edit Business Profile
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Shield size={20} className="text-red-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">Security Settings</h2>
                      <p className="text-sm text-gray-600">Manage your security preferences</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                        <Badge variant="gray">Disabled</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Phone Verification</h3>
                          <p className="text-sm text-gray-500">Your phone is verified</p>
                        </div>
                        <Badge variant="green">Verified</Badge>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Login Sessions</h3>
                          <p className="text-sm text-gray-500">Manage your active sessions</p>
                        </div>
                        <Button variant="secondary" size="sm">View Sessions</Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-4">Danger Zone</h3>
                  <Button
                    variant="ghost"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to log out?')) {
                        const { logout } = useAuthStore.getState();
                        logout();
                      }
                    }}
                  >
                    Log Out
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <Bell size={20} className="text-amber-600" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-gray-900 text-lg">Notification Settings</h2>
                      <p className="text-sm text-gray-600">Manage your notification preferences</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Booking Notifications</h3>
                          <p className="text-sm text-gray-500">Get notified when you receive new bookings</p>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={true}
                          className="w-5 h-5 text-festac-green rounded border-gray-300" 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Message Notifications</h3>
                          <p className="text-sm text-gray-500">Get notified when you receive new messages</p>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={true}
                          className="w-5 h-5 text-festac-green rounded border-gray-300" 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Review Notifications</h3>
                          <p className="text-sm text-gray-500">Get notified when you receive new reviews</p>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={true}
                          className="w-5 h-5 text-festac-green rounded border-gray-300" 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Promotional Notifications</h3>
                          <p className="text-sm text-gray-500">Receive updates about promotions and offers</p>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={false}
                          className="w-5 h-5 text-festac-green rounded border-gray-300" 
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive notifications via email</p>
                        </div>
                        <input 
                          type="checkbox" 
                          defaultChecked={true}
                          className="w-5 h-5 text-festac-green rounded border-gray-300" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
