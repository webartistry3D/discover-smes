import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Map as MapIcon, ArrowRight, Zap, ShieldCheck, MessageCircle, TrendingUp, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useCategories, useFeaturedVendors, useNearbyVendors } from '../../hooks/useVendors';
import { useGeolocation } from '../../hooks/useGeolocation';
import { VendorCard } from '../../components/marketplace/VendorCard';
import { VendorCardSkeleton, Spinner } from '../../components/ui/index';
import { useUIStore } from '../../stores/ui.store';
import type { Category } from '../../lib/shared';

const HERO_STATS = [
  { label: 'Local Businesses', value: '600+' },
  { label: 'Happy Customers', value: '9K+' },
  { label: 'Areas Covered', value: '12 Wards' },
];

const BUSINESS_TYPES = ['Restaurants', 'Pharmacies', 'Minimarts', 'Supermarts', 'Gas Stations', 'Boutiques', 'Hairdressers', 'Engineers', 'Technicians', 'Electricians', 'Mechanics', 'Plumbers', ' Businesses'];

export default function HomePage() {
  const [, navigate] = useLocation();
  const { isDarkMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentBusinessIndex, setCurrentBusinessIndex] = useState(0);
  const { location, isGranted, permission, requestLocation } = useGeolocation(true);
  const { data: categories, isLoading: catsLoading } = useCategories();
  const { data: featured, isLoading: featuredLoading } = useFeaturedVendors(8);
  const { data: nearby, isLoading: nearbyLoading } = useNearbyVendors(location?.lat, location?.lng, 3);

  // Cycle through business types
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBusinessIndex((prev) => (prev + 1) % BUSINESS_TYPES.length);
    }, 2500); // Change every 2.5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    else navigate('/discover');
  };

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* ─── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden -mt-16 pt-16">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-black/70" />
        
        {/* Background patterns */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-festac-amber rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-28 text-white">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            {/* Location pill + View Map */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-wrap items-center gap-2 mb-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80">
                <MapPin size={13} className="text-festac-amber" />
                {isGranted && location
                  ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
                  : permission === 'denied'
                    ? 'Amuwo-Odofin, Lagos'
                    : 'Locating...'}
              </div>
              <Link
                href="/map"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/80 hover:bg-white/20 transition-colors"
              >
                <MapIcon size={13} className="text-festac-amber" />
                <span>View Map</span>
              </Link>
            </motion.div>

            <h1 className="font-display font-black text-4xl sm:text-7xl lg:text-7xl leading-[1.1] text-balance">
              <div className="flex flex-wrap items-baseline gap-2 sm:flex-col">
                <span>Discover</span>
                <span
                  className="inline-grid bg-festac-amber px-4 py-3"
                  style={{ gridTemplateAreas: "'content'" }}
                >
                  {BUSINESS_TYPES.map((type) => (
                    <span
                      key={`sizer-${type}`}
                      className="invisible whitespace-nowrap text-5xl sm:text-7xl lg:text-7xl [grid-area:content]"
                      aria-hidden="true"
                    >
                      {type}
                    </span>
                  ))}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={BUSINESS_TYPES[currentBusinessIndex]}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="inline-block text-5xl sm:text-7xl lg:text-7xl text-black [grid-area:content]"
                    >
                      {BUSINESS_TYPES[currentBusinessIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span>Near You</span>
              </div>
            </h1>
            <p className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 text-white/80 text-lg mt-4 max-w-lg">
              Find trusted vendors and service providers. Connect via WhatsApp instantly.
            </p>

            {/* Search form */}
            <form onSubmit={handleSearch} className="mt-8 flex gap-3 max-w-lg">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-xl">
                <Search size={18} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Jollof rice, hair salon, mechanic..."
                  className="flex-1 text-gray-900 text-sm bg-transparent focus:outline-none placeholder-gray-400"
                  autoComplete="off"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="submit"
                className="px-6 py-3.5 bg-festac-amber text-white font-semibold rounded-2xl text-sm shadow-glow-amber hover:bg-amber-500 transition-colors flex-shrink-0"
              >
                Search
              </motion.button>
            </form>

            {/* Quick links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {['Food & Delivery', 'Hair Salons', 'Mechanics', 'Pharmacies'].map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/discover?q=${encodeURIComponent(q)}`)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full text-xs text-white/80 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-8 mt-12"
          >
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <p className="font-display font-black text-2xl text-white">{stat.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 60 720 0 0 40L0 60Z" fill={isDarkMode ? '#111827' : 'white'} />
          </svg>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16 py-12">

        {/* ─── NEARBY ──────────────────────────────────────── */}
        {(nearbyLoading || (nearby && nearby.length > 0)) && (
          <section>
            <SectionHeader
              icon={<MapPin size={16} className="text-festac-green" />}
              title="Near You"
              subtitle="Businesses within 3km"
              href="/discover?sortBy=distance"
            />
            <div className="flex gap-4 mt-5 overflow-x-auto pb-4">
              {nearbyLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="max-w-[250px] flex-shrink-0">
                    <VendorCardSkeleton />
                  </div>
                ))
              ) : (
                nearby!.slice(0, 6).map((v, i) => (
                  <div key={v.id} className="max-w-[250px] flex-shrink-0">
                    <VendorCard vendor={v} index={i} />
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ─── CATEGORIES ──────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Zap size={16} className="text-festac-amber" />}
            title="Browse Categories"
            subtitle="Find exactly what you need"
            href="/discover"
            isDarkMode={isDarkMode}
          />
          {catsLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={clsx('h-24 rounded-2xl animate-pulse', isDarkMode ? 'bg-gray-800' : 'bg-gray-100')} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mt-5">
              {(categories as Category[])?.slice(0, 12).map((cat, i) => (
                <CategoryCard key={cat.id} category={cat} index={i} isDarkMode={isDarkMode} />
              ))}
            </div>
          )}
        </section>

        {/* ─── FEATURED ────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<TrendingUp size={16} className="text-blue-500" />}
            title="Featured Businesses"
            subtitle="Top-rated & verified vendors"
            href="/discover?isFeatured=true"
            isDarkMode={isDarkMode}
          />
          {featuredLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
              {Array.from({ length: 8 }).map((_, i) => <VendorCardSkeleton key={i} />)}
            </div>
          ) : (featured as any[])?.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-5">
              {(featured as any[]).map((v, i) => (
                <VendorCard key={v.id} vendor={v} index={i} />
              ))}
            </div>
          ) : null}
        </section>

        {/* ─── WHY DISCOVER SMEs ──────────────────────────── */}
        <section className={clsx('rounded-3xl p-8 lg:p-12', isDarkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-gray-50 to-white')}>
          <div className="text-center mb-10">
            <h2 className={clsx('font-display font-black text-3xl', isDarkMode ? 'text-white' : 'text-gray-900')}>
              Why Discover SMEs?
            </h2>
            <p className={clsx('mt-2', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>The smartest way to find and connect with local businesses</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageCircle size={24} className="text-whatsapp" />,
                bg: 'bg-green-50',
                bgDark: 'bg-green-900/30',
                title: 'WhatsApp Native',
                desc: 'Connect directly with vendors via WhatsApp. No phone tag, no waiting — instant conversations.',
              },
              {
                icon: <ShieldCheck size={24} className="text-blue-600" />,
                bg: 'bg-blue-50',
                bgDark: 'bg-blue-900/30',
                title: 'Verified Businesses',
                desc: 'Every business goes through verification. Phone, business docs, and government endorsement levels.',
              },
              {
                icon: <MapPin size={24} className="text-festac-green" />,
                bg: 'bg-green-50',
                bgDark: 'bg-green-900/30',
                title: 'Hyperlocal Discovery',
                desc: 'Find businesses within your ward, your street. Pilot build specific to Amuwo-Odofin.',
              },
            ].map((feat) => (
              <motion.div
                key={feat.title}
                whileHover={{ y: -4 }}
                className={clsx('text-center p-6 rounded-2xl shadow-card', isDarkMode ? 'bg-gray-800' : 'bg-white')}
              >
                <div className={clsx('w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4', isDarkMode ? feat.bgDark : feat.bg)}>
                  {feat.icon}
                </div>
                <h3 className={clsx('font-display font-bold text-lg', isDarkMode ? 'text-white' : 'text-gray-900')}>{feat.title}</h3>
                <p className={clsx('text-sm mt-2 leading-relaxed', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────── */}
        <section className="bg-gradient-festac rounded-3xl p-8 lg:p-12 text-white text-center overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative">
            <h2 className="font-display font-black text-3xl">List Your Business Free</h2>
            <p className="text-white/70 mt-2 max-w-md mx-auto">
              Join businesses already getting customers from Discover SMEs.
            </p>
            <Link href="/vendors/new">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-white text-festac-green font-bold rounded-2xl text-sm shadow-xl hover:shadow-2xl transition-shadow"
              >
                Get Started Free <ArrowRight size={16} />
              </motion.button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, subtitle, href, isDarkMode }: { icon: React.ReactNode; title: string; subtitle?: string; href: string; isDarkMode?: boolean }) {
  const [, navigate] = useLocation();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => navigate(href), 100);
  };

  return (
    <div className="flex items-end justify-between">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h2 className={clsx('font-display font-bold text-xl', isDarkMode ? 'text-white' : 'text-gray-900')}>{title}</h2>
        </div>
        {subtitle && <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-400')}>{subtitle}</p>}
      </div>
      <Link href={href} onClick={handleClick}>
        <span className="flex items-center gap-1 text-sm text-festac-green font-semibold hover:underline">
          See all <ChevronRight size={14} />
        </span>
      </Link>
    </div>
  );
}

function CategoryCard({ category, index, isDarkMode }: { category: Category; index: number; isDarkMode?: boolean }) {
  const [, navigate] = useLocation();
  const iconMap: Record<string, string> = {
    utensils: '🍽️', shirt: '👗', sparkles: '💅', cpu: '📱', home: '🪑',
    car: '🚗', book: '📚', heart: '💊', banknote: '💸', 'shopping-basket': '🛒',
    building: '🏘️', music: '🎵', briefcase: '💼', truck: '🚚', code: '💻',
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => navigate(`/discover?categoryId=${category.id}`)}
      className={clsx('flex flex-col items-center gap-2 p-4 rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-200 group', isDarkMode ? 'bg-gray-800' : 'bg-white')}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform"
        style={{ backgroundColor: `${category.color}15` }}
      >
        {iconMap[category.icon] ?? '🏪'}
      </div>
      <span className={clsx('text-xs font-semibold text-center leading-tight line-clamp-2', isDarkMode ? 'text-gray-300' : 'text-gray-700')}>
        {category.name}
      </span>
      {category.vendorCount !== undefined && (
        <span className={clsx('text-2xs', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>{category.vendorCount}</span>
      )}
    </motion.button>
  );
}
