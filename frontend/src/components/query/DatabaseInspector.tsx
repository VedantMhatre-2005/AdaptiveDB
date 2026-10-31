import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Trash2, AlertTriangle, CheckCircle2, Clock, Layers } from 'lucide-react';
import { api } from '../../services/api';
import type { ClusterDataResponse } from '../../types';

interface DatabaseInspectorProps {
  lastUpdatedTrigger?: number;
}

export const DatabaseInspector: React.FC<DatabaseInspectorProps> = ({
  lastUpdatedTrigger = 0,
}) => {
  const [data, setData] = useState<ClusterDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedNode, setSelectedNode] = useState<string>('node1');
  const [activeView, setActiveView] = useState<'individual' | 'matrix'>('matrix');
  const [clearing, setClearing] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchClusterData = async () => {
    setLoading(true);
    try {
      const res = await api.getClusterData();
      setData(res);
    } catch (err) {
      console.error('Failed to load database records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusterData();
  }, [lastUpdatedTrigger]);

  const handleClearCluster = async () => {
    if (!window.confirm('Are you sure you want to clear all records across all 4 database replicas?')) {
      return;
    }
    setClearing(true);
    try {
      const res = await api.clearCluster();
      setMessage(res.message);
      await fetchClusterData();
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error('Error clearing cluster:', err);
    } finally {
      setClearing(false);
    }
  };

  const nodeKeys = ['node1', 'node2', 'node3', 'node4'];

  return (
    <div className="bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold mb-2 border border-emerald-200">
            <Database className="w-3.5 h-3.5" />
            <span>Direct Database Explorer (Docker PostgreSQL)</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight">
            Live Replica Tables Inspector
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            View actual records, versions, and tombstones stored in each replica container in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-medium border border-stone-200">
            <button
              onClick={() => setActiveView('matrix')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'matrix' ? 'bg-white shadow-xs text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Cross-Node Matrix
            </button>
            <button
              onClick={() => setActiveView('individual')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeView === 'individual' ? 'bg-white shadow-xs text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              Single Replica
            </button>
          </div>

          <button
            onClick={fetchClusterData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors shadow-xs"
            title="Refresh tables"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand-primary' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleClearCluster}
            disabled={clearing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 transition-colors shadow-xs"
            title="Clear all records in cluster"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Data
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Divergence Warning Summary */}
      {data && Object.values(data.key_divergence).some((d) => d.diverged) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Replica Divergence Detected:</span> Some keys hold differing version numbers across replicas. This commonly happens under <strong>EVENTUAL</strong> consistency during replication lag or when a replica has been partitioned.
          </div>
        </div>
      )}

      {/* Cross-Node Matrix View */}
      {activeView === 'matrix' && data && (
        <div className="overflow-x-auto border border-stone-200/90 rounded-2xl shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono">
              <tr>
                <th className="px-4 py-3 font-semibold">Key</th>
                <th className="px-4 py-3 font-semibold">Consistency State</th>
                <th className="px-4 py-3 font-semibold">Node 1 (:5433)</th>
                <th className="px-4 py-3 font-semibold">Node 2 (:5434)</th>
                <th className="px-4 py-3 font-semibold">Node 3 (:5435)</th>
                <th className="px-4 py-3 font-semibold">Node 4 (:5436)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {Object.keys(data.key_divergence).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-stone-400 font-sans">
                    No keys in the database. Send a <strong>PUT</strong> query above to populate the replicas!
                  </td>
                </tr>
              ) : (
                Object.entries(data.key_divergence).map(([k, divInfo]) => (
                  <tr key={k} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-stone-900">{k}</td>
                    <td className="px-4 py-3">
                      {divInfo.diverged ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Diverged (Lagging)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Synchronized
                        </span>
                      )}
                    </td>
                    {nodeKeys.map((nodeId) => {
                      const nodeEntry = divInfo.nodes_holding[nodeId];
                      if (!nodeEntry) {
                        return (
                          <td key={nodeId} className="px-4 py-3 text-stone-400 italic">
                            Missing
                          </td>
                        );
                      }
                      return (
                        <td key={nodeId} className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-stone-800 font-medium">
                              {nodeEntry.deleted ? (
                                <span className="text-rose-600 font-semibold">[Tombstone]</span>
                              ) : (
                                `"${nodeEntry.value}"`
                              )}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              Version: <strong className="text-blue-600">v{nodeEntry.version}</strong>
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Individual Single-Replica Tab View */}
      {activeView === 'individual' && data && (
        <div className="space-y-4">
          {/* Node Tab Pills */}
          <div className="flex flex-wrap gap-2">
            {nodeKeys.map((n) => {
              const nodeInfo = data.replicas[n];
              return (
                <button
                  key={n}
                  onClick={() => setSelectedNode(n)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
                    selectedNode === n
                      ? 'bg-brand-primary text-white border-brand-primary shadow-xs'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>{n}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedNode === n ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                    {nodeInfo?.record_count ?? 0} rows
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table for Selected Node */}
          {data.replicas[selectedNode] && (
            <div className="overflow-x-auto border border-stone-200/90 rounded-2xl shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-mono">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Key</th>
                    <th className="px-4 py-3 font-semibold">Value</th>
                    <th className="px-4 py-3 font-semibold">Logical Clock</th>
                    <th className="px-4 py-3 font-semibold">Tombstone</th>
                    <th className="px-4 py-3 font-semibold">Updated At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {data.replicas[selectedNode].records.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-stone-400 font-sans">
                        No records in replica {selectedNode}.
                      </td>
                    </tr>
                  ) : (
                    data.replicas[selectedNode].records.map((row) => (
                      <tr key={row.key} className="hover:bg-stone-50/60 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-stone-900">{row.key}</td>
                        <td className="px-4 py-2.5 text-stone-700">
                          {row.deleted ? (
                            <span className="text-rose-500 italic">NULL (Tombstone)</span>
                          ) : (
                            row.value
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            v{row.version}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {row.deleted ? (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                              TRUE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                              FALSE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-stone-500 text-[11px]">{row.updated_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 font-mono gap-2">
        <span>Total Unique Keys: {data?.total_unique_keys ?? 0}</span>
        <span>Connected Storage: <strong>{data?.storage_mode === 'live_postgresql' ? 'Docker PostgreSQL Cluster (Ports 5433–5436)' : 'In-Memory Replica Mock'}</strong></span>
      </div>
    </div>
  );
};

