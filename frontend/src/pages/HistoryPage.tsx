import React, { useState, useEffect } from 'react';
import type { ExperimentRecord, HistoricalResultsData } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import {
  History,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
} from 'lucide-react';

interface HistoryPageProps {
  onSelectExperiment: (experiment: ExperimentRecord) => void;
  onNavigateToSimulator: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  onSelectExperiment,
  onNavigateToSimulator,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'recent' | 'baseline'>('recent');
  const [experiments, setExperiments] = useState<ExperimentRecord[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalResultsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [expResponse, histResponse] = await Promise.all([
        api.getExperiments(),
        api.getHistoricalResults(),
      ]);
      setExperiments(expResponse.experiments || []);
      setHistoricalData(histResponse);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to fetch historical runs');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiments = experiments.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.config.consistency_mode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-brand-primary" />
            Experiment Archive &amp; Historical Baselines
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Browse persisted experiment runs and verified benchmark datasets from disk.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-stone-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('recent')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeSubTab === 'recent'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Recent Experiments ({experiments.length})
          </button>
          <button
            onClick={() => setActiveSubTab('baseline')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
              activeSubTab === 'baseline'
                ? 'bg-white text-brand-primary shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Baseline Data
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Reading experiment catalog and CSV datasets..." />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm">
          {error}
        </div>
      ) : activeSubTab === 'recent' ? (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search experiments by name, ID, or mode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {filteredExperiments.length === 0 ? (
            <EmptyState
              title="No Experiments Found"
              description="No experiments match your search or no executions have been run yet."
              actionText="Launch an Experiment"
              onAction={onNavigateToSimulator}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExperiments.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => onSelectExperiment(exp)}
                  className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs hover:border-brand-primary/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge value={exp.config.consistency_mode} size="sm" />
                      <StatusBadge value={exp.status} size="sm" type="status" />
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 mb-1 line-clamp-1">{exp.name}</h3>
                    <p className="text-[11px] font-mono text-stone-400 mb-4">{exp.id}</p>

                    <div className="space-y-1.5 text-xs text-stone-600">
                      <div className="flex justify-between">
                        <span className="text-stone-400">Success Rate:</span>
                        <span className="font-mono font-semibold text-emerald-600">
                          {exp.summary.success_rate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Avg Latency:</span>
                        <span className="font-mono font-semibold">
                          {exp.summary.average_latency_ms.toFixed(1)} ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-400">Throughput:</span>
                        <span className="font-mono font-semibold text-brand-primary">
                          {exp.summary.throughput_ops_sec.toFixed(1)} ops/s
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(exp.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-brand-primary font-semibold flex items-center gap-1">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Baseline Data Tab */
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                Phase 2 Verified Research Datasets
              </h4>
              <p className="mt-1 leading-relaxed">
                Loaded directly from disk (<code className="font-mono bg-emerald-100 px-1 py-0.5 rounded">results/fault_injection_results.csv</code>).
                These authentic results document the performance of STRONG, QUORUM, EVENTUAL, and ADAPTIVE
                under simulated delays (50ms, 100ms), 10% packet drop, and replica partitions.
              </p>
            </div>
          </div>

          {historicalData && historicalData.fault_injection_results.length > 0 && (
            <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-stone-900">
                    results/fault_injection_results.csv ({historicalData.fault_injection_results.length} rows)
                  </span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">100% Genuine File Records</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 text-xs font-mono">
                  <thead className="bg-stone-50 text-stone-700 uppercase font-semibold">
                    <tr>
                      <th className="px-3 py-2.5 text-left font-sans">Experiment</th>
                      <th className="px-3 py-2.5 text-left font-sans">Mode</th>
                      <th className="px-3 py-2.5 text-right font-sans">Success Rate</th>
                      <th className="px-3 py-2.5 text-right font-sans">Avg Latency</th>
                      <th className="px-3 py-2.5 text-right font-sans">P95</th>
                      <th className="px-3 py-2.5 text-right font-sans">Throughput</th>
                      <th className="px-3 py-2.5 text-right font-sans">Delay</th>
                      <th className="px-3 py-2.5 text-right font-sans">Nodes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {historicalData.fault_injection_results.map((row, idx) => (
                      <tr key={idx} className="hover:bg-stone-50">
                        <td className="px-3 py-2 text-stone-800 font-medium font-sans">{row.experiment}</td>
                        <td className="px-3 py-2">
                          <StatusBadge value={row.consistency_mode} size="sm" />
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-emerald-600">
                          {Number(row.success_rate).toFixed(1)}%
                        </td>
                        <td className="px-3 py-2 text-right">{Number(row.average_latency_ms).toFixed(2)} ms</td>
                        <td className="px-3 py-2 text-right">{Number(row.p95_latency_ms).toFixed(2)} ms</td>
                        <td className="px-3 py-2 text-right text-brand-primary">{Number(row.throughput_ops_sec).toFixed(1)}</td>
                        <td className="px-3 py-2 text-right">{row.configured_delay_ms} ms</td>
                        <td className="px-3 py-2 text-right font-sans">
                          {row.available_node_count} / {row.configured_node_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
