import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRESET_SCENARIOS } from '../data/scenarios';
import { Scenario } from '../types/raft';
import { raftLabApi } from '../api/raftLabApi';
import {
  Layers,
  Play,
  PlusCircle,
  Clock,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Filter,
} from 'lucide-react';

export default function ScenariosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'library' | 'builder'>('library');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // Custom scenario builder state
  const [builderTitle, setBuilderTitle] = useState('Custom Partition Stress');
  const [builderClusterSize, setBuilderClusterSize] = useState(5);
  const [builderWorkload, setBuilderWorkload] = useState('PUT user:42 = John\nGET user:42');
  const [builderFaults, setBuilderFaults] = useState('1000ms Partition [1,2] vs [3,4,5]\n2500ms Heal Partition');
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);
  const [scenarioError, setScenarioError] = useState<string | null>(null);
  const [savingScenario, setSavingScenario] = useState(false);

  useEffect(() => {
    raftLabApi.listScenarios()
      .then(setSavedScenarios)
      .catch(cause => setScenarioError(cause instanceof Error ? cause.message : 'Unable to load saved scenarios.'));
  }, []);

  const filteredScenarios = [...savedScenarios, ...PRESET_SCENARIOS].filter(sc => {
    if (filterCategory === 'ALL') return true;
    return sc.category === filterCategory;
  });

  const saveScenario = async () => {
    setSavingScenario(true);
    setScenarioError(null);
    try {
      const workload = builderWorkload.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        const scheduled = line.match(/^(\d+)\s*ms\s+(.+)$/i);
        return scheduled
          ? { timeMs: Number(scheduled[1]), command: scheduled[2] }
          : { timeMs: 0, command: line };
      });
      const faultScript = builderFaults.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        const scheduled = line.match(/^(\d+)\s*ms\s+(.+)$/i);
        return {
          timeMs: scheduled ? Number(scheduled[1]) : 0,
          action: scheduled ? scheduled[2] : line,
        };
      });
      const saved = await raftLabApi.createScenario({
        title: builderTitle.trim(),
        category: 'Partitions',
        difficulty: 'Intermediate',
        description: 'Custom scenario saved from the RaftLab scenario builder.',
        goal: 'Reproduce the configured workload and fault sequence.',
        clusterSize: builderClusterSize,
        expectedVerdict: 'PASS',
        config: { clusterSize: builderClusterSize },
        faultScript,
        workload,
      });
      setSavedScenarios(current => [saved, ...current]);
      setActiveTab('library');
    } catch (cause) {
      setScenarioError(cause instanceof Error ? cause.message : 'Unable to save scenario.');
    } finally {
      setSavingScenario(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              Scenarios & Experiment Lab
            </h1>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Section 24 & 25 Spec — Ready-to-run consensus scenarios and custom experiment builder.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 bg-[#0D1424] p-1 rounded-xl border border-[#1F2D4A] text-xs font-mono">
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'library'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scenario Library
          </button>
          <button
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-lg font-bold transition-colors ${
              activeTab === 'builder'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Scenario Builder
          </button>
        </div>
      </div>

      {scenarioError && (
        <div role="alert" className="rounded-xl border border-rose-900 bg-rose-950/30 p-3 text-xs text-rose-200">
          Saved scenario service error: {scenarioError}
        </div>
      )}

      {activeTab === 'library' ? (
        <div className="space-y-6">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {['ALL', 'Elections', 'Partitions', 'Replication', 'Storage Faults', 'Linearizability'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  filterCategory === cat
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 font-bold'
                    : 'bg-[#0D1424] text-slate-400 border-[#1F2D4A] hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScenarios.map(sc => {
              let diffBg = 'bg-cyan-950 text-cyan-400 border-cyan-800';
              if (sc.difficulty === 'Intermediate') diffBg = 'bg-indigo-950 text-indigo-400 border-indigo-800';
              if (sc.difficulty === 'Advanced') diffBg = 'bg-amber-950 text-amber-400 border-amber-800';

              return (
                <div
                  key={sc.id}
                  className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-lg group"
                >
                  <div>
                    {/* Top badging */}
                    <div className="flex items-center justify-between mb-3 text-xs font-mono">
                      <span className="text-slate-400 font-semibold">{sc.category}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${diffBg}`}>
                        {sc.difficulty}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
                      {sc.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4">
                      {sc.description}
                    </p>

                    <div className="bg-[#070B14] p-3 rounded-xl border border-[#1F2D4A] text-xs font-mono text-slate-400 space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span>Cluster:</span>
                        <span className="text-white font-bold">{sc.clusterSize} nodes</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Expected Verdict:</span>
                        <span className="text-emerald-400 font-bold">{sc.expectedVerdict}</span>
                      </div>
                      <div className="pt-1 text-[11px] text-slate-300 border-t border-slate-800">
                        <strong>Goal:</strong> {sc.goal}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/studio')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:brightness-110 text-white font-bold text-xs font-mono flex items-center justify-center gap-2 shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Launch in Simulation Studio
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Scenario Builder Tab */
        <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 lg:p-8 max-w-3xl mx-auto space-y-6 shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">Visual Scenario Builder (§25)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Create a custom reproducible consensus scenario with scheduled faults and assertions.
            </p>
          </div>

          <div className="space-y-4 font-mono text-xs">
            <div>
              <label htmlFor="builder-title" className="text-slate-300 font-bold block mb-1">Scenario Name</label>
              <input
                id="builder-title"
                type="text"
                value={builderTitle}
                onChange={e => setBuilderTitle(e.target.value)}
                className="w-full p-2.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-white"
              />
            </div>

            <div>
              <span className="text-slate-300 font-bold block mb-1">Cluster Size</span>
              <div className="grid grid-cols-4 gap-2">
                {[3, 5, 7, 9].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setBuilderClusterSize(sz)}
                    className={`py-2 rounded-lg font-bold border ${
                      builderClusterSize === sz
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                        : 'bg-[#070B14] border-slate-800 text-slate-400'
                    }`}
                  >
                    {sz} Nodes
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="builder-workload" className="text-slate-300 font-bold block mb-1">Client Workload Schedule</label>
              <textarea
                id="builder-workload"
                rows={3}
                value={builderWorkload}
                onChange={e => setBuilderWorkload(e.target.value)}
                className="w-full p-2.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-white font-mono"
              />
            </div>

            <div>
              <label htmlFor="builder-faults" className="text-slate-300 font-bold block mb-1">Fault Injection Timeline</label>
              <textarea
                id="builder-faults"
                rows={3}
                value={builderFaults}
                onChange={e => setBuilderFaults(e.target.value)}
                className="w-full p-2.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1F2D4A] flex justify-end gap-3">
            <button
              onClick={() => setActiveTab('library')}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => void saveScenario()}
              disabled={savingScenario || !builderTitle.trim()}
              className="px-6 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg"
            >
              <PlusCircle className="w-4 h-4" /> {savingScenario ? 'Saving…' : 'Save Scenario'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
