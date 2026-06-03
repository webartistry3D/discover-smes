import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Phone, ChevronLeft, CheckCircle, MessageCircle } from 'lucide-react';
import { useVendorDetail, useCreateBooking } from '../../hooks/useVendors';
import { useAuthStore } from '../../stores/auth.store';
import { Button, Spinner } from '../../components/ui/index';
import { generateWhatsAppUrl } from '../../lib/shared';
import toast from 'react-hot-toast';

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00', '16:30', '17:00',
];

export default function BookingPage() {
  const { vendorId } = useParams<{ vendorId: string }>();
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuthStore();
  const { data: vendor, isLoading } = useVendorDetail(vendorId!);
  const createBooking = useCreateBooking();

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [notes, setNotes] = useState('');
  const [customerName, setCustomerName] = useState(`${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim());
  const [customerPhone, setCustomerPhone] = useState(user?.phone ?? '');
  const [step, setStep] = useState<'details' | 'confirm' | 'success'>('details');

  // Build min date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  // Build max date (60 days out)
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 60);
  const maxDateStr = maxDate.toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !customerName || !customerPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`);

    try {
      await createBooking.mutateAsync({
        vendorId: vendorId!,
        serviceId: selectedServiceId || undefined,
        scheduledAt: scheduledAt.toISOString(),
        notes,
        customerName,
        customerPhone,
      });
      setStep('success');
    } catch {
      // Error handled by mutation
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );

  if (!vendor) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Vendor not found</p>
    </div>
  );

  if (step === 'success') return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-card-hover"
      >
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-green-600" />
        </div>
        <h2 className="font-display font-bold text-xl text-gray-900">Booking Confirmed!</h2>
        <p className="text-gray-500 text-sm mt-2">
          Your appointment at <strong>{vendor.businessName}</strong> on {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long' })} at {selectedTime} has been requested.
        </p>
        <p className="text-gray-400 text-xs mt-3">The vendor will confirm via WhatsApp shortly.</p>

        <div className="flex flex-col gap-3 mt-6">
          {vendor.whatsappPhone && (
            <a
              href={generateWhatsAppUrl(vendor.whatsappPhone, `Hi! I just booked an appointment for ${selectedDate} at ${selectedTime}. Please confirm.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp w-full justify-center py-3"
            >
              <MessageCircle size={16} />
              Confirm on WhatsApp
            </a>
          )}
          <Button variant="secondary" onClick={() => navigate(`/vendors/${vendor.slug}`)}>
            Back to Business
          </Button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate(`/vendors/${vendor.slug}`)} className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">Book Appointment</h1>
            <p className="text-xs text-gray-400">{vendor.businessName}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Service selection */}
        {vendor.services?.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <h3 className="font-semibold text-gray-900 mb-3">Select Service</h3>
            <div className="space-y-2">
              <button
                onClick={() => setSelectedServiceId('')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors text-left ${!selectedServiceId ? 'border-festac-green bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <span className="text-sm font-medium text-gray-700">General / Not sure</span>
              </button>
              {vendor.services.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-colors text-left ${selectedServiceId === s.id ? 'border-festac-green bg-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    {s.durationMinutes && <p className="text-xs text-gray-400">{s.durationMinutes} min</p>}
                  </div>
                  {s.price && <p className="text-sm font-bold text-festac-green">₦{Number(s.price).toLocaleString()}</p>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date & Time */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-festac-green" /> Date & Time
          </h3>

          {/* Date picker */}
          <div className="mb-4">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={minDateStr}
              max={maxDateStr}
              className="input"
            />
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-2 block">Select Time</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-colors ${
                      selectedTime === slot
                        ? 'bg-festac-green text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Details */}
        <div className="bg-white rounded-2xl p-5 shadow-card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User size={16} className="text-festac-green" /> Your Details
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Phone Number *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+234 801 234 5678"
                className="input"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1.5 block">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information for the vendor..."
                rows={3}
                className="input resize-none"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {selectedDate && selectedTime && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-festac-green/5 border border-festac-green/20 rounded-2xl p-4"
          >
            <p className="text-sm font-semibold text-festac-green mb-1">Booking Summary</p>
            <p className="text-sm text-gray-700">
              {new Date(`${selectedDate}T${selectedTime}`).toLocaleDateString('en-NG', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })} at {selectedTime}
            </p>
            <p className="text-xs text-gray-500 mt-1">{vendor.businessName} · {vendor.address}</p>
          </motion.div>
        )}

        {/* Submit */}
        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          loading={createBooking.isPending}
          disabled={!selectedDate || !selectedTime || !customerName || !customerPhone}
          className="w-full"
          icon={<Calendar size={18} />}
        >
          Confirm Booking
        </Button>

        <p className="text-xs text-gray-400 text-center">
          Your booking will be confirmed by the vendor. You'll receive a notification via WhatsApp.
        </p>
      </div>
    </div>
  );
}
