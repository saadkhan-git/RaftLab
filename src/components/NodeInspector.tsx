import React, { useState } from 'react';
import { RaftNodeState } from '../types/raft';
import { Cpu, Database, FileText, Activity, ShieldCheck, Crown } from 'lucide-react';

interface NodeInspectorProps {
  node: RaftNodeState | null;
  onCrash?: () => void;
  onRestart?: () => void;
}

export default function NodeInspector({ node, onCrash, onRestart }: NodeInspectorProps) {
  const [tab, setTab] = useState<'overview' | 'log' | 'state' | 'events'>('overview');

  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <Cpu className="w-10 h-10 mb-2 opacity-30 text-cyan-400" />
        <p className="text-sm font-medium">Select a node on canvas</p>
        <p className="text-xs text-slate-600 mt-1">
          Click any node to inspect volatile state, persistent logs, and key-value entries.
        </p>
      </div>
    );
  }

  const isLeader = node.role === 'LEADER';
  const isCrashed = node.role === 'CRASHED';

  return (
    <div className="flex flex-col h-full bg-[#0D1424] border border-[#1F2D4A] rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div className="p-3.5 bg-[#090E1A] border-b border-[#1F2D4A] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
              isLeader
                ? 'bg-amber-950 text-amber-300 border border-amber-600'
                : isCrashed
                ? 'bg-rose-950 text-rose-300 border border-rose-700'
                : 'bg-cyan-950 text-cyan-300 border border-cyan-700'
            }`}
          >
            N{node.id}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-sm">Node {node.id}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  isLeader
                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                    : isCrashed
                    ? 'bg-rose-950 text-rose-400 border border-rose-800'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {node.role}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Node Controls */}
        <div>
          {isCrashed ? (
            <button
              onClick={onRestart}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 hover:bg-emerald-900 transition-colors"
            >
              Restart
            </button>
          ) : (
            <button
              onClick={onCrash}
              className="text-[11px] font-semibold px-2 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors"
            >
              Crash
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1F2D4A] bg-[#070B14] text-xs font-mono">
        <button
          onClick={() => setTab('overview')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            tab === 'overview'
              ? 'border-cyan-400 text-cyan-400 font-semibold bg-[#0D1424]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setTab('log')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            tab === 'log'
              ? 'border-cyan-400 text-cyan-400 font-semibold bg-[#0D1424]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Log ({node.log.length})
        </button>
        <button
          onClick={() => setTab('state')}
          className={`flex-1 py-2 text-center border-b-2 transition-colors ${
            tab === 'state'
              ? 'border-cyan-400 text-cyan-400 font-semibold bg-[#0D1424]'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          KV State
        </button>
      </div>

      {/* Content */}
      <div className="p-3.5 flex-1 overflow-y-auto text-xs font-mono space-y-3">
        {tab === 'overview' && (
          <div className="space-y-3">
            {/* Raft Core State */}
            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A] space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Persistent State (§5.2)
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Term:</span>
                <span className="text-cyan-400 font-bold">{node.currentTerm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Voted For:</span>
                <span className="text-white">{node.votedFor ? `Node ${node.votedFor}` : 'None'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Log Size:</span>
                <span className="text-white">{node.log.length} entries</span>
              </div>
            </div>

            <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A] space-y-2">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Volatile State
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commit Index:</span>
                <span className="text-emerald-400 font-bold">{node.commitIndex}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Applied:</span>
                <span className="text-white">{node.lastApplied}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Leader:</span>
                <span className="text-amber-400 font-semibold">
                  {node.leaderId ? `Node ${node.leaderId}` : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Election Timeout:</span>
                <span className="text-slate-300">{node.electionTimeout} ms</span>
              </div>
            </div>
          </div>
        )}

        {tab === 'log' && (
          <div className="space-y-2">
            {node.log.length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic">Log is currently empty</div>
            ) : (
              node.log.map((entry, idx) => {
                const isCommitted = entry.index <= node.commitIndex;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded border ${
                      isCommitted
                        ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 text-[10px]">
                      <span className="font-bold">
                        Idx #{entry.index} | Term {entry.term}
                      </span>
                      <span
                        className={`px-1 rounded text-[9px] ${
                          isCommitted ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isCommitted ? 'COMMITTED' : 'UNCOMMITTED'}
                      </span>
                    </div>
                    <div className="text-white font-mono">{entry.command}</div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'state' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Replicated Key-Value Store
            </div>
            {Object.keys(node.stateMachine).length === 0 ? (
              <div className="text-center py-6 text-slate-500 italic">No keys stored yet</div>
            ) : (
              <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A] space-y-1.5">
                {Object.entries(node.stateMachine).map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-0.5 border-b border-slate-800/50">
                    <span className="text-cyan-400 font-semibold">{k}</span>
                    <span className="text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {JSON.stringify(v)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
