import React from 'react';
import {
  Cpu,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  Zap,
  Clock,
  ArrowRight,
  Activity,
  Layers,
  AlertTriangle,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto">
      {/* Title & Introduction */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold mb-3 border border-blue-200">
          <Activity className="w-3.5 h-3.5 text-blue-600" />
          Adaptive Controller v2.0 • Deterministic Decision Engine
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          How Consistencies Get Switched
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed">
          AdaptiveDB continuously monitors live cluster signals (replica health, round-trip latency,
          packet drop rate, and workload mix) to dynamically assign each operation to the optimal
          consistency protocol (<strong className="text-amber-700">STRONG</strong>,{' '}
          <strong className="text-blue-700">QUORUM</strong>, or{' '}
          <strong className="text-emerald-700">EVENTUAL</strong>).
        </p>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          Consistency Decision Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
          {/* Step 1: Input Signals */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1">Step 1</span>
              <h3 className="font-bold text-stone-900 mb-2">Cluster Telemetry</h3>
              <ul className="space-y-1.5 text-stone-600 font-mono text-[11px]">
                <li>• Alive Replicas (0-4)</li>
                <li>• Latency + Injected Delay</li>
                <li>• Packet Drop Rate (%)</li>
                <li>• Workload Read/Write Mix</li>
                <li>• Request Throughput (ops/s)</li>
              </ul>
            </div>
            <div className="mt-3 pt-2 border-t border-stone-200 text-stone-400 text-[10px]">
              Cached via TTL (1.0s)
            </div>
          </div>

          {/* Step 2: Safety Overrides */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block mb-1">Step 2</span>
              <h3 className="font-bold text-rose-950 mb-2">Urgent Safety Overrides</h3>
              <p className="text-rose-800 leading-relaxed text-[11px]">
                If <strong>&le; 2 nodes alive</strong>, strict quorum cannot be met: immediately forces <strong>EVENTUAL</strong>.
              </p>
              <p className="text-rose-800 leading-relaxed text-[11px] mt-1.5">
                If <strong>1 node down</strong>, demotes <strong>STRONG &rarr; QUORUM</strong>.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-rose-200/80 text-rose-700 text-[10px] font-semibold">
              Bypasses Cooldown
            </div>
          </div>

          {/* Step 3: Workload & Latency Rules */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider block mb-1">Step 3</span>
              <h3 className="font-bold text-blue-950 mb-2">Rule Evaluation</h3>
              <p className="text-blue-800 leading-relaxed text-[11px]">
                Evaluates latency thresholds (<strong>75ms</strong> and <strong>150ms</strong>) against workload intensity to elect candidate mode.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-blue-200/80 text-blue-700 text-[10px] font-semibold">
              Deterministic O(1)
            </div>
          </div>

          {/* Step 4: Anti-Flapping Filter */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold text-purple-500 uppercase tracking-wider block mb-1">Step 4</span>
              <h3 className="font-bold text-purple-950 mb-2">Hysteresis &amp; Cooldown</h3>
              <p className="text-purple-800 leading-relaxed text-[11px]">
                Requires <strong>3 consecutive proposals</strong> and an active cooldown interval (e.g. 25 ops) to prevent rapid oscillation.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-purple-200/80 text-purple-700 text-[10px] font-semibold">
              Stable Transitions
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Rules by Parameter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Rule 1: Node Availability */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">1. Node Availability &amp; Partitions</h3>
              <p className="text-xs text-stone-500 font-mono">alive_nodes out of 4</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">4 / 4 Nodes Active</span>
                <span className="text-stone-500 text-[11px]">Full cluster available</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-100 text-amber-800">
                STRONG / QUORUM
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-950 block">3 / 4 Nodes Active (1 Down)</span>
                <span className="text-blue-700 text-[11px]">Majority quorum still satisfied</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                QUORUM
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-950 block">&le; 2 Nodes Active (Degraded)</span>
                <span className="text-rose-700 text-[11px]">Majority quorum mathematically impossible</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                EVENTUAL
              </span>
            </div>
          </div>
        </div>

        {/* Rule 2: Latency & Injected Delay */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">2. Latency &amp; Network Delay</h3>
              <p className="text-xs text-stone-500 font-mono">avg_latency + simulated_delay_ms</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">Low Latency (&lt; 75 ms)</span>
                <span className="text-stone-500 text-[11px]">Uncongested network round-trip</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-100 text-amber-800">
                STRONG
              </span>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-blue-950 block">Moderate Latency (75 &ndash; 150 ms)</span>
                <span className="text-blue-700 text-[11px]">Absorbs slowest replica without blocking</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                QUORUM
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-emerald-950 block">Elevated Latency (&gt; 150 ms)</span>
                <span className="text-emerald-700 text-[11px]">Fast-path returns on 1 node + background sync</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                EVENTUAL
              </span>
            </div>
          </div>
        </div>

        {/* Rule 3: Workload Shape */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">3. Workload Shape (R/W Mix)</h3>
              <p className="text-xs text-stone-500 font-mono">read_ratio vs write_ratio</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">Write-Heavy (&ge; 70% Writes)</span>
                <span className="text-stone-500 text-[11px]">Avoids 4-node lockstep write penalties</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                QUORUM / EVENTUAL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">Read-Heavy (&ge; 70% Reads)</span>
                <span className="text-stone-500 text-[11px]">Queries fastest subset of replicas</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                QUORUM / EVENTUAL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">Balanced Mix (~50/50)</span>
                <span className="text-stone-500 text-[11px]">Guided primarily by latency and request rate</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-amber-100 text-amber-800">
                STRONG &rarr; EVENTUAL
              </span>
            </div>
          </div>
        </div>

        {/* Rule 4: Packet Drops & Severe Stress */}
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">4. Packet Drops &amp; Severe Degradation</h3>
              <p className="text-xs text-stone-500 font-mono">failure_rate / packet drops</p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800 block">Normal Conditions (&lt; 10% drops)</span>
                <span className="text-stone-500 text-[11px]">Normal quorum mathematics apply</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                STRONG / QUORUM
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-950 block">Severe Packet Loss (&ge; 15% drops)</span>
                <span className="text-rose-700 text-[11px]">Quorum timeouts imminent; downshifts safely</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                EVENTUAL
              </span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between">
              <div>
                <span className="font-semibold text-rose-950 block">Latency Spike (&ge; 300 ms)</span>
                <span className="text-rose-700 text-[11px]">Exceeds acceptable interactive threshold</span>
              </div>
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800">
                EVENTUAL
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Comprehensive Rule Reference Table */}
      <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          Complete Decision Policy Matrix
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500 uppercase tracking-wider font-semibold text-[10px] bg-stone-50/50">
                <th className="py-2.5 px-3">Cluster State</th>
                <th className="py-2.5 px-3">Alive Nodes</th>
                <th className="py-2.5 px-3">Effective Latency</th>
                <th className="py-2.5 px-3">Drop Rate</th>
                <th className="py-2.5 px-3">Selected Consistency</th>
                <th className="py-2.5 px-3">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">Optimal Steady-State</td>
                <td className="py-2.5 px-3 font-mono">4 / 4</td>
                <td className="py-2.5 px-3 font-mono">&lt; 75 ms</td>
                <td className="py-2.5 px-3 font-mono">&lt; 10%</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 text-amber-800">STRONG</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Zero divergence; 4/4 nodes acknowledge with minimal latency.</td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">Moderate Load / Network Delay</td>
                <td className="py-2.5 px-3 font-mono">4 / 4</td>
                <td className="py-2.5 px-3 font-mono">75 &ndash; 150 ms</td>
                <td className="py-2.5 px-3 font-mono">&lt; 15%</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800">QUORUM</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Requires 3/4 ACKs; avoids waiting on the single slowest replica.</td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">Single Replica Partition</td>
                <td className="py-2.5 px-3 font-mono">3 / 4</td>
                <td className="py-2.5 px-3 font-mono">&lt; 150 ms</td>
                <td className="py-2.5 px-3 font-mono">&lt; 10%</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800">QUORUM</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Strict majority preserved; Strong would fail writes.</td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">1 Node Down + Latency Spike</td>
                <td className="py-2.5 px-3 font-mono">3 / 4</td>
                <td className="py-2.5 px-3 font-mono">&ge; 150 ms</td>
                <td className="py-2.5 px-3 font-mono">&mdash;</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">EVENTUAL</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Degraded cluster under stress; avoids write blocking.</td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">Severe Partition</td>
                <td className="py-2.5 px-3 font-mono">&le; 2 / 4</td>
                <td className="py-2.5 px-3 font-mono">&mdash;</td>
                <td className="py-2.5 px-3 font-mono">&mdash;</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">EVENTUAL</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Urgent safety override; majority quorum impossible.</td>
              </tr>
              <tr className="hover:bg-stone-50/50">
                <td className="py-2.5 px-3 font-semibold text-stone-900">Severe Latency or Packet Loss</td>
                <td className="py-2.5 px-3 font-mono">Any</td>
                <td className="py-2.5 px-3 font-mono">&ge; 300 ms</td>
                <td className="py-2.5 px-3 font-mono">&ge; 15%</td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800">EVENTUAL</span>
                </td>
                <td className="py-2.5 px-3 text-stone-500">Prevents cascading client timeout failures.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
