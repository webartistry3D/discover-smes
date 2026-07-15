import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { ChevronLeft, BarChart3, TrendingUp, Users, Eye, Calendar, ArrowUp, ArrowDown, DollarSign } from 'lucide-react';
import { Skeleton } from '../../components/ui/index';
import { KPICard } from '../../components/ui/KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useVendorAnalytics } from '../../hooks/useVendors';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';

export default function VendorAnalyticsPage() {
  const { isDarkMode } = useUIStore();
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: analytics, isLoading: analyticsLoading } = useVendorAnalytics(period);

  // Transform analytics data for charts
  const profileViewsData = analytics?.profileViewsTrend || [];
  const bookingTrendsData = analytics?.bookingTrends || [];

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* Header */}
      <div className="bg-gradient-hero text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard">
              <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                <ChevronLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="font-display font-bold text-2xl">Full Analytics</h1>
              {/*<p className="text-white/60 text-sm mt-1">Detailed performance data and insights</p>*/}
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2 mt-5">
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'week' ? 'bg-white text-festac-green' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'month' ? 'bg-white text-festac-green' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              This Month
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${period === 'year' ? 'bg-white text-festac-green' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              This Year
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              icon: <Eye size={18} />,
              label: 'Profile Views',
              value: analytics?.profileViews?.toLocaleString() || '0',
              change: analytics?.profileViewsChange || '+0%',
              positive: (analytics?.profileViewsChange || '+0%').includes('+'),
            },
            {
              icon: <Users size={18} />,
              label: 'New Followers',
              value: analytics?.newFollowers?.toLocaleString() || '0',
              change: analytics?.followersChange || '+0%',
              positive: (analytics?.followersChange || '+0%').includes('+'),
            },
            {
              icon: <Calendar size={18} />,
              label: 'Bookings',
              value: analytics?.bookings?.toLocaleString() || '0',
              change: analytics?.bookingsChange || '+0%',
              positive: (analytics?.bookingsChange || '+0%').includes('+'),
            },
            {
              icon: <DollarSign size={18} />,
              label: 'Revenue',
              value: `₦${(analytics?.revenue || 0).toLocaleString()}`,
              change: analytics?.revenueChange || '+0%',
              positive: (analytics?.revenueChange || '+0%').includes('+'),
            },
          ].map((stat, index) => (
            <KPICard
              key={stat.label}
              icon={stat.icon}
              iconContainerClassName="p-2 bg-festac-green/10 rounded-xl text-festac-green"
              topRight={
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  {stat.change}
                </div>
              }
              label={stat.label}
              value={stat.value}
              isLoading={analyticsLoading}
              labelPosition="bottom"
              containerClassName={clsx('rounded-2xl p-4 shadow-card gap-2', isDarkMode ? 'bg-gray-800' : 'bg-white')}
              delay={index * 0.05}
            />
          ))}
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
