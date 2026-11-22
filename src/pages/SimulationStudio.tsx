import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Split,
  Power,
  Database,
  Sliders,
  CheckCircle2,
  Clock,
  Zap,
  Save,
  Download,
  ShieldAlert,
} from 'lucide-react';
import { RaftSimulator } from '../engine/raftSimulator';
import { SimulationConfig, SimulationRunRecord } from '../types/raft';
import ClusterCanvas from '../components/ClusterCanvas';
import NodeInspector from '../components/NodeInspector';
import EventStream from '../components/EventStream';
import PartitionBuilderModal from '../components/PartitionBuilderModal';
import RunVerdictModal from '../components/RunVerdictModal';
import { raftLabApi } from '../api/raftLabApi';

export default function SimulationStudio() {
  const [config, setConfig] = useState<SimulationConfig>({
    clusterSize: 5,
    seed: 71292,
    heartbeatInterval: 120,
    electionTimeoutMin: 250,
    electionTimeoutMax: 500,
    networkLatency: 25,
    networkJitter: 15,
    dropRate: 0,
    duplicateRate: 0,
    reorderRate: 0,
    faultProfile: 'healthy',
  });

  const [simulator, setSimulator] = useState(() => new RaftSimulator(config));
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2, 5, 10
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(1);
  const [activeConfigTab, setActiveConfigTab] = useState<'cluster' | 'workload' | 'network' | 'faults'>('cluster');

  // Modals
  const [isPartitionModalOpen, setIsPartitionModalOpen] = useState(false);
  const [isVerdictModalOpen, setIsVerdictModalOpen] = useState(false);
  const [completedRun, setCompletedRun] = useState<SimulationRunRecord | null>(null);
  const [runSaveStatus, setRunSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [runSaveError, setRunSaveError] = useState<string | null>(null);

  // Workload form state
  const [workloadOp, setWorkloadOp] = useState<'PUT' | 'GET' | 'DELETE'>('PUT');
  const [workloadKey, setWorkloadKey] = useState('user:101');
  const [workloadVal, setWorkloadVal] = useState('Saad');

  // Force re-render state
  const [, setTick] = useState(0);

  const saveRun = async (record: SimulationRunRecord) => {
    setRunSaveStatus('saving');
    setRunSaveError(null);
    try {
      await raftLabApi.createRun(record);
      setRunSaveStatus('saved');
    } catch (cause) {
      setRunSaveStatus('error');
      setRunSaveError(cause instanceof Error ? cause.message : 'The run could not be saved.');
    }
  };

  const showVerdict = (record: SimulationRunRecord) => {
    setCompletedRun(record);
    setIsVerdictModalOpen(true);
    void saveRun(record);
  };

  // Run loop
  useEffect(() => {
    if (!isRunning) return;
    const intervalMs = Math.max(10, Math.round(100 / speed));
    const stepMs = Math.round(20 * (speed > 5 ? 2.5 : 1));

    const timer = setInterval(() => {
      simulator.step(stepMs);
      setTick(t => t + 1);

      // Check if simulation reached run limit (e.g. 5,000 ms)
      if (simulator.virtualTime >= 8000) {
        setIsRunning(false);
        const record = simulator.exportRunRecord('Completed Simulation Run');
        showVerdict(record);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, speed, simulator]);

  const handleStartPause = () => {
    setIsRunning(prev => !prev);
  };

  const handleStepOnce = () => {
    simulator.step(25);
    setTick(t => t + 1);
  };

  const handleReset = () => {
    setIsRunning(false);
    const newSim = new RaftSimulator(config);
    setSimulator(newSim);
    setSelectedNodeId(1);
    setTick(t => t + 1);
  };

  const handleClusterSizeChange = (newSize: number) => {
    const updated = { ...config, clusterSize: newSize };
    setConfig(updated);
    setIsRunning(false);
    setSimulator(new RaftSimulator(updated));
    setSelectedNodeId(1);
    setTick(t => t + 1);
  };

  const handleWorkloadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    simulator.submitClientCommand(workloadOp, workloadKey, workloadVal);
    setTick(t => t + 1);
  };

  const handleExportVerdict = () => {
    const record = simulator.exportRunRecord('Studio Manual Run');
    showVerdict(record);
  };

  const selectedNode = simulator.nodes.find(n => n.id === selectedNodeId) || null;
  const isPartitioned = Object.keys(simulator.partitions).length > 0;

  return (
    <div className="min-h-screen bg-[#070B14] p-3 lg:p-6 flex flex-col gap-4 max-w-[1700px] mx-auto">
      {/* Top Workspace Controls Header */}
      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        {/* Left: Simulation execution controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartPause}
            className={`px-4 py-2 rounded-lg font-bold text-xs font-mono flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isRunning ? 'PAUSE' : 'RUN SIMULATION'}
          </button>

          <button
            onClick={handleStepOnce}
            className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors"
            title="Step Virtual Clock 25ms"
          >
            <SkipForward className="w-4 h-4 text-cyan-400" /> STEP
          </button>

          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed selector */}
          <div className="hidden sm:flex items-center gap-1 bg-[#070B14] p-1 rounded-lg border border-[#1F2D4A] text-xs font-mono">
            {[0.5, 1, 2, 5, 10].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded font-semibold ${
                  speed === s ? 'bg-cyan-950 text-cyan-400 border border-cyan-800' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Center: Live Virtual Telemetry */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-[#070B14] px-3 py-1.5 rounded-lg border border-[#1F2D4A]">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400">Virtual Time:</span>
            <span className="font-bold text-white text-sm">{simulator.virtualTime} ms</span>
          </div>

          <div className="hidden md:flex items-center gap-2 bg-[#070B14] px-3 py-1.5 rounded-lg border border-[#1F2D4A]">
            <span className="text-slate-400">Seed:</span>
            <span className="text-indigo-300 font-bold">{config.seed}</span>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-[#070B14] px-3 py-1.5 rounded-lg border border-[#1F2D4A]">
            <span className="text-slate-400">Events:</span>
            <span className="text-emerald-400 font-bold">{simulator.events.length}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPartitionModalOpen(true)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors border ${
              isPartitioned
                ? 'bg-rose-950 text-rose-300 border-rose-700 animate-pulse'
                : 'bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border-indigo-800'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            {isPartitioned ? 'Partition Active' : 'Partition Builder'}
          </button>

          <button
            onClick={handleExportVerdict}
            className="px-3.5 py-2 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            Verdicts & Invariants
          </button>
        </div>
      </div>

      {/* Main 3-Panel Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Panel: Configuration Tabs (3 cols) */}
        <div className="lg:col-span-3 bg-[#0D1424] border border-[#1F2D4A] rounded-xl flex flex-col overflow-hidden shadow-lg">
          {/* Config Tabs Header */}
          <div className="flex border-b border-[#1F2D4A] bg-[#090E1A] text-xs font-mono">
            {(['cluster', 'workload', 'network', 'faults'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveConfigTab(tab)}
                className={`flex-1 py-2.5 text-center uppercase text-[11px] font-bold border-b-2 transition-colors ${
                  activeConfigTab === tab
                    ? 'border-cyan-400 text-cyan-400 bg-[#0D1424]'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4 flex-1 overflow-y-auto text-xs font-mono space-y-4">
            {activeConfigTab === 'cluster' && (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Cluster Size (Feature 3)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-2">
                    Supports 3, 5, 7, and 9 nodes to test variable quorum scaling.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 5, 7, 9].map(sz => (
                      <button
                        key={sz}
                        onClick={() => handleClusterSizeChange(sz)}
                        className={`py-2 rounded font-bold border ${
                          config.clusterSize === sz
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                            : 'bg-[#070B14] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {sz} Nodes
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Deterministic Seed</label>
                  <input
                    type="number"
                    value={config.seed}
                    onChange={e => {
                      const seed = parseInt(e.target.value) || 0;
                      setConfig(prev => ({ ...prev, seed }));
                    }}
                    className="w-full p-2 bg-[#070B14] border border-[#1F2D4A] rounded text-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Same seed reproduces identical execution order and timing.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Heartbeat Interval:</span>
                    <span className="text-white font-bold">{config.heartbeatInterval} ms</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={config.heartbeatInterval}
                    onChange={e => setConfig(prev => ({ ...prev, heartbeatInterval: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Election Timeout:</span>
                    <span className="text-white font-bold">{config.electionTimeoutMin} ms</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="600"
                    step="25"
                    value={config.electionTimeoutMin}
                    onChange={e => setConfig(prev => ({ ...prev, electionTimeoutMin: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>
              </div>
            )}

            {activeConfigTab === 'workload' && (
              <form onSubmit={handleWorkloadSubmit} className="space-y-4">
                <div className="text-slate-300 font-bold">Client KV Workload Generator (§11)</div>
                <div>
                  <label className="text-slate-400 block mb-1">Operation Verb</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['PUT', 'GET', 'DELETE'] as const).map(op => (
                      <button
                        type="button"
                        key={op}
                        onClick={() => setWorkloadOp(op)}
                        className={`py-1.5 rounded font-bold border ${
                          workloadOp === op
                            ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                            : 'bg-[#070B14] border-slate-800 text-slate-400'
                        }`}
                      >
                        {op}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Key</label>
                  <input
                    type="text"
                    value={workloadKey}
                    onChange={e => setWorkloadKey(e.target.value)}
                    className="w-full p-2 bg-[#070B14] border border-[#1F2D4A] rounded text-white"
                  />
                </div>

                {workloadOp === 'PUT' && (
                  <div>
                    <label className="text-slate-400 block mb-1">Value</label>
                    <input
                      type="text"
                      value={workloadVal}
                      onChange={e => setWorkloadVal(e.target.value)}
                      className="w-full p-2 bg-[#070B14] border border-[#1F2D4A] rounded text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Database className="w-4 h-4" /> Submit Client Request
                </button>
              </form>
            )}

            {activeConfigTab === 'network' && (
              <div className="space-y-4">
                <div className="text-slate-300 font-bold">Virtual Transport Parameters (§8)</div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Base Latency:</span>
                    <span className="text-white">{config.networkLatency} ms</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    value={config.networkLatency}
                    onChange={e => setConfig(prev => ({ ...prev, networkLatency: parseInt(e.target.value) }))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Packet Drop Rate:</span>
                    <span className="text-amber-400 font-bold">{(config.dropRate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={config.dropRate}
                    onChange={e => {
                      const dropRate = parseFloat(e.target.value);
                      setConfig(prev => ({ ...prev, dropRate }));
                      simulator.config.dropRate = dropRate;
                    }}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Duplicate Rate:</span>
                    <span className="text-indigo-400 font-bold">{(config.duplicateRate * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.3"
                    step="0.05"
                    value={config.duplicateRate}
                    onChange={e => {
                      const duplicateRate = parseFloat(e.target.value);
                      setConfig(prev => ({ ...prev, duplicateRate }));
                      simulator.config.duplicateRate = duplicateRate;
                    }}
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeConfigTab === 'faults' && (
              <div className="space-y-3">
                <div className="text-slate-300 font-bold">Manual Fault Injection (§9)</div>

                <button
                  onClick={() => setIsPartitionModalOpen(true)}
                  className="w-full p-2.5 rounded-lg bg-[#070B14] hover:bg-slate-800 border border-[#1F2D4A] text-slate-200 text-left flex items-center gap-2.5 transition-colors"
                >
                  <Split className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-bold text-white">Network Partition</div>
                    <div className="text-[10px] text-slate-400">Split nodes into isolated groups</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    const leader = simulator.nodes.find(n => n.role === 'LEADER');
                    if (leader) {
                      simulator.crashNode(leader.id);
                      setTick(t => t + 1);
                    }
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#070B14] hover:bg-slate-800 border border-[#1F2D4A] text-slate-200 text-left flex items-center gap-2.5 transition-colors"
                >
                  <Power className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-bold text-white">Crash Active Leader</div>
                    <div className="text-[10px] text-slate-400">Trigger immediate failover election</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Randomly crash one follower
                    const followers = simulator.nodes.filter(n => n.role === 'FOLLOWER');
                    if (followers.length > 0) {
                      simulator.crashNode(followers[0].id);
                      setTick(t => t + 1);
                    }
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#070B14] hover:bg-slate-800 border border-[#1F2D4A] text-slate-200 text-left flex items-center gap-2.5 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-bold text-white">Crash Random Follower</div>
                    <div className="text-[10px] text-slate-400">Test minority node resilience</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    // Restart all crashed nodes
                    for (const n of simulator.nodes) {
                      if (n.role === 'CRASHED') simulator.restartNode(n.id);
                    }
                    setTick(t => t + 1);
                  }}
                  className="w-full p-2.5 rounded-lg bg-[#070B14] hover:bg-slate-800 border border-[#1F2D4A] text-slate-200 text-left flex items-center gap-2.5 transition-colors"
                >
                  <Power className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white">Restart All Crashed Nodes</div>
                    <div className="text-[10px] text-slate-400">Rejoin cluster with persistent logs</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center Panel: Cluster Canvas (6 cols) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <ClusterCanvas
            nodes={simulator.nodes}
            packets={simulator.packets}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onCrashNode={id => {
              simulator.crashNode(id);
              setTick(t => t + 1);
            }}
            onRestartNode={id => {
              simulator.restartNode(id);
              setTick(t => t + 1);
            }}
            partitions={simulator.partitions}
          />
        </div>

        {/* Right Panel: Node & State Inspector (3 cols) */}
        <div className="lg:col-span-3">
          <NodeInspector
            node={selectedNode}
            onCrash={() => {
              if (selectedNode) {
                simulator.crashNode(selectedNode.id);
                setTick(t => t + 1);
              }
            }}
            onRestart={() => {
              if (selectedNode) {
                simulator.restartNode(selectedNode.id);
                setTick(t => t + 1);
              }
            }}
          />
        </div>
      </div>

      {/* Bottom Panel: Event Stream */}
      <div className="h-64">
        <EventStream events={simulator.events} />
      </div>

      {/* Modals */}
      <PartitionBuilderModal
        isOpen={isPartitionModalOpen}
        onClose={() => setIsPartitionModalOpen(false)}
        nodes={simulator.nodes}
        onApplyPartition={groups => {
          simulator.createPartition(groups);
          setTick(t => t + 1);
        }}
        onHealPartition={() => {
          simulator.healPartition();
          setTick(t => t + 1);
        }}
        isPartitioned={isPartitioned}
      />

      <RunVerdictModal
        isOpen={isVerdictModalOpen}
        onClose={() => setIsVerdictModalOpen(false)}
        run={completedRun}
        saveStatus={runSaveStatus}
        saveError={runSaveError}
        onRetrySave={() => completedRun && void saveRun(completedRun)}
      />
    </div>
  );
}
