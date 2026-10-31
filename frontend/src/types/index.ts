export type ConsistencyMode = 'STRONG' | 'QUORUM' | 'EVENTUAL' | 'ADAPTIVE' | 'COMPARE_ALL';

export interface NodeHealth {
  host: string;
  port: number;
  alive: boolean;
  simulated_unavailable: boolean;
}

export interface BackendHealth {
  status: 'healthy' | 'degraded' | 'offline';
  coordinator: {
    status: string;
    port: number;
    controller_version: string;
  };
  cluster: {
    total_nodes: number;
    alive_nodes: number;
    nodes: Record<string, NodeHealth>;
  };
  storage_mode: 'mock_in_memory' | 'live_postgresql';
  fault_injection_active: boolean;
}

export interface PresetConfig {
  id: string;
  name: string;
  description: string;
  config: ExperimentConfig;
}

export interface BackendCapabilities {
  consistency_modes: string[];
  nodes: string[];
  workload_limits: {
    min_operations: number;
    max_operations: number;
    min_concurrency: number;
    max_concurrency: number;
    min_repetitions: number;
    max_repetitions: number;
    default_seed: number;
  };
  fault_controls: {
    delay_ms: { min: number; max: number; step: number };
    jitter_ms: { min: number; max: number; step: number };
    failure_probability: { min: number; max: number; step: number };
    replication_delay_ms: { min: number; max: number; step: number };
    selectable_nodes: string[];
  };
  adaptive_parameters: {
    cooldown_operations: { min: number; max: number; default: number };
    window_size: { min: number; max: number; default: number };
  };
  metrics_definitions: Record<string, string>;
  presets: PresetConfig[];
}

export interface ExperimentConfig {
  name: string;
  consistency_mode: ConsistencyMode;
  num_operations: number;
  concurrency: number;
  read_ratio: float;
  warmup_ops: number;
  repetitions: number;
  random_seed: number;
  simulated_delay_ms: number;
  delay_jitter_ms: number;
  failure_probability: number;
  replication_delay_ms: number;
  unavailable_nodes: string[];
  adaptive_cooldown: number;
  adaptive_window_size: number;
}

type float = number;

export interface ExperimentResultRow {
  experiment: string;
  repetition: number;
  consistency_mode: string;
  attempted_operations: number;
  successful_operations: number;
  failed_operations: number;
  success_rate: number;
  average_latency_ms: number;
  median_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  throughput_ops_sec: number;
  stale_reads: number;
  consistency_violations: number;
  replication_attempts: number;
  replication_failures: number;
  configured_node_count: number;
  available_node_count: number;
  configured_delay_ms: number;
  configured_replication_delay_ms: number;
  configured_failure_probability: number;
  simulated_failures: number;
  database_failures: number;
}

export interface AdaptiveDecision {
  timestamp: string;
  controller_version: string;
  operation: string;
  selected_consistency: string;
  alive_nodes: string;
  average_latency_ms: number;
  success_rate: number;
  request_rate: number;
  read_ratio: number;
  write_ratio: number;
  failure_rate: number;
  replication_failure_rate: number;
  simulated_delay_ms: number;
  reason: string;
}

export interface ExperimentSummary {
  total_attempted: number;
  total_succeeded: number;
  total_failed: number;
  success_rate: number;
  average_latency_ms: number;
  median_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  throughput_ops_sec: number;
  stale_reads: number;
  replication_failures: number;
  modes_tested: string[];
  repetitions: number;
}

export interface ExperimentRecord {
  id: string;
  name: string;
  created_at: string;
  start_time: string | null;
  end_time: string | null;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  config: ExperimentConfig;
  progress: {
    completed_runs: number;
    total_runs: number;
    percent: number;
    current_step: string;
  };
  results: ExperimentResultRow[];
  summary: ExperimentSummary;
  adaptive_decisions: AdaptiveDecision[];
  error: string | null;
  provenance: {
    backend_version: string;
    controller_version: string;
    random_seed: number;
    mock_storage: boolean;
  };
}

export interface HistoricalResultsData {
  fault_injection_results: Record<string, string>[];
  benchmark_baseline_results: Record<string, string>[];
  provenance: {
    source_files: string[];
    verification_status: string;
  };
}

export interface NodeQueryDetail {
  node_id: string;
  host: string;
  port: number;
  status: 'ACK' | 'DROPPED' | 'PARTITIONED' | 'ASYNC_QUEUED' | 'SKIPPED' | 'CONSULTED' | 'NOT_QUERIED';
  acknowledged: boolean;
  message: string;
}

export interface QueryExecuteRequest {
  operation: 'PUT' | 'GET' | 'DELETE';
  key: string;
  value?: string;
  consistency_mode: 'STRONG' | 'QUORUM' | 'EVENTUAL' | 'ADAPTIVE';
  simulated_delay_ms: number;
  delay_jitter_ms?: number;
  failure_probability: number;
  replication_delay_ms: number;
  unavailable_nodes: string[];
}

export interface QueryExecuteResponse {
  operation: 'PUT' | 'GET' | 'DELETE';
  key: string;
  value?: string | null;
  requested_consistency: string;
  effective_consistency: string;
  adaptive_info?: {
    selected_mode: string;
    reason: string;
    alive_nodes: number;
  } | null;
  success: boolean;
  version?: number;
  required_acks?: number;
  achieved_acks?: number;
  total_nodes?: number;
  successful_nodes?: string[];
  failed_nodes?: string[];
  nodes_consulted?: string[];
  nodes_detail: Record<string, NodeQueryDetail>;
  latency_ms: number;
  storage_mode: string;
  message: string;
  found?: boolean;
  deleted?: boolean;
  is_stale?: boolean;
  disagreement?: boolean;
  updated_at?: string;
}

export interface DatabaseRecord {
  key: string;
  value: string | null;
  version: number;
  deleted: boolean;
  updated_at: string;
}

export interface ReplicaNodeData {
  node_id: string;
  port: number;
  host: string;
  alive: boolean;
  record_count: number;
  records: DatabaseRecord[];
}

export interface ClusterDataResponse {
  replicas: Record<string, ReplicaNodeData>;
  total_unique_keys: number;
  total_records: number;
  key_divergence: Record<string, {
    diverged: boolean;
    nodes_holding: Record<string, {
      version: number;
      value: string | null;
      deleted: boolean;
    }>;
  }>;
  storage_mode: 'live_postgresql' | 'mock_in_memory';
}

