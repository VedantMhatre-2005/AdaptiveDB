import type {
  BackendCapabilities,
  BackendHealth,
  ExperimentConfig,
  ExperimentRecord,
  HistoricalResultsData,
  PresetConfig,
  QueryExecuteRequest,
  QueryExecuteResponse,
  ClusterDataResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        let errorMessage = `API Error ${response.status}: ${response.statusText}`;
        try {
          const errorJson = await response.json();
          if (errorJson.detail) {
            errorMessage = errorJson.detail;
          }
        } catch {
          // keep fallback error message
        }
        throw new Error(errorMessage);
      }

      return (await response.json()) as T;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown network error occurred');
    }
  }

  async getHealth(): Promise<BackendHealth> {
    return this.request<BackendHealth>('/health');
  }

  async getCapabilities(): Promise<BackendCapabilities> {
    return this.request<BackendCapabilities>('/capabilities');
  }

  async submitExperiment(config: ExperimentConfig): Promise<{ experiment_id: string; status: string; message: string }> {
    return this.request<{ experiment_id: string; status: string; message: string }>('/experiments', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getExperiments(): Promise<{ total: number; experiments: ExperimentRecord[] }> {
    return this.request<{ total: number; experiments: ExperimentRecord[] }>('/experiments');
  }

  async getExperiment(id: string): Promise<ExperimentRecord> {
    return this.request<ExperimentRecord>(`/experiments/${id}`);
  }

  async getExperimentStatus(id: string): Promise<{
    id: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: {
      completed_runs: number;
      total_runs: number;
      percent: number;
      current_step: string;
    };
    error: string | null;
  }> {
    return this.request(`/experiments/${id}/status`);
  }

  async cancelExperiment(id: string): Promise<{ status: string; message: string }> {
    return this.request(`/experiments/${id}/cancel`, {
      method: 'POST',
    });
  }

  async getConfigurations(): Promise<PresetConfig[]> {
    return this.request<PresetConfig[]>('/configurations');
  }

  async saveConfiguration(preset: { name: string; description: string; config: ExperimentConfig }): Promise<PresetConfig> {
    return this.request<PresetConfig>('/configurations', {
      method: 'POST',
      body: JSON.stringify(preset),
    });
  }

  async getHistoricalResults(): Promise<HistoricalResultsData> {
    return this.request<HistoricalResultsData>('/historical_results');
  }

  async executeQuery(req: QueryExecuteRequest): Promise<QueryExecuteResponse> {
    return this.request<QueryExecuteResponse>('/query/execute', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getClusterData(): Promise<ClusterDataResponse> {
    return this.request<ClusterDataResponse>('/cluster/data');
  }

  async clearCluster(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/cluster/clear', {
      method: 'POST',
    });
  }

  getExportUrl(id: string, format: 'json' | 'csv'): string {
    const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`;
    return `${base}/experiments/${id}/export?format=${format}`;
  }
}

export const api = new ApiService();
