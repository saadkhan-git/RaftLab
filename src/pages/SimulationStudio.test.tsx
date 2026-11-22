import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SimulationStudio from './SimulationStudio';
import { raftLabApi } from '../api/raftLabApi';
import { RaftSimulator } from '../engine/raftSimulator';

vi.mock('../api/raftLabApi', () => ({
  raftLabApi: {
    createRun: vi.fn(),
  },
}));

describe('SimulationStudio persistence', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('saves the completed simulation run and reports persistence status', async () => {
    vi.mocked(raftLabApi.createRun).mockResolvedValue({
      id: 'run-studio-test',
      scenarioTitle: 'Completed Simulation Run',
      timestamp: '2026-11-22T12:00:00Z',
      seed: 71292,
      clusterSize: 5,
      virtualDuration: 8000,
      executionDuration: 1000,
      eventCount: 1,
      verdict: 'PASS',
      leaderChanges: 1,
      messagesSent: 2,
      messagesDropped: 0,
      clientSuccess: 0,
      clientErrors: 0,
      linearizabilityPassed: true,
    });
    vi.spyOn(RaftSimulator.prototype, 'step').mockImplementation(function (this: RaftSimulator) {
      this.virtualTime = 8000;
    });
    vi.useFakeTimers();

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SimulationStudio />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'RUN SIMULATION' }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(raftLabApi.createRun).toHaveBeenCalledOnce();
    const savedRun = vi.mocked(raftLabApi.createRun).mock.calls[0][0];
    expect(savedRun.virtualDuration).toBe(8000);
    expect(savedRun.clusterSize).toBe(5);
    expect(savedRun.events.length).toBe(savedRun.eventCount);
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByText('Run and trace saved to the database.')).toBeInTheDocument();
  });
});
