import React, { useState } from 'react';
import type { ExperimentRecord } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Download,
  Calendar,
  Layers,
  Clock,
  Zap,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

interface ResultsPageProps {
  currentExperiment: ExperimentRecord | null;
  onNavigateToSimulator: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  currentExperiment,
  onNavigateToSimulator,
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'table' | 'decisions'>('charts');

  if (!currentExperiment) {
    return (
      <div className="py-12">
        <EmptyState
          title="No Experiment Results Loaded"
          description="Execute a new experiment from the Simulator to inspect authentic metrics and performance charts."
          actionText="Open Simulator"
          onAction={onNavigateToSimulator}
          icon={<BarChart3 className="w-6 h-6 text-brand-primary" />}
        />
      </div>
    );
  }

  const { summary, results, adaptive_decisions, config } = currentExperiment;

  // Prepare chart data from authentic results
  const modeComparisonData = results.map((row) => ({
    name: `${row.consistency_mode} (Run ${row.repetition})`,
    mode: row.consistency_mode,
    repetition: row.repetition,
    avgLatency: Number(row.average_latency_ms.toFixed(2)),
    medianLatency: Number(row.median_latency_ms.toFixed(2)),
    p95Latency: Number(row.p95_latency_ms.toFixed(2)),
    p99Latency: Number(row.p99_latency_ms.toFixed(2)),
    throughput: Number(row.throughput_ops_sec.toFixed(2)),
    successRate: Number(row.success_rate.toFixed(1)),
    staleReads: row.stale_reads,
  }));

  const handleExport = (format: 'csv' | 'json') => {
    const url = api.getExportUrl(currentExperiment.id, format);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 py-6">
      {/* Top Header Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <h1 className="text-xl font-bold text-stone-900">{currentExperiment.name}</h1>
            <StatusBadge value={config.consistency_mode} size="sm" />
            <StatusBadge value={currentExperiment.status} size="sm" type="status" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              ID: {currentExperiment.id}
            </span>
            <span>•</span>
            <span>Created: {new Date(currentExperiment.created_at).toLocaleString()}</span>
            <span>•</span>
            <span>Engine: {currentExperiment.provenance.mock_storage ? 'In-Memory Store' : 'Live PostgreSQL Cluster'}</span>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 border border-blue-200 text-brand-primary hover:bg-blue-100 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-brand-primary" />
            Export JSON
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Success Rate */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Success Rate</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {summary.success_rate.toFixed(1)}%
          </div>
          <div className="text-xs text-stone-400 mt-1">
            {summary.total_succeeded} / {summary.total_attempted} operations
          </div>
        </div>

        {/* Average Latency */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Average Latency</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {summary.average_latency_ms.toFixed(2)} <span className="text-sm font-normal text-stone-500">ms</span>
          </div>
          <div className="text-xs text-stone-400 mt-1 font-mono">
            Median: {summary.median_latency_ms.toFixed(2)} ms
          </div>
        </div>

        {/* Tail Latency (P95) */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>P95 / P99 Latency</span>
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {summary.p95_latency_ms.toFixed(2)} <span className="text-sm font-normal text-stone-500">ms</span>
          </div>
          <div className="text-xs text-stone-400 mt-1 font-mono">
            P99: {summary.p99_latency_ms.toFixed(2)} ms
          </div>
        </div>

        {/* Throughput */}
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
            <span>Throughput</span>
            <Zap className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono">
            {summary.throughput_ops_sec.toFixed(1)} <span className="text-sm font-normal text-stone-500">ops/s</span>
          </div>
          <div className="text-xs text-stone-400 mt-1">
            Stale reads: {summary.stale_reads}
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-stone-200 space-x-6">
        <button
          onClick={() => setActiveTab('charts')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'charts'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Latency &amp; Performance Visualizations
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            activeTab === 'table'
              ? 'border-brand-primary text-brand-primary'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Verifiable Results Table ({results.length} rows)
        </button>
        {adaptive_decisions.length > 0 && (
          <button
            onClick={() => setActiveTab('decisions')}
            className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
              activeTab === 'decisions'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            Adaptive Decision Traces ({adaptive_decisions.length})
          </button>
        )}
      </div>

      {/* Tab: Charts */}
      {activeTab === 'charts' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latency Comparison */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Latency Distribution (Average vs P95 vs P99)
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Measured end-to-end operation latency in milliseconds (lower is better)
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modeComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} unit="ms" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="avgLatency" name="Avg Latency (ms)" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="p95Latency" name="P95 Latency (ms)" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="p99Latency" name="P99 Latency (ms)" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Throughput & Success Rate */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-stone-900 mb-1">
              Throughput &amp; Stale Reads
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Completed operations per second and observed transient inconsistency
            </p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modeComparisonData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="throughput" name="Throughput (ops/sec)" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="staleReads" name="Stale Reads Detected" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Table */}
      {activeTab === 'table' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-xs">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-3 py-3 text-right">Rep</th>
                  <th className="px-3 py-3 text-right">Attempted</th>
                  <th className="px-3 py-3 text-right">Success</th>
                  <th className="px-3 py-3 text-right">Success Rate</th>
                  <th className="px-3 py-3 text-right">Avg (ms)</th>
                  <th className="px-3 py-3 text-right">P95 (ms)</th>
                  <th className="px-3 py-3 text-right">P99 (ms)</th>
                  <th className="px-3 py-3 text-right">Throughput</th>
                  <th className="px-3 py-3 text-right">Stale Reads</th>
                  <th className="px-3 py-3 text-right">Nodes Avail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {results.map((row, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/80 font-mono">
                    <td className="px-4 py-3 font-sans">
                      <StatusBadge value={row.consistency_mode} size="sm" />
                    </td>
                    <td className="px-3 py-3 text-right">{row.repetition}</td>
                    <td className="px-3 py-3 text-right">{row.attempted_operations}</td>
                    <td className="px-3 py-3 text-right text-emerald-600">{row.successful_operations}</td>
                    <td className="px-3 py-3 text-right font-semibold">{row.success_rate.toFixed(1)}%</td>
                    <td className="px-3 py-3 text-right">{row.average_latency_ms.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right">{row.p95_latency_ms.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right">{row.p99_latency_ms.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right text-brand-primary">{row.throughput_ops_sec.toFixed(1)}</td>
                    <td className="px-3 py-3 text-right">{row.stale_reads}</td>
                    <td className="px-3 py-3 text-right font-sans">
                      {row.available_node_count} / {row.configured_node_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Decisions */}
      {activeTab === 'decisions' && (
        <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900">
              Adaptive Controller Decision Trace
            </h3>
            <p className="text-xs text-stone-500">
              Live feedback telemetry recorded by the Adaptive Controller during the run
            </p>
          </div>

          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="min-w-full divide-y divide-stone-200 text-xs font-mono">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5 text-left font-sans">Timestamp</th>
                  <th className="px-3 py-2.5 text-left font-sans">Op</th>
                  <th className="px-3 py-2.5 text-left font-sans">Selected Policy</th>
                  <th className="px-3 py-2.5 text-right font-sans">Latency</th>
                  <th className="px-3 py-2.5 text-right font-sans">Success</th>
                  <th className="px-3 py-2.5 text-left font-sans">Alive Nodes</th>
                  <th className="px-3 py-2.5 text-left font-sans">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 bg-white">
                {adaptive_decisions.map((dec, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="px-3 py-2 text-stone-500">{dec.timestamp}</td>
                    <td className="px-3 py-2 uppercase font-semibold text-stone-800">{dec.operation}</td>
                    <td className="px-3 py-2">
                      <StatusBadge value={dec.selected_consistency} size="sm" />
                    </td>
                    <td className="px-3 py-2 text-right">{dec.average_latency_ms.toFixed(1)} ms</td>
                    <td className="px-3 py-2 text-right">{(dec.success_rate * 100).toFixed(0)}%</td>
                    <td className="px-3 py-2 text-stone-600">{dec.alive_nodes}</td>
                    <td className="px-3 py-2 font-sans text-stone-700 text-xs">{dec.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
