import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Cpu,
  Play,
  Layers,
  ShieldCheck,
  History,
  Activity,
  ArrowRight,
  Zap,
  Split,
  Power,
  Database,
  CheckCircle2,
  Terminal,
  ExternalLink,
} from 'lucide-react';
import { RaftSimulator } from '../engine/raftSimulator';
import ClusterCanvas from '../components/ClusterCanvas';

export default function LandingPage() {
  // Mini interactive simulator instance on landing page!
  const [simulator] = useState(() => new RaftSimulator({ clusterSize: 5, seed: 12345 }));
  const [nodes, setNodes] = useState(() => simulator.nodes);
  const [packets, setPackets] = useState(() => simulator.packets);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(1);
  const [virtualTime, setVirtualTime] = useState(0);

  // Run a continuous gentle tick on landing page
  useEffect(() => {
    const timer = setInterval(() => {
      simulator.step(30);
      setNodes([...simulator.nodes]);
      setPackets([...simulator.packets]);
      setVirtualTime(simulator.virtualTime);
    }, 100);
    return () => clearInterval(timer);
  }, [simulator]);

  const handleCrashLeader = () => {
    const leader = nodes.find(n => n.role === 'LEADER');
    if (leader) {
      simulator.crashNode(leader.id);
      setNodes([...simulator.nodes]);
    }
  };

  const handlePartitionDemo = () => {
    if (Object.keys(simulator.partitions).length > 0) {
      simulator.healPartition();
    } else {
      simulator.createPartition({ A: [1, 2], B: [3, 4, 5] });
    }
    setNodes([...simulator.nodes]);
  };

  const handleClientWrite = () => {
    simulator.submitClientCommand('PUT', `user:${Math.floor(Math.random() * 100)}`, 'Active');
    setNodes([...simulator.nodes]);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 text-xs font-mono font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            Deterministic Distributed Systems Testing Platform
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight">
            Break distributed systems. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              Understand every failure.
            </span>
          </h1>

          <p className="text-lg text-slate-300 mb-8 leading-relaxed">
            RaftLab provides virtual-time simulation, interactive network partition injection, and
            deterministic event replay for Raft-based consensus systems. Replicate subtle distributed
            concurrency bugs with 100% precision.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <NavLink
              to="/studio"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 flex items-center gap-2 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Simulation Studio
            </NavLink>

            <NavLink
              to="/scenarios"
              className="px-6 py-3.5 rounded-xl bg-[#0D1424] hover:bg-[#131E35] text-slate-200 border border-[#1F2D4A] font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              Explore Scenario Library
            </NavLink>
          </div>
        </div>

        {/* Live Interactive Canvas Demo in Hero */}
        <div className="bg-[#0D1424]/90 p-4 sm:p-6 rounded-2xl border border-[#1F2D4A] shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1F2D4A]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-bold text-white text-sm">Interactive Sandbox Demo</span>
              <span className="font-mono text-xs text-slate-400">T: {virtualTime} ms</span>
            </div>

            {/* Quick Interactive Fault Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCrashLeader}
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Power className="w-3.5 h-3.5" /> Crash Leader
              </button>
              <button
                onClick={handlePartitionDemo}
                className="px-3 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/80 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Split className="w-3.5 h-3.5" />
                {Object.keys(simulator.partitions).length > 0 ? 'Heal Partition' : 'Partition [1,2] vs [3,4,5]'}
              </button>
              <button
                onClick={handleClientWrite}
                className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/80 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5" /> Client PUT
              </button>
            </div>
          </div>

          <ClusterCanvas
            nodes={nodes}
            packets={packets}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onCrashNode={id => {
              simulator.crashNode(id);
              setNodes([...simulator.nodes]);
            }}
            onRestartNode={id => {
              simulator.restartNode(id);
              setNodes([...simulator.nodes]);
            }}
            partitions={simulator.partitions}
          />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-[#090E1A] border-y border-[#1F2D4A] px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-bold">
              Engineering Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
              How RaftLab Works
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto mt-3 text-sm">
              From cluster topology to automated safety verification in three simple steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] relative">
              <span className="text-5xl font-black font-mono text-cyan-500/20 absolute top-4 right-4">
                01
              </span>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-5">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Configure</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Choose 3, 5, 7, or 9 nodes. Tune randomized election timeouts, heartbeat intervals,
                network jitter, drop rates, and inject targeted network partitions.
              </p>
            </div>

            <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] relative">
              <span className="text-5xl font-black font-mono text-indigo-500/20 absolute top-4 right-4">
                02
              </span>
              <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-800/60 flex items-center justify-center text-indigo-400 mb-5">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Simulate</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Execute under a deterministic virtual clock without flaky real-world sleeps.
                Observe leader election, heartbeats, and log replication in real time.
              </p>
            </div>

            <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] relative">
              <span className="text-5xl font-black font-mono text-teal-500/20 absolute top-4 right-4">
                03
              </span>
              <div className="w-12 h-12 rounded-xl bg-teal-950/80 border border-teal-800/60 flex items-center justify-center text-teal-400 mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Investigate</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Automated checkers verify Election Safety (INV01), State Machine Safety (INV04), and
                linearizability. Replay the exact execution trace step-by-step.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RaftLab 2.0 Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">
            RaftLab 2.0 Upgrades
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Built for Distributed Systems Rigor
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-cyan-500/50 transition-colors">
            <History className="w-7 h-7 text-cyan-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Deterministic Replay</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every simulation records virtual timestamped events and seeded RNG states.
              Scrub backwards and forward through any run to analyze split votes and edge cases.
            </p>
          </div>

          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-indigo-500/50 transition-colors">
            <CheckCircle2 className="w-7 h-7 text-indigo-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Linearizability Checker</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              RaftLab 2.0 Feature 1: Analyzes the client KV operation history to verify sequential
              consistency and catch stale read bugs during leader transitions.
            </p>
          </div>

          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-emerald-500/50 transition-colors">
            <Terminal className="w-7 h-7 text-emerald-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Failure Explainer</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Converts complex multi-thousand event traces into evidence-grounded diagnosis cards:
              conflicting terms, node logs, and actionable next debugging steps.
            </p>
          </div>

          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-amber-500/50 transition-colors">
            <Split className="w-7 h-7 text-amber-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Visual Partition Builder</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Visually segment nodes into Group A and Group B. See immediate quorum majority
              satisfaction and observe how Raft preserves safety over availability.
            </p>
          </div>

          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-rose-500/50 transition-colors">
            <Activity className="w-7 h-7 text-rose-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Trace Minimizer</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Delta-debugging minimization: reduces 10,000-event failures down to the minimal 20-event
              counterexample that triggers the exact same safety violation.
            </p>
          </div>

          <div className="bg-[#0D1424] p-6 rounded-2xl border border-[#1F2D4A] hover:border-purple-500/50 transition-colors">
            <Layers className="w-7 h-7 text-purple-400 mb-4" />
            <h4 className="text-lg font-bold text-white mb-2">Variable Cluster Sizes</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Scale dynamically between 3, 5, 7, and 9 node clusters. Test odd-numbered quorum
              calculations and fault boundaries across larger topologies.
            </p>
          </div>
        </div>
      </section>

      {/* Engineering Credibility & Invariants Table */}
      <section className="py-16 bg-[#090E1A] border-t border-[#1F2D4A] px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white">Supported Safety & Liveness Invariants</h3>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Continuously verified against the Ongaro & Ousterhout Raft specification.
            </p>
          </div>

          <div className="bg-[#0D1424] rounded-xl border border-[#1F2D4A] overflow-hidden text-xs font-mono">
            <table className="w-full text-left divide-y divide-[#1F2D4A]">
              <thead className="bg-[#070B14] text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Invariant Name</th>
                  <th className="p-3">Guaranteed Safety Property</th>
                  <th className="p-3">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2D4A] text-slate-300">
                <tr>
                  <td className="p-3 text-cyan-400 font-bold">INV01</td>
                  <td className="p-3 font-semibold text-white">Election Safety</td>
                  <td className="p-3 text-slate-400">At most one leader may be elected in any given term.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Safety</span></td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-400 font-bold">INV02</td>
                  <td className="p-3 font-semibold text-white">Term Monotonicity</td>
                  <td className="p-3 text-slate-400">A node's current term must never decrease over virtual time.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Safety</span></td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-400 font-bold">INV03</td>
                  <td className="p-3 font-semibold text-white">Commit Monotonicity</td>
                  <td className="p-3 text-slate-400">Commit index must never move backward on any node.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Safety</span></td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-400 font-bold">INV04</td>
                  <td className="p-3 font-semibold text-white">State Machine Safety</td>
                  <td className="p-3 text-slate-400">Two nodes must not apply different commands at the same index.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Safety</span></td>
                </tr>
                <tr>
                  <td className="p-3 text-cyan-400 font-bold">INV06</td>
                  <td className="p-3 font-semibold text-white">Log Matching</td>
                  <td className="p-3 text-slate-400">Same index and term implies identical preceding entries.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">Safety</span></td>
                </tr>
                <tr>
                  <td className="p-3 text-indigo-400 font-bold">INV_LIN</td>
                  <td className="p-3 font-semibold text-white">Linearizability (RaftLab 2.0)</td>
                  <td className="p-3 text-slate-400">Observed client KV operations admit a valid sequential history.</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400">Linearizable</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-[#070B14] border-t border-[#1F2D4A] px-4 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-white font-bold">RaftLab</span> — Deterministic Distributed Systems Testing Platform
          </div>
          <div className="flex gap-6">
            <NavLink to="/docs" className="hover:text-cyan-400">Documentation</NavLink>
            <NavLink to="/scenarios" className="hover:text-cyan-400">Scenarios</NavLink>
            <NavLink to="/studio" className="hover:text-cyan-400">Simulation Studio</NavLink>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-cyan-400 flex items-center gap-1">
              GitHub <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
