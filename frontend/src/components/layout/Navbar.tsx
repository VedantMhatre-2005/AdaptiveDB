import React from 'react';
import type { BackendHealth } from '../../types';
import { Activity, Server, Database, ShieldCheck, Cpu, Send } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: BackendHealth | null;
  healthLoading: boolean;
  onRefreshHealth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  health,
  healthLoading,
  onRefreshHealth,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview & Theory', icon: Activity },
    { id: 'query', label: 'Live Query & Replicas', icon: Send },
    { id: 'simulator', label: 'Experiment Runner', icon: Cpu },
    { id: 'results', label: 'Analysis & Charts', icon: Database },
    { id: 'history', label: 'Baseline & History', icon: Server },
    { id: 'architecture', label: 'Distributed Design', icon: ShieldCheck },
  ];

  const getHealthBadge = () => {
    if (healthLoading && !health) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-stone-100 text-stone-600 border border-stone-200">
          <span className="w-2 h-2 rounded-full bg-stone-400 animate-pulse" />
          Checking cluster...
        </span>
      );
    }

    if (!health) {
      return (
        <button
          onClick={onRefreshHealth}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
          title="Click to retry connection"
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          API Offline (Click to retry)
        </button>
      );
    }

    const aliveCount = health.cluster.alive_nodes;
    const totalCount = health.cluster.total_nodes;
    const isDegraded = aliveCount < totalCount;

    return (
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${
            isDegraded
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
          title={`Cluster: ${aliveCount}/${totalCount} nodes responding. Storage: ${health.storage_mode}`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isDegraded ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          {aliveCount}/{totalCount} Nodes Active
        </span>

        <span className="hidden md:inline-flex items-center px-2 py-0.5 text-[11px] font-mono rounded bg-stone-100 text-stone-600 border border-stone-200">
          {health.storage_mode === 'live_postgresql' ? 'PostgreSQL 4x' : 'Mock MemDB'}
        </span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-primary to-brand-secondary flex items-center justify-center text-white shadow-sm font-black text-lg tracking-wider">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-stone-900 font-sans">
                  Adaptive<span className="text-brand-primary">DB</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-blue-50 text-blue-700 rounded border border-blue-200">
                  Research Simulator
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Distributed Consistency &amp; Fault-Injection Laboratory
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-stone-100 text-brand-primary font-semibold shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-primary' : 'text-stone-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Health status & Quick actions */}
          <div className="flex items-center gap-3">
            {getHealthBadge()}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-stone-100 space-x-1 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-brand-primary font-semibold'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
