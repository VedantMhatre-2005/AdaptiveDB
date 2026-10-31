import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  subMessage,
  size = 'md',
}) => {
  const spinnerSizes = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div
        className={`${spinnerSizes} rounded-full border-brand-primary border-t-transparent animate-spin mb-3`}
      />
      {message && <p className="text-sm font-medium text-stone-700">{message}</p>}
      {subMessage && <p className="text-xs text-stone-500 mt-1 max-w-sm">{subMessage}</p>}
    </div>
  );
};

export { EmptyState, type EmptyStateProps } from './EmptyState';

