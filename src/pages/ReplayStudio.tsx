import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  History,
  Clock,
  Cpu,
  Layers,
  Crown,
  ShieldAlert,
} from 'lucide-react';
import { RaftSimulator } from '../engine/raftSimulator';
import { RaftNodeState, SimulationRunRecord } from '../types/raft';
import { raftLabApi } from '../api/raftLabApi';

export default function ReplayStudio() {
  const [searchParams] = useSearchParams();
  const runId = searchParams.get('runId');
  const [storedRun, setStoredRun] = useState<SimulationRunRecord | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) {
      setStoredRun(null);
      setLoadState('idle');
      setLoadError(null);
      return;
    }

    let active = true;
    setLoadState('loading');
    setLoadError(null);
    Promise.all([raftLabApi.getRun(runId), raftLabApi.listRunEvents(runId, 5)])
      .then(([run, eventPage]) => {
        if (!active) return;
        setStoredRun({ ...run, events: eventPage.items });
        setLoadState('idle');
      })
      .catch(cause => {
        if (!active) return;
        setLoadError(cause instanceof Error ? cause.message : 'Unable to load this saved run.');
        setLoadState('error');
      });

    return () => {
      active = false;
    };
  }, [runId]);

  // Pre-generate a 3,000ms recorded run with partitions & leader crash
  const [simulator] = useState(() => {
    const sim = new RaftSimulator({ clusterSize: 5, seed: 71292 });
    // Pre-run to generate rich recorded history
    while (sim.virtualTime < 3000) {
      if (sim.virtualTime === 600) {
        sim.submitClientCommand('PUT', 'account:1', '500');
      }
      if (sim.virtualTime === 1000) {
        sim.createPartition({ A: [1, 2], B: [3, 4, 5] });
      }
      if (sim.virtualTime === 1600) {
        sim.submitClientCommand('PUT', 'account:2', '1000');
      }
      if (sim.virtualTime === 2200) {
        sim.healPartition();
      }
      sim.step(25);
    }
    return sim;
  });

  const snapshots = storedRun?.snapshots ?? simulator.snapshots;
  const maxTime = storedRun?.virtualDuration ?? (snapshots.length > 0 ? snapshots[snapshots.length - 1].time : 3000);

  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedNodeId, setSelectedNodeId] = useState(1);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [runId]);

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentTime(prev => {
        const next = prev + 50 * playbackSpeed;
        if (next >= maxTime) {
          setIsPlaying(false);
          return maxTime;
        }
        return next;
      });
    }, 50);
    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, maxTime]);

  // Find snapshot closest to currentTime
  const currentSnapshot = snapshots.reduce((prev, curr) => {
    return Math.abs(curr.time - currentTime) < Math.abs(prev.time - currentTime) ? curr : prev;
  }, snapshots[0]);

  const activeNodes: RaftNodeState[] = currentSnapshot ? currentSnapshot.nodes : simulator.nodes;
  const selectedNode = activeNodes.find(n => n.id === selectedNodeId) || activeNodes[0];

  // Notable timeline milestones
  const demoMilestones = [
    { time: 0, label: 'Start' },
    { time: 600, label: 'Client PUT' },
    { time: 1000, label: 'Partition [1,2] vs [3,4,5]' },
    { time: 1600, label: 'Write in Majority' },
    { time: 2200, label: 'Partition Healed' },
  ];
  const milestones = storedRun
    ? [
        { time: 0, label: 'Start' },
        ...storedRun.events.slice(0, 4).map(event => ({
          time: event.virtualTime,
          label: event.type.replace(/_/g, ' '),
        })),
      ]
    : demoMilestones;

  if (loadState === 'loading') {
    return <div className="min-h-screen bg-[#070B14] p-8 text-sm font-mono text-cyan-300">Loading saved run...</div>;
  }

  if (loadState === 'error') {
    return (
      <div className="min-h-screen bg-[#070B14] p-8">
        <div role="alert" className="mx-auto max-w-2xl rounded-xl border border-rose-900 bg-rose-950/30 p-5 text-sm text-rose-200">
          Could not load saved run: {loadError}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Replay Studio
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Section 22 Spec — Deterministically step through past executions and inspect point-in-time state.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-[#0D1424] border border-[#1F2D4A] text-slate-300">
            Recorded Seed: <strong className="text-indigo-400">{storedRun?.seed ?? 71292}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-[#0D1424] border border-[#1F2D4A] text-slate-300">
            Total Duration: <strong className="text-cyan-400">{maxTime} ms</strong>
          </span>
        </div>
      </div>

      {/* Scrubber Bar & Playback Controls */}
      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between text-xs font-mono text-slate-300">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Replay Timestamp: <strong className="text-white text-sm">{Math.round(currentTime)} ms</strong>
          </span>
          <span className="text-slate-500">Total Run: {maxTime} ms</span>
        </div>

        {/* Range Slider */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max={maxTime}
            value={currentTime}
            onChange={e => {
              setIsPlaying(false);
              setCurrentTime(parseInt(e.target.value));
            }}
            className="w-full accent-indigo-500 h-2 bg-[#070B14] rounded-lg cursor-pointer"
          />

          {/* Milestone markers on scrubber */}
          <div className="flex justify-between mt-2">
            {milestones.map(m => (
              <button
                key={`${m.time}-${m.label}`}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentTime(m.time);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  Math.abs(currentTime - m.time) < 150
                    ? 'bg-indigo-950 text-indigo-300 border-indigo-700 font-bold'
                    : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
                }`}
              >
                {m.time}ms ({m.label})
              </button>
            ))}
          </div>
        </div>

        {/* Media Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#1F2D4A]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentTime(0)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Jump to Start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentTime(prev => Math.max(0, prev - 100))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Step Back 100ms"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(p => !p)}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              {isPlaying ? 'PAUSE' : 'PLAY REPLAY'}
            </button>
            <button
              onClick={() => setCurrentTime(prev => Math.min(maxTime, prev + 100))}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              title="Step Forward 100ms"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-slate-400 mr-2">Speed:</span>
            {[0.5, 1, 2, 5].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2 py-1 rounded ${
                  playbackSpeed === s
                    ? 'bg-indigo-950 text-indigo-400 border border-indigo-700 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side-by-Side Node State at Selected Timestamp */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Node cards snapshot (8 cols) */}
        <div className="lg:col-span-8 bg-[#0D1424] rounded-2xl border border-[#1F2D4A] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2D4A]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Cluster State at {Math.round(currentTime)} ms
            </h2>
            <span className="text-xs font-mono text-slate-400">
              Active Leaders: {activeNodes.filter(n => n.role === 'LEADER').map(n => `N${n.id}`).join(', ') || 'None'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {activeNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isLeader = node.role === 'LEADER';
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer font-mono text-xs transition-all ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/40'
                      : 'border-[#1F2D4A] bg-[#070B14] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">Node {node.id}</span>
                    {isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        isLeader
                          ? 'bg-amber-950 text-amber-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {node.role}
                    </span>
                  </div>

                  <div className="space-y-1 text-slate-400 text-[11px]">
                    <div className="flex justify-between">
                      <span>Term:</span>
                      <span className="text-white font-bold">{node.currentTerm}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Commit Index:</span>
                      <span className="text-cyan-400 font-bold">{node.commitIndex}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Log Size:</span>
                      <span>{node.log.length} entries</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Node Details & Log at that timestamp (4 cols) */}
        <div className="lg:col-span-4 bg-[#0D1424] rounded-2xl border border-[#1F2D4A] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1F2D4A]">
            <h2 className="text-sm font-bold text-white">
              Node {selectedNode.id} Snapshot
            </h2>
            <span className="text-xs font-mono text-indigo-400 font-bold">{selectedNode.role}</span>
          </div>

          <div className="font-mono text-xs space-y-3">
            <div className="bg-[#070B14] p-3 rounded-xl border border-[#1F2D4A] space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Term:</span>
                <span className="text-white font-bold">{selectedNode.currentTerm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voted For:</span>
                <span>{selectedNode.votedFor ? `Node ${selectedNode.votedFor}` : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Leader ID:</span>
                <span className="text-amber-400 font-bold">{selectedNode.leaderId || 'None'}</span>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Replicated Log Entries ({selectedNode.log.length})
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {selectedNode.log.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-4">No log entries</div>
                ) : (
                  selectedNode.log.map((entry, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-[#070B14] border border-[#1F2D4A] flex justify-between items-center text-[11px]"
                    >
                      <span className="text-cyan-400 font-bold">#{entry.index} (T{entry.term})</span>
                      <span className="text-white">{entry.command}</span>
                      <span
                        className={`text-[9px] px-1 rounded ${
                          entry.index <= selectedNode.commitIndex ? 'text-emerald-400 bg-emerald-950' : 'text-slate-500'
                        }`}
                      >
                        {entry.index <= selectedNode.commitIndex ? 'COMMITTED' : 'PENDING'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
