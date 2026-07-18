import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, BarChart3, TrendingUp, Users, Eye, Calendar } from 'lucide-react';
import { Skeleton } from '../../components/ui/index';
import { KPICard } from '../../components/ui/KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useVendorAnalytics } from '../../hooks/useVendors';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { formatCurrencyCompact } from '../../lib/utils';

export default function VendorAnalyticsPage() {
  const { isDarkMode } = useUIStore();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading: analyticsLoading } = useVendorAnalytics(period);

  const periodButtonClass = (active: boolean) => clsx(
    'min-w-max px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
    active
      ? (isDarkMode ? 'bg-white text-festac-green' : 'bg-festac-green text-white')
      : (isDarkMode ? 'text-gray-300 hover:bg-white/10' : 'text-gray-600 hover:bg-gray-100')
  );

  // Transform analytics data for charts
  const profileViewsData = analytics?.profileViewsTrend || [];
  const bookingTrendsData = analytics?.bookingTrends || [];

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className={clsx('shadow-sm', isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900')}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-600')}>
                <ChevronLeft size={20} />
              </button>
            </Link>
          <div className="flex-1">
            <h1 className="font-display font-bold text-2xl">Full Analytics</h1>
          </div>
        </div>
      </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Eye size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />,
              iconContainerClassName: clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20'),
              label: 'Profile Views',
              value: analytics?.profileViews?.toLocaleString() || '0',
              change: analytics?.profileViewsChange || '+0%',
              positive: (analytics?.profileViewsChange || '+0%').includes('+'),
            },
            {
              icon: <Users size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />,
              iconContainerClassName: clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20'),
              label: 'New Followers',
              value: analytics?.newFollowers?.toLocaleString() || '0',
              change: analytics?.followersChange || '+0%',
              positive: (analytics?.followersChange || '+0%').includes('+'),
            },
            {
              icon: <Calendar size={20} className={isDarkMode ? 'text-green-300' : 'text-green-600'} />,
              iconContainerClassName: clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20'),
              label: 'Bookings',
              value: analytics?.bookings?.toLocaleString() || '0',
              change: analytics?.bookingsChange || '+0%',
              positive: (analytics?.bookingsChange || '+0%').includes('+'),
            },
            {
              icon: <span className={clsx('text-xl font-semibold', isDarkMode ? 'text-green-300' : 'text-green-600')}>₦</span>,
              iconContainerClassName: clsx('p-2 rounded-lg', isDarkMode ? 'bg-green-900/20' : 'bg-green-500/20'),
              label: 'Revenue',
              value: formatCurrencyCompact(analytics?.revenue || 0),
              change: analytics?.revenueChange || '+0%',
              positive: (analytics?.revenueChange || '+0%').includes('+'),
            },
          ].map((stat, index) => (
            <KPICard
              key={stat.label}
              icon={stat.icon}
              iconContainerClassName={stat.iconContainerClassName}
              label={stat.label}
              value={stat.value}
              isLoading={analyticsLoading}
              delay={index * 0.1}
            />
          ))}
        </div>
        {/* Period Selector */}
          <div className={clsx('flex gap-2 rounded-lg p-2 shadow-sm border overflow-x-auto', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}>
            <button
              onClick={() => setPeriod('week')}
              className={periodButtonClass(period === 'week')}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={periodButtonClass(period === 'month')}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={periodButtonClass(period === 'year')}
            >
              This Year
            </button>
          </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className={clsx('rounded-2xl p-5 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <BarChart3 className="w-5 h-5 text-festac-green" />
              Profile Views Over Time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profileViewsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: isDarkMode ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Current Period"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="previous" 
                    stroke="#9ca3af" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#9ca3af', strokeWidth: 2, r: 4 }}
                    name="Previous Period"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={clsx('rounded-2xl p-5 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <h2 className={clsx('font-semibold mb-4 flex items-center gap-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
              <TrendingUp className="w-5 h-5 text-festac-green" />
              Booking Trends
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                      border: isDarkMode ? '#374151' : '#e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: isDarkMode ? '#f3f4f6' : '#1f2937'
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="completed" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                    name="Completed"
                  />
                  <Bar 
                    dataKey="pending" 
                    fill="#f59e0b" 
                    radius={[4, 4, 0, 0]}
                    name="Pending"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className={clsx('rounded-2xl p-5 shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <h2 className={clsx('font-semibold mb-4', isDarkMode ? 'text-white' : 'text-gray-900')}>Detailed Metrics</h2>
          {analyticsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { metric: 'Average Session Duration', value: analytics?.avgSessionDuration || '0:00', change: analytics?.sessionDurationChange || '+0%' },
                { metric: 'Bounce Rate', value: analytics?.bounceRate || '0%', change: analytics?.bounceRateChange || '+0%' },
                { metric: 'Conversion Rate', value: analytics?.conversionRate || '0%', change: analytics?.conversionRateChange || '+0%' },
                { metric: 'Customer Satisfaction', value: analytics?.customerSatisfaction || '0/5', change: analytics?.satisfactionChange || '+0%' },
              ].map((item, index) => (
                <div key={index} className={clsx('flex items-center justify-between p-4 rounded-xl', isDarkMode ? 'bg-gray-700' : 'bg-gray-50')}>
                  <div>
                    <p className={clsx('font-medium', isDarkMode ? 'text-white' : 'text-gray-900')}>{item.metric}</p>
                    <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>vs previous period</p>
                  </div>
                  <div className="text-right">
                    <p className={clsx('font-bold', isDarkMode ? 'text-white' : 'text-gray-900')}>{item.value}</p>
                    <p className={clsx('text-sm', item.change.includes('+') ? 'text-green-600' : item.change.includes('-') ? 'text-red-600' : 'text-gray-600')}>{item.change}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
