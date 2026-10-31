import React, { useState } from 'react';
import { Send, Sliders, Shield, Zap, GitFork, Cpu, Database, AlertTriangle, Play, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { LiveQueryVisualizer } from '../components/query/LiveQueryVisualizer';
import { DatabaseInspector } from '../components/query/DatabaseInspector';
import type { QueryExecuteRequest, QueryExecuteResponse } from '../types';

export const LiveQueryPage: React.FC = () => {
  // Query Form State
  const [operation, setOperation] = useState<'PUT' | 'GET' | 'DELETE'>('PUT');
  const [key, setKey] = useState<string>('user_101');
  const [value, setValue] = useState<string>('Balance: $5,000');
  const [consistency, setConsistency] = useState<'STRONG' | 'QUORUM' | 'EVENTUAL' | 'ADAPTIVE'>('QUORUM');
  
  // Fault Parameters
  const [delayMs, setDelayMs] = useState<number>(0);
  const [repDelayMs, setRepDelayMs] = useState<number>(0);
  const [failureProb, setFailureProb] = useState<number>(0.0);
  const [unavailableNodes, setUnavailableNodes] = useState<string[]>([]);

  // Execution & Animation State
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [animationStage, setAnimationStage] = useState<'idle' | 'client_to_coord' | 'coord_to_nodes' | 'nodes_processing' | 'nodes_to_coord' | 'completed'>('idle');
  const [lastResponse, setLastResponse] = useState<QueryExecuteResponse | null>(null);
  const [dbRefreshTrigger, setDbRefreshTrigger] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleNodePartition = (nodeId: string) => {
    setUnavailableNodes((prev) =>
      prev.includes(nodeId) ? prev.filter((n) => n !== nodeId) : [...prev, nodeId]
    );
  };

  const handleSendQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!key.trim()) return;

    setIsExecuting(true);
    setErrorMessage(null);
    setAnimationStage('client_to_coord');

    const req: QueryExecuteRequest = {
      operation,
      key: key.trim(),
      value: operation === 'PUT' ? value : undefined,
      consistency_mode: consistency,
      simulated_delay_ms: delayMs,
      failure_probability: failureProb,
      replication_delay_ms: repDelayMs,
      unavailable_nodes: unavailableNodes,
    };

    try {
      // Step 1: Client -> Coordinator animation
      await new Promise((r) => setTimeout(r, 250));
      setAnimationStage('coord_to_nodes');

      // Step 2: Coordinator -> Replicas animation
      await new Promise((r) => setTimeout(r, 250));
      setAnimationStage('nodes_processing');

      // Send to backend (Docker PostgreSQL)
      const res = await api.executeQuery(req);

      // Step 3: Replicas -> Coordinator return animation
      setAnimationStage('nodes_to_coord');
      await new Promise((r) => setTimeout(r, 250));

      setLastResponse(res);
      setAnimationStage('completed');
      setDbRefreshTrigger((c) => c + 1);
    } catch (err: unknown) {
      console.error('Error executing query:', err);
      if (err instanceof Error) {
        if (err.message === 'Not Found' || err.message.includes('404')) {
          setErrorMessage('Endpoint returned 404 (Not Found). Please restart your backend server (run "python api_server.py" in the app terminal) to load the new query routes.');
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage('Failed to execute query against database.');
      }
      setAnimationStage('idle');
    } finally {
      setIsExecuting(false);
    }
  };

  // Quick Preset Handlers
  const loadPreset = (op: 'PUT' | 'GET' | 'DELETE', k: string, v: string, cons: 'STRONG' | 'QUORUM' | 'EVENTUAL' | 'ADAPTIVE', delay = 0, repDelay = 0) => {
    setOperation(op);
    setKey(k);
    setValue(v);
    setConsistency(cons);
    setDelayMs(delay);
    setRepDelayMs(repDelay);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-brand-primary text-xs font-semibold mb-2 border border-blue-200">
            <Send className="w-3.5 h-3.5" />
            <span>Interactive Distributed Execution Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
            Live Replicated Query Dispatcher
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Dispatch individual reads, writes, and tombstone deletes to PostgreSQL replicas under varying consistency models.
          </p>
        </div>

        {/* Quick Sample Action Chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => loadPreset('PUT', 'user_101', 'Alice, Balance: $5000', 'QUORUM')}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-brand-primary text-stone-700 transition-colors shadow-xs"
          >
            + Quorum Write
          </button>
          <button
            onClick={() => loadPreset('GET', 'user_101', '', 'QUORUM')}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-brand-primary text-stone-700 transition-colors shadow-xs"
          >
            + Quorum Read
          </button>
          <button
            onClick={() => loadPreset('PUT', 'order_202', 'Shipped', 'EVENTUAL', 0, 200)}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-500 text-stone-700 transition-colors shadow-xs"
          >
            + Eventual Lag Test
          </button>
          <button
            onClick={() => loadPreset('DELETE', 'user_101', '', 'QUORUM')}
            className="px-3 py-1.5 rounded-xl bg-white border border-stone-200 hover:border-rose-500 text-stone-700 transition-colors shadow-xs"
          >
            + Tombstone Delete
          </button>
        </div>
      </div>

      {/* Main Grid: Control Form (Left) & Network Visualizer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Query Configurator */}
        <div className="lg:col-span-5 bg-white border border-stone-200/90 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <form onSubmit={handleSendQuery} className="space-y-5">
            {/* Operation Selector */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Operation Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['PUT', 'GET', 'DELETE'] as const).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperation(op)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      operation === op
                        ? op === 'DELETE'
                          ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                          : 'bg-blue-50 border-brand-primary text-brand-primary shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    {op} {op === 'PUT' ? '(Write)' : op === 'GET' ? '(Read)' : '(Delete)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Key & Value Inputs */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Key <span className="text-stone-400 font-normal">(Primary Index)</span>
                </label>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="e.g. user_101"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                  required
                />
              </div>

              {operation === 'PUT' && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Value Payload
                  </label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. Alice, Balance: $5,000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    required
                  />
                </div>
              )}
            </div>

            {/* Consistency Level Selection */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                Consistency Protocol
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'STRONG', label: 'STRONG', desc: '4/4 ACKs • Strict', color: 'border-amber-400 bg-amber-50/50' },
                  { id: 'QUORUM', label: 'QUORUM', desc: '3/4 Strict Majority', color: 'border-blue-400 bg-blue-50/50' },
                  { id: 'EVENTUAL', label: 'EVENTUAL', desc: '1/4 Fast-path + Async', color: 'border-emerald-400 bg-emerald-50/50' },
                  { id: 'ADAPTIVE', label: 'ADAPTIVE', desc: 'Dynamic Controller', color: 'border-purple-400 bg-purple-50/50' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setConsistency(item.id as any)}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      consistency === item.id
                        ? `${item.color} shadow-xs font-bold`
                        : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="text-xs font-bold text-stone-900">{item.label}</div>
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible Fault Injection Controls */}
            <div className="pt-2 border-t border-stone-100 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-stone-500" />
                  Fault Injection Adjustments
                </span>
                <span className="text-[11px] text-stone-400 font-mono">Real Network Emulation</span>
              </div>

              {/* Node Partitions Toggle */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1.5">
                  Simulate Partitioned / Down Nodes:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['node1', 'node2', 'node3', 'node4'].map((n) => {
                    const isDown = unavailableNodes.includes(n);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => toggleNodePartition(n)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-mono font-semibold border transition-all ${
                          isDown
                            ? 'bg-rose-100 border-rose-300 text-rose-800 line-through'
                            : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-600 font-medium">Network Latency:</span>
                    <span className="font-mono font-bold text-brand-primary">{delayMs} ms</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="25"
                    value={delayMs}
                    onChange={(e) => setDelayMs(Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {consistency === 'EVENTUAL' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-stone-600 font-medium">Replication Lag (Async Delay):</span>
                      <span className="font-mono font-bold text-emerald-600">{repDelayMs} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="50"
                      value={repDelayMs}
                      onChange={(e) => setRepDelayMs(Number(e.target.value))}
                      className="w-full accent-emerald-600"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-stone-600 font-medium">Packet Drop Probability:</span>
                    <span className="font-mono font-bold text-rose-600">{(failureProb * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={failureProb}
                    onChange={(e) => setFailureProb(Number(e.target.value))}
                    className="w-full accent-rose-600"
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isExecuting}
              className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
                isExecuting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-brand-primary hover:bg-blue-700 active:scale-[0.99] shadow-blue-500/20'
              }`}
            >
              <Send className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
              <span>{isExecuting ? 'Broadcasting to Replicas...' : `Dispatch ${operation} Query`}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Visualizer & Execution Results */}
        <div className="lg:col-span-7 space-y-6">
          <LiveQueryVisualizer
            isExecuting={isExecuting}
            stage={animationStage}
            lastResponse={lastResponse}
            targetConsistency={consistency}
            unavailableNodes={unavailableNodes}
          />

          {/* Response Telemetry Card */}
          {lastResponse && (
            <div className="bg-white border border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${lastResponse.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="text-sm font-bold text-stone-900">
                    Operation {lastResponse.success ? 'Succeeded' : 'Failed'}
                  </span>
                </div>
                <span className="text-xs font-mono text-stone-500">
                  Latency: <strong>{lastResponse.latency_ms} ms</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 text-[10px] block">Effective Mode</span>
                  <strong className="text-brand-primary">{lastResponse.effective_consistency}</strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 text-[10px] block">Logical Version</span>
                  <strong className="text-stone-800">v{lastResponse.version ?? 'N/A'}</strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 text-[10px] block">Quorum ACKs</span>
                  <strong className="text-stone-800">
                    {lastResponse.achieved_acks ?? (lastResponse.nodes_consulted?.length || 0)} / {lastResponse.required_acks ?? 4}
                  </strong>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
                  <span className="text-stone-400 text-[10px] block">Stale Read Detected</span>
                  <strong className={lastResponse.is_stale ? 'text-amber-600' : 'text-emerald-600'}>
                    {lastResponse.is_stale ? 'YES (Stale)' : 'NO'}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-stone-600 bg-blue-50/60 p-3 rounded-xl border border-blue-100">
                <strong>Coordinator Summary:</strong> {lastResponse.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Database Inspector (Direct Docker PostgreSQL Table Views) */}
      <DatabaseInspector lastUpdatedTrigger={dbRefreshTrigger} />
    </div>
  );
};

