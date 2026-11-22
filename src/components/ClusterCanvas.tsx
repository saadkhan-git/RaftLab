import React from 'react';
import { RaftNodeState, MessagePacket } from '../types/raft';
import { Crown, Power, ShieldAlert, Cpu } from 'lucide-react';

interface ClusterCanvasProps {
  nodes: RaftNodeState[];
  packets: MessagePacket[];
  selectedNodeId: number | null;
  onSelectNode: (nodeId: number) => void;
  onCrashNode?: (nodeId: number) => void;
  onRestartNode?: (nodeId: number) => void;
  partitions: { [groupId: string]: number[] };
}

export default function ClusterCanvas({
  nodes,
  packets,
  selectedNodeId,
  onSelectNode,
  onCrashNode,
  onRestartNode,
  partitions,
}: ClusterCanvasProps) {
  const width = 640;
  const height = 440;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.36;

  // Calculate node positions in a circle
  const nodePositions = nodes.map((node, index) => {
    const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
    return {
      id: node.id,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  const getNodePos = (id: number) => {
    return nodePositions.find(p => p.id === id) || { x: centerX, y: centerY };
  };

  const hasPartitions = Object.keys(partitions).length > 0;
  const leaderNode = nodes.find(n => n.role === 'LEADER');
  const aliveNodes = nodes.filter(n => n.role !== 'CRASHED').length;
  const majority = Math.floor(nodes.length / 2) + 1;
  const hasQuorum = aliveNodes >= majority;

  return (
    <div className="relative w-full h-[460px] bg-[#0A0F1D] rounded-xl border border-[#1F2D4A] overflow-hidden select-none shadow-inner">
      {/* Topology Status Overlay */}
      <div className="absolute top-3 left-4 z-10 flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="px-2.5 py-1 rounded bg-[#0D1527] border border-[#1F2D4A] text-slate-300">
          Cluster Size: <strong className="text-white">{nodes.length}</strong>
        </span>
        <span
          className={`px-2.5 py-1 rounded border flex items-center gap-1.5 ${
            hasQuorum
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${hasQuorum ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
          Quorum: {aliveNodes}/{nodes.length} (Req: {majority})
        </span>
        {leaderNode && (
          <span className="px-2.5 py-1 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Leader: Node {leaderNode.id} (Term {leaderNode.currentTerm})
          </span>
        )}
        {hasPartitions && (
          <span className="px-2.5 py-1 rounded bg-rose-950/80 text-rose-400 border border-rose-700/80 animate-pulse font-semibold">
            Network Partitioned
          </span>
        )}
      </div>

      {/* SVG Canvas for Links, Flight Packets, and Boundaries */}
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
          </radialGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <rect x="0" y="0" width={width} height={height} fill="url(#meshGradient)" />

        {/* Network links between nodes */}
        {nodePositions.map((posA, i) =>
          nodePositions.slice(i + 1).map(posB => {
            const nodeA = nodes.find(n => n.id === posA.id);
            const nodeB = nodes.find(n => n.id === posB.id);
            const isPartitionBroken =
              nodeA?.partitionGroup &&
              nodeB?.partitionGroup &&
              nodeA.partitionGroup !== nodeB.partitionGroup;

            const isCrashed = nodeA?.role === 'CRASHED' || nodeB?.role === 'CRASHED';

            return (
              <line
                key={`link-${posA.id}-${posB.id}`}
                x1={posA.x}
                y1={posA.y}
                x2={posB.x}
                y2={posB.y}
                stroke={isPartitionBroken ? '#EF4444' : isCrashed ? '#1E293B' : '#1E3A5F'}
                strokeWidth={isPartitionBroken ? 2 : 1.5}
                strokeDasharray={isPartitionBroken ? '6 4' : undefined}
                opacity={isCrashed ? 0.3 : 0.8}
              />
            );
          })
        )}

        {/* Partition Separation Boundary Visualizer */}
        {hasPartitions && (
          <line
            x1={centerX}
            y1={20}
            x2={centerX}
            y2={height - 20}
            stroke="#EF4444"
            strokeWidth="2.5"
            strokeDasharray="8 6"
            opacity="0.8"
          />
        )}

        {/* Message Packets in Flight */}
        {packets.map(packet => {
          const fromPos = getNodePos(packet.from);
          const toPos = getNodePos(packet.to);
          // Midpoint representation
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;

          const isHeartbeat = packet.type === 'APPEND_ENTRIES' && (!packet.payload.entries || packet.payload.entries.length === 0);
          const isVote = packet.type === 'REQUEST_VOTE';
          const color = isHeartbeat ? '#10B981' : isVote ? '#A855F7' : '#06B6D4';

          return (
            <g key={packet.id} filter="url(#glow)">
              <circle cx={midX} cy={midY} r="6" fill={color} className="animate-ping opacity-60" />
              <circle cx={midX} cy={midY} r="4.5" fill={color} />
              <text
                x={midX}
                y={midY - 8}
                fill={color}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
                className="font-bold tracking-tighter"
              >
                {packet.type === 'APPEND_ENTRIES' ? (isHeartbeat ? '♥ HB' : 'APPEND') : 'VOTE'}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive HTML Node Elements overlayed on canvas */}
      {nodes.map(node => {
        const pos = getNodePos(node.id);
        const isSelected = selectedNodeId === node.id;
        const isLeader = node.role === 'LEADER';
        const isCandidate = node.role === 'CANDIDATE';
        const isCrashed = node.role === 'CRASHED';

        let borderColor = 'border-slate-700 bg-slate-900/90 text-slate-200';
        let glowStyle = '';
        if (isLeader) {
          borderColor = 'border-amber-400 bg-amber-950/90 text-amber-100 ring-2 ring-amber-400/50';
          glowStyle = 'shadow-[0_0_20px_rgba(251,191,36,0.35)]';
        } else if (isCandidate) {
          borderColor = 'border-purple-400 bg-purple-950/90 text-purple-100 animate-pulse';
          glowStyle = 'shadow-[0_0_15px_rgba(168,85,247,0.35)]';
        } else if (isCrashed) {
          borderColor = 'border-rose-900/60 bg-rose-950/30 text-rose-400/60 opacity-60 line-through';
        } else if (isSelected) {
          borderColor = 'border-cyan-400 bg-cyan-950/90 text-cyan-100 ring-2 ring-cyan-400/50';
        }

        return (
          <div
            key={node.id}
            onClick={() => onSelectNode(node.id)}
            style={{
              position: 'absolute',
              left: `${pos.x}px`,
              top: `${pos.y}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className={`cursor-pointer rounded-xl p-2.5 w-32 border transition-all duration-300 z-20 ${borderColor} ${glowStyle} hover:scale-105 backdrop-blur-md`}
          >
            {/* Top Node Bar */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-xs font-bold flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                N{node.id}
              </span>

              {isLeader && <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />}
              {isCrashed && <ShieldAlert className="w-4 h-4 text-rose-500" />}

              {node.partitionGroup && (
                <span className="text-[9px] font-mono font-bold px-1 py-0.2 rounded bg-rose-900 text-rose-200">
                  Grp {node.partitionGroup}
                </span>
              )}
            </div>

            {/* Role & Term */}
            <div className="text-[11px] font-bold tracking-tight mb-1">
              {node.role}
            </div>

            {/* Raft Core Metrics */}
            <div className="text-[10px] font-mono space-y-0.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Term:</span>
                <span className="font-semibold text-white">{node.currentTerm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Log:</span>
                <span>{node.log.length} entries</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Commit:</span>
                <span className="text-cyan-400 font-bold">{node.commitIndex}</span>
              </div>
            </div>

            {/* Quick action buttons on node */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
              {isCrashed ? (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onRestartNode?.(node.id);
                  }}
                  className="w-full py-0.5 px-1.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 flex items-center justify-center gap-1 text-[10px]"
                >
                  <Power className="w-3 h-3" /> Restart
                </button>
              ) : (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onCrashNode?.(node.id);
                  }}
                  className="w-full py-0.5 px-1.5 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 flex items-center justify-center gap-1 text-[10px]"
                >
                  <Power className="w-3 h-3" /> Crash
                </button>
              )}
            </div>
          </div>
        );
      })}

      {/* Helper Legend */}
      <div className="absolute bottom-2 right-3 z-10 hidden sm:flex items-center gap-3 text-[11px] font-mono text-slate-400 bg-[#070B14]/80 px-2.5 py-1 rounded border border-[#1F2D4A]">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Leader
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span> Candidate
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span> Follower
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Crashed
        </div>
      </div>
    </div>
  );
}
