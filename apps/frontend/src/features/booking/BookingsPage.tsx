import { useState } from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Phone, User, CheckCircle, AlertCircle, X, ChevronLeft } from 'lucide-react';
import { useMyBookings, useCancelBooking } from '../../hooks/useVendors';
import { Skeleton, Badge, Button } from '../../components/ui/index';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function BookingsPage() {
  const { isAuthenticated, user } = useAuthStore();
  const { isDarkMode } = useUIStore();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');

  // Fetch user's bookings
  const { data: bookings, isLoading } = useMyBookings();
  const cancelBooking = useCancelBooking();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Please sign in to view your bookings</p>
          <Link href="/">
            <Button variant="primary">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filteredBookings = statusFilter === 'all'
    ? (bookings || [])
    : (bookings || []).filter((b: any) => b.status.toLowerCase() === statusFilter.toLowerCase());

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      await cancelBooking.mutateAsync(bookingId);
      toast.success('Booking cancelled successfully');
    } catch {
      toast.error('Failed to cancel booking');
    }
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
            <div className="flex-1">
              <h1 className="font-display font-bold text-2xl">My Bookings</h1>
              {/*<p className="text-white/60 text-sm mt-1">Manage your appointments and reservations</p>*/}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {(['all', 'pending', 'confirmed', 'completed'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={clsx('flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all', statusFilter === status ? (isDarkMode ? 'bg-white text-festac-green' : 'bg-festac-green text-white') : (isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'))}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-2xl" />
            ))}
          </div>
        ) : !filteredBookings || filteredBookings.length === 0 ? (
          <div className={clsx('rounded-2xl p-12 shadow-card text-center', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
            <Calendar size={40} className={clsx('mx-auto mb-3', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
            <p className={clsx('font-medium', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>No bookings found</p>
            <p className={clsx('text-sm mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>Book an appointment with a vendor to see it here</p>
            <Link href="/discover">
              <Button variant="primary" className="mt-4">Find Vendors</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((booking: any) => (
              <motion.div
                key={booking.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx('rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-shadow', isDarkMode ? 'bg-gray-800' : 'bg-white')}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>{booking.vendor?.businessName}</h3>
                    {booking.customerName && (
                      <p className={clsx('text-sm flex items-center gap-1 mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                        <User size={14} /> {booking.customerName}
                      </p>
                    )}
                  </div>
                  <BookingStatusBadge status={booking.status} />
                </div>

                {/* Booking Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                  <div className={clsx('flex items-center gap-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                    <Calendar size={16} className="text-festac-green flex-shrink-0" />
                    <span>{new Date(booking.scheduledAt).toLocaleDateString('en-NG')}</span>
                  </div>
                  <div className={clsx('flex items-center gap-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                    <Clock size={16} className="text-festac-green flex-shrink-0" />
                    <span>{new Date(booking.scheduledAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {booking.vendor?.address && (
                    <div className={clsx('flex items-center gap-2 col-span-1 sm:col-span-2', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>
                      <MapPin size={16} className="text-festac-green flex-shrink-0" />
                      <span className="truncate">{booking.vendor.address}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {booking.notes && (
                  <div className={clsx('mb-3 p-3 rounded-lg text-sm border-l-2 border-festac-green', isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600')}>
                    <p className={clsx('font-medium mb-1', isDarkMode ? 'text-gray-200' : 'text-gray-700')}>Notes:</p>
                    {booking.notes}
                  </div>
                )}

                {/* Actions */}
                <div className={clsx('flex gap-2 pt-3 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-50')}>
                  {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancelBooking.isPending}
                      className={clsx('flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50', isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-700 hover:bg-red-100')}
                    >
                      Cancel Booking
                    </button>
                  )}
                  {booking.vendor?.whatsappPhone && (
                    <a
                      href={`https://wa.me/${booking.vendor.whatsappPhone.replace(/\D/g, '')}?text=Booking%20confirmation:%20${booking.customerName}%20on%20${new Date(booking.scheduledAt).toLocaleDateString()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clsx('flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors', isDarkMode ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50' : 'bg-green-50 text-green-700 hover:bg-green-100')}
                    >
                      Message on WhatsApp
                    </a>
                  )}
                  {booking.vendor?.phone && (
                    <a
                      href={`tel:${booking.vendor.phone}`}
                      className={clsx('flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors', isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
                    >
                      Call
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { variant: string; label: string; icon: React.ReactNode }> = {
    PENDING: { variant: 'amber', label: 'Pending', icon: <AlertCircle size={14} /> },
    CONFIRMED: { variant: 'green', label: 'Confirmed', icon: <CheckCircle size={14} /> },
    CANCELLED: { variant: 'red', label: 'Cancelled', icon: <AlertCircle size={14} /> },
    COMPLETED: { variant: 'blue', label: 'Completed', icon: <CheckCircle size={14} /> },
    NO_SHOW: { variant: 'gray', label: 'No Show', icon: <AlertCircle size={14} /> },
  };

  const config = statusConfig[status] || { variant: 'gray', label: status, icon: null };

  const colorMap = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    gray: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-medium flex-shrink-0 ${colorMap[config.variant as keyof typeof colorMap]}`}>
      {config.icon}
      {config.label}
    </div>
  );
}
