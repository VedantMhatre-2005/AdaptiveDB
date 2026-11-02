# AdaptiveDB — Adaptive Consistency Distributed Key-Value Database

AdaptiveDB is an educational and research-grade, fault-tolerant, replicated distributed key-value database. It features configurable and dynamically adaptive consistency levels across PostgreSQL replicas, orchestrated by a centralized coordinator with dual interfaces: **gRPC** (for high-throughput systems and CLI clients) and **FastAPI REST** (for interactive exploration and web dashboards).

---

## Table of Contents
1. [Project Overview & Core Architecture](#1-project-overview--core-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Model, Versioning & Conflict Resolution](#3-database-model-versioning--conflict-resolution)
4. [Consistency Models & Quorum Mathematics](#4-consistency-models--quorum-mathematics)
5. [The Adaptive Consistency Controller (v2.0)](#5-the-adaptive-consistency-controller-v20)
6. [Fault Injection, Anti-Entropy & Read Repair](#6-fault-injection-anti-entropy--read-repair)
7. [Repository & Project Structure](#7-repository--project-structure)
8. [The AdaptiveDB Cookbook (Practical Runbooks)](#8-the-adaptivedb-cookbook-practical-runbooks)
   - [Recipe 1: Quick Cold-Start (PostgreSQL + Coordinator + Frontend)](#recipe-1-quick-cold-start-postgresql--coordinator--frontend)
   - [Recipe 2: Offline Mode (Zero Docker / In-Memory Mock Storage)](#recipe-2-offline-mode-zero-docker--in-memory-mock-storage)
   - [Recipe 3: CLI Data Operations across Consistency Levels](#recipe-3-cli-data-operations-across-consistency-levels)
   - [Recipe 4: Inducing Physical Container Failure & Quorum Validation](#recipe-4-inducing-physical-container-failure--quorum-validation)
   - [Recipe 5: Simulating Replication Lag & Observing Stale Reads](#recipe-5-simulating-replication-lag--observing-stale-reads)
   - [Recipe 6: Triggering Anti-Entropy Node Recovery](#recipe-6-triggering-anti-entropy-node-recovery)
   - [Recipe 7: Observing Dynamic Downshifting under High Latency](#recipe-7-observing-dynamic-downshifting-under-high-latency)
   - [Recipe 8: Running Phase 2 Automated Benchmark Suites](#recipe-8-running-phase-2-automated-benchmark-suites)
   - [Recipe 9: Running Automated Unit and Integration Tests](#recipe-9-running-automated-unit-and-integration-tests)
   - [Recipe 10: Interacting via the REST API using cURL / HTTP](#recipe-10-interacting-via-the-rest-api-using-curl--http)
   - [Recipe 11: Inspecting & Exporting Telemetry and Benchmark CSVs](#recipe-11-inspecting--exporting-telemetry-and-benchmark-csvs)
   - [Recipe 12: Cluster Health Check and Soft/Hard State Reset](#recipe-12-cluster-health-check-and-softhard-state-reset)
   - [Recipe 13: Recompiling Protocol Buffers (gRPC)](#recipe-13-recompiling-protocol-buffers-grpc)
9. [Web Dashboard Capabilities](#9-web-dashboard-capabilities)
10. [Known Limitations & Research Boundaries](#10-known-limitations--research-boundaries)

---

## 1. Project Overview & Core Architecture

Distributed storage systems face fundamental trade-offs described by the **CAP Theorem** (Consistency, Availability, Partition Tolerance) and the **PACELC Theorem** (If Partition: Availability vs Consistency; Else: Latency vs Consistency). Traditional databases enforce a static consistency level regardless of changing network conditions or workload requirements.

**AdaptiveDB** solves this by decoupling storage replicas from client interaction using a coordinator architecture that continuously inspects runtime health and workload metrics. It dynamically adapts consistency modes (`STRONG`, `QUORUM`, `EVENTUAL`) to maintain maximum availability and optimal latency without compromising data safety.

```
                    ┌──────────────────────────────────────────────┐
                    │               Client Interfaces              │
                    │  React Web UI  │  CLI Client  │  Benchmarks  │
                    └───────┬────────────────┬───────────────┬─────┘
                            │ (HTTP / REST)  │ (gRPC :50051) │
                            ▼                │               │
             ┌─────────────────────────────┐ │               │
             │   FastAPI Server (:8000)    │ │               │
             │  (Interactive / Telemetry)  │ │               │
             └──────────────┬──────────────┘ │               │
                            │                ▼               ▼
             ┌──────────────┴──────────────────────────────────────┐
             │            AdaptiveDB Coordinator Layer             │
             │                                                     │
             │  ┌────────────────────────┐  ┌───────────────────┐  │
             │  │   AdaptiveController   │  │ MetricsCollector  │  │
             │  │ (Hysteresis, Cooldown) │  │  (P50/P95/P99)    │  │
             │  └───────────┬────────────┘  └─────────┬─────────┘  │
             │              ▼                         ▼            │
             │  ┌───────────────────────────────────────────────┐  │
             │  │        ReplicationManager & Quorum Math       │  │
             │  │  - Concurrent Fan-out (ThreadPoolExecutor)    │  │
             │  │  - Non-blocking Asynchronous Replication      │  │
             │  │  - Read Repair Engine & Anti-Entropy Sync     │  │
             │  └───────────────────────┬───────────────────────┘  │
             │                          ▼                          │
             │  ┌───────────────────────────────────────────────┐  │
             │  │       Fault Injection Engine & Health Cache   │  │
             │  │   (Latency, Jitter, Packet Drops, Dropouts)   │  │
             │  └───────────────────────┬───────────────────────┘  │
             └──────────────────────────┼──────────────────────────┘
                                        │
           ┌────────────────┬───────────┴────────────┬────────────────┐
           ▼                ▼                         ▼                ▼
     ┌───────────┐    ┌───────────┐             ┌───────────┐    ┌───────────┐
     │  Node 1   │    │  Node 2   │             │  Node 3   │    │  Node 4   │
     │ Port 5433 │    │ Port 5434 │             │ Port 5435 │    │ Port 5436 │
     │PostgreSQL │    │PostgreSQL │             │PostgreSQL │    │PostgreSQL │
     └───────────┘    └───────────┘             └───────────┘    └───────────┘
```

---

## 2. Technology Stack

- **Storage Replicas**: PostgreSQL 17 (4 independent instances containerized via Docker)
- **Coordinator & RPC**: Python 3.10+, gRPC + Protocol Buffers (`proto3`)
- **REST & Telemetry API**: FastAPI, Uvicorn, Pydantic
- **Database Driver**: `psycopg` (v3) with socket connection timeouts (`CONNECT_TIMEOUT=2s`)
- **Concurrency & Async Execution**: Python `concurrent.futures.ThreadPoolExecutor`
- **Frontend Dashboard**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Recharts, Framer Motion
- **Testing & Benchmarks**: Python `unittest`, custom multi-threaded latency/throughput harness, CSV/JSON exporters

---

## 3. Database Model, Versioning & Conflict Resolution

### Relational Schema
All 4 PostgreSQL replicas execute identical schemas created in table `kv_store`:

```sql
CREATE TABLE IF NOT EXISTS kv_store (
    key TEXT PRIMARY KEY,
    value TEXT,
    version BIGINT NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Concurrency Principles:
1. **Monotonically Increasing Logical Clock**: The coordinator manages a thread-safe `VersionManager`. Every mutating request (`PUT` or `DELETE`) receives an incremental logical version.
2. **Safe Conflict Resolution (Last-Write-Wins with Monotonicity)**: Writes execute with an atomic conditional `ON CONFLICT` clause:
   ```sql
   INSERT INTO kv_store (key, value, version, deleted, updated_at)
   VALUES (%s, %s, %s, FALSE, CURRENT_TIMESTAMP)
   ON CONFLICT (key) DO UPDATE SET
       value = EXCLUDED.value,
       version = EXCLUDED.version,
       deleted = FALSE,
       updated_at = EXCLUDED.updated_at
   WHERE kv_store.version <= EXCLUDED.version;
   ```
   If a delayed background replication packet arrives after a newer write has already been committed, PostgreSQL discards the stale overwrite.
3. **Tombstone Deletions**: Deletes do not purge rows immediately; instead, they persist `deleted = TRUE` and `value = NULL` with an elevated version number. This prevents stale replicas from resurrecting deleted keys during read repair or anti-entropy sync.

---

## 4. Consistency Models & Quorum Mathematics

AdaptiveDB operates on a 4-node cluster ($N = 4$). Consistency is determined by write acknowledgments ($W$) and read replicas queried ($R$):

| Consistency Level | Required ACKs ($N=4$) | Write Behavior | Read Behavior | Trade-off Profile |
| :--- | :---: | :--- | :--- | :--- |
| **STRONG** | **4 / 4** | Concurrent fan-out to all 4 nodes; all 4 must ACK before replying. | Queries all 4 replicas; returns highest version; triggers read repair on lagging replicas. | **High consistency**, zero stale reads; sensitive to node downtime (1 failure blocks writes). |
| **QUORUM** | **3 / 4** | Strict majority $\lfloor N/2 \rfloor + 1 = 3$. Returns immediately once 3 nodes ACK. | Queries replicas concurrently until 3 responses arrive; resolves newest version. | **Balanced**; survives 1 node failure without loss of availability ($R + W > N$). |
| **EVENTUAL** | **1 / 4** | Writes to the first reachable node (Fast-Path) and returns immediately; remaining replicas updated asynchronously in background. | Queries single fastest replica immediately. Flags stale reads if cluster divergence exists. | **Lowest latency**, maximum throughput; small window of potential stale reads. |
| **ADAPTIVE** | Dynamic | Controller evaluates health, latency, failure rate, and request rate to choose between `STRONG`, `QUORUM`, and `EVENTUAL`. | Queries replicas according to the dynamically selected consistency mode. | **Optimal Pareto efficiency**: Strong under calm conditions, degrades safely under stress. |

---

## 5. The Adaptive Consistency Controller (v2.0)

The `AdaptiveController` provides real-time, deterministic consistency switching without human intervention.

```
                      Workload & Cluster Signals
      (Node Health, P95 Latency, Request Rate, Failure Rate, R/W Ratio)
                                  │
                                  ▼
                     Deterministic Decision Rules
                                  │
                                  ▼
                      Urgent Safety Overrides?
                     ├── <= 2 Nodes Alive  ──► Force EVENTUAL
                     └── 1 Node Down (3/4) ──► Demote STRONG to QUORUM
                                  │ (No)
                                  ▼
                      Hysteresis & Cooldown Filter
                (Requires 3 consecutive candidate votes
                 AND at least 25 ops since last switch)
                                  │
                                  ▼
                      Enforced Consistency Mode
                     (STRONG / QUORUM / EVENTUAL)
```

### Deterministic Decision Logic
1. **Cluster Degradation Overrides (Immediate Safety)**:
   - $\le 2$ nodes alive $\rightarrow$ Immediate switch to `EVENTUAL` (Majority quorum impossible).
   - $3$ nodes alive $\rightarrow$ Immediate demotion of `STRONG` to `QUORUM` (4/4 impossible). If effective latency $\ge 150\text{ms}$ or failure rate $> 10\%$, demote to `EVENTUAL`.
2. **Severe Latency or Packet Loss Degradation**:
   - If effective latency $\ge 300\text{ms}$ or failure rate $\ge 15\% \rightarrow$ Switch to `EVENTUAL`.
3. **Workload-Specific Policies (All 4 Replicas Healthy)**:
   - **Write-Heavy** ($\ge 70\%$ writes): `QUORUM` under normal latency ($< 75\text{ms}$); `EVENTUAL` if latency $\ge 75\text{ms}$.
   - **Read-Heavy** ($\ge 70\%$ reads): `QUORUM` under normal latency ($< 75\text{ms}$); `EVENTUAL` if latency $\ge 75\text{ms}$.
   - **Balanced Workload**:
     - Low latency ($< 75\text{ms}$) & Low load ($< 50\text{ ops/s}$) $\rightarrow$ **`STRONG`**
     - Moderate latency ($75-150\text{ms}$) or Moderate load ($50-100\text{ ops/s}$) $\rightarrow$ **`QUORUM`**
     - High latency ($> 150\text{ms}$) or High load ($\ge 100\text{ ops/s}$) $\rightarrow$ **`EVENTUAL`**
4. **Hysteresis & Cooldown Safeguards**:
   - To prevent rapid switching (flapping/thrashing), candidate mode changes require **3 consecutive identical proposals** and a minimum cooldown interval (default: 25 operations) before state changes take effect.

---

## 6. Fault Injection, Anti-Entropy & Read Repair

AdaptiveDB incorporates enterprise-grade self-healing and simulation primitives:

- **Asynchronous Read Repair**: When a `STRONG` or `QUORUM` read detects that a replica is missing a key or returning an outdated version, the coordinator dispatches an asynchronous task via its background thread pool to update that replica to the latest authoritative version.
- **Background Anti-Entropy Recovery Engine**: A background daemon monitors replica connectivity every 3 seconds. When a previously offline node transitions from `DOWN` to `UP`:
  1. The engine queries healthy replicas to build an authoritative key-version catalog.
  2. It iterates through the recovered node's records, copying missing keys or newer versions.
  3. It correctly replicates tombstones so deleted items remain deleted.
- **Node Health Cache**: Node health checks are cached with a configurable TTL (`HEALTH_CACHE_TTL=1.0s`). Read and write operations never block on synchronous TCP socket timeouts on the fast-path.
- **Application-Level Fault Injector**: Allows simulating delays, bounded jitter, packet drops, replication delay, and specific node outages without touching container infrastructure.

---

## 7. Repository & Project Structure

```text
DC_MicroProject/
├── docker-compose.yml          # Defines 4 PostgreSQL 17 nodes (ports 5433-5436)
├── init.sql                    # Initial schema setup script
├── requirements.txt            # Python dependencies (grpcio, psycopg, fastapi, uvicorn)
├── README.md                   # Comprehensive documentation & cookbook
├── how_to_start.md             # Concise quick-start instructions
│
├── app/                        # Coordinator Backend & Benchmark Suite
│   ├── config.py               # Node credentials, timeouts, and default parameters
│   ├── database.py             # PostgreSQL operations, logical clock, health cache, mock engine
│   ├── consistency.py          # Quorum mathematics & read resolution logic
│   ├── replication.py          # ReplicationManager, read repair, anti-entropy sync
│   ├── adaptive.py             # AdaptiveController v2.0 (hysteresis & cooldown)
│   ├── metrics.py              # Thread-safe metrics telemetry (P50/P95/P99)
│   ├── fault_injection.py      # Fault injection manager (delay, jitter, drops)
│   ├── server.py               # gRPC Coordinator Server (port 50051)
│   ├── api_server.py           # FastAPI REST Server (port 8000)
│   ├── client.py               # CLI Client & interactive testing harness
│   ├── benchmark.py            # Baseline benchmark comparing consistency modes
│   ├── fault_benchmark.py      # Phase 2 fault-injection benchmark matrix
│   └── proto/
│       ├── database.proto      # gRPC service and message declarations
│       ├── database_pb2.py     # Generated protobuf message classes
│       └── database_pb2_grpc.py# Generated gRPC stubs and servicers
│
├── frontend/                   # React 18 + Vite + Tailwind Web Application
│   ├── package.json            # Node.js dependencies
│   ├── vite.config.ts          # Vite build & proxy settings
│   ├── src/
│   │   ├── App.tsx             # Root application orchestrator & polling
│   │   ├── pages/
│   │   │   ├── OverviewPage.tsx     # Cluster health, node status, architecture summary
│   │   │   ├── LiveQueryPage.tsx    # Interactive PUT/GET/DELETE query explorer
│   │   │   ├── SimulatorPage.tsx    # Benchmark simulator & parameter controls
│   │   │   ├── ResultsPage.tsx      # Recharts visualizations (latencies, stale reads)
│   │   │   ├── HistoryPage.tsx      # Historical experiment browser & export tools
│   │   │   └── ArchitecturePage.tsx # Technical diagrams & quorum mathematics guide
│   │   ├── services/api.ts          # REST client communicating with FastAPI
│   │   └── types/index.ts           # TypeScript interfaces & types
│   └── public/                      # Static assets & icons
│
├── results/                    # Generated benchmark and experiment outputs
│   ├── benchmark_results.csv
│   ├── adaptive_decisions.csv
│   ├── fault_injection_results.csv
│   ├── replication_recovery_results.csv
│   ├── stale_read_results.csv
│   ├── experiment_metadata.json
│   └── experiments/            # JSON records of individual simulation runs
│
└── tests/                      # Automated Test Suites
    ├── test_distributed_db.py         # Consistency, quorum, and rule tests
    └── test_unit_fault_injection.py   # In-memory mock tests (20 Phase 2 requirements)
```

---

## 8. The AdaptiveDB Cookbook (Practical Runbooks)

This section provides step-by-step recipes for configuring, running, testing, and debugging AdaptiveDB in production and research workflows.

---

### Recipe 1: Quick Cold-Start (PostgreSQL + Coordinator + Frontend)

**Goal**: Bring up the entire cluster with database replicas, gRPC coordinator, REST API, and the React frontend.

#### Step 1: Launch the PostgreSQL Replicas
```powershell
# In project root:
docker compose up -d
```
Verify that 4 containers are running:
```powershell
docker ps --filter "name=dc-db-node"
```

#### Step 2: Install Python & Node Dependencies
```powershell
# Python backend:
pip install -r requirements.txt

# Frontend UI:
cd frontend
npm install
cd ..
```

#### Step 3: Start the Servers
Open three separate terminal windows:

- **Terminal 1 — FastAPI REST Server (Port 8000)**:
  ```powershell
  cd app
  python api_server.py
  ```
- **Terminal 2 — gRPC Coordinator Server (Port 50051)**:
  ```powershell
  cd app
  python server.py
  ```
- **Terminal 3 — React Frontend (Vite on Port 5173)**:
  ```powershell
  cd frontend
  npm run dev
  ```

Open your browser at `http://localhost:5173` to interact with the dashboard.

---

### Recipe 2: Offline Mode (Zero Docker / In-Memory Mock Storage)

**Goal**: Run all benchmarks, unit tests, and the REST API without installing or starting Docker.

AdaptiveDB includes an in-memory storage engine and simulated health cache in `app/database.py`.

```powershell
# Run the 20-test unit validation suite completely in-memory:
python tests/test_unit_fault_injection.py
```

To run the REST API in offline mock mode, launch Python with the mock flag:
```python
from database import enable_mock_storage
enable_mock_storage()
```
The FastAPI server will automatically fall back to mock storage whenever live PostgreSQL nodes are unreachable.

---

### Recipe 3: CLI Data Operations across Consistency Levels

**Goal**: Execute standalone queries via the gRPC CLI client to verify quorum rules.

Ensure `python server.py` is running in `app/`. In another terminal:

```powershell
cd app

# 1. Strong consistency write (Requires 4/4 ACKs):
python client.py --op put --key user:101 --value '{"name": "Alice", "balance": 500}' --consistency STRONG

# 2. Quorum consistency read (Requires 3/4 ACKs):
python client.py --op get --key user:101 --consistency QUORUM

# 3. Eventual consistency write (Fast-path: returns on 1 ACK):
python client.py --op put --key user:102 --value '{"name": "Bob", "balance": 250}' --consistency EVENTUAL

# 4. Adaptive consistency write (Controller selects optimal level):
python client.py --op put --key user:103 --value '{"name": "Charlie"}' --consistency ADAPTIVE

# 5. Tombstone deletion:
python client.py --op delete --key user:101 --consistency QUORUM

# 6. Cluster health inspection:
python client.py --op health

# 7. Print real-time metrics telemetry:
python client.py --op stats
```

---

### Recipe 4: Inducing Physical Container Failure & Quorum Validation

**Goal**: Physically stop a PostgreSQL node and verify how consistency modes respond.

#### Step 1: Stop Node 4
```powershell
docker stop dc-db-node-4
```

#### Step 2: Test Write Operations
```powershell
cd app

# STRONG write will FAIL because it requires 4/4 nodes:
python client.py --op put --key test_fail --value "data" --consistency STRONG
# Output -> Success: False (3/4 nodes acknowledged, Required: 4)

# QUORUM write will SUCCEED because it requires 3/4 nodes:
python client.py --op put --key test_quorum --value "data" --consistency QUORUM
# Output -> Success: True (3/4 nodes acknowledged, Required: 3)

# ADAPTIVE write automatically selects QUORUM or EVENTUAL:
python client.py --op put --key test_adaptive --value "data" --consistency ADAPTIVE
# Output -> Success: True (Selected Mode: ADAPTIVE -> QUORUM)
```

#### Step 3: Restart Node 4
```powershell
docker start dc-db-node-4
```
Within 3 seconds, the background recovery daemon will detect Node 4 coming back online and reconcile any missing keys.

---

### Recipe 5: Simulating Replication Lag & Observing Stale Reads

**Goal**: Artificially delay asynchronous background replication to observe and measure stale reads.

You can simulate replication delay either through environment variables or programmatically:

#### Via PowerShell Environment Variables:
```powershell
# Set 200ms background replication delay:
$env:FAULT_INJECTION_ENABLED="true"
$env:SIMULATED_REPLICATION_DELAY_MS="200"

# Restart the coordinator server to pick up variables, or run the client:
python app/client.py --op put --key lag_key --value "fresh_value" --consistency EVENTUAL

# Read immediately with EVENTUAL consistency:
python app/client.py --op get --key lag_key --consistency EVENTUAL
```

#### Programmatically in Python:
```python
from fault_injection import fault_injector
from replication import replication_manager
from consistency import ConsistencyLevel

with fault_injector.override(enabled=True, replication_delay_ms=250.0):
    # Fast-path write returns on 1 node; others delayed by 250ms
    res = replication_manager.replicate_write("PUT", "key_stale", "v1", ConsistencyLevel.EVENTUAL)
    # A read immediately against lagging nodes detects divergence
    read_res = replication_manager.replicate_read("key_stale", ConsistencyLevel.EVENTUAL)
    print("Is Stale Read:", read_res["is_stale"])
```

---

### Recipe 6: Triggering Anti-Entropy Node Recovery

**Goal**: Force an explicit anti-entropy synchronization across all reachable nodes.

#### Via CLI:
```powershell
cd app
python client.py --op recovery
```

#### Via REST API:
```powershell
curl -X POST http://localhost:8000/api/query/execute `
  -H "Content-Type: application/json" `
  -d '{"operation": "RECOVER"}'
```

#### Programmatically in Python:
```python
from replication import replication_manager
result = replication_manager.reconcile_all_nodes()
print(f"Reconciled {result['reconciled_keys']} keys across {result['recovered_nodes']}")
```

---

### Recipe 7: Observing Dynamic Downshifting under High Latency

**Goal**: Inject 160ms simulated network latency and verify that the Adaptive Controller downshifts from `STRONG`/`QUORUM` to `EVENTUAL`.

```powershell
# Set 160ms delay:
$env:FAULT_INJECTION_ENABLED="true"
$env:SIMULATED_DELAY_MS="160"

# Run a sequence of 30 operations:
cd app
python -c "
from adaptive import adaptive_controller
from metrics import metrics_collector
for i in range(35):
    mode, reason = adaptive_controller.evaluate_and_select(op_type='PUT', recent_avg_latency=160.0)
    print(f'Op {i}: Selected {mode.value} -> {reason}')
"
```
*Expected Behavior*: After the 3-proposal hysteresis window passes, the controller downshifts to `EVENTUAL` consistency to preserve throughput.

---

### Recipe 8: Running Phase 2 Automated Benchmark Suites

**Goal**: Execute the comprehensive multi-repetition benchmark matrix and generate telemetry CSVs.

Ensure PostgreSQL replicas are running (`docker compose up -d`).

#### Quick Benchmark Run (1 Repetition):
```powershell
cd app
python fault_benchmark.py --quick
```

#### Full Comprehensive Benchmark Matrix (3 Repetitions):
```powershell
cd app
python fault_benchmark.py
```

The runner tests 6 distinct experiment environments:
- **Suite A**: Baseline (4 healthy nodes, 0ms latency)
- **Suite B**: Increasing Network Delays (0ms, 25ms, 50ms, 100ms)
- **Suite C**: Partial Node Failures (4/4, 3/4, 2/4, 1/4 nodes alive)
- **Suite D**: Replication Lag & Staleness (0ms, 50ms, 100ms, 250ms delay)
- **Suite E**: Random Operation Failures (0%, 5%, 10%, 25% drop rate)
- **Suite F**: Combined Complex Faults

Outputs are saved in `results/fault_injection_results.csv` and `results/adaptive_decisions.csv`.

---

### Recipe 9: Running Automated Unit and Integration Tests

**Goal**: Run automated tests to verify cluster logic, quorum math, and controller rules.

```powershell
# 1. Run Phase 2 unit tests (20 mock tests, runs in < 0.1s, no Docker required):
python tests/test_unit_fault_injection.py

# 2. Run core distributed database rules and quorum tests:
python tests/test_distributed_db.py
```

---

### Recipe 10: Interacting via the REST API using cURL / HTTP

**Goal**: Control the database and simulator directly from scripts or third-party HTTP clients.

Ensure the FastAPI server is running (`python app/api_server.py` on port 8000).

#### 1. Cluster Health Check:
```powershell
curl http://localhost:8000/api/health
```

#### 2. Execute an Interactive PUT Query:
```powershell
curl -X POST http://localhost:8000/api/query/execute `
  -H "Content-Type: application/json" `
  -d '{
    "operation": "PUT",
    "key": "sensor:temp",
    "value": "23.5",
    "consistency_mode": "QUORUM"
  }'
```

#### 3. Execute an Interactive GET Query:
```powershell
curl -X POST http://localhost:8000/api/query/execute `
  -H "Content-Type: application/json" `
  -d '{
    "operation": "GET",
    "key": "sensor:temp",
    "consistency_mode": "QUORUM"
  }'
```

#### 4. Submit an Automated Simulation Experiment:
```powershell
curl -X POST http://localhost:8000/api/experiments `
  -H "Content-Type: application/json" `
  -d '{
    "name": "cURL Stress Test",
    "consistency_mode": "COMPARE_ALL",
    "num_operations": 40,
    "concurrency": 4,
    "read_ratio": 0.5,
    "simulated_delay_ms": 25.0
  }'
```

---

### Recipe 11: Inspecting & Exporting Telemetry and Benchmark CSVs

**Goal**: Analyze experimental outputs and export telemetry for papers or reports.

All outputs are saved to `results/`:
- `results/fault_injection_results.csv`: Contains P50, P95, P99 latency, success rate, throughput (ops/sec), stale reads, and simulated vs actual DB failures.
- `results/adaptive_decisions.csv`: Decision trace for every adaptive choice (controller version, signals, selected mode, rationale).
- `results/replication_recovery_results.csv`: Recovery synchronization durations and key counts.
- `results/stale_read_results.csv`: Detailed log of stale read detections under replication lag.

To export historical data via REST:
```powershell
# List all completed experiment IDs:
curl http://localhost:8000/api/experiments

# Export specific experiment as CSV:
curl http://localhost:8000/api/experiments/{experiment_id}/export?format=csv -o experiment_export.csv
```

---

### Recipe 12: Cluster Health Check and Soft/Hard State Reset

**Goal**: Clear all test data across all replicas to return to a clean baseline.

#### Soft Reset (Clear Table Data via API):
```powershell
curl -X POST http://localhost:8000/api/cluster/clear
```

#### Reset Telemetry Metrics:
```powershell
cd app
python -c "from metrics import metrics_collector; metrics_collector.reset()"
```

#### Hard Reset (Wipe PostgreSQL Volumes):
```powershell
# Stop containers and delete all Docker volume data:
docker compose down -v

# Re-create fresh PostgreSQL containers:
docker compose up -d
```

---

### Recipe 13: Recompiling Protocol Buffers (gRPC)

**Goal**: Regenerate Python gRPC stubs after modifying `app/proto/database.proto`.

```powershell
python -m grpc_tools.protoc -Iapp/proto --python_out=app/proto --grpc_python_out=app/proto app/proto/database.proto
```

Verify that `app/proto/database_pb2.py` and `app/proto/database_pb2_grpc.py` updated without syntax errors:
```powershell
python -c "import app.proto.database_pb2; print('Protobuf compiled successfully!')"
```

---

## 9. Web Dashboard Capabilities

The React frontend (`frontend/`) provides an interactive research UI:

1. **Overview Page**:
   - Live cluster health cards displaying status, port, and latency for each of the 4 replicas.
   - Quick statistics and quick-launch presets.
2. **Live Query Page**:
   - Interactive key-value query runner with JSON payload support.
   - Per-query consistency selector (`STRONG`, `QUORUM`, `EVENTUAL`, `ADAPTIVE`).
   - Visual inspection of which nodes acknowledged, which failed, and version numbers.
3. **Simulator Page**:
   - Sliders for simulated delay (ms), jitter, failure probability, and replication delay.
   - Interactive toggles to disconnect specific nodes (e.g., mark Node 2 and Node 4 offline).
   - Real-time progress bar tracking execution phases and workers.
4. **Results Page**:
   - Latency percentiles (P50, P95, P99) rendered with Recharts.
   - Throughput comparisons and stale read counts.
   - Distribution chart showing Adaptive Controller decisions across consistency modes.
5. **History Page**:
   - Historical experiment browser with filtering, search, and one-click JSON/CSV export.
6. **Architecture Page**:
   - Interactive component diagram, mathematical breakdown of quorum equations ($R + W > N$), and explanation of the PACELC trade-off curve.

---

## 10. Known Limitations & Research Boundaries

1. **Application-Level Delay Emulation**: In-process sleep and jitter simulate round-trip application latency at the coordinator boundary. They do not simulate kernel-level TCP windowing or asymmetric network partitions.
2. **Linearizability vs Eventual Consistency**: Static quorum policies ($R + W > N$) protect against stale reads during static majorities, but acknowledge thresholds alone do not guarantee strict linearizability under concurrency without consensus protocols (e.g., Raft/Paxos) or synchronized hardware clocks (e.g., TrueTime).
3. **Pluggable Policy Interface**: The `AdaptiveController.choose_consistency(...)` interface is decoupled so that rule-based deterministic policies can be swapped for Reinforcement Learning (RL) or neural predictors without modifying storage or replication layers.
