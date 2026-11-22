import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminPage from './AdminPage';
import { raftLabApi } from '../api/raftLabApi';

vi.mock('../api/raftLabApi', () => ({
  raftLabApi: {
    adminOverview: vi.fn(),
    listScenarios: vi.fn(),
    listRuns: vi.fn(),
    deleteRun: vi.fn(),
    deleteScenario: vi.fn(),
  },
}));

const overview = {
  database: 'sqlite',
  tables: { runs: 1, runEvents: 2, nodeSnapshots: 1, invariantResults: 1, scenarios: 0 },
  totalRuns: 1,
  passRuns: 1,
  failedRuns: 0,
  totalEvents: 2,
  recentRuns: [],
};

const savedRun = {
  id: 'run-admin-1',
  scenarioTitle: 'Admin test run',
  timestamp: '2026-11-22T12:00:00Z',
  seed: 11,
  clusterSize: 3,
  virtualDuration: 120,
  executionDuration: 10,
  eventCount: 2,
  verdict: 'PASS' as const,
  leaderChanges: 1,
  messagesSent: 3,
  messagesDropped: 0,
  clientSuccess: 1,
  clientErrors: 0,
  linearizabilityPassed: true,
};

describe('AdminPage', () => {
  beforeEach(() => {
    vi.mocked(raftLabApi.adminOverview).mockResolvedValue(overview);
    vi.mocked(raftLabApi.listScenarios).mockResolvedValue([]);
    vi.mocked(raftLabApi.listRuns).mockResolvedValue({
      items: [savedRun],
      total: 1,
      limit: 20,
      offset: 0,
    });
    vi.mocked(raftLabApi.deleteRun).mockResolvedValue(undefined);
    vi.mocked(raftLabApi.deleteScenario).mockResolvedValue(undefined);
  });

  it('renders persisted database stats and run records', async () => {
    render(<AdminPage />);

    expect(await screen.findByText('Admin test run')).toBeInTheDocument();
    expect(screen.getByText('SQLITE')).toBeInTheDocument();
    expect(screen.getByText('runEvents')).toBeInTheDocument();
    expect(screen.getByText('runEvents').parentElement).toHaveTextContent('2');
    expect(raftLabApi.listRuns).toHaveBeenCalledWith(20, 0);
  });

  it('confirms and deletes a persisted run, then refreshes the database data', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<AdminPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Delete run-admin-1' }));

    await waitFor(() => expect(raftLabApi.deleteRun).toHaveBeenCalledWith('run-admin-1'));
    expect(confirm).toHaveBeenCalled();
    expect(raftLabApi.adminOverview).toHaveBeenCalledTimes(2);
  });

  it('shows API errors instead of displaying a false empty state', async () => {
    vi.mocked(raftLabApi.adminOverview).mockRejectedValue(new Error('API is offline'));
    render(<AdminPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('API is offline');
    expect(screen.queryByText('No runs saved yet.')).not.toBeInTheDocument();
  });
});
