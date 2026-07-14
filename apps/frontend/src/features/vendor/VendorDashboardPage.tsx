import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, MessageCircle, Eye, Star, Calendar, TrendingUp,
  Settings, Bell, ChevronRight, CheckCircle, AlertCircle, Users,
  ArrowUpRight, ArrowDownRight, Wallet, Package, FileText,
  PieChart, Bot, Megaphone, MessageSquare, DollarSign
} from 'lucide-react';
import { useVendorAnalytics, useVendorBookings, useFinancialSummary, useVendorProfile } from '../../hooks/useVendors';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { Skeleton, Badge, Button } from '../../components/ui/index';
import { formatNaira } from '../../lib/shared';
import { formatCurrencyCompact } from '../../lib/utils';
import { clsx } from 'clsx';

export default function VendorDashboardPage() {
  const { user } = useAuthStore();
  const { isDarkMode } = useUIStore();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading: analyticsLoading } = useVendorAnalytics(period);
  const { data: bookings, isLoading: bookingsLoading } = useVendorBookings();
  const { data: financialSummary } = useFinancialSummary();
  const { data: vendorProfile } = useVendorProfile();

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
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <ArrowUpRight size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Income</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {formatCurrencyCompact(financialSummary?.income || 0)}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <ArrowDownRight size={20} className={isDarkMode ? 'text-red-300' : 'text-red-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Expenses</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>
                  {formatCurrencyCompact(financialSummary?.expense || 0)}
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={clsx('rounded-xl p-4 border', isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200')}
            >
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Wallet size={20} className={isDarkMode ? 'text-blue-300' : 'text-blue-600'} />
                  </div>
                  <p className={clsx('text-xs', isDarkMode ? 'text-white/60' : 'text-gray-500')}>Net Profit</p>
                </div>
                <p className={clsx('font-bold text-6xl font-mono', isDarkMode ? (financialSummary?.profit >= 0 ? 'text-green-300' : 'text-red-300') : (financialSummary?.profit >= 0 ? 'text-green-600' : 'text-red-600'))}>
                  {formatCurrencyCompact(financialSummary?.profit || 0)}
                </p>
              </div>
            </motion.div>
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-5 pt-5">

        {/* ─── ANALYTICS CARDS ──────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Profile Views', value: analytics?.profileViews, icon: <Eye size={18} />, color: 'blue' },
            { label: 'WhatsApp Clicks', value: analytics?.whatsappClicks, icon: <MessageCircle size={18} />, color: 'green' },
            { label: 'Booking Requests', value: analytics?.bookingRequests, icon: <Calendar size={18} />, color: 'purple' },
            //{ label: 'New Reviews', value: analytics?.newReviews, icon: <Star size={18} />, color: 'amber' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx('rounded-2xl p-4 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}
            >
              {analyticsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-7 w-1/2" />
                </div>
              ) : (
                <>
                  <div className={clsx('w-8 h-8 rounded-xl flex items-center justify-center mb-2', isDarkMode ? `bg-${stat.color}-900/30 text-${stat.color}-400` : `bg-${stat.color}-50 text-${stat.color}-600`)}>
                    {stat.icon}
                  </div>
                  <p className={clsx('text-4xl font-display font-black font-mono', isDarkMode ? 'text-white' : 'text-gray-900')}>{(stat.value ?? 0).toLocaleString()}</p>
                  <p className={clsx('text-xs mt-0.5', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{stat.label}</p>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {/* ─── BOOKINGS ─────────────────────────────────────── */}
        <div className={clsx('rounded-2xl shadow-card overflow-hidden', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
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

        {/* ─── QUICK ACTIONS ──────────────────────────────────── */}

        {/* ─── PROFILE COMPLETENESS ──────────────────────────── */}
        <div className={clsx('rounded-2xl p-5 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
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
