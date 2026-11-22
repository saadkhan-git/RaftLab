import React, { useState } from 'react';
import { BookOpen, Terminal, ShieldCheck, Cpu, Code2, Layers, CheckCircle2 } from 'lucide-react';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<'getting-started' | 'raft' | 'simulator' | 'invariants' | 'api'>('getting-started');

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Documentation Center
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Section 28 Spec — Complete architectural and protocol guide for the RaftLab testing platform.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation (3 cols) */}
        <div className="lg:col-span-3 space-y-1 font-mono text-xs">
          <button
            onClick={() => setActiveSection('getting-started')}
            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${
              activeSection === 'getting-started'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-[#0D1424] border-[#1F2D4A] text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" /> Getting Started
          </button>

          <button
            onClick={() => setActiveSection('raft')}
            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${
              activeSection === 'raft'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-[#0D1424] border-[#1F2D4A] text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" /> Raft Protocol Spec
          </button>

          <button
            onClick={() => setActiveSection('simulator')}
            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${
              activeSection === 'simulator'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-[#0D1424] border-[#1F2D4A] text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" /> Virtual Simulator Engine
          </button>

          <button
            onClick={() => setActiveSection('invariants')}
            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${
              activeSection === 'invariants'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-[#0D1424] border-[#1F2D4A] text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" /> Safety Invariants & Lin
          </button>

          <button
            onClick={() => setActiveSection('api')}
            className={`w-full text-left p-3 rounded-xl border transition-colors flex items-center gap-2 ${
              activeSection === 'api'
                ? 'bg-cyan-950/80 border-cyan-600 text-cyan-300 font-bold'
                : 'bg-[#0D1424] border-[#1F2D4A] text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" /> REST API Reference
          </button>
        </div>

        {/* Right Content Area (9 cols) */}
        <div className="lg:col-span-9 bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 lg:p-8 space-y-6 text-slate-300 text-sm leading-relaxed shadow-xl">
          {activeSection === 'getting-started' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Getting Started with RaftLab</h2>
              <p>
                RaftLab is a deterministic distributed testing and visualization environment. Rather than relying on
                unpredictable wall-clock sleeps, RaftLab controls virtual time and message delivery.
              </p>

              <h3 className="text-base font-bold text-white mt-4">1. Launching a Simulation</h3>
              <p>
                Navigate to <strong>Simulation Studio</strong>, select cluster size (e.g. 5 nodes), set your deterministic seed,
                and click <strong>RUN SIMULATION</strong>. The virtual clock will advance and followers will start elections.
              </p>

              <h3 className="text-base font-bold text-white mt-4">2. Injecting Faults</h3>
              <p>
                Use the <strong>Partition Builder</strong> to split nodes into Group A and Group B, or click <strong>Crash Leader</strong> to observe election failovers.
              </p>
            </div>
          )}

          {activeSection === 'raft' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Raft Consensus Protocol (§5)</h2>
              <p>
                Raft decomposes distributed consensus into three core subproblems:
              </p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Leader Election (§5.2):</strong> A new leader must be chosen when an existing leader fails. Candidates request votes from peers; a candidate winning a majority of votes becomes leader.</li>
                <li><strong>Log Replication (§5.3):</strong> The leader accepts log entries from clients and replicates them across followers via AppendEntries messages.</li>
                <li><strong>Safety (§5.4):</strong> If any server has applied a particular log entry to its state machine, no other server may apply a different command for the same log index.</li>
              </ul>
            </div>
          )}

          {activeSection === 'simulator' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Virtual Clock & Deterministic Engine (§4)</h2>
              <p>
                Traditional applications use real-world time (`time.sleep()`), making concurrency bugs notoriously difficult to reproduce.
                RaftLab maintains an ordered event queue:
              </p>
              <div className="bg-[#070B14] p-4 rounded-xl border border-[#1F2D4A] font-mono text-xs text-cyan-300 space-y-1">
                <div>[0 ms] Cluster initialized with 5 nodes</div>
                <div>[280 ms] Node 2 election timeout fired: started election for Term 1</div>
                <div>[310 ms] Node 2 received votes from [1, 2, 3] -&gt; BECOME_LEADER</div>
                <div>[450 ms] Leader 2 broadcast AppendEntries heartbeats</div>
              </div>
              <p className="text-xs text-slate-400">
                <strong>Determinism Promise:</strong> Same seed + same scenario configuration produces the exact identical execution trace.
              </p>
            </div>
          )}

          {activeSection === 'invariants' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">Automated Safety & Linearizability Checkers</h2>
              <p>
                RaftLab executes automated correctness verifiers over recorded traces:
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 bg-[#070B14] rounded-lg border border-[#1F2D4A]">
                  <strong className="text-cyan-400">INV01 (Election Safety):</strong> At most one leader may be elected in any given term.
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-[#1F2D4A]">
                  <strong className="text-cyan-400">INV03 (Commit Index Monotonicity):</strong> Commit index must advance monotonically on all participating nodes.
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-[#1F2D4A]">
                  <strong className="text-cyan-400">INV04 (State Machine Safety):</strong> Two nodes must not apply different commands at the same committed log index.
                </div>
                <div className="p-3 bg-[#070B14] rounded-lg border border-[#1F2D4A]">
                  <strong className="text-indigo-400">INV_LIN (Linearizability Checker):</strong> The client key-value history must admit a valid sequential execution order that respects real-time constraints.
                </div>
              </div>
            </div>
          )}

          {activeSection === 'api' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">FastAPI Backend Endpoints (§32)</h2>
              <div className="bg-[#070B14] p-4 rounded-xl border border-[#1F2D4A] font-mono text-xs space-y-2 text-slate-300">
                <div><span className="text-emerald-400 font-bold">GET</span> /api/v1/experiments</div>
                <div><span className="text-cyan-400 font-bold">POST</span> /api/v1/experiments/&#123;id&#125;/runs</div>
                <div><span className="text-emerald-400 font-bold">GET</span> /api/v1/runs/&#123;run_id&#125;/events</div>
                <div><span className="text-emerald-400 font-bold">GET</span> /api/v1/runs/&#123;run_id&#125;/invariants</div>
                <div><span className="text-indigo-400 font-bold">POST</span> /api/v1/runs/&#123;run_id&#125;/replay</div>
                <div><span className="text-amber-400 font-bold">POST</span> /api/v1/runs/&#123;run_id&#125;/minimize</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
