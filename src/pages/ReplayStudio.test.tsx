import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ReplayStudio from './ReplayStudio';
import { raftLabApi } from '../api/raftLabApi';

vi.mock('../api/raftLabApi', () => ({
  raftLabApi: {
    getRun: vi.fn(),
    listRunEvents: vi.fn(),
  },
}));

describe('ReplayStudio', () => {
  it('loads the selected persisted run snapshot and its event page', async () => {
    vi.mocked(raftLabApi.getRun).mockResolvedValue({
      id: 'run-replay-test',
      scenarioTitle: 'Replay test',
      timestamp: '2026-11-22T12:00:00Z',
      seed: 98765,
      clusterSize: 3,
      virtualDuration: 300,
      executionDuration: 20,
      eventCount: 1,
      verdict: 'PASS',
      leaderChanges: 1,
      messagesSent: 2,
      messagesDropped: 0,
      clientSuccess: 0,
      clientErrors: 0,
      invariants: [],
      linearizabilityPassed: true,
      snapshots: [{
        time: 300,
        nodes: [{
          id: 1,
          role: 'LEADER',
          currentTerm: 4,
          votedFor: 1,
          log: [],
          commitIndex: 0,
          lastApplied: 0,
          stateMachine: {},
          electionTimeout: 250,
          heartbeatInterval: 100,
          votesReceived: [1, 2],
          leaderId: 1,
          lastHeartbeatTime: 300,
        }],
      }],
    });
    vi.mocked(raftLabApi.listRunEvents).mockResolvedValue({
      items: [{
        id: 1,
        virtualTime: 300,
        type: 'BECOME_LEADER',
        nodeId: 1,
        details: 'Node elected',
        severity: 'success',
      }],
      total: 1,
      limit: 5,
      offset: 0,
    });

    render(
      <MemoryRouter initialEntries={['/replay?runId=run-replay-test']}>
        <ReplayStudio />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Node 1 Snapshot')).toBeInTheDocument();
    expect(screen.getByText('98765')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /BECOME LEADER/ })).toBeInTheDocument();
    expect(raftLabApi.getRun).toHaveBeenCalledWith('run-replay-test');
    expect(raftLabApi.listRunEvents).toHaveBeenCalledWith('run-replay-test', 5);
  });

  it('shows an error when a persisted run cannot be loaded', async () => {
    vi.mocked(raftLabApi.getRun).mockRejectedValue(new Error('Saved run not found'));
    vi.mocked(raftLabApi.listRunEvents).mockResolvedValue({
      items: [],
      total: 0,
      limit: 5,
      offset: 0,
    });

    render(
      <MemoryRouter initialEntries={['/replay?runId=missing']}>
        <ReplayStudio />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('Saved run not found');
  });
});
