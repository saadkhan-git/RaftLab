import React from 'react';
import { GitCompare, CheckCircle2, AlertOctagon, TrendingUp, Layers, Cpu } from 'lucide-react';

export default function ComparePage() {
  const comparisonData = {
    runA: {
      name: 'Run #8921 — Healthy Baseline',
      seed: 71292,
      nodes: 5,
      latency: '25 ms',
      dropRate: '0%',
      partition: 'None',
      verdict: 'PASS',
      leaderChanges: 1,
      messagesSent: 412,
      messagesDropped: 0,
      clientSuccess: 12,
      clientErrors: 0,
      avgLatency: '35 ms',
      invStatus: 'All 7 Passed',
    },
    runB: {
      name: 'Run #8914 — Lossy Network Stress',
      seed: 71292,
      nodes: 5,
      latency: '60 ms',
      dropRate: '25%',
      partition: 'Group [1,2] vs [3,4,5]',
      verdict: 'LIVENESS_FAIL',
      leaderChanges: 6,
      messagesSent: 680,
      messagesDropped: 170,
      clientSuccess: 4,
      clientErrors: 8,
      avgLatency: '142 ms',
      invStatus: 'Liveness timeout (election stalled)',
    },
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="w-6 h-6 text-teal-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Run Comparison
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            RaftLab 2.0 Feature 7 & Section 26 Spec — Side-by-side behavioral diffing between two simulation executions.
          </p>
        </div>
      </div>

      {/* Side-by-side Cards Header */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A] space-y-2">
          <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase">Experiment A</div>
          <h2 className="text-lg font-bold text-white">{comparisonData.runA.name}</h2>
          <div className="text-xs font-mono text-slate-400">Seed: {comparisonData.runA.seed} | Cluster: {comparisonData.runA.nodes} nodes</div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A] space-y-2">
          <div className="text-[11px] font-mono text-indigo-400 font-bold uppercase">Experiment B</div>
          <h2 className="text-lg font-bold text-white">{comparisonData.runB.name}</h2>
          <div className="text-xs font-mono text-slate-400">Seed: {comparisonData.runB.seed} | Cluster: {comparisonData.runB.nodes} nodes</div>
        </div>
      </div>

      {/* Comparison Diff Table */}
      <div className="bg-[#0D1424] rounded-2xl border border-[#1F2D4A] overflow-hidden shadow-xl">
        <div className="p-4 bg-[#090E1A] border-b border-[#1F2D4A] font-mono text-xs font-bold text-white">
          Configuration & Metric Diff (§26)
        </div>

        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px] border-b border-[#1F2D4A]">
            <tr>
              <th className="p-3.5">Property / Metric</th>
              <th className="p-3.5 text-cyan-300">Run A (Baseline)</th>
              <th className="p-3.5 text-indigo-300">Run B (Lossy)</th>
              <th className="p-3.5 text-right">Delta / Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2D4A] text-slate-300">
            <tr>
              <td className="p-3.5 font-bold text-white">Final Verdict</td>
              <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-800">PASS</span></td>
              <td className="p-3.5"><span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-bold border border-amber-800">LIVENESS_FAIL</span></td>
              <td className="p-3.5 text-right text-rose-400 font-bold">Failure Introduced</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Packet Drop Rate</td>
              <td className="p-3.5">{comparisonData.runA.dropRate}</td>
              <td className="p-3.5 text-amber-400 font-bold">{comparisonData.runB.dropRate}</td>
              <td className="p-3.5 text-right text-amber-400">+25% drop rate</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Network Partition</td>
              <td className="p-3.5">{comparisonData.runA.partition}</td>
              <td className="p-3.5 text-rose-400 font-bold">{comparisonData.runB.partition}</td>
              <td className="p-3.5 text-right text-rose-400">Split Quorum</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Leader Transitions</td>
              <td className="p-3.5">{comparisonData.runA.leaderChanges}</td>
              <td className="p-3.5 text-amber-400 font-bold">{comparisonData.runB.leaderChanges}</td>
              <td className="p-3.5 text-right text-amber-400">+5 re-elections</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Messages Dropped</td>
              <td className="p-3.5">{comparisonData.runA.messagesDropped}</td>
              <td className="p-3.5 text-rose-400 font-bold">{comparisonData.runB.messagesDropped}</td>
              <td className="p-3.5 text-right text-rose-400">+170 packets lost</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Client Success / Errors</td>
              <td className="p-3.5 text-emerald-400">{comparisonData.runA.clientSuccess} / {comparisonData.runA.clientErrors}</td>
              <td className="p-3.5 text-amber-400">{comparisonData.runB.clientSuccess} / {comparisonData.runB.clientErrors}</td>
              <td className="p-3.5 text-right text-rose-400">8 client timeouts</td>
            </tr>
            <tr>
              <td className="p-3.5 text-slate-400">Invariants Verified</td>
              <td className="p-3.5 text-emerald-400 font-semibold">{comparisonData.runA.invStatus}</td>
              <td className="p-3.5 text-amber-400 font-semibold">{comparisonData.runB.invStatus}</td>
              <td className="p-3.5 text-right text-amber-400">Liveness failed</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
