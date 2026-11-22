import React, { useState, useMemo } from 'react';
import { SimulationEvent } from '../types/raft';
import { Search, Filter, Terminal, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EventStreamProps {
  events: SimulationEvent[];
  maxEvents?: number;
}

export default function EventStream({ events, maxEvents = 200 }: EventStreamProps) {
  const [filter, setFilter] = useState<'ALL' | 'ELECTIONS' | 'REPLICATION' | 'FAULTS' | 'INVARIANTS'>('ALL');
  const [search, setSearch] = useState('');

  const filteredEvents = useMemo(() => {
    return events
      .filter(evt => {
        // Category filter
        if (filter === 'ELECTIONS') {
          return ['START_ELECTION', 'VOTE_REQUEST', 'VOTE_GRANTED', 'VOTE_DENIED', 'BECOME_LEADER'].includes(evt.type);
        }
        if (filter === 'REPLICATION') {
          return ['APPEND_ENTRIES', 'LOG_REPLICATED', 'ENTRY_COMMITTED', 'STATE_APPLIED', 'CLIENT_WRITE', 'CLIENT_READ'].includes(evt.type);
        }
        if (filter === 'FAULTS') {
          return ['NODE_CRASH', 'NODE_RESTART', 'NETWORK_PARTITION', 'NETWORK_HEAL', 'MESSAGE_DROP', 'MESSAGE_DELAY'].includes(evt.type);
        }
        if (filter === 'INVARIANTS') {
          return evt.type === 'INVARIANT_VIOLATION';
        }
        return true;
      })
      .filter(evt => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
          evt.details.toLowerCase().includes(q) ||
          evt.type.toLowerCase().includes(q) ||
          (evt.nodeId && `node ${evt.nodeId}`.includes(q))
        );
      })
      .slice(-maxEvents)
      .reverse();
  }, [events, filter, search, maxEvents]);

  return (
    <div className="flex flex-col h-full bg-[#0D1424] border border-[#1F2D4A] rounded-xl overflow-hidden shadow-lg">
      {/* Control Bar */}
      <div className="p-3 bg-[#090E1A] border-b border-[#1F2D4A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-white">Event Stream</span>
          <span className="text-slate-400">({events.length} total events)</span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          {(['ALL', 'ELECTIONS', 'REPLICATION', 'FAULTS', 'INVARIANTS'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 rounded transition-colors ${
                filter === f
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/80 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Filter events..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1 bg-[#070B14] border border-[#1F2D4A] rounded text-xs text-slate-200 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-2 font-mono text-xs space-y-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-600 italic">No matching events in stream</div>
        ) : (
          filteredEvents.map(evt => {
            let badgeBg = 'bg-slate-800 text-slate-300';
            let borderStyle = 'border-transparent';

            if (evt.severity === 'error') {
              badgeBg = 'bg-rose-950 text-rose-300 border border-rose-800';
              borderStyle = 'border-l-2 border-rose-500';
            } else if (evt.severity === 'warn') {
              badgeBg = 'bg-amber-950 text-amber-300 border border-amber-800';
              borderStyle = 'border-l-2 border-amber-500';
            } else if (evt.severity === 'success') {
              badgeBg = 'bg-emerald-950 text-emerald-300 border border-emerald-800';
              borderStyle = 'border-l-2 border-emerald-500';
            } else if (evt.type.includes('LEADER')) {
              badgeBg = 'bg-cyan-950 text-cyan-300 border border-cyan-800';
              borderStyle = 'border-l-2 border-cyan-400';
            }

            return (
              <div
                key={evt.id}
                className={`flex items-start gap-2.5 py-1 px-2.5 rounded bg-[#070B14]/60 hover:bg-[#070B14] transition-colors ${borderStyle}`}
              >
                <span className="text-slate-500 text-[11px] shrink-0 font-bold w-16 text-right">
                  [{evt.virtualTime} ms]
                </span>

                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${badgeBg}`}>
                  {evt.type}
                </span>

                {evt.nodeId && (
                  <span className="text-cyan-400 font-semibold shrink-0">
                    N{evt.nodeId}
                    {evt.targetId ? ` -> N${evt.targetId}` : ''}:
                  </span>
                )}

                <span className="text-slate-200 break-words flex-1">{evt.details}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
