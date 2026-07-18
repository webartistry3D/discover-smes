import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Store,
  CheckCircle,
  BarChart3,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '../../stores/auth.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function AdminMobileBottomNav() {
  const [location] = useLocation();
  const { user } = useAuthStore();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/admin',
      icon: <LayoutDashboard size={36} />,
    },
    {
      label: 'Vendors',
      href: '/admin',
      icon: <Store size={36} />,
    },
    {
      label: 'Verification',
      href: '/admin',
      icon: <CheckCircle size={36} />,
    },
    {
      label: 'Analytics',
      href: '/admin',
      icon: <BarChart3 size={36} />,
    },
    {
      label: 'Settings',
      href: '/admin',
      icon: <Settings size={36} />,
    },
  ];

  const isActive = (href: string) => {
    return location === '/admin';
  };

  return (
    <div className={clsx(
      'fixed bottom-0 left-0 right-0 z-50',
      'border-t',
      'bg-gray-900 border-gray-800'
    )}>
      <div className="flex items-center justify-around px-2 py-3 max-w-7xl mx-auto">
        {navItems.map((item) => (
          <motion.div
            key={item.label}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href={item.href}
              className={clsx(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[70px]',
                isActive(item.href)
                  ? 'text-green-300'
                  : 'text-gray-400 hover:text-gray-300'
              )}
            >
              {item.icon}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
