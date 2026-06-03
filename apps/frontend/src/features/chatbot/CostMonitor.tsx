import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Database, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  DollarSign,
  Shield,
  Trash2,
  RefreshCw,
  ChevronLeft,
  Activity,
  Users,
  PieChart,
  MessageSquare,
  Layers,
  CircuitBoard
} from 'lucide-react';
import { Button, Skeleton, Badge } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import {
  useCostDashboard,
  useCostSavings,
  useEnableReducedMode,
  useDisableReducedMode,
  useClearCache,
  useTwilioCircuitStatus,
  useTwilioQueueStatus,
} from '../../hooks/useCostControl';
import toast from 'react-hot-toast';

export default function CostMonitor() {
  const { user } = useAuthStore();
  const { data: dashboard, isLoading: dashboardLoading } = useCostDashboard();
  const { data: savings, isLoading: savingsLoading } = useCostSavings();
  const { data: circuitStatus } = useTwilioCircuitStatus();
  const { data: queueStatus } = useTwilioQueueStatus();
  const enableReducedMode = useEnableReducedMode();
  const disableReducedMode = useDisableReducedMode();
  const clearCache = useClearCache();

  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the response cache? This may increase costs temporarily.')) {
      setIsClearingCache(true);
      await clearCache.mutateAsync();
      setIsClearingCache(false);
    }
  };

  const handleToggleReducedMode = async () => {
    if (dashboard?.quota.quota.reducedMode) {
      await disableReducedMode.mutateAsync();
    } else {
      if (confirm('Enable reduced mode? The chatbot will only use cached responses.')) {
        await enableReducedMode.mutateAsync();
      }
    }
  };

  if (dashboardLoading || savingsLoading) {
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

  const quotaStatus = dashboard?.quota.status || 'OK';
  const statusColors = {
    OK: 'green',
    WARNING: 'amber',
    CRITICAL: 'red',
  } as const;

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
              <h1 className="font-display font-bold text-2xl">Cost Control Dashboard</h1>
              <p className="text-white/60 text-sm mt-1">Monitor and optimize your WhatsApp API costs</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="bg-white/10 hover:bg-white/20 text-white border-none"
              >
                <Trash2 size={16} className="mr-2" />
                Clear Cache
              </Button>
              <Button
                variant={dashboard?.quota.quota.reducedMode ? 'primary' : 'secondary'}
                onClick={handleToggleReducedMode}
                disabled={enableReducedMode.isPending || disableReducedMode.isPending}
                className={dashboard?.quota.quota.reducedMode ? '' : 'bg-white/10 hover:bg-white/20 text-white border-none'}
              >
                <Shield size={16} className="mr-2" />
                {dashboard?.quota.quota.reducedMode ? 'Disable Reduced Mode' : 'Enable Reduced Mode'}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <DollarSign size={20} className="text-green-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Total Cost</p>
                  <p className="text-white font-bold text-xl">₦{savings?.totalCost?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Database size={20} className="text-blue-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Cache Hit Rate</p>
                  <p className="text-white font-bold text-xl">{savings?.savingsPercentage?.toFixed(1) || 0}%</p>
                </div>
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity size={20} className="text-purple-300" />
                </div>
                <div>
                  <p className="text-white/60 text-xs">Quota Status</p>
                  <p className="text-white font-bold text-xl">{quotaStatus}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Database size={20} className="text-festac-green" />
                Monthly Quota
              </h2>
              <Badge variant={statusColors[quotaStatus as keyof typeof statusColors]}>
                {quotaStatus}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Usage</span>
                  <span className="font-semibold">
                    {dashboard?.quota.usagePercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      quotaStatus === 'CRITICAL' ? 'bg-red-500' :
                      quotaStatus === 'WARNING' ? 'bg-amber-500' :
                      'bg-festac-green'
                    }`}
                    style={{ width: `${dashboard?.quota.usagePercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard?.quota.quota.currentUsage.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Used</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard?.quota.remaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Remaining</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard?.quota.quota.monthlyLimit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">Limit</p>
                </div>
              </div>

              {dashboard?.quota.quota.reducedMode && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Reduced mode is active. Only cached responses are being used.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

      {/* Cost Savings */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <DollarSign size={20} className="text-festac-green" />
          Cost Savings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-green-600" />
              <span className="text-sm text-gray-600">Total Saved</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              ₦{savings?.savings.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {savings?.savingsPercentage.toFixed(1)}% reduction
            </p>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-blue-600" />
              <span className="text-sm text-gray-600">Cache Hits</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {savings?.cachedMessages.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {savings?.savingsPercentage.toFixed(1)}% saved
            </p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={16} className="text-purple-600" />
              <span className="text-sm text-gray-600">API Calls</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {savings?.apiCalls.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Actual messages sent
            </p>
          </div>

          <div className="p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-amber-600" />
              <span className="text-sm text-gray-600">Total Messages</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {savings?.totalMessages.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Including cached
            </p>
          </div>
        </div>
      </motion.div>

      {/* Cache Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Database size={20} className="text-festac-green" />
          Cache Statistics
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.cache.stats.total}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Entries</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.cache.stats.activeEntries}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.cache.stats.totalHits.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Hits</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Cache Hit Rate</span>
            <span className="text-lg font-bold text-blue-600">
              {dashboard?.cache.hitRate.hitRate.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${dashboard?.cache.hitRate.hitRate || 0}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Spike Detection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Zap size={20} className="text-festac-green" />
          Traffic Spike Detection
        </h2>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {dashboard?.spike.spikeDetected ? (
              <AlertTriangle size={24} className="text-red-500" />
            ) : (
              <CheckCircle size={24} className="text-green-500" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {dashboard?.spike.spikeDetected ? 'Spike Detected' : 'Normal Traffic'}
              </p>
              <p className="text-xs text-gray-500">
                {dashboard?.spike.spikeDetected
                  ? `Traffic is ${dashboard?.spike.multiplier.toFixed(1)}x normal`
                  : 'No unusual activity detected'
                }
              </p>
            </div>
          </div>
          <Badge variant={dashboard?.spike.spikeDetected ? 'red' : 'green'}>
            {dashboard?.spike.spikeDetected ? 'Alert' : 'OK'}
          </Badge>
        </div>
      </motion.div>

      {/* Conversation Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <BarChart3 size={20} className="text-festac-green" />
          Conversation Statistics
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.conversations.today}
            </p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.conversations.week}
            </p>
            <p className="text-xs text-gray-500 mt-1">This Week</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {dashboard?.conversations.activeNow}
            </p>
            <p className="text-xs text-gray-500 mt-1">Active Now</p>
          </div>
        </div>
      </motion.div>

      {/* Twilio Circuit Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <CircuitBoard size={20} className="text-festac-green" />
          Twilio Circuit Breaker Status
        </h2>

        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {circuitStatus?.isOpen ? (
              <AlertTriangle size={24} className="text-red-500" />
            ) : (
              <CheckCircle size={24} className="text-green-500" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {circuitStatus?.isOpen ? 'Circuit Open' : 'Circuit Closed'}
              </p>
              <p className="text-xs text-gray-500">
                {circuitStatus?.isOpen
                  ? `Fallback to ${circuitStatus?.fallbackProvider} active`
                  : 'Twilio operating normally'
                }
              </p>
            </div>
          </div>
          <Badge variant={circuitStatus?.isOpen ? 'red' : 'green'}>
            {circuitStatus?.isOpen ? 'Fallback' : 'Normal'}
          </Badge>
        </div>

        {circuitStatus && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {circuitStatus.failureCount}
              </p>
              <p className="text-xs text-gray-500">Failures</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-lg font-bold text-gray-900">
                {circuitStatus.successCount}
              </p>
              <p className="text-xs text-gray-500">Successes</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Twilio Queue Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
      >
        <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
          <Layers size={20} className="text-festac-green" />
          Twilio Message Queue
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {queueStatus?.pending}
            </p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {queueStatus?.processing}
            </p>
            <p className="text-xs text-gray-500 mt-1">Processing</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {queueStatus?.completed}
            </p>
            <p className="text-xs text-gray-500 mt-1">Completed</p>
          </div>
        </div>

        {queueStatus && queueStatus.pending > 0 && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" />
            <p className="text-sm text-blue-800">
              {queueStatus.pending} messages queued for processing
            </p>
          </div>
        )}
      </motion.div>
        </div>
      </div>
    </div>
  );
}
