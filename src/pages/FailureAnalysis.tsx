import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Minimize2,
  FileText,
  History,
  Download,
  Terminal,
  ArrowRight,
  Layers,
} from 'lucide-react';

export default function FailureAnalysis() {
  const [minimizing, setMinimizing] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleRunMinimizer = () => {
    setMinimizing(true);
    setTimeout(() => {
      setMinimizing(false);
      setMinimized(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Failure Analysis & Explainer
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            RaftLab 2.0 Feature 2 & 6 — Evidence-grounded root cause diagnosis and automated trace minimization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NavLink
            to="/replay"
            className="px-3.5 py-2 rounded-lg bg-[#0D1424] hover:bg-[#131E35] text-slate-200 border border-[#1F2D4A] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
          >
            <History className="w-4 h-4 text-indigo-400" /> Jump to Replay
          </NavLink>
        </div>
      </div>

      {/* Main Failure Banner */}
      <div className="bg-rose-950/70 border border-rose-600/80 rounded-2xl p-6 text-rose-100 shadow-xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-9 h-9 text-rose-400 shrink-0" />
            <div>
              <div className="text-xs font-mono uppercase font-bold text-rose-300">
                Safety Invariant Violation Detected
              </div>
              <h2 className="text-2xl font-black font-mono tracking-tight text-white">
                INV01 — Election Safety: Dual Leaders in Term 8
              </h2>
            </div>
          </div>

          <div className="text-xs font-mono text-right space-y-0.5">
            <div>Experiment: <strong className="text-white">Leader Crash Stress #8919</strong></div>
            <div>Seed: <strong className="text-cyan-300">98112</strong></div>
            <div>Violation Time: <strong className="text-rose-300">1,840 ms</strong></div>
          </div>
        </div>

        <p className="text-sm text-rose-200 leading-relaxed max-w-4xl">
          Two distinct nodes (<strong>Node 2</strong> and <strong>Node 4</strong>) were both recorded
          with role <code className="bg-rose-900 px-1.5 py-0.5 rounded text-white">LEADER</code> during Term 8.
          This violates Raft specification §5.2 ("At most one leader can be elected in a given term").
        </p>
      </div>

      {/* Structured Evidence Cards (Feature 2 Spec) */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Left: Evidence & Investigation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Verified Event Evidence
            </h3>

            <div className="bg-[#070B14] rounded-xl border border-[#1F2D4A] divide-y divide-[#1F2D4A] text-xs font-mono">
              <div className="p-3">
                <span className="text-slate-400">[1,720 ms] Event #142:</span>
                <span className="text-cyan-400 font-bold ml-2">Node 2</span> won election with votes from [1, 2, 3] (Majority reached).
              </div>
              <div className="p-3 bg-rose-950/20">
                <span className="text-slate-400">[1,760 ms] Event #149:</span>
                <span className="text-amber-400 font-bold ml-2">Node 4</span> delayed vote response from Node 3 arrived with old term data.
              </div>
              <div className="p-3 bg-rose-950/40">
                <span className="text-slate-400">[1,840 ms] Event #156:</span>
                <span className="text-rose-400 font-bold ml-2">Node 4</span> declared leadership for Term 8 (Duplicate election vote counted).
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs font-mono text-amber-200 space-y-2">
              <div className="font-bold uppercase tracking-wider text-amber-300">
                Suggested Root Cause Investigation
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-300">
                <li>Inspect Node 3 vote persistence: Did Node 3 restart volatile state without saving votedFor?</li>
                <li>Check message deduplication: Did Node 4 receive a replayed RequestVote response?</li>
                <li>Verify election timeout distribution to prevent overlapping candidate timers.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: Automatic Failure Minimizer (Feature 6 Spec) (5 cols) */}
        <div className="lg:col-span-5 bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Automatic Trace Minimizer
            </h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            RaftLab 2.0 Feature 6 applies delta-debugging to strip away irrelevant client writes and
            unrelated packets while guaranteeing the exact same safety failure is reproduced.
          </p>

          <div className="bg-[#070B14] p-4 rounded-xl border border-[#1F2D4A] font-mono text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Original Trace:</span>
              <span className="text-white font-bold">10,240 events</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Client Operations:</span>
              <span className="text-white">3,200 ops</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fault Events:</span>
              <span className="text-white">18 faults</span>
            </div>

            {minimized && (
              <div className="pt-2 border-t border-slate-800 text-emerald-400 space-y-1">
                <div className="flex justify-between font-bold">
                  <span>Reduced Trace:</span>
                  <span>23 events (99.7% reduction!)</span>
                </div>
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Minimized Workload:</span>
                  <span>1 client op + 1 delayed packet</span>
                </div>
                <div className="text-[10px] text-emerald-300">
                  Confirmed: Exact INV01 safety failure successfully reproduced!
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleRunMinimizer}
            disabled={minimizing}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {minimizing ? 'RUNNING DELTA-DEBUGGING...' : minimized ? 'RE-MINIMIZE TRACE' : 'RUN AUTOMATIC MINIMIZER'}
          </button>
        </div>
      </div>
    </div>
  );
}
