import React from 'react';
import {
  Shield,
  Layers,
  GitBranch,
  Clock,
  Database,
  Cpu,
  Server,
  Key,
  CheckCircle2,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  return (
    <div className="space-y-10 py-6 max-w-5xl mx-auto">
      {/* Title */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-brand-primary text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          Technical Specifications &amp; Algorithms
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          AdaptiveDB Architecture &amp; Theory
        </h1>
        <p className="mt-2 text-sm sm:text-base text-stone-600 leading-relaxed">
          Deep dive into the distributed coordinator, quorum equations, monotonic versioning,
          and the Adaptive Consistency Controller feedback loop.
        </p>
      </div>

      {/* Coordinator Architecture Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center font-bold">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">1. Distributed Coordinator &amp; gRPC Service</h2>
            <p className="text-xs text-stone-500">Port 50051 • Thread-Safe Async Dispatcher</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          AdaptiveDB implements an RPC-coordinated architecture where client requests terminate at the
          central Coordinator. The coordinator maintains persistent connection pools to all four PostgreSQL
          replicas (<code className="font-mono bg-stone-100 px-1 py-0.5 rounded">db_1:5432</code>,{' '}
          <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">db_2:5433</code>,{' '}
          <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">db_3:5434</code>, and{' '}
          <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">db_4:5435</code>).
        </p>

        <div className="bg-stone-50 rounded-xl p-4 font-mono text-xs text-stone-800 border border-stone-200 overflow-x-auto">
          <div className="text-stone-400 mb-1">// gRPC Protobuf Service Definition</div>
          <div>service DatabaseService &#123;</div>
          <div className="pl-4">rpc Put(PutRequest) returns (PutResponse);</div>
          <div className="pl-4">rpc Get(GetRequest) returns (GetResponse);</div>
          <div className="pl-4">rpc Delete(DeleteRequest) returns (DeleteResponse);</div>
          <div className="pl-4">rpc Health(HealthRequest) returns (HealthResponse);</div>
          <div>&#125;</div>
        </div>
      </div>

      {/* Quorum Mathematics Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">2. Strict Quorum Mathematics ($W + R &gt; N$)</h2>
            <p className="text-xs text-stone-500">Pigeonhole Principle for Strong Consistency</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-stone-600 leading-relaxed">
          <p>
            In a cluster of $N=4$ replicas, strict quorum requires that write acknowledgments $W$ and read
            acknowledgments $R$ satisfy the inequality:
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center font-mono text-sm text-purple-900 font-bold">
            W + R &gt; N &nbsp;&implies;&nbsp; 3 + 2 = 5 &gt; 4
          </div>

          <p>
            By the <strong>Pigeonhole Principle</strong>, any subset of $W=3$ nodes where a write succeeded
            and any subset of $R=2$ nodes queried on read must overlap in at least:
          </p>

          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-center font-mono text-xs text-stone-800">
            Intersection Size = (W + R) - N = (3 + 2) - 4 = 1 node
          </div>

          <p>
            This guaranteed intersection guarantees that the client read will include the replica holding the
            highest version number, preserving linearizability even during partial replica outages.
          </p>
        </div>
      </div>

      {/* Conflict Resolution & Versioning Card */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">3. PostgreSQL Monotonic Versioning &amp; LWW</h2>
            <p className="text-xs text-stone-500">Last-Write-Wins with Atomic Upserts and Tombstones</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Every write assigns a strictly monotonically increasing 64-bit integer version. Replicas enforce
          convergence using atomic upserts:
        </p>

        <div className="bg-stone-900 rounded-xl p-4 font-mono text-xs text-emerald-400 border border-stone-800 overflow-x-auto">
          <div className="text-stone-500">// Idempotent PostgreSQL Upsert</div>
          <div>INSERT INTO kv_store (key, value, version, updated_at, is_deleted)</div>
          <div>VALUES (%s, %s, %s, %s, %s)</div>
          <div>ON CONFLICT (key) DO UPDATE</div>
          <div>&nbsp;&nbsp;SET value = EXCLUDED.value,</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;version = EXCLUDED.version,</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;updated_at = EXCLUDED.updated_at,</div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;is_deleted = EXCLUDED.is_deleted</div>
          <div>&nbsp;&nbsp;WHERE kv_store.version &lt;= EXCLUDED.version;</div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          Deletions write a <em>tombstone</em> record with <code className="font-mono bg-stone-100 px-1 py-0.5 rounded">is_deleted = TRUE</code> and
          an incremented version. This ensures that delayed background replication messages cannot resurrect
          previously deleted keys.
        </p>
      </div>

      {/* Adaptive Controller v2.0 State Machine */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">4. Adaptive Controller v2.0 Decision Flow</h2>
            <p className="text-xs text-stone-500">Dynamic Policy Switching &amp; Hysteresis</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          The Adaptive Controller tracks a sliding execution window of recent operations. Rather than
          remaining rigid, it dynamically transitions across consistency modes based on cluster health:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
            <span className="font-bold text-stone-900 block mb-1">State: Optimal Cluster</span>
            <p className="text-stone-500 mb-3">All 4 nodes online, p95 latency &lt; 50ms, low failure rate</p>
            <span className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-800 font-bold font-mono">
              Policy: STRONG
            </span>
          </div>

          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
            <span className="font-bold text-stone-900 block mb-1">State: Degraded / Partitioned</span>
            <p className="text-stone-500 mb-3">1 node unreachable OR tail latency &gt; 100ms</p>
            <span className="inline-block px-2.5 py-1 rounded bg-blue-100 text-blue-800 font-bold font-mono">
              Policy: QUORUM
            </span>
          </div>

          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/50">
            <span className="font-bold text-stone-900 block mb-1">State: Critical Partition</span>
            <p className="text-stone-500 mb-3">&gt;= 2 nodes unreachable OR extreme network stress</p>
            <span className="inline-block px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 font-bold font-mono">
              Policy: EVENTUAL
            </span>
          </div>
        </div>

        <div className="border-t border-stone-100 pt-4 text-xs text-stone-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-primary shrink-0" />
          <span>
            <strong>Anti-Flapping Hysteresis:</strong> Enforces a configurable cooldown period (e.g. 10 operations)
            to prevent high-frequency oscillation between policies during transient packet jitter.
          </span>
        </div>
      </div>
    </div>
  );
};
