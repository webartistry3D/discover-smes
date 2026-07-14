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
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
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
  const { isDarkMode } = useUIStore();
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
    if (dashboard?.quota?.quota?.reducedMode) {
      await disableReducedMode.mutateAsync();
    } else {
      if (confirm('Enable reduced mode? The chatbot will only use cached responses.')) {
        await enableReducedMode.mutateAsync();
      }
    }
  };

  if (dashboardLoading || savingsLoading) {
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

  const quotaStatus = dashboard?.quota?.status || 'OK';
  const statusColors = {
    OK: 'green',
    WARNING: 'amber',
    CRITICAL: 'red',
  } as const;

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Link href="/dashboard">
                <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                  <ChevronLeft size={20} />
                </button>
              </Link>
              <div className="flex-1">
                <h1 className="font-display font-bold text-xl sm:text-2xl">Cost Control</h1>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={handleClearCache}
                disabled={isClearingCache}
                className={clsx('text-xs sm:text-sm', isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-none' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-none')}
              >
                <Trash2 size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Clear Cache</span>
              </Button>
              <Button
                variant={dashboard?.quota?.quota?.reducedMode ? 'primary' : 'secondary'}
                onClick={handleToggleReducedMode}
                disabled={enableReducedMode.isPending || disableReducedMode.isPending}
                className={dashboard?.quota?.quota?.reducedMode ? '' : clsx('text-xs sm:text-sm', isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-none' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-none')}
              >
                <Shield size={16} className="mr-1 sm:mr-2" />
                <span className="hidden sm:inline">{dashboard?.quota?.quota?.reducedMode ? 'Disable Reduced Mode' : 'Enable Reduced Mode'}</span>
                <span className="sm:hidden">{dashboard?.quota?.quota?.reducedMode ? 'Disable' : 'Enable'}</span>
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent p-3 sm:p-4' : 'bg-gray-50 border-gray-200 p-3 sm:p-4')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <DollarSign size={18} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <p className={clsx('text-[10px] sm:text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Cost</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{savings?.totalCost?.toLocaleString() || 0}</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent p-3 sm:p-4' : 'bg-gray-50 border-gray-200 p-3 sm:p-4')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Database size={18} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <p className={clsx('text-[10px] sm:text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Cache Hit Rate</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{savings?.savingsPercentage?.toFixed(1) || 0}%</p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent p-3 sm:p-4' : 'bg-gray-50 border-gray-200 p-3 sm:p-4')}>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Activity size={18} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} />
                  </div>
                  <p className={clsx('text-[10px] sm:text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Quota Status</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{quotaStatus}</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className={clsx('font-semibold flex items-center gap-2 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
                <Database size={18} className="text-festac-green" />
                Monthly Quota
              </h2>
              <Badge variant={statusColors[quotaStatus as keyof typeof statusColors]}>
                {quotaStatus}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Usage</span>
                  <span className="font-semibold">
                    {dashboard?.quota?.usagePercentage?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className={clsx('w-full rounded-full h-3', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                  <div
                    className={`h-3 rounded-full transition-all ${
                      quotaStatus === 'CRITICAL' ? 'bg-red-500' :
                      quotaStatus === 'WARNING' ? 'bg-amber-500' :
                      'bg-festac-green'
                    }`}
                    style={{ width: `${dashboard?.quota?.usagePercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-3 sm:pt-4">
                <div className="text-center">
                  <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {dashboard?.quota?.quota?.currentUsage?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Used</p>
                </div>
                <div className="text-center">
                  <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {dashboard?.quota?.remaining?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Remaining</p>
                </div>
                <div className="text-center">
                  <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                    {dashboard?.quota?.quota?.monthlyLimit?.toLocaleString() || 0}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500">Limit</p>
                </div>
              </div>

              {dashboard?.quota?.quota?.reducedMode && (
                <div className="mt-3 sm:mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <p className="text-xs sm:text-sm text-amber-800">
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
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <DollarSign size={18} className="text-festac-green" />
          Cost Savings
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <TrendingDown size={14} className="text-green-600" />
              <span className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Total Saved</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-green-600">
              ₦{String(savings?.savings?.toFixed(2) || 0).replace('.00', '')}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              {savings?.savingsPercentage?.toFixed(1) || 0}% reduction
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Database size={14} className="text-blue-600" />
              <span className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Cache Hits</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-blue-600">
              {savings?.cachedMessages?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              {savings?.savingsPercentage?.toFixed(1) || 0}% saved
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <BarChart3 size={14} className="text-purple-600" />
              <span className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>API Calls</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-purple-600">
              {savings?.apiCalls?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
              Actual messages sent
            </p>
          </div>

          <div className="p-3 sm:p-4 bg-amber-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1 sm:mb-2">
              <Clock size={14} className="text-amber-600" />
              <span className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Total Messages</span>
            </div>
            <p className="text-lg sm:text-2xl font-bold text-amber-600">
              {savings?.totalMessages?.toLocaleString() || 0}
            </p>
            <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1">
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
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <Database size={18} className="text-festac-green" />
          Cache Statistics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.cache?.stats?.total || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Total Entries</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.cache?.stats?.activeEntries || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Active</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.cache?.stats?.totalHits?.toLocaleString() || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Total Hits</p>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <span className={clsx('text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Cache Hit Rate</span>
            <span className="text-base sm:text-lg font-bold text-blue-600">
              {dashboard?.cache?.hitRate?.hitRate?.toFixed(1) || 0}%
            </span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${dashboard?.cache?.hitRate?.hitRate || 0}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Spike Detection */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <Zap size={18} className="text-festac-green" />
          Traffic Spike Detection
        </h2>

        <div className={clsx('flex items-center justify-between p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
          <div className="flex items-center gap-2 sm:gap-3">
            {dashboard?.spike?.spikeDetected ? (
              <AlertTriangle size={20} className="text-red-500" />
            ) : (
              <CheckCircle size={20} className="text-green-500" />
            )}
            <div>
              <p className={clsx('font-semibold text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {dashboard?.spike?.spikeDetected ? 'Spike Detected' : 'Normal Traffic'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
                {dashboard?.spike?.spikeDetected
                  ? `Traffic is ${dashboard?.spike?.multiplier?.toFixed(1) || 0}x normal`
                  : 'No unusual activity detected'
                }
              </p>
            </div>
          </div>
          <Badge variant={dashboard?.spike?.spikeDetected ? 'red' : 'green'}>
            {dashboard?.spike?.spikeDetected ? 'Alert' : 'OK'}
          </Badge>
        </div>
      </motion.div>

      {/* Conversation Stats */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <BarChart3 size={18} className="text-festac-green" />
          Conversation Statistics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.conversations?.today || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Today</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.conversations?.week || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>This Week</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {dashboard?.conversations?.activeNow || 0}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Active Now</p>
          </div>
        </div>
      </motion.div>

      {/* Twilio Circuit Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <CircuitBoard size={18} className="text-festac-green" />
          Twilio Circuit Breaker Status
        </h2>

        <div className={clsx('flex items-center justify-between p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
          <div className="flex items-center gap-2 sm:gap-3">
            {circuitStatus?.isOpen ? (
              <AlertTriangle size={20} className="text-red-500" />
            ) : (
              <CheckCircle size={20} className="text-green-500" />
            )}
            <div>
              <p className={clsx('font-semibold text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {circuitStatus?.isOpen ? 'Circuit Open' : 'Circuit Closed'}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">
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
          <div className="mt-3 sm:mt-4 grid grid-cols-2 gap-3 sm:gap-4">
            <div className={clsx('text-center p-2 sm:p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
              <p className={clsx('text-base sm:text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {circuitStatus.failureCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Failures</p>
            </div>
            <div className={clsx('text-center p-2 sm:p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
              <p className={clsx('text-base sm:text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {circuitStatus.successCount}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500">Successes</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Twilio Queue Status */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={clsx('rounded-xl p-4 sm:p-6 shadow-sm border', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}
      >
        <h2 className={clsx('font-semibold flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base', isDarkMode ? 'text-white' : 'text-gray-900')}>
          <Layers size={18} className="text-festac-green" />
          Twilio Message Queue
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {queueStatus?.pending}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Pending</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {queueStatus?.processing}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Processing</p>
          </div>
          <div className={clsx('text-center p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
            <p className={clsx('text-lg sm:text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {queueStatus?.completed}
            </p>
            <p className={clsx('text-[10px] sm:text-xs mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>Completed</p>
          </div>
        </div>

        {queueStatus && queueStatus.pending > 0 && (
          <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
            <MessageSquare size={14} className="text-blue-600" />
            <p className="text-xs sm:text-sm text-blue-800">
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
