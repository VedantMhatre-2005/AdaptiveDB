import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Database, CheckCircle2, XCircle, Clock, Zap, WifiOff } from 'lucide-react';
import type { QueryExecuteResponse, NodeQueryDetail } from '../../types';

interface LiveQueryVisualizerProps {
  isExecuting: boolean;
  stage: 'idle' | 'client_to_coord' | 'coord_to_nodes' | 'nodes_processing' | 'nodes_to_coord' | 'completed';
  lastResponse: QueryExecuteResponse | null;
  targetConsistency: string;
  unavailableNodes: string[];
}

export const LiveQueryVisualizer: React.FC<LiveQueryVisualizerProps> = ({
  isExecuting,
  stage,
  lastResponse,
  targetConsistency,
  unavailableNodes,
}) => {
  const nodes = [
    { id: 'node1', label: 'Replica 1', port: 5433 },
    { id: 'node2', label: 'Replica 2', port: 5434 },
    { id: 'node3', label: 'Replica 3', port: 5435 },
    { id: 'node4', label: 'Replica 4', port: 5436 },
  ];

  const getNodeStatus = (nodeId: string): NodeQueryDetail | undefined => {
    return lastResponse?.nodes_detail?.[nodeId];
  };

  const isPartitioned = (nodeId: string) => unavailableNodes.includes(nodeId);

  return (
    <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mb-2 border border-blue-500/30">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Distributed Network Visualizer</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100">
            gRPC Coordinator &amp; 4-Node Replica Mesh
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time visualization of query dispatch, concurrent quorum verification, and storage replication.
          </p>
        </div>

        {/* Quorum Metric Banner */}
        {lastResponse && (
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-2xl">
            <div className={`w-3 h-3 rounded-full ${lastResponse.success ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-rose-500'}`} />
            <div>
              <div className="text-[11px] font-mono text-slate-400">
                Mode: <span className="font-semibold text-blue-400">{lastResponse.effective_consistency}</span>
                {lastResponse.adaptive_info && (
                  <span className="text-amber-400 ml-1.5">(Adapted from {lastResponse.requested_consistency})</span>
                )}
              </div>
              <div className="text-xs font-bold text-slate-200">
                Quorum: {lastResponse.achieved_acks ?? 0} / {lastResponse.required_acks ?? 0} ACKs
                <span className="text-slate-400 font-normal font-mono ml-2">({lastResponse.latency_ms}ms)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visual Canvas */}
      <div className="relative z-10 my-8 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-8 relative">
          
          {/* 1. Client Node */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: stage === 'client_to_coord' ? [1, 1.05, 1] : 1,
                borderColor: stage === 'client_to_coord' ? '#3B82F6' : '#334155',
              }}
              className="w-40 bg-slate-900 border-2 rounded-2xl p-4 shadow-lg text-center relative"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Client Station</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Frontend UI / CLI</p>
              
              <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                Target: <span className="text-blue-400 font-bold">{targetConsistency}</span>
              </div>
            </motion.div>
          </div>

          {/* 2. Coordinator Node */}
          <div className="flex flex-col items-center">
            <motion.div
              animate={{
                scale: stage === 'coord_to_nodes' || stage === 'nodes_to_coord' ? [1, 1.04, 1] : 1,
                borderColor: isExecuting ? '#60A5FA' : '#334155',
              }}
              transition={{ repeat: isExecuting ? Infinity : 0, duration: 1.5 }}
              className="w-48 bg-slate-900 border-2 rounded-2xl p-5 shadow-xl text-center relative"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-400 mx-auto flex items-center justify-center mb-2">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-100">Coordinator Server</h3>
              <p className="text-[11px] font-mono text-purple-300 mt-0.5">Port 50051 (gRPC)</p>

              <div className="mt-3 space-y-1 text-[11px] font-mono">
                <span className="inline-block px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Adaptive v2.0
                </span>
              </div>

              {/* Status Banner */}
              <div className="mt-3 pt-2.5 border-t border-slate-800 text-[11px]">
                {isExecuting ? (
                  <span className="text-amber-400 font-mono animate-pulse">Evaluating Quorum...</span>
                ) : lastResponse ? (
                  <span className={lastResponse.success ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                    {lastResponse.success ? '✓ Quorum Achieved' : '✕ Quorum Failed'}
                  </span>
                ) : (
                  <span className="text-slate-400 font-mono">Ready for query</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* 3. Four Database Replicas */}
          <div className="grid grid-cols-2 gap-3.5">
            {nodes.map((node) => {
              const detail = getNodeStatus(node.id);
              const partitioned = isPartitioned(node.id) || detail?.status === 'PARTITIONED';
              const acked = detail?.acknowledged;
              const isConsulted = detail?.status === 'CONSULTED';
              const isDropped = detail?.status === 'DROPPED';
              const isAsync = detail?.status === 'ASYNC_QUEUED';

              let borderColor = 'border-slate-800';
              let badgeColor = 'bg-slate-800 text-slate-400';
              let statusLabel = 'Idle';

              if (partitioned) {
                borderColor = 'border-rose-900/80 bg-rose-950/20';
                badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
                statusLabel = 'Partitioned';
              } else if (stage === 'coord_to_nodes' || stage === 'nodes_processing') {
                borderColor = 'border-blue-500/80 shadow-lg shadow-blue-500/20';
                badgeColor = 'bg-blue-500/20 text-blue-400';
                statusLabel = 'Processing...';
              } else if (acked || isConsulted) {
                borderColor = 'border-emerald-500/70 bg-emerald-950/20';
                badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                statusLabel = isConsulted ? 'Read ACK' : 'Write ACK';
              } else if (isDropped) {
                borderColor = 'border-amber-700/80 bg-amber-950/20';
                badgeColor = 'bg-amber-500/20 text-amber-400';
                statusLabel = 'Dropped';
              } else if (isAsync) {
                borderColor = 'border-cyan-800/80 bg-cyan-950/20';
                badgeColor = 'bg-cyan-500/20 text-cyan-400';
                statusLabel = 'Async Queued';
              }

              return (
                <motion.div
                  key={node.id}
                  animate={{
                    scale: stage === 'nodes_processing' && !partitioned ? [1, 1.03, 1] : 1,
                  }}
                  className={`bg-slate-900 border-2 rounded-2xl p-3.5 transition-all relative ${borderColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-200">{node.id}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">:{node.port}</span>
                  </div>

                  <p className="text-[11px] font-mono text-slate-400">{node.label}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full ${badgeColor}`}>
                      {statusLabel}
                    </span>

                    {partitioned ? (
                      <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : acked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isDropped ? (
                      <XCircle className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Dynamic Animated Status Feed */}
      <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2 font-mono">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          <span>
            {stage === 'client_to_coord' && 'Step 1/4: Dispatching request via gRPC to Coordinator...'}
            {stage === 'coord_to_nodes' && 'Step 2/4: Coordinator broadcasting to replica threads...'}
            {stage === 'nodes_processing' && 'Step 3/4: Writing to PostgreSQL engines (Docker)...'}
            {stage === 'nodes_to_coord' && 'Step 4/4: Aggregating ACKs and resolving conflict clock...'}
            {stage === 'completed' && lastResponse?.message}
            {stage === 'idle' && 'Waiting for query invocation.'}
          </span>
        </div>

        {lastResponse && (
          <div className="text-[11px] text-slate-400">
            Engine: <span className="font-semibold text-slate-200">{lastResponse.storage_mode === 'live_postgresql' ? 'Docker PostgreSQL 17' : 'In-Memory Replica Mock'}</span>
          </div>
        )}
      </div>
    </div>
  );
};

