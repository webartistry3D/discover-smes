import { motion } from 'framer-motion';
import { MapPin, Clock, MessageCircle, Star, Truck, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Link } from 'wouter';
import type { VendorSummary } from '../../lib/shared';
import { generateWhatsAppUrl, generateWhatsAppGreeting, formatDistance, truncate } from '../../lib/shared';
import { VerificationBadge } from '../ui/VerificationBadge';
import { useTrackWhatsApp } from '../../hooks/useVendors';
import { useUIStore } from '../../stores/ui.store';

interface VendorCardProps {
  vendor: VendorSummary;
  variant?: 'default' | 'compact' | 'featured';
  index?: number;
}

const priceRangeLabel: Record<string, string> = {
  BUDGET: 'Budget',
  MID_RANGE: 'Mid-range',
  PREMIUM: 'Premium',
};

export function VendorCard({ vendor, variant = 'default', index = 0 }: VendorCardProps) {
  const trackWhatsApp = useTrackWhatsApp();
  const { isDarkMode } = useUIStore();

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    trackWhatsApp.mutate(vendor.id);
    const url = generateWhatsAppUrl(
      vendor.whatsappPhone ?? '',
      generateWhatsAppGreeting(vendor.businessName),
    );
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'compact') return <CompactCard vendor={vendor} onWhatsApp={handleWhatsAppClick} isDarkMode={isDarkMode} />;
  if (variant === 'featured') return <FeaturedCard vendor={vendor} index={index} onWhatsApp={handleWhatsAppClick} isDarkMode={isDarkMode} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link href={`/vendors/${vendor.slug}`}>
        <div className={clsx('vendor-card group', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          {/* Cover Image */}
          <div className={clsx('relative h-44 overflow-hidden', isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-200')}>
            {vendor.coverImage ? (
              <img
                src={vendor.coverImage}
                alt={vendor.businessName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl">{vendor.category?.icon === 'utensils' ? '🍽️' : '🏪'}</span>
              </div>
            )}

            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

            {/* Featured badge */}
            {vendor.isFeatured && (
              <span className="absolute top-2.5 left-2.5 badge bg-festac-amber text-white border-0 text-2xs font-bold uppercase tracking-wide shadow-sm">
                ⭐ Featured
              </span>
            )}

            {/* Open now */}
            {vendor.isOpenNow !== undefined && (
              <span className={clsx(
                'absolute top-2.5 right-2.5 badge text-2xs font-semibold',
                vendor.isOpenNow
                  ? 'bg-green-500/90 text-white border-0'
                  : 'bg-black/50 text-white border-0',
              )}>
                <Clock size={9} />
                {vendor.isOpenNow ? 'Open Now' : 'Closed'}
              </span>
            )}

            {/* Logo */}
            {vendor.logo && (
              <div className="absolute bottom-2.5 left-3 w-10 h-10 rounded-xl shadow-md overflow-hidden border-2 border-white">
                <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Category tag */}
            {vendor.category && (
              <span className="text-2xs font-semibold text-brand-600 uppercase tracking-wider">
                {vendor.category.name}
              </span>
            )}

            <h3 className={clsx('font-display font-semibold text-base mt-0.5 leading-snug group-hover:text-festac-green transition-colors', isDarkMode ? 'text-white' : 'text-gray-900')}>
              {vendor.businessName}
            </h3>

            <p className={clsx('text-xs mt-1 leading-relaxed line-clamp-2', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
              {truncate(vendor.description, 90)}
            </p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2.5 flex-wrap">
              {/* Rating */}
              {vendor.totalReviews > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={12} className="star-filled" />
                  <span className={clsx('text-xs font-semibold', isDarkMode ? 'text-gray-200' : 'text-gray-800')}>{vendor.averageRating.toFixed(1)}</span>
                  <span className={clsx('text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>({vendor.totalReviews})</span>
                </div>
              )}

              {/* Price range */}
              <span className={clsx('text-xs font-semibold', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{priceRangeLabel[vendor.priceRange]}</span>

              {/* Delivery */}
              {vendor.deliveryAvailable && (
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <Truck size={11} />
                  Delivery
                </div>
              )}

              {/* Distance */}
              {vendor.distance !== undefined && (
                <div className={clsx('flex items-center gap-1 text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                  <MapPin size={10} />
                  {formatDistance(vendor.distance)}
                </div>
              )}
            </div>

            {/* Location */}
            <div className={clsx('flex items-center gap-1 mt-1.5 text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
              <MapPin size={10} className="flex-shrink-0" />
              <span className="truncate">{vendor.ward ?? vendor.lga}</span>
            </div>

            {/* Verification + WhatsApp */}
            <div className={clsx('flex items-center justify-between mt-3 pt-3 border-t', isDarkMode ? 'border-gray-700' : 'border-gray-50')}>
              <VerificationBadge level={vendor.verificationLevel} size="sm" showLabel={false} />

              {vendor.whatsappPhone && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-whatsapp/10 text-whatsapp rounded-lg text-xs font-semibold hover:bg-whatsapp hover:text-white transition-all duration-150 active:scale-95"
                >
                  <MessageCircle size={12} />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── COMPACT CARD ────────────────────────────────────────────

function CompactCard({ vendor, onWhatsApp, isDarkMode }: { vendor: VendorSummary; onWhatsApp: (e: React.MouseEvent) => void; isDarkMode: boolean }) {
  return (
    <Link href={`/vendors/${vendor.slug}`}>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={clsx('flex items-center gap-3 p-3 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200', isDarkMode ? 'bg-gray-800' : 'bg-white')}
      >
        <div className={clsx('w-14 h-14 rounded-xl overflow-hidden flex-shrink-0', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
          {vendor.coverImage ? (
            <img src={vendor.coverImage} alt={vendor.businessName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🏪</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('font-semibold text-sm truncate', isDarkMode ? 'text-white' : 'text-gray-900')}>{vendor.businessName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {vendor.totalReviews > 0 && (
              <div className="flex items-center gap-0.5">
                <Star size={10} className="star-filled" />
                <span className={clsx('text-xs', isDarkMode ? 'text-gray-300' : 'text-gray-600')}>{vendor.averageRating.toFixed(1)}</span>
              </div>
            )}
            <span className={clsx('text-xs truncate', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>{vendor.ward ?? vendor.lga}</span>
          </div>
        </div>
        <ChevronRight size={16} className={clsx('flex-shrink-0', isDarkMode ? 'text-gray-600' : 'text-gray-300')} />
      </motion.div>
    </Link>
  );
}

// ─── FEATURED CARD ───────────────────────────────────────────

function FeaturedCard({ vendor, index, onWhatsApp, isDarkMode }: { vendor: VendorSummary; index: number; onWhatsApp: (e: React.MouseEvent) => void; isDarkMode: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
    >
      <Link href={`/vendors/${vendor.slug}`}>
        <div className={clsx('relative w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-card group cursor-pointer', isDarkMode ? 'bg-gray-800' : 'bg-white')}>
          <div className={clsx('h-36', isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-200 to-gray-300')}>
            {vendor.coverImage && (
              <img
                src={vendor.coverImage}
                alt={vendor.businessName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <p className="font-display font-semibold text-sm leading-snug">{vendor.businessName}</p>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-1">
                {vendor.totalReviews > 0 && (
                  <>
                    <Star size={10} className="fill-festac-amber text-festac-amber" />
                    <span className="text-xs opacity-90">{vendor.averageRating.toFixed(1)}</span>
                  </>
                )}
                <span className="text-xs opacity-70">{vendor.ward ?? vendor.lga}</span>
              </div>
              {vendor.whatsappPhone && (
                <button onClick={onWhatsApp} className="p-1.5 bg-whatsapp rounded-lg">
                  <MessageCircle size={12} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
