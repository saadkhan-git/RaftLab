import React, { useState } from 'react';
import { BarChart3, TrendingUp, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AnalyticsPage() {
  const [seedSearch, setSeedSearch] = useState('');

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Consensus Analytics & Metrics
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-1">
          RaftLab 2.0 Feature 5 & Section 27 Spec — Cross-run aggregate telemetry, fault sensitivity, and seed campaigns.
        </p>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A]">
          <div className="text-slate-400 text-[10px]">Verified Runs</div>
          <div className="text-2xl font-bold text-white mt-1">384</div>
          <div className="text-[10px] text-emerald-400 mt-1">93.2% Pass Rate</div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A]">
          <div className="text-slate-400 text-[10px]">Total Virtual Time</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">1,420 s</div>
          <div className="text-[10px] text-slate-400 mt-1">Executed in 18 mins real time</div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A]">
          <div className="text-slate-400 text-[10px]">Total Events Analyzed</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">142,800</div>
          <div className="text-[10px] text-slate-400 mt-1">100% Deterministic trace</div>
        </div>

        <div className="bg-[#0D1424] p-5 rounded-2xl border border-[#1F2D4A]">
          <div className="text-slate-400 text-[10px]">Safety Failures Found</div>
          <div className="text-2xl font-bold text-rose-400 mt-1">14</div>
          <div className="text-[10px] text-rose-300 mt-1">3.6% Failure Discovery</div>
        </div>
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Verdict Distribution Chart */}
        <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Verdict Distribution Across Experiments (§27)
          </h3>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-emerald-400">PASS (358 runs)</span>
                <span className="text-slate-400">93.2%</span>
              </div>
              <div className="w-full h-3 bg-[#070B14] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '93.2%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-rose-400">SAFETY_FAIL (14 runs)</span>
                <span className="text-slate-400">3.6%</span>
              </div>
              <div className="w-full h-3 bg-[#070B14] rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 rounded-full" style={{ width: '3.6%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-amber-400">LIVENESS_FAIL (12 runs)</span>
                <span className="text-slate-400">3.1%</span>
              </div>
              <div className="w-full h-3 bg-[#070B14] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '3.1%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Cluster Scalability Comparison */}
        <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Cluster Size Scaling (Feature 3)
          </h3>

          <div className="bg-[#070B14] rounded-xl border border-[#1F2D4A] overflow-hidden text-xs font-mono">
            <table className="w-full text-left divide-y divide-[#1F2D4A]">
              <thead className="bg-[#090E1A] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Nodes</th>
                  <th className="p-3">Majority Req</th>
                  <th className="p-3">Avg Election Time</th>
                  <th className="p-3">Msg Overhead</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2D4A] text-slate-300">
                <tr>
                  <td className="p-3 font-bold text-cyan-400">3 Nodes</td>
                  <td className="p-3">2 Votes (66%)</td>
                  <td className="p-3">240 ms</td>
                  <td className="p-3 text-slate-400">Low (6 msgs/round)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-cyan-400">5 Nodes</td>
                  <td className="p-3">3 Votes (60%)</td>
                  <td className="p-3">310 ms</td>
                  <td className="p-3 text-slate-400">Standard (20 msgs/round)</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-cyan-400">7 Nodes</td>
                  <td className="p-3">4 Votes (57%)</td>
                  <td className="p-3">420 ms</td>
                  <td className="p-3 text-slate-400">Moderate (42 msgs/round)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Seed Exploration Campaign (§27) */}
      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Automated Seed Campaign Explorer
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Testing thousands of pseudo-random seeds to uncover edge-case race conditions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search seed..."
              value={seedSearch}
              onChange={e => setSeedSearch(e.target.value)}
              className="px-3 py-1.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 font-mono text-xs">
          {[
            { seed: 71292, verdict: 'PASS' },
            { seed: 98112, verdict: 'SAFETY_FAIL' },
            { seed: 42100, verdict: 'PASS' },
            { seed: 33410, verdict: 'LIVENESS_FAIL' },
            { seed: 88721, verdict: 'PASS' },
            { seed: 12490, verdict: 'PASS' },
            { seed: 55412, verdict: 'PASS' },
            { seed: 61099, verdict: 'PASS' },
            { seed: 77201, verdict: 'SAFETY_FAIL' },
            { seed: 31415, verdict: 'PASS' },
            { seed: 99401, verdict: 'PASS' },
            { seed: 10240, verdict: 'PASS' },
          ]
            .filter(item => !seedSearch || item.seed.toString().includes(seedSearch))
            .map(item => (
              <div
                key={item.seed}
                className={`p-2.5 rounded-lg border text-center ${
                  item.verdict === 'PASS'
                    ? 'bg-[#070B14] border-[#1F2D4A] text-slate-300'
                    : 'bg-rose-950/60 border-rose-800 text-rose-300 font-bold animate-pulse'
                }`}
              >
                <div>Seed {item.seed}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{item.verdict}</div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
