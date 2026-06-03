import { useState, useEffect } from 'react';
import { useSearch } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, MapPin, Grid3X3, List } from 'lucide-react';
import { clsx } from 'clsx';
import { useVendorSearch, useCategories } from '../../hooks/useVendors';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useUIStore } from '../../stores/ui.store';
import { VendorCard } from '../../components/marketplace/VendorCard';
import { VendorCardSkeleton, EmptyState, Button } from '../../components/ui/index';
import type { SearchFilters } from '../../lib/shared';
import { FESTAC_WARDS } from '../../lib/shared';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'distance', label: 'Nearest' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
] as const;

const PRICE_OPTIONS = [
  { value: '', label: 'Any Budget' },
  { value: 'BUDGET', label: '₦ Budget' },
  { value: 'MID_RANGE', label: '₦₦ Mid-Range' },
  { value: 'PREMIUM', label: '₦₦₦ Premium' },
];

export default function DiscoverPage() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const { location } = useGeolocation(true);
  const { isDarkMode } = useUIStore();

  const [filters, setFilters] = useState<SearchFilters>({
    query: params.get('q') ?? undefined,
    categoryId: params.get('categoryId') ?? undefined,
    sortBy: (params.get('sortBy') as SearchFilters['sortBy']) ?? 'relevance',
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState(filters.query ?? '');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: categories } = useCategories();
  const { data, isLoading, isFetching } = useVendorSearch({
    ...filters,
    lat: location?.lat,
    lng: location?.lng,
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, query: params.get('q') ?? undefined, categoryId: params.get('categoryId') ?? undefined, page: 1 }));
    setSearchInput(params.get('q') ?? '');
  }, [searchString]);

  const updateFilter = (key: keyof SearchFilters, value: SearchFilters[keyof SearchFilters]) => {
    setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'relevance', page: 1, limit: 20 });
    setSearchInput('');
  };

  const activeFilterCount = [
    filters.categoryId, filters.priceRange, filters.ward,
    filters.minRating, filters.isOpenNow, filters.deliveryAvailable,
    filters.verificationLevel,
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('query', searchInput.trim() || undefined);
  };

  const vendors = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className={clsx('min-h-screen', isDarkMode ? 'bg-gray-900' : 'bg-gray-50')}>
      {/* ─── STICKY SEARCH BAR ─────────────────────────────── */}
      <div className={clsx('sticky top-16 z-40 border-b shadow-sm', isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className={clsx('flex-1 flex items-center gap-2 rounded-xl px-3 py-2.5', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
              <Search size={15} className={clsx('flex-shrink-0', isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search businesses, services..."
                className={clsx('flex-1 bg-transparent text-sm placeholder-gray-400 focus:outline-none', isDarkMode ? 'text-white' : 'text-gray-900')}
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); updateFilter('query', undefined); }}>
                  <X size={14} className={clsx(isDarkMode ? 'text-gray-400' : 'text-gray-400')} />
                </button>
              )}
            </form>

            {/* Filter button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={clsx('relative flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors', isFilterOpen || activeFilterCount > 0 ? 'bg-festac-green text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:block">Filters</span>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-festac-amber text-white text-2xs font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* View mode */}
            <div className={clsx('hidden sm:flex items-center rounded-xl p-1', isDarkMode ? 'bg-gray-700' : 'bg-gray-100')}>
              <button onClick={() => setViewMode('grid')} className={clsx('p-1.5 rounded-lg transition-colors', viewMode === 'grid' ? (isDarkMode ? 'bg-gray-600 shadow-sm' : 'bg-white shadow-sm') : (isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'))}>
                <Grid3X3 size={14} className={clsx('text-gray-600', isDarkMode && 'text-gray-300')} />
              </button>
              <button onClick={() => setViewMode('list')} className={clsx('p-1.5 rounded-lg transition-colors', viewMode === 'list' ? (isDarkMode ? 'bg-gray-600 shadow-sm' : 'bg-white shadow-sm') : (isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'))}>
                <List size={14} className={clsx('text-gray-600', isDarkMode && 'text-gray-300')} />
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1 flex flex-wrap gap-2">
                  {/* Sort */}
                  <FilterSelect
                    label="Sort"
                    value={filters.sortBy ?? 'relevance'}
                    onChange={(v) => updateFilter('sortBy', v as SearchFilters['sortBy'])}
                    options={SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
                    isDarkMode={isDarkMode}
                  />

                  {/* Category */}
                  <FilterSelect
                    label="Category"
                    value={filters.categoryId ?? ''}
                    onChange={(v) => updateFilter('categoryId', v)}
                    options={[
                      { value: '', label: 'All Categories' },
                      ...((categories as any[]) ?? []).map((c: any) => ({ value: c.id, label: c.name })),
                    ]}
                    isDarkMode={isDarkMode}
                  />

                  {/* Ward */}
                  <FilterSelect
                    label="Ward / Area"
                    value={filters.ward ?? ''}
                    onChange={(v) => updateFilter('ward', v)}
                    options={[
                      { value: '', label: 'All Areas' },
                      ...FESTAC_WARDS.map((w) => ({ value: w, label: w })),
                    ]}
                    isDarkMode={isDarkMode}
                  />

                  {/* Price */}
                  <FilterSelect
                    label="Price Range"
                    value={filters.priceRange ?? ''}
                    onChange={(v) => updateFilter('priceRange', v as SearchFilters['priceRange'])}
                    options={PRICE_OPTIONS}
                    isDarkMode={isDarkMode}
                  />

                  {/* Toggle chips */}
                  <ToggleChip
                    active={!!filters.isOpenNow}
                    onClick={() => updateFilter('isOpenNow', filters.isOpenNow ? undefined : true)}
                    label="Open Now"
                    isDarkMode={isDarkMode}
                  />
                  <ToggleChip
                    active={!!filters.deliveryAvailable}
                    onClick={() => updateFilter('deliveryAvailable', filters.deliveryAvailable ? undefined : true)}
                    label="Delivery"
                    isDarkMode={isDarkMode}
                  />
                  <ToggleChip
                    active={filters.verificationLevel === 'BUSINESS_VERIFIED'}
                    onClick={() => updateFilter('verificationLevel', filters.verificationLevel ? undefined : 'BUSINESS_VERIFIED')}
                    label="Verified Only"
                    isDarkMode={isDarkMode}
                  />

                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className={clsx('flex items-center gap-1 px-3 py-1.5 text-xs rounded-xl transition-colors font-medium', isDarkMode ? 'text-red-400 hover:bg-red-900/20' : 'text-red-600 hover:bg-red-50')}>
                      <X size={12} /> Clear All
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── RESULTS ───────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            {filters.query && (
              <p className={clsx('text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-500')}>
                Results for <span className={clsx('font-semibold', isDarkMode ? 'text-white' : 'text-gray-900')}>"{filters.query}"</span>
              </p>
            )}
            {meta && (
              <p className={clsx('text-xs mt-0.5', isDarkMode ? 'text-gray-500' : 'text-gray-400')}>
                {meta.total.toLocaleString()} businesses found
                {isFetching && ' · Updating...'}
              </p>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {Array.from({ length: 12 }).map((_, i) => <VendorCardSkeleton key={i} />)}
          </div>
        ) : vendors.length === 0 ? (
          <EmptyState
            icon={<Search size={32} />}
            title="No businesses found"
            description="Try adjusting your search or filters. New businesses join every day!"
            action={<Button onClick={clearFilters} variant="outline">Clear Filters</Button>}
          />
        ) : (
          <>
            <div className={viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-3'
            }>
              {vendors.map((v: any, i: number) => (
                <VendorCard key={v.id} vendor={v} index={i} variant={viewMode === 'list' ? 'compact' : 'default'} />
              ))}
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasPrev}
                  onClick={() => updateFilter('page', (filters.page ?? 1) - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-500">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta.hasNext}
                  onClick={() => updateFilter('page', (filters.page ?? 1) + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options, isDarkMode }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  isDarkMode?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={clsx('text-xs font-medium px-3 py-1.5 border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer transition-colors', isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function ToggleChip({ active, onClick, label, isDarkMode }: { active: boolean; onClick: () => void; label: string; isDarkMode?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx('px-3 py-1.5 rounded-xl text-xs font-medium transition-colors', active ? 'bg-festac-green text-white' : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}
    >
      {label}
    </button>
  );
}
