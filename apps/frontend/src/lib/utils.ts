export function formatCurrencyCompact(amount: number): string {
  if (amount === 0) return '₦0';
  
  const absAmount = Math.abs(amount);
  let formatted: string;
  let suffix = '';
  
  if (absAmount >= 1000000000) {
    formatted = (absAmount / 1000000000).toFixed(2);
    suffix = 'B';
  } else if (absAmount >= 1000000) {
    formatted = (absAmount / 1000000).toFixed(2);
    suffix = 'M';
  } else if (absAmount >= 1000) {
    formatted = (absAmount / 1000).toFixed(2);
    suffix = 'K';
  } else {
    formatted = absAmount.toFixed(2);
    suffix = '';
  }
  
  // Remove trailing .00
  if (formatted.endsWith('.00')) {
    formatted = formatted.slice(0, -3);
  }
  
  return `₦${formatted}${suffix}`;
}

export function formatNumberCompact(amount: number): string {
  if (amount === 0) return '0';
  
  const absAmount = Math.abs(amount);
  let formatted: string;
  let suffix = '';
  
  if (absAmount >= 1000000000) {
    formatted = (absAmount / 1000000000).toFixed(2);
    suffix = 'B';
  } else if (absAmount >= 1000000) {
    formatted = (absAmount / 1000000).toFixed(2);
    suffix = 'M';
  } else if (absAmount >= 1000) {
    formatted = (absAmount / 1000).toFixed(2);
    suffix = 'K';
  } else {
    formatted = absAmount.toFixed(2);
    suffix = '';
  }
  
  // Remove trailing .00
  if (formatted.endsWith('.00')) {
    formatted = formatted.slice(0, -3);
  }
  
  return `${formatted}${suffix}`;
}
