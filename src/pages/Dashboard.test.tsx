import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard';
import { raftLabApi } from '../api/raftLabApi';

vi.mock('../api/raftLabApi', () => ({
  raftLabApi: {
    adminOverview: vi.fn(),
  },
}));

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname}{location.search}</output>;
}

describe('Dashboard', () => {
  it('renders persisted metrics and navigates to the selected run replay', async () => {
    vi.mocked(raftLabApi.adminOverview).mockResolvedValue({
      database: 'sqlite',
      tables: { runs: 1, runEvents: 2, nodeSnapshots: 1, invariantResults: 1, scenarios: 0 },
      totalRuns: 1,
      passRuns: 1,
      failedRuns: 0,
      totalEvents: 2,
      recentRuns: [{
        id: 'run/dashboard 1',
        scenarioTitle: 'Persisted dashboard test',
        timestamp: '2026-11-22T12:00:00Z',
        seed: 42,
        clusterSize: 3,
        virtualDuration: 150,
        executionDuration: 10,
        eventCount: 2,
        verdict: 'PASS',
        leaderChanges: 1,
        messagesSent: 2,
        messagesDropped: 0,
        clientSuccess: 1,
        clientErrors: 0,
        linearizabilityPassed: true,
      }],
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/replay" element={<CurrentLocation />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Persisted dashboard test')).toBeInTheDocument();
    expect(screen.getByText('150 ms')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/replay?runId=run%2Fdashboard%201');
  });

  it('shows an explicit connection error if the API is unavailable', async () => {
    vi.mocked(raftLabApi.adminOverview).mockRejectedValue(new Error('API offline'));

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('API offline');
  });
});
