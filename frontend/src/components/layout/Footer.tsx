import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white/70 py-8 text-xs text-stone-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <span className="font-semibold text-stone-800">AdaptiveDB Research Lab</span>
            <span className="hidden sm:inline text-stone-300">•</span>
            <span>Distributed Key-Value Engine with Adaptive Consistency Control</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-stone-500">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-stone-700">
              Controller: v2.0-adaptive
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-stone-100 font-mono text-[11px] text-stone-700">
              gRPC :50051
            </span>
            <span className="text-stone-400">Zero Synthetic Benchmarks • 100% Executed Metrics</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
