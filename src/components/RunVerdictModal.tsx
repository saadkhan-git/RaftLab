import React from 'react';
import { SimulationRunRecord } from '../types/raft';
import { CheckCircle2, AlertOctagon, Clock, ShieldCheck, Download, History, Sparkles, Database, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RunVerdictModalProps {
  run: SimulationRunRecord | null;
  isOpen: boolean;
  onClose: () => void;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
  saveError?: string | null;
  onRetrySave?: () => void;
}

export default function RunVerdictModal({ run, isOpen, onClose, saveStatus = 'idle', saveError, onRetrySave }: RunVerdictModalProps) {
  const navigate = useNavigate();
  if (!isOpen || !run) return null;

  const isPass = run.verdict === 'PASS';
  const isSafetyFail = run.verdict === 'SAFETY_FAIL';

  const downloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(run, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `raftlab-run-${run.id}.json`);
    dlAnchor.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Verdict Banner */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between mb-6 ${
            isPass
              ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-200'
              : isSafetyFail
              ? 'bg-rose-950/80 border-rose-600/80 text-rose-200'
              : 'bg-amber-950/70 border-amber-600/70 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {isPass ? (
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            ) : (
              <AlertOctagon className="w-8 h-8 text-rose-400" />
            )}
            <div>
              <div className="text-xs uppercase tracking-wider font-bold opacity-80">Simulation Verdict</div>
              <div className="text-2xl font-black font-mono tracking-tight">{run.verdict}</div>
            </div>
          </div>

          <div className="text-right text-xs font-mono space-y-0.5">
            <div>Seed: <strong className="text-white">{run.seed}</strong></div>
            <div>Virtual Time: <strong className="text-cyan-300">{run.virtualDuration} ms</strong></div>
            <div>Events: <strong className="text-white">{run.eventCount}</strong></div>
          </div>
        </div>

        {saveStatus !== 'idle' && (
          <div
            role={saveStatus === 'error' ? 'alert' : 'status'}
            className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-xs font-mono ${
              saveStatus === 'error'
                ? 'border-rose-900 bg-rose-950/40 text-rose-200'
                : saveStatus === 'saved'
                ? 'border-emerald-900 bg-emerald-950/30 text-emerald-300'
                : 'border-cyan-900 bg-cyan-950/30 text-cyan-200'
            }`}
          >
            <span className="flex items-start gap-2">
              <Database className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {saveStatus === 'saving' && 'Saving run, events, and snapshots to the database…'}
                {saveStatus === 'saved' && 'Run and trace saved to the database.'}
                {saveStatus === 'error' && (saveError || 'The run could not be saved.')}
              </span>
            </span>
            {saveStatus === 'error' && onRetrySave && (
              <button onClick={onRetrySave} className="flex items-center gap-1 rounded bg-rose-900/70 px-2.5 py-1.5 font-bold hover:bg-rose-900">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            )}
          </div>
        )}

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono text-xs">
          <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A]">
            <div className="text-slate-400 text-[10px]">Leader Changes</div>
            <div className="text-lg font-bold text-white mt-1">{run.leaderChanges}</div>
          </div>
          <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A]">
            <div className="text-slate-400 text-[10px]">Messages Sent</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{run.messagesSent}</div>
          </div>
          <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A]">
            <div className="text-slate-400 text-[10px]">Packets Dropped</div>
            <div className="text-lg font-bold text-amber-400 mt-1">{run.messagesDropped}</div>
          </div>
          <div className="bg-[#070B14] p-3 rounded-lg border border-[#1F2D4A]">
            <div className="text-slate-400 text-[10px]">Client Success</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{run.clientSuccess}</div>
          </div>
        </div>

        {/* Invariant Checker Results Table */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            Safety & Correctness Invariants (§12 & RaftLab 2.0)
          </h4>

          <div className="bg-[#070B14] rounded-xl border border-[#1F2D4A] divide-y divide-[#1F2D4A] text-xs font-mono">
            {run.invariants.map(inv => (
              <div key={inv.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{inv.id} — {inv.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        inv.status === 'PASS'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800 animate-pulse'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{inv.description}</p>
                  {inv.evidence && (
                    <div className="mt-1.5 p-1.5 bg-rose-950/40 rounded border border-rose-900/60 text-[10px] text-rose-300">
                      <strong>Observed:</strong> {inv.evidence.observed}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#1F2D4A]">
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJSON}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" /> Export Run JSON
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/analysis');
              }}
              className="px-3.5 py-2 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-4 h-4" /> Failure Explainer
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`/replay?runId=${encodeURIComponent(run.id)}`);
              }}
              disabled={saveStatus !== 'saved'}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md disabled:cursor-not-allowed disabled:opacity-40"
            >
              <History className="w-4 h-4" /> Open in Replay Studio
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
