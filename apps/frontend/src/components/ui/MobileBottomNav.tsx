import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  ChevronUp,
  ChevronDown,
  FileText,
  TrendingUp,
  Receipt,
  Calculator,
  PieChart,
  Users,
  MessageSquare,
  BrainCircuit,
  Megaphone,
  Sparkles,
  CalendarClock,
  Activity,
  MapPin,
  LogOut,
  Package,
  ScanLine
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';

// Custom Naira icon component
const NairaIcon = ({ size }: { size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Left vertical bar */}
    <line x1="5" y1="3" x2="5" y2="21" />
    {/* Right vertical bar */}
    <line x1="19" y1="3" x2="19" y2="21" />
    {/* Diagonal stroke top-left to bottom-right */}
    <line x1="5" y1="3" x2="19" y2="21" />
    {/* Top horizontal bar */}
    <line x1="3" y1="9" x2="21" y2="9" />
    {/* Bottom horizontal bar */}
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
  roles?: string[];
  hasDropdown?: boolean;
  dropdownKey?: string;
}

export function MobileBottomNav() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDarkMode, openAuthModal, dropdownCloseTrigger } = useUIStore();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [pendingDropdown, setPendingDropdown] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ left: number }>({ left: 0 });
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const financeRef = useRef<HTMLButtonElement>(null);
  const operationsRef = useRef<HTMLButtonElement>(null);
  const monitorRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when global close trigger changes
  useEffect(() => {
    setActiveDropdown(null);
    setPendingDropdown(null);
  }, [dropdownCloseTrigger]);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={36} />,
      requiresAuth: true,
      roles: ['VENDOR'],
    },
    {
      label: 'Finance',
      href: '#',
      icon: <NairaIcon size={36} />,
      hasDropdown: true,
      dropdownKey: 'finance',
      requiresAuth: true,
      roles: ['VENDOR'],
    },
    {
      label: 'Operations',
      href: '#',
      icon: <Settings size={36} />,
      hasDropdown: true,
      dropdownKey: 'operations',
      requiresAuth: true,
      roles: ['VENDOR'],
    },
    {
      label: 'Monitor',
      href: '#',
      icon: <BarChart3 size={36} />,
      hasDropdown: true,
      dropdownKey: 'monitor',
      requiresAuth: true,
      roles: ['VENDOR'],
    },
    {
      label: 'Map',
      href: '/map',
      icon: <MapPin size={36} />,
    },
  ];

  const financeSubItems = [
    { label: 'POS', href: '/pos', icon: <ScanLine size={18} /> },
    { label: 'Invoice', href: '/financial/invoices', icon: <FileText size={18} /> },
    { label: 'Income', href: '/financial/income', icon: <TrendingUp size={18} /> },
    { label: 'Expenses', href: '/financial/expense', icon: <Receipt size={18} /> },
    { label: 'Tax', href: '/tax', icon: <Calculator size={18} /> },
    { label: 'Reports', href: '/financial/reports', icon: <PieChart size={18} /> },
  ];

  const operationsSubItems = [
    { label: 'Inventory', href: '/inventory', icon: <Package size={18} /> },
    { label: 'Customers', href: '/crm', icon: <Users size={18} /> },
    { label: 'FAQs', href: '/chatbot/faq', icon: <MessageSquare size={18} /> },
    { label: 'Analytics', href: '/dashboard/analytics', icon: <BrainCircuit size={18} /> },
  ];

  const monitorSubItems = [
    { label: 'Bookings', href: '/bookings', icon: <CalendarClock size={18} /> },
    { label: 'Chat', href: '/chatbot/monitor', icon: <Activity size={18} /> },
    { label: 'Cost', href: '/chatbot/cost', icon: <BarChart3 size={18} /> },
    { label: 'Marketing', href: '/marketing', icon: <Megaphone size={18} /> },
    { label: 'Adverts', href: '/dashboard/promote', icon: <Sparkles size={18} /> },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === '/';
    if (href === '#') return false;
    return location.startsWith(href);
  };

  const isDropdownSectionActive = (dropdownKey: string) => {
    const subItems: Record<string, string[]> = {
      'finance': financeSubItems.map(item => item.href),
      'operations': operationsSubItems.map(item => item.href),
      'monitor': monitorSubItems.map(item => item.href),
    };
    
    const currentSubItems = subItems[dropdownKey] || [];
    return currentSubItems.some(href => location.startsWith(href));
  };

  const openDropdown = (dropdownKey: string) => {
    const refMap: Record<string, React.RefObject<HTMLButtonElement>> = {
      'finance': financeRef,
      'operations': operationsRef,
      'monitor': monitorRef,
    };
    
    const ref = refMap[dropdownKey];
    if (ref?.current) {
      const rect = ref.current.getBoundingClientRect();
      const dropdownWidth = 180; // min-width of dropdown
      let left = rect.left + rect.width / 2 - dropdownWidth / 2;

      setDropdownPosition({ left: Math.max(16, Math.min(window.innerWidth - dropdownWidth - 16, left)) });
    }
    
    setActiveDropdown(dropdownKey);
    setPendingDropdown(null);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.requiresAuth && !isAuthenticated) {
      openAuthModal();
      return;
    }
    if (item.roles && user && !item.roles.includes(user.role)) {
      return;
    }
    
    // Set the active button
    setActiveButton(item.label);
    
    // Clear any pending timeout
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    
    if (item.hasDropdown) {
      const targetKey = item.dropdownKey || '';
      
      if (activeDropdown === targetKey) {
        // Close if clicking the same one
        setActiveDropdown(null);
      } else if (activeDropdown) {
        // Close current and open new one after exit animation
        setPendingDropdown(targetKey);
        setActiveDropdown(null);
        dropdownTimeoutRef.current = setTimeout(() => {
          openDropdown(targetKey);
        }, 180);
      } else {
        // Open directly if no dropdown is active
        openDropdown(targetKey);
      }
    } else {
      // Close any open dropdown when clicking non-dropdown buttons
      setActiveDropdown(null);
      setPendingDropdown(null);
    }
  };

  const handleSubItemClick = (href: string) => {
    setActiveDropdown(null);
  };

  const isDropdownActive = (dropdownKey: string) => {
    return activeDropdown === dropdownKey || pendingDropdown === dropdownKey;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const handleSignOut = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <div className={clsx(
        'fixed bottom-0 left-0 right-0 z-50',
        'border-t',
        isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
      )}>
        <div className="flex items-center justify-around px-2 py-3 max-w-7xl mx-auto">
          {navItems.map((item) => {
            const isItemActive = activeButton === item.label;
            const isDropdownOpen = isDropdownActive(item.dropdownKey || '');
            const isAccessible = !item.requiresAuth || isAuthenticated;
            const hasRoleAccess = !item.roles || (user && item.roles.includes(user.role));

            if (!isAccessible || !hasRoleAccess) {
              return null;
            }

            if (item.hasDropdown) {
              const refMap: Record<string, React.RefObject<HTMLButtonElement>> = {
                'finance': financeRef,
                'operations': operationsRef,
                'monitor': monitorRef,
              };
              const ref = refMap[item.dropdownKey || ''];
              const isSectionActive = isDropdownSectionActive(item.dropdownKey || '');
              
              return (
                <motion.button
                  key={item.label}
                  ref={ref}
                  onClick={() => handleNavClick(item)}
                  whileTap={{ scale: 0.95 }}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px]',
                    isDropdownOpen || isSectionActive
                      ? 'text-festac-green'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {item.icon}
                </motion.button>
              );
            }

            return (
              <motion.div
                key={item.label}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href={item.href}
                  onClick={() => handleNavClick(item)}
                  className={clsx(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px]',
                    isItemActive
                      ? 'text-festac-green'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-gray-300'
                        : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {item.icon}
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Dropdown Overlays */}
      <AnimatePresence>
        {activeDropdown && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setActiveDropdown(null)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scaleY: 0.9 }}
              animate={{ opacity: 1, y: 0, scaleY: 1 }}
              exit={{ opacity: 0, y: 16, scaleY: 0.9 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28, mass: 0.8 }}
              style={{ left: `${dropdownPosition.left}px`, transformOrigin: 'bottom center' }}
              className={clsx(
                'fixed bottom-16 z-40 shadow-2xl overflow-hidden rounded-2xl',
                isDarkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
              )}
            >
              <div className="p-2 w-max">
              {activeDropdown === 'finance' && (
                <>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 8 }
                    }}
                    className="px-4 py-2 text-[18px] font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Finance
                  </motion.div>
                  {financeSubItems.map((subItem) => (
                    <motion.div
                      key={subItem.href}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        visible: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: -8 }
                      }}
                    >
                      <Link
                        href={subItem.href}
                        onClick={() => handleSubItemClick(subItem.href)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap',
                          isActive(subItem.href)
                            ? 'text-green-600'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {subItem.icon}
                        <span className="text-[21px] font-medium">{subItem.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}

              {activeDropdown === 'operations' && (
                <>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 8 }
                    }}
                    className="px-4 py-2 text-[18px] font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Operations
                  </motion.div>
                  {operationsSubItems.map((subItem) => (
                    <motion.div
                      key={subItem.href}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        visible: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: -8 }
                      }}
                    >
                      <Link
                        href={subItem.href}
                        onClick={() => handleSubItemClick(subItem.href)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap',
                          isActive(subItem.href)
                            ? 'text-green-600'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {subItem.icon}
                        <span className="text-[21px] font-medium">{subItem.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}

              {activeDropdown === 'monitor' && (
                <>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      visible: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 8 }
                    }}
                    className="px-4 py-2 text-[18px] font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    Monitor
                  </motion.div>
                  {monitorSubItems.map((subItem) => (
                    <motion.div
                      key={subItem.href}
                      variants={{
                        hidden: { opacity: 0, x: -12 },
                        visible: { opacity: 1, x: 0 },
                        exit: { opacity: 0, x: -8 }
                      }}
                    >
                      <Link
                        href={subItem.href}
                        onClick={() => handleSubItemClick(subItem.href)}
                        className={clsx(
                          'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors whitespace-nowrap',
                          isActive(subItem.href)
                            ? 'text-green-600'
                            : isDarkMode
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-gray-700 hover:bg-gray-50'
                        )}
                      >
                        {subItem.icon}
                        <span className="text-[21px] font-medium">{subItem.label}</span>
                      </Link>
                    </motion.div>
                  ))}
                </>
              )}

              </div>
          </motion.div>
        </>
      )}
      </AnimatePresence>
    </>
  );
}
