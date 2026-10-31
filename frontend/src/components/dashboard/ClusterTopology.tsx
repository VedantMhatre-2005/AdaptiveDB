import React from 'react';
import type { BackendHealth } from '../../types';
import { Database, Server, Wifi, WifiOff, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ClusterTopologyProps {
  health: BackendHealth | null;
  unavailableNodes?: string[];
  simulatedDelayMs?: number;
  failureProbability?: number;
  onToggleNode?: (nodeId: string) => void;
  interactive?: boolean;
}

export const ClusterTopology: React.FC<ClusterTopologyProps> = ({
  health,
  unavailableNodes = [],
  simulatedDelayMs = 0,
  failureProbability = 0,
  onToggleNode,
  interactive = false,
}) => {
  const nodes = [
    { id: 'node1', name: 'Replica 1', port: 5433, label: 'node1 (Port 5433)' },
    { id: 'node2', name: 'Replica 2', port: 5434, label: 'node2 (Port 5434)' },
    { id: 'node3', name: 'Replica 3', port: 5435, label: 'node3 (Port 5435)' },
    { id: 'node4', name: 'Replica 4', port: 5436, label: 'node4 (Port 5436)' },
  ];

  const isNodeSimulatedDown = (nodeId: string) => unavailableNodes.includes(nodeId);

  return (
    <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <Server className="w-5 h-5 text-brand-primary" />
            4-Node Distributed Replicated Topology
          </h3>
          <p className="text-xs text-stone-500">
            PostgreSQL multi-replica cluster coordinated via gRPC with WAL versioning
          </p>
        </div>

        {/* Global Fault Status */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {simulatedDelayMs > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 font-mono">
              <Wifi className="w-3 h-3 text-amber-500" />
              +{simulatedDelayMs}ms delay
            </span>
          )}
          {failureProbability > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-mono">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              {(failureProbability * 100).toFixed(0)}% drop rate
            </span>
          )}
          {unavailableNodes.length > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 font-mono">
              <WifiOff className="w-3 h-3 text-rose-500" />
              {unavailableNodes.length} partitioned
            </span>
          )}
        </div>
      </div>

      {/* Coordinator Header Card */}
      <div className="mb-8 flex justify-center">
        <div className="w-full max-w-md bg-stone-50 border-2 border-brand-primary/40 rounded-xl p-4 text-center shadow-xs">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 text-brand-primary mb-2">
            <Server className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-stone-900">Coordinator (gRPC Service)</h4>
          <p className="text-xs text-stone-500 font-mono">Port 50051 • Adaptive Consistency Controller</p>
          <div className="mt-2 flex items-center justify-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
              Quorum: W+R &gt; N
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
              Anti-Entropy WAL
            </span>
          </div>
        </div>
      </div>

      {/* Replica Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {nodes.map((node) => {
          const simulatedDown = isNodeSimulatedDown(node.id);
          const liveNodeHealth = health?.cluster?.nodes?.[node.id];
          const isPhysicallyAlive = liveNodeHealth ? liveNodeHealth.alive : true;
          const isEffectiveDown = simulatedDown || !isPhysicallyAlive;

          return (
            <div
              key={node.id}
              onClick={() => interactive && onToggleNode && onToggleNode(node.id)}
              className={`relative rounded-xl border p-4 transition-all ${
                interactive ? 'cursor-pointer hover:border-brand-primary/60 hover:shadow-md' : ''
              } ${
                isEffectiveDown
                  ? 'bg-rose-50/60 border-rose-300'
                  : 'bg-white border-stone-200/90 hover:border-stone-300'
              }`}
            >
              {/* Status Indicator */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-stone-700">{node.id}</span>
                {isEffectiveDown ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Online
                  </span>
                )}
              </div>

              {/* Node Icon and Description */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isEffectiveDown
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-semibold text-stone-900">{node.name}</h5>
                  <p className="text-[11px] font-mono text-stone-500">Port {node.port}</p>
                </div>
              </div>

              {/* Replica Parameters */}
              <div className="mt-3 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                <span>Conflict: LWW</span>
                <span className="font-mono">schema: kv_store</span>
              </div>

              {interactive && (
                <div className="mt-2 text-center">
                  <span className="text-[10px] text-stone-400">Click to toggle node partition</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
