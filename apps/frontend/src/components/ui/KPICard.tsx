import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useUIStore } from '../../stores/ui.store';
import { Skeleton } from './index';

export interface KPICardProps {
  icon?: ReactNode;
  iconContainerClassName?: string;
  label: string;
  labelPosition?: 'top' | 'bottom' | 'top-left';
  labelClassName?: string;
  value?: string | number;
  isLoading?: boolean;
  valueClassName?: string;
  topRight?: ReactNode;
  delay?: number;
  containerClassName?: string;
}

export function KPICard({
  icon,
  iconContainerClassName,
  label,
  labelPosition = 'top',
  labelClassName,
  value,
  isLoading,
  valueClassName,
  topRight,
  delay = 0,
  containerClassName,
}: KPICardProps) {
  const { isDarkMode } = useUIStore();

  const defaultContainer = clsx(
    'rounded-xl p-4 border flex flex-col gap-2',
    isDarkMode ? 'bg-white/10 backdrop-blur border-transparent' : 'bg-gray-50 border-gray-200 shadow-xl hover:shadow-2xl transition-shadow duration-200'
  );

  const defaultIconContainer = 'p-2 rounded-lg';

  const defaultValueClass = 'text-3xl font-bold font-mono';
  const defaultLabelClass = 'text-sm';

  const valueSizeMatch = valueClassName?.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/);
  const valueSize = valueSizeMatch ? valueSizeMatch[1] : '6xl';

  const skeletonSize: string = {
    xs: 'h-5 w-20',
    sm: 'h-5 w-20',
    base: 'h-6 w-24',
    lg: 'h-7 w-24',
    xl: 'h-7 w-24',
    '2xl': 'h-8 w-28',
    '3xl': 'h-9 w-32',
    '4xl': 'h-10 w-32',
    '5xl': 'h-12 w-36',
    '6xl': 'h-14 w-36',
    '7xl': 'h-16 w-40',
    '8xl': 'h-16 w-40',
    '9xl': 'h-16 w-40',
  }[valueSize] || 'h-14 w-36';

  const topRightContent = topRight ? (
    topRight
  ) : labelPosition === 'top' ? (
    <p
      className={clsx(
        'text-right',
        defaultLabelClass,
        labelClassName,
        isDarkMode ? 'text-white/60' : 'text-gray-500'
      )}
    >
      {label}
    </p>
  ) : null;

  const topLeftContent = labelPosition === 'top-left' ? (
    <p
      className={clsx(
        'text-left',
        defaultLabelClass,
        labelClassName,
        isDarkMode ? 'text-white/60' : 'text-gray-500'
      )}
    >
      {label}
    </p>
  ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={clsx('flex flex-col', containerClassName || defaultContainer)}
    >
      <div className="flex justify-between items-start">
        {labelPosition === 'top-left' ? (
          <div className="text-left">{topLeftContent}</div>
        ) : icon ? (
          <div className={clsx((iconContainerClassName || '').replace(/\s?bg-[^\s]+/g, '') || defaultIconContainer)}>
            {isLoading ? (
              <Skeleton
                className={clsx(
                  'h-5 w-5 rounded-md',
                  isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                )}
              />
            ) : (
              icon
            )}
          </div>
        ) : (
          <div />
        )}
        <div className="text-right">{topRightContent}</div>
      </div>

      {isLoading ? (
        <Skeleton
          className={clsx(
            'rounded-lg',
            skeletonSize,
            isDarkMode ? 'bg-gray-900' : 'bg-gray-300'
          )}
        />
      ) : (
        <p
          className={clsx(
            defaultValueClass,
            isDarkMode ? 'text-white' : 'text-gray-900',
            valueClassName
          )}
        >
          {value ?? 0}
        </p>
      )}

      {labelPosition === 'bottom' && (
        <p
          className={clsx(
            defaultLabelClass,
            labelClassName,
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          )}
        >
          {label}
        </p>
      )}
    </motion.div>
  );
}
