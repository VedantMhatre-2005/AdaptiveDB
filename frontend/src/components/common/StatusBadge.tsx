import React from 'react';

interface StatusBadgeProps {
  type?: 'mode' | 'status' | 'custom';
  value: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  type = 'mode',
  value,
  className = '',
  size = 'md',
}) => {
  const normalized = (value || '').toUpperCase();
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  }[size];

  if (type === 'mode' || ['STRONG', 'QUORUM', 'EVENTUAL', 'ADAPTIVE', 'COMPARE_ALL'].includes(normalized)) {
    switch (normalized) {
      case 'STRONG':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200/80 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            STRONG
          </span>
        );
      case 'QUORUM':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200/80 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            QUORUM (W+R&gt;N)
          </span>
        );
      case 'EVENTUAL':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            EVENTUAL
          </span>
        );
      case 'ADAPTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-purple-50 text-purple-700 border border-purple-200 shadow-sm ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-ping" />
            ADAPTIVE
          </span>
        );
      case 'COMPARE_ALL':
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/80 ${sizeClasses} ${className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            COMPARE ALL MODES
          </span>
        );
      default:
        break;
    }
  }

  // Execution statuses
  const statusLower = (value || '').toLowerCase();
  switch (statusLower) {
    case 'completed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Completed
        </span>
      );
    case 'running':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-spin" />
          Running
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-rose-50 text-rose-700 border border-rose-200 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          Failed
        </span>
      );
    case 'cancelled':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
          Cancelled
        </span>
      );
    case 'pending':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200 ${sizeClasses} ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Pending
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-stone-100 text-stone-700 border border-stone-200 ${sizeClasses} ${className}`}>
          {value}
        </span>
      );
  }
};
