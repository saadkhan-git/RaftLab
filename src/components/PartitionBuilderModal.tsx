import React, { useState } from 'react';
import { RaftNodeState } from '../types/raft';
import { Network, X, Check, ShieldAlert, Split } from 'lucide-react';

interface PartitionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: RaftNodeState[];
  onApplyPartition: (groups: { [group: string]: number[] }) => void;
  onHealPartition: () => void;
  isPartitioned: boolean;
}

export default function PartitionBuilderModal({
  isOpen,
  onClose,
  nodes,
  onApplyPartition,
  onHealPartition,
  isPartitioned,
}: PartitionBuilderModalProps) {
  if (!isOpen) return null;

  // Track which group each node belongs to ('A' or 'B')
  const [nodeGroups, setNodeGroups] = useState<{ [nodeId: number]: 'A' | 'B' }>(() => {
    const init: { [id: number]: 'A' | 'B' } = {};
    nodes.forEach((n, idx) => {
      // Default: split minority / majority for 5 nodes [1, 2] vs [3, 4, 5]
      init[n.id] = idx < Math.floor(nodes.length / 2) ? 'A' : 'B';
    });
    return init;
  });

  const toggleGroup = (nodeId: number) => {
    setNodeGroups(prev => ({
      ...prev,
      [nodeId]: prev[nodeId] === 'A' ? 'B' : 'A',
    }));
  };

  const groupA = nodes.filter(n => nodeGroups[n.id] === 'A').map(n => n.id);
  const groupB = nodes.filter(n => nodeGroups[n.id] === 'B').map(n => n.id);

  const majorityReq = Math.floor(nodes.length / 2) + 1;
  const groupAHasQuorum = groupA.length >= majorityReq;
  const groupBHasQuorum = groupB.length >= majorityReq;

  const handleApply = () => {
    onApplyPartition({
      A: groupA,
      B: groupB,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-xl max-w-xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-400">
            <Split className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Interactive Partition Builder</h3>
            <p className="text-xs text-slate-400">
              RaftLab 2.0 Feature 4 — Visually assign nodes to split groups to test quorum survival.
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div className="mb-6 bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A] text-xs font-mono space-y-1 text-slate-300">
          <div className="flex justify-between">
            <span>Cluster Size: <strong className="text-white">{nodes.length} nodes</strong></span>
            <span>Required Quorum Majority: <strong className="text-cyan-400">{majorityReq} votes</strong></span>
          </div>
          <p className="text-slate-400 text-[11px]">
            Click nodes below to toggle them between <strong>Group A</strong> and <strong>Group B</strong>.
          </p>
        </div>

        {/* Two partition buckets */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Group A */}
          <div className="bg-[#090E1A] p-4 rounded-xl border border-indigo-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-indigo-400 text-sm">Group A</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  groupAHasQuorum
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {groupA.length} nodes {groupAHasQuorum ? '(Quorum ✓)' : '(No Quorum ✗)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-[#050810] rounded-lg border border-slate-800">
              {groupA.map(id => (
                <button
                  key={id}
                  onClick={() => toggleGroup(id)}
                  className="px-3 py-1.5 rounded-md bg-indigo-950 border border-indigo-700/60 text-white font-mono text-xs font-semibold hover:border-cyan-400 transition-colors"
                >
                  Node {id}
                </button>
              ))}
              {groupA.length === 0 && (
                <span className="text-xs text-slate-500 italic m-auto">Empty</span>
              )}
            </div>
          </div>

          {/* Group B */}
          <div className="bg-[#090E1A] p-4 rounded-xl border border-cyan-900/40">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-cyan-400 text-sm">Group B</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  groupBHasQuorum
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {groupB.length} nodes {groupBHasQuorum ? '(Quorum ✓)' : '(No Quorum ✗)'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-[#050810] rounded-lg border border-slate-800">
              {groupB.map(id => (
                <button
                  key={id}
                  onClick={() => toggleGroup(id)}
                  className="px-3 py-1.5 rounded-md bg-cyan-950 border border-cyan-700/60 text-white font-mono text-xs font-semibold hover:border-indigo-400 transition-colors"
                >
                  Node {id}
                </button>
              ))}
              {groupB.length === 0 && (
                <span className="text-xs text-slate-500 italic m-auto">Empty</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1F2D4A]">
          {isPartitioned ? (
            <button
              onClick={() => {
                onHealPartition();
                onClose();
              }}
              className="px-4 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" /> Heal Network (Rejoin All)
            </button>
          ) : (
            <div className="text-xs text-slate-400">Network currently connected</div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
            >
              <ShieldAlert className="w-4 h-4" /> Apply Partition Fault
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
