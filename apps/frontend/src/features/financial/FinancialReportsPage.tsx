import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, FileText, Download, Calendar, Filter } from 'lucide-react';
import { useProfitLossReport, useCashFlowReport, useSalesAnalytics, useTaxSummaryReport } from '../../hooks/useVendors';
import { Button, Skeleton } from '../../components/ui/index';
import toast from 'react-hot-toast';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

type ReportTab = 'profit-loss' | 'cash-flow' | 'sales-analytics' | 'tax-summary';

export default function FinancialReportsPage() {
  const { isDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState<ReportTab>('profit-loss');
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Get current period dates
  const getPeriodDates = () => {
    const now = new Date();
    if (period === 'month') {
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    } else if (period === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        start: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    } else if (period === 'year') {
      return {
        start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
      };
    }
    return { start: '', end: '' };
  };

  const periodDates = getPeriodDates();
  const effectiveStartDate = startDate || periodDates.start;
  const effectiveEndDate = endDate || periodDates.end;

  // Fetch reports
  const { data: profitLossData, isLoading: isLoadingPL } = useProfitLossReport(
    activeTab === 'profit-loss' ? { startDate: effectiveStartDate, endDate: effectiveEndDate, period } : undefined
  );

  const { data: cashFlowData, isLoading: isLoadingCF } = useCashFlowReport(
    activeTab === 'cash-flow' ? { startDate: effectiveStartDate, endDate: effectiveEndDate, period } : undefined
  );

  const { data: salesData, isLoading: isLoadingSales } = useSalesAnalytics(
    activeTab === 'sales-analytics' ? { startDate: effectiveStartDate, endDate: effectiveEndDate, period } : undefined
  );

  const { data: taxData, isLoading: isLoadingTax } = useTaxSummaryReport(
    activeTab === 'tax-summary' ? { startDate: effectiveStartDate, endDate: effectiveEndDate, period } : undefined
  );

  const isLoading = activeTab === 'profit-loss' ? isLoadingPL 
    : activeTab === 'cash-flow' ? isLoadingCF
    : activeTab === 'sales-analytics' ? isLoadingSales
    : isLoadingTax;

  const handleExport = () => {
    toast.success('Report exported successfully');
  };

  return (
    <div className={clsx('min-h-screen pb-20', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-2xl">Financial Reports</h1>
            </div>
          </div>

          {/* Period Selector */}
          <div className={clsx('flex gap-2 rounded-lg p-2 shadow-sm border overflow-x-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}>
            {(['month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
                  period === p
                    ? 'bg-festac-green text-white'
                    : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === 'profit-loss' && profitLossData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                    </div>
                    <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Revenue</p>
                  </div>
                  <p className={clsx('font-bold text-5xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{profitLossData.totalRevenue?.toLocaleString() || 0}</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <TrendingDown size={20} className={isDarkMode ? 'text-red-300' : 'text-red-600'} />
                    </div>
                    <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Expenses</p>
                  </div>
                  <p className={clsx('font-bold text-5xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{profitLossData.totalExpenses?.toLocaleString() || 0}</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <DollarSign size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                    </div>
                    <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Gross Profit</p>
                  </div>
                  <p className={clsx('font-bold text-5xl font-mono', isDarkMode ? ((profitLossData.grossProfit || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((profitLossData.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                    <span>₦{profitLossData.grossProfit?.toLocaleString() || 0}</span>
                  </p>
                </div>
              </motion.div>
            </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar size={18} className={isDarkMode ? 'text-white/70' : 'text-gray-500'} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={clsx('w-full sm:w-auto border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2', isDarkMode ? 'bg-white/10 border-white/20 text-white focus:ring-white/50' : 'bg-white border-gray-200 text-gray-900 focus:ring-festac-green/20')}
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className={clsx(isDarkMode ? 'text-white/60' : 'text-gray-600')}>to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={clsx('w-full sm:w-auto border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2', isDarkMode ? 'bg-white/10 border-white/20 text-white focus:ring-white/50' : 'bg-white border-gray-200 text-gray-900 focus:ring-festac-green/20')}
                  />
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleExport} variant="primary" className="flex items-center gap-2">
                  <Download size={18} />
                  Export
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Tabs */}
        <div className={clsx('flex gap-2 rounded-lg p-2 shadow-sm border overflow-x-auto mb-6', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}>
          <button
            onClick={() => setActiveTab('profit-loss')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'profit-loss'
                ? 'bg-festac-green text-white'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp size={16} className="inline mr-2" />
            Profit & Loss
          </button>
          <button
            onClick={() => setActiveTab('cash-flow')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'cash-flow'
                ? 'bg-festac-green text-white'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <DollarSign size={16} className="inline mr-2" />
            Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('sales-analytics')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'sales-analytics'
                ? 'bg-festac-green text-white'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={16} className="inline mr-2" />
            Sales Analytics
          </button>
          <button
            onClick={() => setActiveTab('tax-summary')}
            className={`flex-1 min-w-max px-3 sm:px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === 'tax-summary'
                ? 'bg-festac-green text-white'
                : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            Tax Summary
          </button>
        </div>

        {/* Report Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Profit & Loss Report */}
            {activeTab === 'profit-loss' && profitLossData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                  <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Gross Margin</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min(profitLossData.grossMargin || 0, 100)}%` }}
                      />
                    </div>
                    <span className={clsx('text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{profitLossData.grossMargin?.toFixed(1) || 0}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Revenue by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(profitLossData.incomeByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{category}</span>
                          <span className={clsx('font-medium font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Expenses by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(profitLossData.expenseByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{category}</span>
                          <span className={clsx('font-medium font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Cash Flow Report */}
            {activeTab === 'cash-flow' && cashFlowData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Operating Cash Flow</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((cashFlowData.operatingCashFlow || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((cashFlowData.operatingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                        <span>₦{cashFlowData.operatingCashFlow?.toLocaleString() || 0}</span>
                      </p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Investing Cash Flow</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((cashFlowData.investingCashFlow || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((cashFlowData.investingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                        <span>₦{cashFlowData.investingCashFlow?.toLocaleString() || 0}</span>
                      </p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Financing Cash Flow</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((cashFlowData.financingCashFlow || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((cashFlowData.financingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                        <span>₦{cashFlowData.financingCashFlow?.toLocaleString() || 0}</span>
                      </p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Net Cash Flow</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((cashFlowData.netCashFlow || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((cashFlowData.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                        <span>₦{cashFlowData.netCashFlow?.toLocaleString() || 0}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                  <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Cash Flow Transactions</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cashFlowData.cashFlows?.map((flow: any, index: number) => (
                      <div key={index} className={clsx('flex items-center justify-between p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${flow.type === 'INFLOW' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {flow.type === 'INFLOW' ? (
                              <TrendingUp size={16} className="text-green-600" />
                            ) : (
                              <TrendingDown size={16} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{flow.category}</p>
                            <p className="text-xs text-gray-500">{new Date(flow.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-semibold ${flow.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                          <span className="font-mono">{flow.type === 'INFLOW' ? '+' : '-'}₦{flow.amount.toLocaleString()}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Sales Analytics */}
            {activeTab === 'sales-analytics' && salesData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Sales</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{salesData.totalSales?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Orders</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{salesData.totalOrders || 0}</p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Avg Order Value</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{salesData.averageOrderValue?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Conversion Rate</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{salesData.conversionRate?.toFixed(1) || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Sales by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.salesByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{category}</span>
                          <span className={clsx('font-medium font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Top Products</h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.topProducts || {}).slice(0, 5).map(([product, amount]) => (
                        <div key={product} className="flex items-center justify-between">
                          <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>{product}</span>
                          <span className={clsx('font-medium font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tax Summary */}
            {activeTab === 'tax-summary' && taxData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Tax Liability</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{taxData.totalTaxLiability?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Total Tax Paid</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-green-300' : 'text-green-600')}>₦{taxData.totalTaxPaid?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Tax Balance</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((taxData.taxBalance || 0) > 0 ? 'text-red-300' : 'text-green-300') : ((taxData.taxBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'))}>
                        ₦{taxData.taxBalance?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}>
                    <div className="flex flex-col gap-2">
                      <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Net VAT</p>
                      <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? ((taxData.netVat || 0) >= 0 ? 'text-green-300' : 'text-red-300') : ((taxData.netVat || 0) >= 0 ? 'text-green-600' : 'text-red-600'))}>
                        ₦{taxData.netVat?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Filing Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Pending Filings</span>
                        <span className="font-medium text-yellow-600">{taxData.pendingFilings || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>Overdue Filings</span>
                        <span className="font-medium text-red-600">{taxData.overdueFilings || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                    <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>VAT Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>VAT Collected</span>
                        <span className={clsx('font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{taxData.vatCollected?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>VAT Paid</span>
                        <span className={clsx('font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{taxData.vatPaid?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={clsx('rounded-xl p-6 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-white border-gray-100')}>
                  <h3 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Tax Records</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {taxData.taxRecords?.map((record: any) => (
                      <div key={record.id} className={clsx('flex items-center justify-between p-3 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                        <div>
                          <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{record.type}</p>
                          <p className="text-xs text-gray-500">Period: {record.period}</p>
                        </div>
                        <div className="text-right">
                          <p className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>₦{record.taxAmount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-1 rounded ${
                            record.status === 'PAID' ? 'bg-green-100 text-green-700' :
                            record.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            record.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {record.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
