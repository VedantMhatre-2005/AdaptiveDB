import React, { useState } from 'react';
import type {
  BackendCapabilities,
  BackendHealth,
  ConsistencyMode,
  ExperimentConfig,
  PresetConfig,
} from '../types';
import { ClusterTopology } from '../components/dashboard/ClusterTopology';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Play,
  RotateCcw,
  Sliders,
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface SimulatorPageProps {
  health: BackendHealth | null;
  capabilities: BackendCapabilities | null;
  runningExperimentId: string | null;
  progressPercent: number;
  currentStep: string;
  onSubmitExperiment: (config: ExperimentConfig) => Promise<void>;
  onCancelExperiment: () => void;
  onViewResults: (experimentId: string) => void;
  lastCompletedExperimentId: string | null;
}

const DEFAULT_CONFIG: ExperimentConfig = {
  name: 'Interactive Evaluation Run',
  consistency_mode: 'ADAPTIVE',
  num_operations: 100,
  concurrency: 2,
  read_ratio: 0.8,
  warmup_ops: 5,
  repetitions: 1,
  random_seed: 42,
  simulated_delay_ms: 0,
  delay_jitter_ms: 0,
  failure_probability: 0.0,
  replication_delay_ms: 0,
  unavailable_nodes: [],
  adaptive_cooldown: 10,
  adaptive_window_size: 20,
};

export const SimulatorPage: React.FC<SimulatorPageProps> = ({
  health,
  capabilities,
  runningExperimentId,
  progressPercent,
  currentStep,
  onSubmitExperiment,
  onCancelExperiment,
  onViewResults,
  lastCompletedExperimentId,
}) => {
  const [config, setConfig] = useState<ExperimentConfig>(DEFAULT_CONFIG);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('adaptive_resilience');
  const [customPresetName, setCustomPresetName] = useState<string>('');
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Apply preset selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!capabilities) return;
    const found = capabilities.presets.find((p) => p.id === presetId);
    if (found) {
      setConfig({ ...found.config, name: found.name });
    }
  };

  const handleToggleNode = (nodeId: string) => {
    setConfig((prev) => {
      const exists = prev.unavailable_nodes.includes(nodeId);
      return {
        ...prev,
        unavailable_nodes: exists
          ? prev.unavailable_nodes.filter((n) => n !== nodeId)
          : [...prev.unavailable_nodes, nodeId],
      };
    });
  };

  const handleReset = () => {
    setConfig(DEFAULT_CONFIG);
    setSelectedPresetId('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmitExperiment(config);
  };

  return (
    <div className="space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-brand-primary" />
            Experiment Simulator &amp; Workload Runner
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure real workload executions, inject controlled faults, and observe replica responses.
          </p>
        </div>

        {/* Completion notice */}
        {lastCompletedExperimentId && !runningExperimentId && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Experiment complete!</span>
            <button
              onClick={() => onViewResults(lastCompletedExperimentId)}
              className="ml-auto font-semibold underline hover:text-emerald-900"
            >
              View Analytics →
            </button>
          </div>
        )}
      </div>

      {/* Progress banner when running */}
      {runningExperimentId && (
        <div className="bg-blue-50/90 border-2 border-brand-primary/40 rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-brand-primary animate-ping" />
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Executing Experiment: <span className="font-mono text-brand-primary">{runningExperimentId}</span>
                </h3>
                <p className="text-xs text-stone-600 mt-0.5">{currentStep || 'Running operations...'}</p>
              </div>
            </div>

            <button
              onClick={onCancelExperiment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors shadow-xs cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-white" />
              Cancel Experiment
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-primary h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-stone-500 mt-2 font-mono">
            <span>Dispatched to backend coordinator</span>
            <span>{progressPercent}% Complete</span>
          </div>
        </div>
      )}

      {/* Preset Selector */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-brand-primary" />
            Research Scenario Presets
          </h2>
          <span className="text-xs text-stone-400">Click a preset to load parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(capabilities?.presets || []).map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-brand-primary bg-blue-50/50 shadow-xs'
                    : 'border-stone-200/90 hover:border-stone-300 bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-stone-900">{preset.name}</span>
                  <StatusBadge value={preset.config.consistency_mode} size="sm" />
                </div>
                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Workload & Mode Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-stone-900">1. Experiment Parameters</h3>
                <p className="text-xs text-stone-500">Configure workload shape, concurrency, and mode</p>
              </div>

              {/* Experiment Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Experiment Label
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig({ ...config, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Consistency Mode */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Target Consistency Mode
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['ADAPTIVE', 'STRONG', 'QUORUM', 'EVENTUAL', 'COMPARE_ALL'] as ConsistencyMode[]).map(
                    (mode) => {
                      const isSelected = config.consistency_mode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setConfig({ ...config, consistency_mode: mode })}
                          className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-center transition-all ${
                            isSelected
                              ? 'border-brand-primary bg-blue-50/70 text-brand-primary font-bold shadow-xs'
                              : 'border-stone-200 hover:border-stone-300 text-stone-700 bg-white'
                          }`}
                        >
                          {mode === 'COMPARE_ALL' ? '★ Compare All 4' : mode}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                {/* Operations */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Operations</span>
                    <span className="font-mono text-brand-primary font-bold">{config.num_operations}</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={500}
                    step={10}
                    value={config.num_operations}
                    onChange={(e) => setConfig({ ...config, num_operations: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <span className="text-[10px] text-stone-400">Total key-value operations</span>
                </div>

                {/* Concurrency */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Concurrency</span>
                    <span className="font-mono text-brand-primary font-bold">{config.concurrency} threads</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    value={config.concurrency}
                    onChange={(e) => setConfig({ ...config, concurrency: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <span className="text-[10px] text-stone-400">Parallel client worker threads</span>
                </div>

                {/* Read Ratio */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Read Ratio</span>
                    <span className="font-mono text-brand-primary font-bold">
                      {(config.read_ratio * 100).toFixed(0)}% Read / {((1 - config.read_ratio) * 100).toFixed(0)}% Write
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    value={config.read_ratio}
                    onChange={(e) => setConfig({ ...config, read_ratio: parseFloat(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <span className="text-[10px] text-stone-400">Read vs Write mix</span>
                </div>

                {/* Repetitions */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Repetitions</span>
                    <span className="font-mono text-brand-primary font-bold">{config.repetitions} runs</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={1}
                    value={config.repetitions}
                    onChange={(e) => setConfig({ ...config, repetitions: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"
                  />
                  <span className="text-[10px] text-stone-400">Statistical repetitions</span>
                </div>
              </div>
            </div>

            {/* Adaptive Controller Tuning */}
            {config.consistency_mode === 'ADAPTIVE' && (
              <div className="bg-purple-50/50 border border-purple-200/80 rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                      Adaptive Controller v2.0 Parameters
                    </h3>
                    <p className="text-xs text-purple-800">
                      Fine-tune smoothing window and anti-flapping hysteresis
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-700">Window Size</span>
                      <span className="font-mono font-bold text-purple-700">
                        {config.adaptive_window_size} ops
                      </span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={5}
                      value={config.adaptive_window_size}
                      onChange={(e) =>
                        setConfig({ ...config, adaptive_window_size: parseInt(e.target.value) })
                      }
                      className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-stone-700">Cooldown</span>
                      <span className="font-mono font-bold text-purple-700">
                        {config.adaptive_cooldown} ops
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={30}
                      step={5}
                      value={config.adaptive_cooldown}
                      onChange={(e) =>
                        setConfig({ ...config, adaptive_cooldown: parseInt(e.target.value) })
                      }
                      className="w-full h-1.5 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Fault Injection Controls (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    2. Fault Injection Engine
                  </h3>
                  <p className="text-xs text-stone-500">Inject network delays &amp; partition replicas</p>
                </div>
              </div>

              {/* Sliders */}
              <div className="space-y-4">
                {/* Network Delay */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Simulated Network Delay</span>
                    <span className="font-mono text-amber-700 font-bold">{config.simulated_delay_ms} ms</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    step={10}
                    value={config.simulated_delay_ms}
                    onChange={(e) =>
                      setConfig({ ...config, simulated_delay_ms: parseInt(e.target.value) })
                    }
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                {/* Failure Probability */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Operation Drop Probability</span>
                    <span className="font-mono text-rose-700 font-bold">
                      {(config.failure_probability * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.0}
                    max={0.3}
                    step={0.05}
                    value={config.failure_probability}
                    onChange={(e) =>
                      setConfig({ ...config, failure_probability: parseFloat(e.target.value) })
                    }
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Asynchronous Replication Delay */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-stone-700">Replication Lag</span>
                    <span className="font-mono text-emerald-700 font-bold">
                      {config.replication_delay_ms} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={20}
                    value={config.replication_delay_ms}
                    onChange={(e) =>
                      setConfig({ ...config, replication_delay_ms: parseInt(e.target.value) })
                    }
                    className="w-full h-1.5 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-stone-400">Tests stale reads under EVENTUAL mode</span>
                </div>
              </div>

              {/* Node Partition Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-2">
                  Simulated Node Partitions / Crashes
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['node1', 'node2', 'node3', 'node4'].map((nodeId) => {
                    const isDown = config.unavailable_nodes.includes(nodeId);
                    return (
                      <button
                        key={nodeId}
                        type="button"
                        onClick={() => handleToggleNode(nodeId)}
                        className={`p-3 rounded-xl border-2 text-xs font-mono font-bold flex items-center justify-between transition-all shadow-xs cursor-pointer ${
                          isDown
                            ? 'bg-rose-50 border-rose-400 text-rose-700 hover:bg-rose-100'
                            : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${isDown ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
                          <span className={isDown ? 'line-through' : ''}>{nodeId}</span>
                        </div>
                        <span className="text-[10px] font-sans font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-stone-200/50">
                          {isDown ? 'Partitioned' : 'Healthy'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  Partitioned nodes reject operations to test QUORUM and ADAPTIVE failover.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Cluster Topology Preview */}
        <ClusterTopology
          health={health}
          unavailableNodes={config.unavailable_nodes}
          simulatedDelayMs={config.simulated_delay_ms}
          failureProbability={config.failure_probability}
          onToggleNode={handleToggleNode}
          interactive={true}
        />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-100 hover:border-stone-400 transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
              Reset Defaults
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={!!runningExperimentId}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                runningExperimentId
                  ? 'bg-stone-400 cursor-not-allowed opacity-90'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
              }`}
            >
              <Play className="w-4 h-4 fill-white text-white" />
              {runningExperimentId ? 'Execution in Progress...' : 'Execute Experiment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
