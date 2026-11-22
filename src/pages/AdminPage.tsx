import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Database, RefreshCw, ShieldAlert, Trash2 } from 'lucide-react';
import { raftLabApi, AdminOverview, RunPage } from '../api/raftLabApi';
import { Scenario } from '../types/raft';

export default function AdminPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [runPage, setRunPage] = useState<RunPage | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runOffset, setRunOffset] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [databaseOverview, savedScenarios, savedRuns] = await Promise.all([
        raftLabApi.adminOverview(),
        raftLabApi.listScenarios(),
        raftLabApi.listRuns(20, runOffset),
      ]);
      setOverview(databaseOverview);
      setScenarios(savedScenarios);
      setRunPage(savedRuns);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load database records.');
    } finally {
      setLoading(false);
    }
  }, [runOffset]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const removeRun = async (id: string) => {
    if (!window.confirm(`Permanently delete run ${id} and its events and snapshots?`)) return;
    setBusyId(id);
    setError(null);
    try {
      await raftLabApi.deleteRun(id);
      if (runPage?.items.length === 1 && runOffset > 0) {
        setRunOffset(Math.max(0, runOffset - 20));
      } else {
        await refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete run.');
    } finally {
      setBusyId(null);
    }
  };

  const removeScenario = async (id: string) => {
    if (!window.confirm(`Permanently delete saved scenario ${id}?`)) return;
    setBusyId(id);
    setError(null);
    try {
      await raftLabApi.deleteScenario(id);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to delete scenario.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-white">Database Admin</h1>
          </div>
          <p className="mt-1 text-xs font-mono text-slate-400">
            Inspect persisted runs, event traces, snapshots, and saved scenarios.
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-[#1F2D4A] bg-[#0D1424] px-3 py-2 text-xs font-mono text-slate-200 hover:bg-[#131E35] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-900/70 bg-amber-950/30 p-4 text-xs text-amber-200">
        <ShieldAlert className="h-5 w-5 shrink-0 text-amber-400" />
        <p>
          Local development admin only. This panel has no sign-in or role checks; do not expose this API
          to an untrusted network or production users without adding authentication and authorization.
        </p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-900 bg-rose-950/40 p-4 text-sm text-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-bold">Database request failed</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        </div>
      )}

      {!overview && !loading && !error && (
        <div className="rounded-xl border border-[#1F2D4A] bg-[#0D1424] p-6 text-sm text-slate-300">
          No database overview is available.
        </div>
      )}

      {overview && (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Database', overview.database.toUpperCase()],
              ['Saved runs', overview.totalRuns],
              ['Passing runs', overview.passRuns],
              ['Failed runs', overview.failedRuns],
              ['Stored events', overview.totalEvents],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-[#1F2D4A] bg-[#0D1424] p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">{label}</div>
                <div className="mt-2 truncate text-xl font-black text-white">{value}</div>
              </div>
            ))}
          </section>

          <section className="rounded-2xl border border-[#1F2D4A] bg-[#0D1424]">
            <div className="border-b border-[#1F2D4A] p-4">
              <h2 className="text-sm font-bold text-white">Database tables</h2>
              <p className="mt-1 text-[11px] font-mono text-slate-400">Live row counts from the configured database.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4">
              {Object.entries(overview.tables).map(([table, count]) => (
                <div key={table} className="rounded-lg border border-[#1F2D4A] bg-[#070B14] p-3">
                  <div className="text-xs font-mono text-cyan-300">{table}</div>
                  <div className="mt-1 text-lg font-bold text-white">{count.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#1F2D4A] bg-[#0D1424]">
            <div className="border-b border-[#1F2D4A] p-4">
              <h2 className="text-sm font-bold text-white">Recent persisted runs</h2>
              <p className="mt-1 text-[11px] font-mono text-slate-400">Deleting a run also removes its event trace and snapshots.</p>
            </div>
            {runPage?.items.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No runs saved yet. Complete a simulation in the Studio to create one.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs font-mono">
                  <thead className="bg-[#070B14] text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="p-3">Run</th>
                      <th className="p-3">Verdict</th>
                      <th className="p-3">Cluster</th>
                      <th className="p-3">Events</th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2D4A] text-slate-300">
                    {(runPage?.items ?? []).map(run => (
                      <tr key={run.id}>
                        <td className="max-w-[280px] truncate p-3">
                          <div className="font-bold text-white">{run.scenarioTitle}</div>
                          <div className="text-[10px] text-slate-500">{run.id} · seed {run.seed}</div>
                        </td>
                        <td className="p-3">{run.verdict}</td>
                        <td className="p-3">{run.clusterSize} nodes</td>
                        <td className="p-3">{run.eventCount.toLocaleString()}</td>
                        <td className="p-3">{new Date(run.timestamp).toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => void removeRun(run.id)}
                            disabled={busyId === run.id}
                            aria-label={`Delete ${run.id}`}
                            className="rounded p-2 text-rose-300 hover:bg-rose-950 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {runPage && runPage.total > runPage.limit && (
              <div className="flex items-center justify-between border-t border-[#1F2D4A] p-3 text-xs font-mono text-slate-400">
                <span>
                  {runPage.total === 0 ? 0 : runPage.offset + 1}-{Math.min(runPage.offset + runPage.limit, runPage.total)} of {runPage.total}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRunOffset(Math.max(0, runOffset - runPage.limit))}
                    disabled={runOffset === 0 || loading}
                    className="rounded border border-[#1F2D4A] px-2.5 py-1 text-slate-200 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setRunOffset(runOffset + runPage.limit)}
                    disabled={runOffset + runPage.limit >= runPage.total || loading}
                    className="rounded border border-[#1F2D4A] px-2.5 py-1 text-slate-200 disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#1F2D4A] bg-[#0D1424]">
            <div className="border-b border-[#1F2D4A] p-4">
              <h2 className="text-sm font-bold text-white">Saved custom scenarios</h2>
            </div>
            {scenarios.length === 0 ? (
              <p className="p-6 text-sm text-slate-400">No custom scenarios saved yet.</p>
            ) : (
              <ul className="divide-y divide-[#1F2D4A]">
                {scenarios.map(scenario => (
                  <li key={scenario.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white">{scenario.title}</p>
                      <p className="mt-1 text-[11px] font-mono text-slate-400">
                        {scenario.id} · {scenario.category} · {scenario.clusterSize} nodes
                      </p>
                    </div>
                    <button
                      onClick={() => void removeScenario(scenario.id)}
                      disabled={busyId === scenario.id}
                      aria-label={`Delete ${scenario.title}`}
                      className="rounded p-2 text-rose-300 hover:bg-rose-950 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
