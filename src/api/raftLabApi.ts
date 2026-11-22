import { Scenario, SimulationRunRecord, Verdict } from '../types/raft';

const API_BASE = `${import.meta.env.VITE_API_BASE_URL ?? ''}/api/v1`;

export interface RunSummary {
  id: string;
  scenarioId?: string | null;
  scenarioTitle: string;
  timestamp: string;
  seed: number;
  clusterSize: number;
  virtualDuration: number;
  executionDuration: number;
  eventCount: number;
  verdict: Verdict;
  leaderChanges: number;
  messagesSent: number;
  messagesDropped: number;
  clientSuccess: number;
  clientErrors: number;
  linearizabilityPassed: boolean;
}

export interface RunPage {
  items: RunSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface RunEventPage {
  items: SimulationRunRecord['events'];
  total: number;
  limit: number;
  offset: number;
}

export interface AdminOverview {
  database: string;
  tables: {
    runs: number;
    runEvents: number;
    nodeSnapshots: number;
    invariantResults: number;
    scenarios: number;
  };
  totalRuns: number;
  passRuns: number;
  failedRuns: number;
  totalEvents: number;
  recentRuns: RunSummary[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail = body && typeof body.detail === 'string' ? body.detail : response.statusText;
    throw new Error(`API request failed (${response.status}): ${detail}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const raftLabApi = {
  health: () => request<{ status: string; database: string }>('/health'),
  adminOverview: () => request<AdminOverview>('/admin/overview'),
  listRuns: (limit = 20, offset = 0) =>
    request<RunPage>(`/runs?limit=${limit}&offset=${offset}`),
  getRun: (id: string) => request<Omit<SimulationRunRecord, 'events'>>(`/runs/${encodeURIComponent(id)}`),
  listRunEvents: (id: string, limit = 100, offset = 0) =>
    request<RunEventPage>(`/runs/${encodeURIComponent(id)}/events?limit=${limit}&offset=${offset}`),
  createRun: (run: SimulationRunRecord) =>
    request<RunSummary>('/runs', { method: 'POST', body: JSON.stringify(run) }),
  deleteRun: (id: string) =>
    request<void>(`/runs/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  listScenarios: () => request<Scenario[]>('/scenarios'),
  createScenario: (scenario: Omit<Scenario, 'id'>) =>
    request<Scenario>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(scenario),
    }),
  deleteScenario: (id: string) =>
    request<void>(`/scenarios/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
