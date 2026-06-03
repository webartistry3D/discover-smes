import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, BarChart3, FileText, Download, Calendar, Filter } from 'lucide-react';
import { useProfitLossReport, useCashFlowReport, useSalesAnalytics, useTaxSummaryReport } from '../../hooks/useVendors';
import { Button, Skeleton } from '../../components/ui/index';
import toast from 'react-hot-toast';

type ReportTab = 'profit-loss' | 'cash-flow' | 'sales-analytics' | 'tax-summary';

export default function FinancialReportsPage() {
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center">
            <Link href="/dashboard">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-2xl">Financial Reports</h1>
              <p className="text-white/60 text-sm mt-1">Analyze your business financial performance</p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-2 bg-white/10 rounded-lg p-2">
              {(['month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    period === p ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'profit-loss' && profitLossData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Total Revenue</p>
                    <p className="text-2xl font-bold text-white mt-1">₦{profitLossData.totalRevenue?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp size={20} className="text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Total Expenses</p>
                    <p className="text-2xl font-bold text-white mt-1">₦{profitLossData.totalExpenses?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <TrendingDown size={20} className="text-red-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">Gross Profit</p>
                    <p className={`text-2xl font-bold mt-1 ${(profitLossData.grossProfit || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                      ₦{profitLossData.grossProfit?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${(profitLossData.grossProfit || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <DollarSign size={20} className={(profitLossData.grossProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'} />
                  </div>
                </div>
              </div>
            </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center mt-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Calendar size={18} className="text-white/70" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full sm:w-auto bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-white/60">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full sm:w-auto bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
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
        <div className="overflow-x-auto mb-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-2 min-w-max py-2">
            <button
              onClick={() => setActiveTab('profit-loss')}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md ${
                activeTab === 'profit-loss' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={16} className="inline mr-2" />
              Profit & Loss
            </button>
            <button
              onClick={() => setActiveTab('cash-flow')}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md ${
                activeTab === 'cash-flow' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign size={16} className="inline mr-2" />
              Cash Flow
            </button>
            <button
              onClick={() => setActiveTab('sales-analytics')}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md ${
                activeTab === 'sales-analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={16} className="inline mr-2" />
              Sales Analytics
            </button>
            <button
              onClick={() => setActiveTab('tax-summary')}
              className={`px-3 py-2 text-sm font-medium whitespace-nowrap rounded-md ${
                activeTab === 'tax-summary' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText size={16} className="inline mr-2" />
              Tax Summary
            </button>
          </div>
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
                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Gross Margin</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all"
                        style={{ width: `${Math.min(profitLossData.grossMargin || 0, 100)}%` }}
                      />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{profitLossData.grossMargin?.toFixed(1) || 0}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Revenue by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(profitLossData.incomeByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="font-medium text-gray-900">₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(profitLossData.expenseByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="font-medium text-gray-900">₦{Number(amount).toLocaleString()}</span>
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
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Operating Cash Flow</p>
                    <p className={`text-xl font-bold mt-1 ${(cashFlowData.operatingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{cashFlowData.operatingCashFlow?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Investing Cash Flow</p>
                    <p className={`text-xl font-bold mt-1 ${(cashFlowData.investingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{cashFlowData.investingCashFlow?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Financing Cash Flow</p>
                    <p className={`text-xl font-bold mt-1 ${(cashFlowData.financingCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{cashFlowData.financingCashFlow?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Net Cash Flow</p>
                    <p className={`text-2xl font-bold mt-1 ${(cashFlowData.netCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{cashFlowData.netCashFlow?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Cash Flow Transactions</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {cashFlowData.cashFlows?.map((flow: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${flow.type === 'INFLOW' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {flow.type === 'INFLOW' ? (
                              <TrendingUp size={16} className="text-green-600" />
                            ) : (
                              <TrendingDown size={16} className="text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{flow.category}</p>
                            <p className="text-xs text-gray-500">{new Date(flow.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <span className={`font-semibold ${flow.type === 'INFLOW' ? 'text-green-600' : 'text-red-600'}`}>
                          {flow.type === 'INFLOW' ? '+' : '-'}₦{flow.amount.toLocaleString()}
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
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₦{salesData.totalSales?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesData.totalOrders || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₦{salesData.averageOrderValue?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{salesData.conversionRate?.toFixed(1) || 0}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Sales by Category</h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.salesByCategory || {}).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{category}</span>
                          <span className="font-medium text-gray-900">₦{Number(amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Top Products</h3>
                    <div className="space-y-3">
                      {Object.entries(salesData.topProducts || {}).slice(0, 5).map(([product, amount]) => (
                        <div key={product} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{product}</span>
                          <span className="font-medium text-gray-900">₦{Number(amount).toLocaleString()}</span>
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
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Total Tax Liability</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">₦{taxData.totalTaxLiability?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Total Tax Paid</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">₦{taxData.totalTaxPaid?.toLocaleString() || 0}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Tax Balance</p>
                    <p className={`text-2xl font-bold mt-1 ${(taxData.taxBalance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₦{taxData.taxBalance?.toLocaleString() || 0}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <p className="text-sm text-gray-600">Net VAT</p>
                    <p className={`text-2xl font-bold mt-1 ${(taxData.netVat || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₦{taxData.netVat?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Filing Status</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pending Filings</span>
                        <span className="font-medium text-yellow-600">{taxData.pendingFilings || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Overdue Filings</span>
                        <span className="font-medium text-red-600">{taxData.overdueFilings || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">VAT Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">VAT Collected</span>
                        <span className="font-medium text-gray-900">₦{taxData.vatCollected?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">VAT Paid</span>
                        <span className="font-medium text-gray-900">₦{taxData.vatPaid?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur rounded-xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Tax Records</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {taxData.taxRecords?.map((record: any) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{record.type}</p>
                          <p className="text-xs text-gray-500">Period: {record.period}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₦{record.taxAmount.toLocaleString()}</p>
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
