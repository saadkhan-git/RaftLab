import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ScenariosPage from './ScenariosPage';
import { raftLabApi } from '../api/raftLabApi';
import { Scenario } from '../types/raft';

vi.mock('../api/raftLabApi', () => ({
  raftLabApi: {
    listScenarios: vi.fn(),
    createScenario: vi.fn(),
  },
}));

const savedScenario: Scenario = {
  id: 'custom-test',
  title: 'Saved custom scenario',
  category: 'Partitions',
  difficulty: 'Intermediate',
  description: 'Stored scenario',
  goal: 'Persist and load',
  clusterSize: 5,
  expectedVerdict: 'PASS',
  config: { clusterSize: 5 },
  faultScript: [],
  workload: [],
};

describe('ScenariosPage', () => {
  beforeEach(() => {
    vi.mocked(raftLabApi.listScenarios).mockResolvedValue([savedScenario]);
    vi.mocked(raftLabApi.createScenario).mockResolvedValue(savedScenario);
  });

  it('loads persisted scenarios alongside the built-in scenario library', async () => {
    render(<MemoryRouter><ScenariosPage /></MemoryRouter>);

    expect(await screen.findByText('Saved custom scenario')).toBeInTheDocument();
    expect(screen.getByText('Standard Leader Election')).toBeInTheDocument();
  });

  it('parses builder schedules and saves a custom scenario', async () => {
    vi.mocked(raftLabApi.listScenarios).mockResolvedValue([]);
    render(<MemoryRouter><ScenariosPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Scenario Builder' }));
    fireEvent.change(screen.getByLabelText('Scenario Name'), { target: { value: 'Partition regression' } });
    fireEvent.change(screen.getByLabelText('Client Workload Schedule'), {
      target: { value: '750ms PUT account:4 = active\nGET account:4' },
    });
    fireEvent.change(screen.getByLabelText('Fault Injection Timeline'), {
      target: { value: '1000ms Partition [1,2] vs [3,4,5]\n2500ms Heal Partition' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Scenario' }));

    await waitFor(() => expect(raftLabApi.createScenario).toHaveBeenCalledOnce());
    expect(raftLabApi.createScenario).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Partition regression',
      workload: [
        { timeMs: 750, command: 'PUT account:4 = active' },
        { timeMs: 0, command: 'GET account:4' },
      ],
      faultScript: [
        { timeMs: 1000, action: 'Partition [1,2] vs [3,4,5]' },
        { timeMs: 2500, action: 'Heal Partition' },
      ],
    }));
    expect(await screen.findByText('Saved custom scenario')).toBeInTheDocument();
  });

  it('shows save failures to the user', async () => {
    vi.mocked(raftLabApi.createScenario).mockRejectedValue(new Error('Database unavailable'));
    render(<MemoryRouter><ScenariosPage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Scenario Builder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save Scenario' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
  });
});
