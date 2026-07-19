import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  BarChart3, MessageCircle, Eye, Star, Calendar, TrendingDown,
  Settings, Bell, ChevronRight, CheckCircle, AlertCircle, Users,
  ArrowUpRight, ArrowDownRight, Wallet, Package, FileText,
  Bot, Megaphone, MessageSquare
} from 'lucide-react';
import { useInvoices, useTaxSummary, useVendorAnalytics, useVendorBookings, useFinancialSummary, useVendorProfile, useProfitLossReport, useSalesAnalytics, useInventoryItems } from '../../hooks/useVendors';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { Skeleton, Badge, Button } from '../../components/ui/index';
import { KPICard } from '../../components/ui/KPICard';
import { formatNaira } from '../../lib/shared';
import { formatCurrencyCompact } from '../../lib/utils';
import { clsx } from 'clsx';

const getPeriodRange = (period: 'week' | 'month' | 'year') => {
  const end = new Date();
  const start = new Date();
  if (period === 'week') start.setDate(end.getDate() - 7);
  else if (period === 'month') start.setDate(end.getDate() - 30);
  else start.setFullYear(end.getFullYear() - 1);
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
};

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const { isDarkMode } = useUIStore();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading: analyticsLoading } = useVendorAnalytics(period);
  const { data: bookings, isLoading: bookingsLoading } = useVendorBookings();
  const { data: financialSummary, isLoading: financialSummaryLoading } = useFinancialSummary();
  const { data: taxSummary, isLoading: taxSummaryLoading } = useTaxSummary();
  const { data: paidInvoices, isLoading: isPaidInvoicesLoading } = useInvoices({ status: 'PAID' });
  const { data: vendorProfile } = useVendorProfile();
  const [, navigate] = useLocation();
  const reportRange = useMemo(() => getPeriodRange(period), [period]);
  const { data: profitLoss, isLoading: profitLossLoading } = useProfitLossReport({ startDate: reportRange.start, endDate: reportRange.end });
  const { data: salesAnalytics, isLoading: salesAnalyticsLoading } = useSalesAnalytics({ startDate: reportRange.start, endDate: reportRange.end });
  const { data: inventoryItems, isLoading: inventoryItemsLoading } = useInventoryItems({ lowStock: 'true' });
  const chartColors = isDarkMode ? ['#6EE7B7', '#34D399', '#22D3EE', '#F87171', '#FBBF24', '#FCD34D', '#A78BFA'] : ['#059669', '#10B981', '#0EA5E9', '#EF4444', '#F59E0B', '#FBBF24', '#8B5CF6'];
  const expenseColors = isDarkMode ? ['#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#FDBA74', '#F97316', '#EF4444'] : ['#EF4444', '#DC2626', '#B91C1C', '#F87171', '#FCA5A5', '#FDBA74', '#7F1D1D'];

  const invoiceVat = useMemo(() =>
    (paidInvoices || []).reduce((sum: number, invoice: any) => sum + Number(invoice.taxAmount || 0), 0),
    [paidInvoices]
  );
  const kpiTotalLiability = (taxSummary?.totalTaxLiability || 0) + invoiceVat;

  const incomeData = useMemo(() => Object.entries(profitLoss?.incomeByCategory || {})
    .map(([name, value]) => ({ name, value: Number(value) }))
    .filter(d => d.value > 0), [profitLoss]);

  const expenseData = useMemo(() => Object.entries(profitLoss?.expenseByCategory || {})
    .map(([name, value]) => ({ name, value: Number(value) }))
    .filter(d => d.value > 0), [profitLoss]);

  const salesTrendData = useMemo(() => {
    const grouped = (salesAnalytics?.salesTrend || []).reduce((acc: Record<string, number>, point: any) => {
      const date = new Date(point.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] || 0) + Number(point.amount);
      return acc;
    }, {});
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount })).slice(-14);
  }, [salesAnalytics]);

  const topProducts = useMemo(() => Object.entries(salesAnalytics?.topProducts || {})
    .map(([name, value]) => ({ name, value: Number(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5), [salesAnalytics]);

  const topServices = useMemo(() => {
    const counts: Record<string, { name: string; revenue: number }> = {};
    (bookings as any[])?.filter((b: any) => ['CONFIRMED', 'COMPLETED'].includes(b.status) && (b.service || b.serviceId))
      .forEach((b: any) => {
        const name = b.service?.name || b.service?.description || 'Service booking';
        const revenue = Number(b.price || 0);
        if (!counts[name]) counts[name] = { name, revenue: 0 };
        counts[name].revenue += revenue;
      });
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [bookings]);

  const recentActivity = useMemo(() => {
    const activities: any[] = [];
    (paidInvoices as any[])?.slice(0, 3).forEach((inv: any) => {
      activities.push({ type: 'invoice', title: `Invoice paid • ${inv.customerName || 'Customer'}`, date: inv.createdAt, amount: Number(inv.total || 0) });
    });
    (bookings as any[])?.filter(b => ['CONFIRMED', 'COMPLETED', 'PENDING'].includes(b.status)).slice(0, 3).forEach((b: any) => {
      activities.push({ type: 'booking', title: `Booking: ${b.customerName || 'Client'}`, date: b.createdAt, amount: Number(b.price || 0) });
    });
    return activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [paidInvoices, bookings]);

  const pendingBookings = (bookings as any[])?.filter((b: any) => b.status === 'PENDING') ?? [];
  const confirmedBookings = (bookings as any[])?.filter((b: any) => b.status === 'CONFIRMED') ?? [];

  // Calculate profile completeness
  const profileCompleteness = {
    hasDescription: !!(vendorProfile?.description && vendorProfile.description.length > 0),
    hasCoverPhoto: !!(vendorProfile?.coverPhoto && vendorProfile.coverPhoto.length > 0),
    hasOpeningHours: !!(vendorProfile?.openingHours && typeof vendorProfile.openingHours === 'object' && Object.keys(vendorProfile.openingHours).length > 0),
    hasProductsOrServices: !!((vendorProfile?.products?.length ?? 0) > 0 || (vendorProfile?.services?.length ?? 0) > 0),
    hasWhatsAppVerified: !!((user as any)?.isPhoneVerified),
  };

  const completedItems = Object.values(profileCompleteness).filter(Boolean).length;
  const totalItems = Object.keys(profileCompleteness).length;
  const completenessPercentage = Math.round((completedItems / totalItems) * 100);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) return 'Good morning,';
    if (hour >= 12 && hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  const periodButtonClass = (p: 'week' | 'month' | 'year') => clsx(
    'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
    period === p
      ? (isDarkMode ? 'bg-white text-festac-green' : 'bg-festac-green text-white')
      : (isDarkMode ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
  );

  return (
    <div className={clsx('min-h-screen pb-10', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div>
            {/*
            <div>
              <p className="text-white/60 text-sm">Vendor Dashboard</p>
              <h1 className="font-display font-bold text-2xl mt-1">
                Good morning, {user?.firstName} 
              </h1>
            </div>
            */}
            {/* Welcome Section */}
            <div className="rounded-lg p-0">
              <h1 className={clsx('text-2xl font-inter font-regular mb-0', isDarkMode ? 'text-white' : 'text-gray-900')}>
                {getGreeting()} {user?.firstName}! 
              </h1>
              <p className={clsx('font-inter text-sm mt-0', isDarkMode ? 'text-white/80' : 'text-gray-600')}>
                Here's your business update..
              </p>
            </div>
          </div>

          {/* ─── FINANCIAL SUMMARY ─────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <KPICard
              icon={<ArrowUpRight size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Income"
              value={formatCurrencyCompact(financialSummary?.income || 0)}
              isLoading={financialSummaryLoading}
            />
            <KPICard
              icon={<ArrowDownRight size={20} className={isDarkMode ? 'text-red-300' : 'text-red-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Expenses"
              value={formatCurrencyCompact(financialSummary?.expense || 0)}
              isLoading={financialSummaryLoading}
              delay={0.1}
            />
            <KPICard
              icon={<Wallet size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20')}
              label="Net Profit"
              value={formatCurrencyCompact(financialSummary?.profit || 0)}
              isLoading={financialSummaryLoading}
              valueClassName={isDarkMode ? ((financialSummary?.profit || 0) >= 0 ? '!text-green-300' : '!text-red-300') : ((financialSummary?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600')}
              delay={0.2}
            />
            <KPICard
              icon={<FileText size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'}/>}
              iconContainerClassName={clsx('p-2 rounded-lg', isDarkMode ? 'bg-red-900/20' : 'bg-red-500/20')}
              label="Tax Liability"
              value={formatCurrencyCompact(kpiTotalLiability)}
              isLoading={taxSummaryLoading || isPaidInvoicesLoading}
              valueClassName={isDarkMode ? '!text-red-300' : 'text-red-600'}
              delay={0.3}
            />
          </div>

          {/* Period selector */}
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              onClick={() => setPeriod('week')}
              className={periodButtonClass('week')}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={periodButtonClass('month')}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={periodButtonClass('year')}
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-5 pt-5">

        {/* ─── BOOKINGS ─────────────────────────────────────── */}
        <div className={clsx('rounded-2xl shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 overflow-hidden order-8 md:col-span-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <div className={clsx('flex items-center justify-between px-5 py-4 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-50')}>
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-festac-green" />
              <h2 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Booking Requests</h2>
              {pendingBookings.length > 0 && (
                <span className="badge bg-festac-amber text-white border-0 text-2xs">{pendingBookings.length} pending</span>
              )}
            </div>
            <button className="text-xs text-festac-green font-semibold flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>

          {bookingsLoading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
            </div>
          ) : (bookings as any[])?.length === 0 ? (
            <div className={clsx('py-12 text-center', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
              <Calendar size={28} className="mx-auto mb-2" />
              <p className="text-sm">No bookings yet</p>
            </div>
          ) : (
            <div className={clsx('divide-y', isDarkMode ? 'divide-gray-700' : 'divide-gray-50')}>
              {(bookings as any[])?.slice(0, 5).map((booking: any) => (
                <div key={booking.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                    <Users size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-medium text-sm', isDarkMode ? 'text-white' : 'text-gray-900')}>{booking.customerName}</p>
                    <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>
                      {new Date(booking.scheduledAt).toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* ─── INCOME & EXPENSE BREAKDOWN ─────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-1 md:col-span-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Income & Expense Breakdown</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h3 className={clsx('text-sm font-medium mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>Income by category</h3>
              {profitLossLoading ? <Skeleton className='h-48 w-full' /> : incomeData.length === 0 ? (
                <div className={clsx('h-48 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No income data</div>
              ) : (
                <ResponsiveContainer width='100%' height={200}>
                  <PieChart>
                    <Pie data={incomeData} dataKey='value' nameKey='name' innerRadius='40%' outerRadius='70%' paddingAngle={3} label>
                      {incomeData.map((_, i) => <Cell key={i} fill={chartColors[i % chartColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div>
              <h3 className={clsx('text-sm font-medium mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>Expense by category</h3>
              {profitLossLoading ? <Skeleton className='h-48 w-full' /> : expenseData.length === 0 ? (
                <div className={clsx('h-48 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No expense data</div>
              ) : (
                <ResponsiveContainer width='100%' height={200}>
                  <PieChart>
                    <Pie data={expenseData} dataKey='value' nameKey='name' innerRadius='40%' outerRadius='70%' paddingAngle={3} label>
                      {expenseData.map((_, i) => <Cell key={i} fill={expenseColors[i % expenseColors.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* ─── SALES TREND ─────────────────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Sales Trend</h2>
          {salesAnalyticsLoading ? <Skeleton className='h-60 w-full' /> : salesTrendData.length === 0 ? (
            <div className={clsx('h-60 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No sales data</div>
          ) : (
            <ResponsiveContainer width='100%' height={250}>
              <LineChart data={salesTrendData}>
                <CartesianGrid strokeDasharray='3 3' stroke={isDarkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey='date' tick={{ fill: isDarkMode ? '#D1D5DB' : '#374151' }} axisLine={{ stroke: isDarkMode ? '#4B5563' : '#E5E7EB' }} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyCompact(Number(v))} tick={{ fill: isDarkMode ? '#D1D5DB' : '#374151' }} axisLine={false} />
                <Tooltip formatter={(value) => formatCurrencyCompact(Number(value))} />
                <Line type='monotone' dataKey='amount' stroke={chartColors[0]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ─── TOP SELLING PRODUCTS ─────────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-4', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Top Selling Products</h2>
          {salesAnalyticsLoading ? <Skeleton className='h-40 w-full' /> : topProducts.length === 0 ? (
            <div className={clsx('h-40 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No product sales</div>
          ) : (
            <div className='space-y-3'>
              {topProducts.map((product, i) => (
                <div key={product.name} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}>{i + 1}</span>
                    <p className={clsx('text-sm font-medium truncate max-w-[180px]', isDarkMode ? 'text-white' : 'text-gray-900')}>{product.name}</p>
                  </div>
                  <span className={clsx('text-sm font-semibold', isDarkMode ? 'text-green-300' : 'text-festac-green')}>{formatCurrencyCompact(product.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── TOP SELLING SERVICES ───────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-5', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Top Selling Services</h2>
          {bookingsLoading ? <Skeleton className='h-40 w-full' /> : topServices.length === 0 ? (
            <div className={clsx('h-40 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No service bookings</div>
          ) : (
            <div className='space-y-3'>
              {topServices.map((service, i) => (
                <div key={service.name} className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <span className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}>{i + 1}</span>
                    <p className={clsx('text-sm font-medium truncate max-w-[180px]', isDarkMode ? 'text-white' : 'text-gray-900')}>{service.name}</p>
                  </div>
                  <span className={clsx('text-sm font-semibold', isDarkMode ? 'text-green-300' : 'text-festac-green')}>{formatCurrencyCompact(service.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── INVENTORY STATUS ───────────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-3', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Inventory Status</h2>
          {inventoryItemsLoading ? <Skeleton className='h-40 w-full' /> : (inventoryItems as any[])?.length === 0 ? (
            <div className={clsx('h-40 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No low-stock items</div>
          ) : (
            <div className='space-y-3'>
              {(inventoryItems as any[])?.slice(0, 5).map((item: any) => (
                <div key={item.id} className='flex items-center justify-between'>
                  <div>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{item.name}</p>
                    <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{item.category || item.categoryRel?.name || 'Uncategorized'}</p>
                  </div>
                  <div className='text-right'>
                    <p className={clsx('text-sm font-semibold', Number(item.quantity) === 0 ? 'text-red-500' : 'text-amber-500')}>{Number(item.quantity)} left</p>
                    <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>min {Number(item.minStock)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── RECENT ACTIVITY FEED ─────────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-6 md:col-span-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Recent Activity</h2>
          {(bookingsLoading || isPaidInvoicesLoading) ? <Skeleton className='h-40 w-full' /> : recentActivity.length === 0 ? (
            <div className={clsx('h-40 flex items-center justify-center text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No recent activity</div>
          ) : (
            <div className='space-y-3'>
              {recentActivity.map((activity, i) => (
                <div key={i} className='flex items-start gap-3'>
                  <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
                    {activity.type === 'invoice' ? <FileText size={14} className='text-festac-green' /> : <Calendar size={14} className='text-festac-green' />}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className={clsx('text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{activity.title}</p>
                    <p className={clsx('text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{new Date(activity.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {activity.amount !== undefined && <span className={clsx('text-sm font-semibold', isDarkMode ? 'text-green-300' : 'text-festac-green')}>{formatCurrencyCompact(activity.amount)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── QUICK ACTIONS ──────────────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-7 md:col-span-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Quick Actions</h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3'>
            {[
              { label: 'Add Income', icon: <Wallet size={18} />, onClick: () => navigate('/financial/income') },
              { label: 'Add Expense', icon: <TrendingDown size={18} />, onClick: () => navigate('/financial/expense') },
              { label: 'Inventory', icon: <Package size={18} />, onClick: () => navigate('/inventory') },
              { label: 'Invoices', icon: <FileText size={18} />, onClick: () => navigate('/financial/invoices') },
              { label: 'Profile', icon: <Users size={18} />, onClick: () => navigate('/profile') },
              { label: 'Verification', icon: <CheckCircle size={18} />, onClick: () => navigate('/dashboard/verification') },
            ].map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={clsx('flex flex-col items-center gap-2 p-4 rounded-xl transition-colors', isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-700')}
              >
                <span className='text-festac-green'>{action.icon}</span>
                <span className='text-xs font-medium'>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        

        {/* ─── ANALYTICS CARDS ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 order-9 md:col-span-2">
          {[
            { label: 'Profile Views', value: analytics?.profileViews, icon: <Eye size={18} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />, iconContainerClassName: clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDarkMode ? 'bg-green-900/30' : 'bg-green-50') },
            { label: 'WhatsApp Clicks', value: analytics?.whatsappClicks, icon: <MessageCircle size={18} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />, iconContainerClassName: clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDarkMode ? 'bg-green-900/30' : 'bg-green-50') },
            { label: 'Booking Requests', value: analytics?.bookingRequests, icon: <Calendar size={18} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />, iconContainerClassName: clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDarkMode ? 'bg-green-900/30' : 'bg-green-50') },
          ].map((stat, index) => (
            <KPICard
              key={stat.label}
              icon={stat.icon}
              iconContainerClassName={stat.iconContainerClassName}
              label={stat.label}
              value={(stat.value ?? 0).toLocaleString()}
              isLoading={analyticsLoading}
              valueClassName="text-4xl font-display font-black"
              labelPosition="bottom"
              labelClassName="mt-0.5"
              containerClassName={clsx('rounded-2xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 gap-0', isDarkMode ? 'bg-gray-800' : 'bg-white')}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* ─── PROFILE COMPLETENESS ──────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 order-10 md:col-span-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <div className="flex items-center justify-between mb-3">
            <h2 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>Profile Completeness</h2>
            <span className="text-sm font-bold text-festac-green">{completenessPercentage}%</span>
          </div>
          <div className={clsx('w-full rounded-full h-2 mb-4', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
            <div className="bg-festac-green h-2 rounded-full transition-all duration-1000" style={{ width: `${completenessPercentage}%` }} />
          </div>
          <div className="space-y-2">
            {[
              { label: 'Business description', done: profileCompleteness.hasDescription },
              { label: 'Cover photo uploaded', done: profileCompleteness.hasCoverPhoto },
              { label: 'Opening hours set', done: profileCompleteness.hasOpeningHours },
              { label: 'Products/Services added', done: profileCompleteness.hasProductsOrServices },
              { label: 'WhatsApp number verified', done: profileCompleteness.hasWhatsAppVerified },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                ) : (
                  <AlertCircle size={14} className="text-amber-400 flex-shrink-0" />
                )}
                <span className={item.done ? (isDarkMode ? 'text-gray-300' : 'text-gray-600') : (isDarkMode ? 'text-gray-500' : 'text-gray-400')}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: any; label: string }> = {
    PENDING: { variant: 'amber', label: 'Pending' },
    CONFIRMED: { variant: 'green', label: 'Confirmed' },
    CANCELLED: { variant: 'red', label: 'Cancelled' },
    COMPLETED: { variant: 'blue', label: 'Completed' },
    NO_SHOW: { variant: 'gray', label: 'No Show' },
  };
  const { variant, label } = map[status] ?? { variant: 'gray', label: status };
  return <Badge variant={variant}>{label}</Badge>;
}
