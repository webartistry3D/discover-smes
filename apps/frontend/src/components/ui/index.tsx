import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Star } from 'lucide-react';

// ─── BUTTON ──────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'whatsapp' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconPosition = 'left', className, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-festac-green text-white hover:bg-festac-green-light shadow-sm',
      secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600',
      outline: 'border-2 border-festac-green text-festac-green hover:bg-festac-green hover:text-white',
      ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
      whatsapp: 'bg-whatsapp text-white hover:bg-green-500 shadow-sm',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
    };
    const sizes = {
      sm: 'px-3.5 py-2 text-xs rounded-lg gap-1.5',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
      lg: 'px-6 py-3.5 text-base rounded-xl gap-2.5',
    };

    return (
      <motion.button
        ref={ref as any}
        whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
        className={clsx(
          'inline-flex items-center justify-center font-semibold transition-all duration-150',
          'disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || loading}
        {...props as any}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
          </svg>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {children}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </motion.button>
    );
  },
);
Button.displayName = 'Button';

// ─── BADGE ───────────────────────────────────────────────────

type BadgeVariant = 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ variant = 'green', children, className, dot }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    green: 'bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
    amber: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    red: 'bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    blue: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    gray: 'bg-gray-50 text-gray-700 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
    purple: 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  };
  const dotColors: Record<BadgeVariant, string> = {
    green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500',
    blue: 'bg-blue-500', gray: 'bg-gray-400', purple: 'bg-purple-500',
  };

  return (
    <span className={clsx('badge', variants[variant], className)}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

// ─── SKELETON ────────────────────────────────────────────────

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton rounded-lg', className)} />;
}

export function VendorCardSkeleton() {
  return (
    <div className="vendor-card p-0 overflow-hidden animate-fade-in dark:bg-gray-800">
      <Skeleton className="h-44 w-full rounded-none dark:bg-gray-700" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4 dark:bg-gray-700" />
        <Skeleton className="h-3.5 w-full dark:bg-gray-700" />
        <Skeleton className="h-3.5 w-2/3 dark:bg-gray-700" />
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-16 dark:bg-gray-700" />
          <Skeleton className="h-4 w-20 dark:bg-gray-700" />
        </div>
      </div>
    </div>
  );
}

// ─── STAR RATING ────────────────────────────────────────────

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, max = 5, size = 'sm', showValue, reviewCount }: StarRatingProps) {
  const sizeMap = { sm: 12, md: 16, lg: 20 };
  const px = sizeMap[size];

  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: max }).map((_, i) => (
          <Star
            key={i}
            size={px}
            className={i < Math.round(rating) ? 'star-filled' : 'star-empty'}
          />
        ))}
      </div>
      {showValue && (
        <span className={clsx('font-semibold text-gray-800 dark:text-gray-200', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className={clsx('text-gray-400 dark:text-gray-500', size === 'sm' ? 'text-xs' : 'text-sm')}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// ─── AVATAR ──────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const sizes = { xs: 'w-6 h-6 text-2xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-lg' };
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700', sizes[size], className)}
      />
    );
  }

  const colors = ['bg-festac-green', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
  const colorIndex = name.charCodeAt(0) % colors.length;

  return (
    <div className={clsx('rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0', sizes[size], colors[colorIndex], className)}>
      {initials}
    </div>
  );
}

// ─── EMPTY STATE ─────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {icon && <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-400">{icon}</div>}
      <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-1">{title}</h3>
      {description && <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}

// ─── LOADING SPINNER ─────────────────────────────────────────

export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <svg className={clsx('animate-spin text-festac-green', sizes[size], className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  );
}
