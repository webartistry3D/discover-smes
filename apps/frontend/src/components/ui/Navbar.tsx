import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Bell, User, Menu, X, ChevronRight, Store, LayoutDashboard, LogOut, ShieldCheck, Settings, Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { Avatar } from '../ui/index';

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openAuthModal, isDarkMode, toggleDarkMode } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isHome = location === '/';

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/discover?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      <nav className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        isHome ? 'bg-transparent' : isDarkMode ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-sm' : 'bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm',
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div whileTap={{ scale: 0.97 }} className="flex items-center gap-2 cursor-pointer">
                <div className="w-8 h-8 bg-gradient-festac rounded-xl flex items-center justify-center shadow-glow">
                  <span className="text-white font-black text-sm">DF</span>
                </div>
                <div className="hidden sm:block">
                  <span className={clsx('font-display font-bold text-lg leading-none', isDarkMode ? 'text-white' : 'text-gray-900')}>Discover</span>
                  <span className="font-display font-bold text-festac-green text-lg leading-none ml-1">Festac</span>
                </div>
              </motion.div>
            </Link>

            {/* Search Bar — Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
              <div className={clsx(
                'flex items-center gap-2 w-full rounded-2xl px-4 py-2.5 transition-all duration-200',
                isSearchFocused ? 'ring-2 ring-brand-500/20 shadow-sm' : '',
                isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-900',
              )}>
                <Search size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-400 flex-shrink-0'} />
                <input
                  ref={searchRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="Search businesses, services..."
                  className={clsx('flex-1 text-sm placeholder-gray-400 focus:outline-none bg-transparent', isDarkMode ? 'text-white' : 'text-gray-900')}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')}>
                    <X size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-400'} />
                  </button>
                )}
              </div>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <Link href="/discover">
                <button className={clsx('md:hidden p-2 rounded-xl transition-colors', isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}>
                  <Search size={20} />
                </button>
              </Link>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'hover:bg-gray-800 text-yellow-400' : 'hover:bg-gray-100 text-gray-700')}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Location pill */}
              <div className={clsx('hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors', isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                <MapPin size={12} className="text-festac-green" />
                Festac Town
              </div>

              {isAuthenticated && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={clsx('flex items-center gap-2 p-1 rounded-xl transition-colors', isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}
                  >
                    <Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="sm" />
                    <span className={clsx('hidden sm:block text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-700')}>{user.firstName}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAuthModal('login')}
                    className={clsx('text-sm font-semibold transition-colors px-3 py-2', isDarkMode ? 'text-gray-300 hover:text-festac-green' : 'text-gray-700 hover:text-festac-green')}
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700')}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Outside nav to avoid stacking context issues */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={clsx('fixed top-16 right-0 bottom-0 w-[50%] md:w-[30%] z-[9999] h-[30%] overflow-y-auto', isDarkMode ? 'bg-gray-900' : 'bg-white')}
          >
            <div className="px-4 py-4 space-y-1">
              <MobileNavLink href="/discover" label="Discover" onClick={() => setIsMobileMenuOpen(false)} isDarkMode={isDarkMode} />
              <MobileNavLink href="/map" label="Map View" onClick={() => setIsMobileMenuOpen(false)} isDarkMode={isDarkMode} />
              {!isAuthenticated && (
                <div className="pt-3 border-t border-gray-100">
                  <button onClick={() => { openAuthModal(); setIsMobileMenuOpen(false); }} className="btn-primary w-full justify-center">
                    List Your Business Free
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Menu - Outside nav to avoid stacking context issues */}
      <AnimatePresence>
        {isUserMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={clsx('fixed top-16 right-0 bottom-0 w-[60%] md:w-[30%] z-[9999] h-[35%] overflow-y-auto', isDarkMode ? 'bg-gray-900' : 'bg-white')}
          >
            <div className={clsx('px-4 py-3 border-b', isDarkMode ? 'border-gray-800' : 'border-gray-50')}>
              <p className={clsx('font-semibold text-sm', isDarkMode ? 'text-white' : 'text-gray-900')}>{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.phone}</p>
            </div>
            <div className="p-1.5">
              <UserMenuItem icon={<User size={15} />} label="My Profile" href="/profile" onClick={() => setIsUserMenuOpen(false)} isDarkMode={isDarkMode} />
              {(user?.role === 'VENDOR' || user?.role === 'SUPER_ADMIN') && (
                <UserMenuItem icon={<Store size={15} />} label="Vendor Dashboard" href="/dashboard" onClick={() => setIsUserMenuOpen(false)} isDarkMode={isDarkMode} />
              )}
              {(user?.role === 'SUPER_ADMIN' || user?.role === 'MODERATOR') && (
                <UserMenuItem icon={<ShieldCheck size={15} />} label="Admin Panel" href="/admin" onClick={() => setIsUserMenuOpen(false)} isDarkMode={isDarkMode} />
              )}
              <UserMenuItem icon={<Settings size={15} />} label="Settings" href="/settings" onClick={() => setIsUserMenuOpen(false)} isDarkMode={isDarkMode} />
              <button
                onClick={() => { logout(); setIsUserMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function UserMenuItem({ icon, label, href, onClick, isDarkMode }: { icon: React.ReactNode; label: string; href: string; onClick: () => void; isDarkMode?: boolean }) {
  return (
    <Link href={href} onClick={onClick} className={clsx('flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors', isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50')}>
      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-400'}>{icon}</span>
      {label}
      <ChevronRight size={13} className={isDarkMode ? 'ml-auto text-gray-500' : 'ml-auto text-gray-300'} />
    </Link>
  );
}

function MobileNavLink({ href, label, onClick, isDarkMode }: { href: string; label: string; onClick: () => void; isDarkMode?: boolean }) {
  return (
    <Link href={href} onClick={onClick} className={clsx('flex items-center justify-between px-3 py-3 font-medium rounded-xl transition-colors text-sm', isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-50')}>
      {label}
      <ChevronRight size={14} className={isDarkMode ? 'text-gray-500' : 'text-gray-300'} />
    </Link>
  );
}
