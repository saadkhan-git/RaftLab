import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Sliders, Shield, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const [defaultClusterSize, setDefaultClusterSize] = useState(5);
  const [defaultSpeed, setDefaultSpeed] = useState('1');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070B14] p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
            Settings & Preferences
          </h1>
        </div>
        <p className="text-xs font-mono text-slate-400 mt-1">
          Section 29 Spec — Configure environment defaults, simulation policies, and API keys.
        </p>
      </div>

      <div className="bg-[#0D1424] border border-[#1F2D4A] rounded-2xl p-6 lg:p-8 space-y-6 shadow-xl">
        {/* Simulation Defaults */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Simulation Engine Defaults
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Default Cluster Size</label>
              <select
                value={defaultClusterSize}
                onChange={e => setDefaultClusterSize(parseInt(e.target.value))}
                className="w-full p-2.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-white"
              >
                <option value={3}>3 Nodes (Majority = 2)</option>
                <option value={5}>5 Nodes (Majority = 3)</option>
                <option value={7}>7 Nodes (Majority = 4)</option>
                <option value={9}>9 Nodes (Majority = 5)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1">Default Simulation Speed</label>
              <select
                value={defaultSpeed}
                onChange={e => setDefaultSpeed(e.target.value)}
                className="w-full p-2.5 bg-[#070B14] border border-[#1F2D4A] rounded-lg text-white"
              >
                <option value="0.5">0.5× Slow</option>
                <option value="1">1.0× Real-feel</option>
                <option value="2">2.0× Fast</option>
                <option value="5">5.0× Accelerated</option>
                <option value="10">10.0× Instant</option>
              </select>
            </div>
          </div>
        </div>

        {/* API Tokens (Section 29 spec) */}
        <div className="pt-6 border-t border-[#1F2D4A] space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            API Access Tokens
          </h2>

          <div className="p-4 bg-[#070B14] rounded-xl border border-[#1F2D4A] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div>
              <div className="font-bold text-white">Default CI/CD Token</div>
              <div className="text-slate-500 text-[11px]">raftlab_live_sec_99a8b1... (Expires in 90 days)</div>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs">
              Revoke
            </button>
          </div>
        </div>

        {/* Save button */}
        <div className="pt-6 border-t border-[#1F2D4A] flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-lg"
          >
            {saved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            {saved ? 'PREFERENCES SAVED' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>
    </div>
  );
}
