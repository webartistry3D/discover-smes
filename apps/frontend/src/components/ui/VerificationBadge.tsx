import { ShieldCheck, ShieldAlert, Shield, BadgeCheck } from 'lucide-react';
import { clsx } from 'clsx';
import type { VerificationLevel } from '../../lib/shared';

interface Props {
  level: VerificationLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const config: Record<VerificationLevel, { icon: typeof Shield; label: string; className: string; iconClass: string }> = {
  NONE: {
    icon: Shield,
    label: 'Unverified',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
    iconClass: 'text-gray-400',
  },
  PHONE_VERIFIED: {
    icon: ShieldAlert,
    label: 'Phone Verified',
    className: 'bg-blue-50 text-blue-700 border-blue-100',
    iconClass: 'text-blue-500',
  },
  BUSINESS_VERIFIED: {
    icon: ShieldCheck,
    label: 'Business Verified',
    className: 'bg-green-50 text-green-700 border-green-100',
    iconClass: 'text-green-600',
  },
  GOVERNMENT_ENDORSED: {
    icon: BadgeCheck,
    label: 'Government Endorsed',
    className: 'bg-amber-50 text-amber-700 border-amber-100',
    iconClass: 'text-amber-500',
  },
};

const sizes = {
  sm: { icon: 12, text: 'text-2xs px-1.5 py-0.5 gap-1 rounded-md' },
  md: { icon: 14, text: 'text-xs px-2 py-1 gap-1.5 rounded-lg' },
  lg: { icon: 16, text: 'text-sm px-2.5 py-1.5 gap-2 rounded-xl' },
};

export function VerificationBadge({ level, size = 'md', showLabel = true }: Props) {
  const { icon: Icon, label, className, iconClass } = config[level];
  const { icon: iconSize, text } = sizes[size];

  if (level === 'NONE' && !showLabel) return null;

  return (
    <span className={clsx('inline-flex items-center font-semibold border', text, className)}>
      <Icon size={iconSize} className={iconClass} />
      {showLabel && label}
    </span>
  );
}
