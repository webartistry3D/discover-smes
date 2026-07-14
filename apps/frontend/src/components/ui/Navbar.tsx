import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Sun, Moon, User, LogOut, ChevronDown, Bell, Lock, LogIn, UserPlus, Store } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';
import { Avatar } from '../ui/index';

export function Navbar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { openAuthModal, isDarkMode, toggleDarkMode, closeAllDropdowns } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [isAuthDropdownOpen, setIsAuthDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const authDropdownRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isProfileDropdownOpen) return;
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        profileRef.current && !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isProfileDropdownOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!isAuthDropdownOpen) return;
      if (
        authDropdownRef.current && !authDropdownRef.current.contains(e.target as Node) &&
        authRef.current && !authRef.current.contains(e.target as Node)
      ) {
        setIsAuthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isAuthDropdownOpen]);

  const isHome = location === '/';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/discover?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleSignout = () => {
    logout();
    window.location.href = '/';
  };

  const toggleProfileDropdown = () => {
    if (!isProfileDropdownOpen) {
      closeAllDropdowns();
    }
    setIsProfileDropdownOpen(!isProfileDropdownOpen);
  };

  const closeProfileDropdown = () => {
    setIsProfileDropdownOpen(false);
  };

  const closeAuthDropdown = () => {
    setIsAuthDropdownOpen(false);
  };

  const toggleAuthDropdown = () => {
    if (!isAuthDropdownOpen) {
      closeAllDropdowns();
    }
    setIsAuthDropdownOpen(!isAuthDropdownOpen);
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
                  <span className="text-white font-black text-sm">D</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-display font-bold text-lg leading-none text-gray-900">Discover</span>
                  <span className="font-display font-bold text-festac-green text-lg leading-none ml-1">SMEs</span>
                </div>
              </motion.div>
            </Link>

            {/* Search Bar — Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-lg mx-6">
              <div className={clsx(
                'flex items-center gap-2 w-full rounded-2xl px-4 py-2.5 transition-all duration-200 shadow-sm',
                isSearchFocused ? 'ring-2 ring-brand-500/20 shadow-md' : '',
                isDarkMode ? 'bg-gray-800/70 text-white' : 'bg-white/80 text-gray-900',
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
                <button className={clsx('md:hidden p-2 rounded-xl transition-colors', isDarkMode ? 'bg-gray-800/70 hover:bg-gray-700 text-gray-300' : 'bg-white/80 hover:bg-gray-100 text-gray-700 shadow-sm')}>
                  <Search size={24} />
                </button>
              </Link>

              {/* Bell icon */}
              <button
                className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-gray-800/70 hover:bg-gray-700 text-gray-300' : 'bg-white/80 hover:bg-gray-100 text-gray-700 shadow-sm')}
              >
                <Bell size={24} />
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-gray-800/70 hover:bg-gray-700 text-yellow-400' : 'bg-white/80 hover:bg-gray-100 text-gray-700 shadow-sm')}
              >
                {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
              </button>

              {/* Location pill */}
              <div className={clsx('hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors shadow-sm', isDarkMode ? 'bg-gray-800/70 text-gray-300 hover:bg-gray-700' : 'bg-white/80 text-gray-600 hover:bg-gray-100')}>
                <MapPin size={12} className="text-festac-green" />
                Festac Town
              </div>

              {isAuthenticated && user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={toggleProfileDropdown}
                    className={clsx('flex items-center gap-2 p-1 rounded-xl transition-colors', isDarkMode ? 'bg-gray-800/70 hover:bg-gray-700' : 'bg-white/80 hover:bg-gray-100 shadow-sm')}
                  >
                    <Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="sm" />
                    <span className={clsx('hidden sm:block text-sm font-medium', isDarkMode ? 'text-white' : 'text-gray-700')}>{user.firstName}</span>
                    <ChevronDown size={14} className={clsx('hidden sm:block transition-transform', isDarkMode ? 'text-gray-400' : 'text-gray-500', isProfileDropdownOpen ? 'rotate-180' : '')} />
                  </button>

                  </div>
              ) : (
                <div className="relative" ref={authRef}>
                  <button
                    onClick={toggleAuthDropdown}
                    className={clsx('p-2 rounded-xl transition-colors', isDarkMode ? 'bg-gray-800/70 hover:bg-gray-700 text-gray-300' : 'bg-white/80 hover:bg-gray-100 text-gray-700 shadow-sm')}
                  >
                    <Lock size={24} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Dropdown — rendered outside nav so it appears behind sticky navbar */}
      <AnimatePresence>
        {isProfileDropdownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black z-40"
              onClick={closeProfileDropdown}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              ref={dropdownRef}
              className={clsx(
                'fixed top-0 right-0 z-50 h-fit max-h-screen w-fit max-w-[85vw] shadow-2xl overflow-y-auto',
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              )}
            >
              <div className="p-4">
                <button
                  onClick={closeProfileDropdown}
                  className={clsx(
                    'absolute top-2 right-2 p-2 transition-colors',
                    isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <Link
                  href="/profile"
                  onClick={closeProfileDropdown}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 transition-colors text-[21px] font-medium whitespace-nowrap',
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <User size={18} />
                  <span>Profile</span>
                </Link>
                <button
                  onClick={() => {
                    closeProfileDropdown();
                    setShowSignoutModal(true);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 transition-colors text-[21px] font-medium text-red-600 whitespace-nowrap',
                    isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-red-50'
                  )}
                >
                  <LogOut size={18} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Dropdown — Sign In / Sign Up */}
      <AnimatePresence>
        {isAuthDropdownOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black z-40"
              onClick={closeAuthDropdown}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              ref={authDropdownRef}
              className={clsx(
                'fixed top-0 right-0 z-50 h-fit max-h-screen w-fit max-w-[85vw] shadow-2xl overflow-y-auto rounded-l-2xl',
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              )}
            >
              <div className="p-0">
                <button
                  onClick={closeAuthDropdown}
                  className={clsx(
                    'absolute top-2 right-2 p-2 rounded-lg transition-colors',
                    isDarkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'
                  )}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => {
                    closeAuthDropdown();
                    openAuthModal('login');
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium whitespace-nowrap',
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <LogIn size={18} />
                  <span className='text-2xl'>Sign In</span>
                </button>
                <button
                  onClick={() => {
                    closeAuthDropdown();
                    openAuthModal('signup');
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium whitespace-nowrap',
                    isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <UserPlus size={18} />
                  <span className='text-2xl'>Sign Up</span>
                </button>
                <div className="h-px my-0" />
                <button
                  onClick={() => {
                    closeAuthDropdown();
                    // Navigate to vendor onboarding
                    window.location.href = '/vendors/new';
                  }}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium whitespace-nowrap',
                    isDarkMode ? 'text-festac-green hover:bg-gray-700' : 'text-festac-green hover:bg-green-50'
                  )}
                >
                  <Store size={18} />
                  <span className='text-xl'>Become a Vendor</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signout Confirmation Modal */}
      <AnimatePresence>
        {showSignoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowSignoutModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  'w-full max-w-sm rounded-2xl shadow-2xl p-6',
                  isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                )}
              >
              <h3 className={clsx('text-xl font-semibold mb-2', isDarkMode ? 'text-white' : 'text-gray-900')}>
                Sign Out
              </h3>
              <p className={clsx('text-sm mb-6', isDarkMode ? 'text-gray-400' : 'text-gray-600')}>
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSignoutModal(false)}
                  className={clsx(
                    'flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors',
                    isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  )}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowSignoutModal(false);
                    handleSignout();
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
