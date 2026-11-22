import { afterEach, describe, expect, it, vi } from 'vitest';
import { raftLabApi } from './raftLabApi';
import { SimulationRunRecord } from '../types/raft';

const run: SimulationRunRecord = {
  id: 'run/42',
  scenarioTitle: 'API test run',
  timestamp: '2026-11-22T12:00:00Z',
  seed: 42,
  clusterSize: 3,
  virtualDuration: 100,
  executionDuration: 10,
  eventCount: 0,
  verdict: 'PASS',
  leaderChanges: 1,
  messagesSent: 2,
  messagesDropped: 0,
  clientSuccess: 1,
  clientErrors: 0,
  invariants: [],
  linearizabilityPassed: true,
  events: [],
  snapshots: [],
};

describe('raftLabApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates a run with JSON content type and decodes the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: run.id, scenarioTitle: run.scenarioTitle }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(raftLabApi.createRun(run)).resolves.toMatchObject({
      id: run.id,
      scenarioTitle: run.scenarioTitle,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/runs$/),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(run),
      }),
    );
  });

  it('encodes run ids and requests event pages', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ items: [], total: 0, limit: 25, offset: 50 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await raftLabApi.listRunEvents('run/a b', 25, 50);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/v1\/runs\/run%2Fa%20b\/events\?limit=25&offset=50$/),
      expect.objectContaining({ headers: {} }),
    );
  });

  it('requests paginated runs and fetches a run by its encoded id', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [], total: 0, limit: 10, offset: 20 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: run.id }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await raftLabApi.listRuns(10, 20);
    await raftLabApi.getRun(run.id);

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/runs\?limit=10&offset=20$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/v1\/runs\/run%2F42$/);
  });

  it('creates and deletes scenarios through the versioned API', async () => {
    const scenario = {
      title: 'Saved scenario',
      category: 'Partitions' as const,
      difficulty: 'Intermediate' as const,
      description: 'description',
      goal: 'goal',
      clusterSize: 5,
      expectedVerdict: 'PASS' as const,
      config: { clusterSize: 5 },
      faultScript: [],
      workload: [],
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'custom-1', ...scenario }), { status: 201 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(raftLabApi.createScenario(scenario)).resolves.toMatchObject({ id: 'custom-1' });
    await expect(raftLabApi.deleteScenario('custom/a')).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/v1\/scenarios$/);
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/api\/v1\/scenarios\/custom%2Fa$/);
  });

  it('returns undefined for successful no-content deletes', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })));

    await expect(raftLabApi.deleteRun('run-1')).resolves.toBeUndefined();
  });

  it('surfaces API validation errors from response details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: 'eventCount must match submitted events' }), { status: 422 }),
      ),
    );

    await expect(raftLabApi.createRun(run)).rejects.toThrow(
      'API request failed (422): eventCount must match submitted events',
    );
  });

  it('uses the HTTP status text when an error body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
    })));

    await expect(raftLabApi.health()).rejects.toThrow('API request failed (503): Service Unavailable');
  });
});
