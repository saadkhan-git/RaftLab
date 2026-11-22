import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Layers,
  Play,
  History,
  AlertTriangle,
  GitCompare,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  Cpu,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { raftLabApi, AdminOverview } from '../api/raftLabApi';

export default function Dashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [databaseError, setDatabaseError] = useState<string | null>(null);
  const recentRuns = overview?.recentRuns ?? [];

  useEffect(() => {
    raftLabApi.adminOverview()
      .then(setOverview)
      .catch(cause => setDatabaseError(cause instanceof Error ? cause.message : 'Database is unavailable.'));
  }, []);

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Engineering Dashboard
          </h1>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Overview of deterministic simulation runs, automated invariant verification, and failure traces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <NavLink
            to="/studio"
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> New Simulation
          </NavLink>
          <NavLink
            to="/replay"
            className="px-3.5 py-2 rounded-lg bg-[#0D1424] hover:bg-[#131E35] text-slate-300 border border-[#1F2D4A] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" /> Replay Last Run
          </NavLink>
          <NavLink
            to="/scenarios"
            className="px-3.5 py-2 rounded-lg bg-[#0D1424] hover:bg-[#131E35] text-slate-300 border border-[#1F2D4A] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Preset Scenarios
          </NavLink>
          <NavLink
            to="/compare"
            className="px-3.5 py-2 rounded-lg bg-[#0D1424] hover:bg-[#131E35] text-slate-300 border border-[#1F2D4A] text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <GitCompare className="w-3.5 h-3.5 text-teal-400" /> Compare Runs
          </NavLink>
        </div>
      </div>

      {databaseError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-900 bg-amber-950/30 p-4 text-xs text-amber-200">
          <span>Could not load persisted run data: {databaseError}</span>
          <button onClick={() => navigate('/admin')} className="font-bold underline">Check API status</button>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0D1424] p-5 rounded-xl border border-[#1F2D4A]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Custom Scenarios</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{overview?.tables.scenarios ?? '—'}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            Saved custom scenarios
          </div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-xl border border-[#1F2D4A]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Simulation Runs</span>
            <Play className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black text-white font-mono">{overview?.totalRuns ?? '—'}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            Persisted simulation runs
          </div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-xl border border-[#1F2D4A]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Failed Runs</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 font-mono">{overview?.failedRuns ?? '—'}</div>
          <div className="text-[11px] text-rose-300/80 mt-1">
            Non-passing verdicts
          </div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-xl border border-[#1F2D4A]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-2">
            <span>Successful Runs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 font-mono">{overview?.passRuns ?? '—'}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Passing verdicts
          </div>
        </div>
      </div>

      {/* Main Content: Recent Runs Table + Activity Feed */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Runs Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#0D1424] rounded-xl border border-[#1F2D4A] overflow-hidden">
          <div className="p-4 bg-[#090E1A] border-b border-[#1F2D4A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-white text-sm">Recent Simulation Runs</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Section 18 Spec</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px] border-b border-[#1F2D4A]">
                <tr>
                  <th className="p-3">Experiment & Scenario</th>
                  <th className="p-3">Verdict</th>
                  <th className="p-3">Seed</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Time</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2D4A] text-slate-300">
                {recentRuns.map(run => (
                  <tr key={run.id} className="hover:bg-[#070B14]/50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-white text-sm">{run.scenarioTitle}</div>
                      <div className="text-[11px] text-slate-400">{run.clusterSize} nodes · {run.eventCount} events</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          run.verdict === 'PASS'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : run.verdict === 'SAFETY_FAIL'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {run.verdict}
                      </span>
                    </td>
                    <td className="p-3 text-cyan-300">{run.seed}</td>
                    <td className="p-3 text-slate-300">{run.virtualDuration.toLocaleString()} ms</td>
                    <td className="p-3 text-slate-400">{new Date(run.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => navigate(`/replay?runId=${encodeURIComponent(run.id)}`)}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]"
                        title="Replay Execution"
                      >
                        Replay
                      </button>
                      {run.verdict !== 'PASS' && (
                        <button
                          onClick={() => navigate('/analysis')}
                          className="px-2 py-1 rounded bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 text-[11px]"
                          title="Failure Explainer"
                        >
                          Analyze
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {recentRuns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      {databaseError ? 'Run history is unavailable until the API connects.' : 'No runs saved yet. Complete a simulation to populate this dashboard.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="bg-[#0D1424] rounded-xl border border-[#1F2D4A] overflow-hidden flex flex-col">
          <div className="p-4 bg-[#090E1A] border-b border-[#1F2D4A] flex items-center justify-between">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Activity Feed
            </h2>
            <button onClick={() => navigate('/admin')} className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300">Database Admin</button>
          </div>

          <div className="p-4 space-y-3 font-mono text-xs flex-1 overflow-y-auto">
            {recentRuns.slice(0, 5).map(run => (
              <div key={run.id} className="p-2.5 rounded bg-[#070B14] border border-[#1F2D4A]">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span className={`font-bold ${run.verdict === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}`}>{run.verdict}</span>
                  <span>{new Date(run.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-slate-200">{run.scenarioTitle} · seed {run.seed}</p>
              </div>
            ))}
            {recentRuns.length === 0 && <p className="text-slate-400">Recent persisted run activity appears here.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
