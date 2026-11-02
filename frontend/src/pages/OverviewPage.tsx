import React from 'react';
import type { BackendHealth } from '../types';
import { ClusterTopology } from '../components/dashboard/ClusterTopology';
import { Play, ArrowRight, Shield, Zap, GitFork, Cpu, BarChart3, Layers } from 'lucide-react';

interface OverviewPageProps {
  onStartExperiment: () => void;
  health: BackendHealth | null;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onStartExperiment,
  health,
}) => {
  return (
    <div className="space-y-10 py-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50/80 via-white to-purple-50/50 border border-blue-100/80 p-8 sm:p-12 shadow-xs">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-brand-primary text-xs font-semibold mb-4 border border-blue-200">
            <Cpu className="w-3.5 h-3.5" />
            <span>Distributed Systems Microproject • Phase 2 Verified</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight">
            Adaptive Consistency in <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-blue-600 to-purple-600">
              Distributed Databases
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-stone-600 leading-relaxed font-normal">
            AdaptiveDB evaluates the latency-availability-consistency trade-off under real-world
            partitions, injected network delay, and replica crashes. Compare <strong>STRONG</strong>,{' '}
            <strong>QUORUM</strong>, <strong>EVENTUAL</strong>, and dynamic <strong>ADAPTIVE</strong>{' '}
            runtime control with zero simulated or fabricated metrics.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              onClick={onStartExperiment}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Launch Experiment Simulator
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#modes"
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl font-medium text-stone-700 bg-white border border-stone-200 hover:bg-stone-50 transition-colors"
            >
              Learn Consistency Trade-Offs
            </a>
          </div>
        </div>

        {/* Ambient Decorative element */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl pointer-events-none" />
      </div>

      {/* Live Cluster Topology */}
      <ClusterTopology health={health} interactive={false} />

      {/* 4 Consistency Modes Comparison Cards */}
      <div id="modes" className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Consistency Models Implemented</h2>
          <p className="text-sm text-stone-500">
            Each mode defines how reads and writes interact with the 4-node PostgreSQL cluster.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* STRONG */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:border-amber-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold mb-4 border border-amber-100">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-stone-900">STRONG</h3>
                <span className="text-xs font-mono font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  W=N, R=1
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Writes must synchronously replicate to all 4 nodes before returning success. Reads query
                a single replica.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Zero stale reads guaranteed
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span> Single node failure stalls writes
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span> Latency bounded by slowest node
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-stone-400">
              PACELC: PC / EC
            </div>
          </div>

          {/* QUORUM */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:border-blue-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4 border border-blue-100">
                <GitFork className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-stone-900">QUORUM</h3>
                <span className="text-xs font-mono font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  W=3, R=2 (W+R &gt; N)
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Strict majority quorum where write and read sets intersect in at least one up-to-date node.
                Tolerates partial failures.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Strong consistency preserved
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Tolerates 1 dead replica
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-stone-600 font-bold">~</span> Balanced write latency
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-stone-400">
              PACELC: PC / EC
            </div>
          </div>

          {/* EVENTUAL */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 border border-emerald-100">
                <Zap className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-stone-900">EVENTUAL</h3>
                <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                  W=1, R=1
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Write confirms on primary node and propagates asynchronously in the background. High
                throughput and availability.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Ultra-low write latency
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span> Highest throughput under load
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-rose-600 font-bold">✕</span> Stale reads during replication lag
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-stone-400">
              PACELC: PA / EL
            </div>
          </div>

          {/* ADAPTIVE */}
          <div className="bg-white rounded-2xl border-2 border-purple-300 p-6 flex flex-col justify-between shadow-sm relative">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-600 text-white">
              Controller v2.0
            </span>
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 border border-purple-100">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-stone-900">ADAPTIVE</h3>
                <span className="text-xs font-mono font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  Dynamic Runtime
                </span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Continuously evaluates sliding-window latency, failure rates, replica availability, and
                read/write ratio to pick the optimal policy.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-stone-500">
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span> Steps down to QUORUM if node drops
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span> Recovers to STRONG when restored
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-purple-600 font-bold">✓</span> Cooldown avoids flapping
                </li>
              </ul>
            </div>
            <div className="mt-6 pt-4 border-t border-stone-100 text-[11px] font-mono text-purple-700 font-semibold">
              Feedback-Driven Auto-Tuning
            </div>
          </div>
        </div>
      </div>

      {/* 4-Step Interactive Workflow */}
      <div className="bg-stone-50 border border-stone-200/90 rounded-2xl p-8">
        <h2 className="text-xl font-bold text-stone-900 mb-6">How The Simulator Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Select or Craft Scenario</h4>
            <p className="text-xs text-stone-500">
              Pick a pre-configured benchmark preset or adjust operations, concurrency, injected delays,
              and node failures.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Execute on Real Backend</h4>
            <p className="text-xs text-stone-500">
              Operations dispatch to the actual Python gRPC coordinator and PostgreSQL cluster in an
              isolated background thread.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Live Telemetry &amp; Traces</h4>
            <p className="text-xs text-stone-500">
              Inspect adaptive controller decisions in real time as network delays and node failures are
              introduced.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary flex items-center justify-center font-bold text-sm">
              4
            </div>
            <h4 className="text-sm font-semibold text-stone-900">Analyze Verified Results</h4>
            <p className="text-xs text-stone-500">
              Compare p95/p99 latency distributions, throughput, and stale reads. Export verifiable CSV
              and JSON records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
