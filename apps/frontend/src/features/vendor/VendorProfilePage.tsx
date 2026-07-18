import { useState } from 'react';
import { useParams, Link } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Phone, Clock, MessageCircle, Star, Package, Wrench, ChevronDown,
  Share2, Heart, ArrowLeft, CheckCircle, Truck, Calendar,
  Edit2, Save, X,
} from 'lucide-react';
import { useVendorDetail, useReviews, useTrackWhatsApp } from '../../hooks/useVendors';
import { useChatbotRules } from '../../hooks/useChatbot';
import { ChatbotRuleType } from '../../lib/shared';
import { VerificationBadge } from '../../components/ui/VerificationBadge';
import { StarRating, Skeleton, Avatar, Badge, Button } from '../../components/ui/index';
import { generateWhatsAppUrl, generateWhatsAppGreeting, formatNaira, isVendorOpenNow } from '../../lib/shared';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { clsx } from 'clsx';
import { useMutation } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function VendorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: vendor, isLoading } = useVendorDetail(slug!);
  const { data: reviewsData } = useReviews(vendor?.id ?? '', 1);
  const { data: chatbotRules } = useChatbotRules();
  const faqRules = chatbotRules?.filter((r) => r.ruleType === ChatbotRuleType.FAQ) ?? [];
  const trackWa = useTrackWhatsApp();
  const { user } = useAuthStore();
  const { isDarkMode } = useUIStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'services' | 'faqs' | 'reviews'>('overview');
  const [showFullDesc, setShowFullDesc] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [editingHours, setEditingHours] = useState(false);
  const [hours, setHours] = useState<Record<string, { open: string; close: string; isClosed?: boolean }>>({});

  const isOwner = user?.id === vendor?.ownerId;

  const updateHoursMutation = useMutation({
    mutationFn: (data: { openingHours: Record<string, { open: string; close: string; isClosed?: boolean }> }) =>
      vendorApi.update(vendor!.id, data),
    onSuccess: () => {
      toast.success('Opening hours updated successfully');
      setEditingHours(false);
    },
    onError: () => {
      toast.error('Failed to update opening hours');
    },
  });

  if (isLoading) return <VendorProfileSkeleton />;
  if (!vendor) return (
    <div className={clsx('min-h-screen flex items-center justify-center', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-300">Business not found</p>
        <Link href="/discover"><Button variant="primary" className="mt-4">Browse Businesses</Button></Link>
      </div>
    </div>
  );

  const isOpen = isVendorOpenNow(vendor.openingHours as any);
  const waUrl = vendor.whatsappPhone
    ? generateWhatsAppUrl(vendor.whatsappPhone, generateWhatsAppGreeting(vendor.businessName))
    : null;

  const handleWhatsApp = () => {
    if (!waUrl) return;
    trackWa.mutate(vendor.id);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: vendor.businessName, text: vendor.description, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const handleEditHours = () => {
    setHours(vendor.openingHours as any || {});
    setEditingHours(true);
  };

  const handleSaveHours = () => {
    updateHoursMutation.mutate({ openingHours: hours });
  };

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'products', label: `Products (${vendor.inventoryItems?.length ?? 0})`, show: (vendor.inventoryItems?.length ?? 0) > 0 },
    { id: 'services', label: `Services (${vendor.services?.length ?? 0})`, show: (vendor.services?.length ?? 0) > 0 },
    { id: 'faqs', label: `FAQs (${faqRules.length})`, show: faqRules.length > 0 || isOwner },
    { id: 'reviews', label: `Reviews (${vendor.totalReviews})` },
  ].filter((t) => t.show !== false);

  return (
    <div className={clsx('min-h-screen pb-24', isDarkMode ? 'bg-gray-900 dark' : 'bg-gray-50')}>
      {/* Cover Image */}
      <div className="relative h-64 sm:h-80 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
        {vendor.coverImage ? (
          <img src={vendor.coverImage} alt={vendor.businessName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl">🏪</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Back button */}
        <button onClick={() => history.back()} className="absolute top-4 left-4 p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
          <ArrowLeft size={18} />
        </button>

        {/* Share + Save */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button onClick={handleShare} className="p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
            <Share2 size={16} />
          </button>
          <button onClick={() => setIsSaved(!isSaved)} className="p-2 bg-black/30 backdrop-blur-sm rounded-xl text-white hover:bg-black/50 transition-colors">
            <Heart size={16} className={isSaved ? 'fill-red-500 text-red-500' : ''} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Business Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 -mt-10 relative z-10 p-6">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-700 border-2 border-white shadow-md overflow-hidden flex-shrink-0">
              {vendor.logo ? (
                <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="font-display font-bold text-xl text-gray-900 dark:text-white leading-tight">{vendor.businessName}</h1>
                  {vendor.category && (
                    <span className="text-xs text-festac-green font-semibold uppercase tracking-wider">{vendor.category.name}</span>
                  )}
                </div>
                <VerificationBadge level={vendor.verificationLevel} size="sm" />
              </div>

              {/* Stats row */}
              <div className="flex items-center flex-wrap gap-3 mt-2">
                {vendor.totalReviews > 0 && (
                  <StarRating rating={vendor.averageRating} showValue reviewCount={vendor.totalReviews} />
                )}
                <span className={`text-xs font-semibold flex items-center gap-1 ${isOpen ? 'text-green-600' : 'text-gray-400 dark:text-gray-300'}`}>
                  <Clock size={11} />
                  {isOpen ? 'Open Now' : 'Closed'}
                </span>
                {vendor.deliveryAvailable && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <Truck size={11} /> Delivery
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Location + Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
              <MapPin size={14} className="text-festac-green flex-shrink-0" />
              <span className="truncate">{vendor.address}</span>
            </div>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-300 hover:text-festac-green transition-colors">
                <Phone size={14} className="text-festac-green flex-shrink-0" />
                {vendor.phone}
              </a>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2 mt-5">
            {waUrl && (
              <button onClick={handleWhatsApp} className="btn-whatsapp flex-1 justify-center py-3">
                <MessageCircle size={16} />
                Chat on WhatsApp
              </button>
            )}
            <Link href={`/book/${vendor.id}`}>
              <button className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm rounded-xl hover:bg-gray-200 active:scale-95 transition-all">
                <Calendar size={15} />
                Book
              </button>
            </Link>
            {vendor.phone && (
              <a href={`tel:${vendor.phone}`} className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold text-sm rounded-xl hover:bg-gray-200 active:scale-95 transition-all">
                <Phone size={15} />
              </a>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-2xl p-1 mt-5 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-5 space-y-4">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Description */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                  <p className={`text-gray-600 dark:text-gray-300 text-sm leading-relaxed ${!showFullDesc && 'line-clamp-4'}`}>
                    {vendor.description}
                  </p>
                  {vendor.description?.length > 200 && (
                    <button onClick={() => setShowFullDesc(!showFullDesc)} className="flex items-center gap-1 text-festac-green text-xs font-semibold mt-2">
                      {showFullDesc ? 'Show less' : 'Read more'} <ChevronDown size={12} className={showFullDesc ? 'rotate-180' : ''} />
                    </button>
                  )}
                </div>

                {/* Opening Hours */}
                {vendor.openingHours && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Opening Hours</h3>
                      {isOwner && !editingHours && (
                        <button onClick={handleEditHours} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                          <Edit2 size={14} className="text-gray-500 dark:text-gray-300" />
                        </button>
                      )}
                    </div>
                    {editingHours ? (
                      <div className="space-y-2">
                        <OpeningHoursEditGrid hours={hours} setHours={setHours} />
                        <div className="flex gap-2 mt-4">
                          <button onClick={handleSaveHours} disabled={updateHoursMutation.isPending} className="flex items-center gap-1 px-4 py-2 bg-festac-green text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50">
                            <Save size={14} />
                            {updateHoursMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingHours(false)} className="flex items-center gap-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <OpeningHoursGrid hours={vendor.openingHours as any} />
                    )}
                  </div>
                )}

                {/* Current Promotions */}
                {vendor.promotions?.length > 0 && (
                  <div className="bg-festac-amber/10 border border-festac-amber/20 rounded-2xl p-5">
                    <h3 className="font-semibold text-amber-800 mb-2">🎉 Current Offers</h3>
                    {vendor.promotions.map((promo: any) => (
                      <div key={promo.id}>
                        <p className="font-medium text-amber-900 text-sm">{promo.title}</p>
                        {promo.description && <p className="text-amber-700 text-xs mt-0.5">{promo.description}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'products' && (
              <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {vendor.inventoryItems?.map((p: any) => (
                  <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                      <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-gray-400 dark:text-gray-300" /></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</p>
                      {p.description && <p className="text-gray-500 dark:text-gray-300 text-xs mt-0.5 line-clamp-2">{p.description}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-festac-green text-sm">{formatNaira(Number(p.sellingPrice || 0))}</p>
                      {p.unit && <p className="text-gray-400 dark:text-gray-300 text-xs">per {p.unit}</p>}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'services' && (
              <motion.div key="services" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {vendor.services?.map((s: any) => (
                  <div key={s.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-festac-green/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Wrench size={20} className="text-festac-green" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">{s.name}</p>
                      {s.description && <p className="text-gray-500 dark:text-gray-300 text-xs mt-0.5 line-clamp-2">{s.description}</p>}
                      {s.durationMinutes && <p className="text-gray-400 dark:text-gray-300 text-xs mt-0.5">{s.durationMinutes} mins</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-festac-green text-sm">
                        {s.price ? formatNaira(Number(s.price)) : s.priceLabel ?? 'Contact'}
                      </p>
                      {s.bookingRequired && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Booking req.</span>
                      )}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {activeTab === 'faqs' && (
              <motion.div key="faqs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {faqRules.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-300">No FAQs yet.</p>
                    {isOwner && (
                      <Link href="/chatbot/faq" className="block mt-2 text-festac-green hover:underline text-sm">
                        Manage FAQs in FAQ Manager
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                    <div className="space-y-3">
                      {faqRules.map((faq: any) => (
                        <div key={faq.id} className="border-b border-gray-50 dark:border-gray-700 last:border-0 pb-3 last:pb-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Q: {faq.questionPattern || faq.keyword}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">A: {faq.response}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {(reviewsData as any)?.data?.map((r: any) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl hover:shadow-2xl dark:shadow-none dark:hover:shadow-none transition-shadow duration-200">
                    <div className="flex items-start gap-3">
                      <Avatar src={r.user?.avatar} name={`${r.user?.firstName} ${r.user?.lastName}`} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.user?.firstName} {r.user?.lastName}</p>
                          <StarRating rating={r.rating} />
                        </div>
                        {r.comment && <p className="text-gray-500 dark:text-gray-300 text-sm mt-1 leading-relaxed">{r.comment}</p>}
                        <p className="text-gray-300 text-xs mt-1.5">
                          {new Date(r.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(reviewsData as any)?.data?.length === 0 && (
                  <div className="text-center py-12 text-gray-400 dark:text-gray-300">
                    <Star size={32} className="mx-auto mb-2" />
                    <p className="text-sm">No reviews yet. Be the first!</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Fixed bottom WhatsApp CTA */}
      {/*{waUrl && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800/90 backdrop-blur-xl border-t border-gray-100 z-40">
          <button onClick={handleWhatsApp} className="btn-whatsapp w-full justify-center py-3.5 text-base rounded-2xl">
            <MessageCircle size={18} />
            Chat with {vendor.businessName} on WhatsApp
          </button>
        </div>
      )} */}
    </div>
  );
}

function OpeningHoursGrid({ hours }: { hours: Record<string, { open: string; close: string; isClosed?: boolean }> }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const today = days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const h = hours[day];
        const isToday = day === today;
        return (
          <div key={day} className={`flex items-center justify-between text-sm ${isToday ? 'font-semibold text-festac-green' : 'text-gray-600 dark:text-gray-300'}`}>
            <span className="capitalize">{day}{isToday ? ' (Today)' : ''}</span>
            {h ? (
              h.isClosed ? <span className="text-gray-400 dark:text-gray-300">Closed</span> : <span>{h.open} – {h.close}</span>
            ) : <span className="text-gray-400 dark:text-gray-300">–</span>}
          </div>
        );
      })}
    </div>
  );
}

function OpeningHoursEditGrid({ hours, setHours }: { hours: Record<string, { open: string; close: string; isClosed?: boolean }>; setHours: (hours: Record<string, { open: string; close: string; isClosed?: boolean }>) => void }) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const updateDay = (day: string, field: 'open' | 'close' | 'isClosed', value: string | boolean) => {
    setHours({
      ...hours,
      [day]: {
        ...hours[day],
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-2">
      {days.map((day) => {
        const h = hours[day] || { open: '', close: '', isClosed: false };
        return (
          <div key={day} className="flex items-center gap-2 text-sm">
            <span className="w-24 capitalize text-gray-700 dark:text-gray-300">{day}</span>
            <label className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={h.isClosed || false}
                onChange={(e) => updateDay(day, 'isClosed', e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-festac-green focus:ring-festac-green"
              />
              <span className="text-gray-500 dark:text-gray-300 text-xs">Closed</span>
            </label>
            {!h.isClosed && (
              <>
                <input
                  type="time"
                  value={h.open}
                  onChange={(e) => updateDay(day, 'open', e.target.value)}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs focus:outline-none focus:ring-2 focus:ring-festac-green"
                />
                <span className="text-gray-400 dark:text-gray-300">–</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={(e) => updateDay(day, 'close', e.target.value)}
                  className="px-2 py-1 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-xs focus:outline-none focus:ring-2 focus:ring-festac-green"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VendorProfileSkeleton() {
  const { isDarkMode } = useUIStore();
  return (
    <div className={clsx('min-h-screen pb-24', isDarkMode ? 'bg-gray-900 dark' : 'bg-gray-50')}>
      <Skeleton className="h-72 w-full rounded-none" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-white dark:bg-gray-800 rounded-3xl -mt-10 p-6 space-y-4">
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
