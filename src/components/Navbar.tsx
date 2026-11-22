import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Activity,
  Cpu,
  Layers,
  History,
  AlertTriangle,
  GitCompare,
  BarChart3,
  BookOpen,
  Settings as SettingsIcon,
  Play,
  Code2,
  Database,
} from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#070B14]/90 backdrop-blur-md border-b border-[#1F2D4A] px-4 lg:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                  RaftLab
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-semibold">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Deterministic Distributed Systems Lab
              </p>
            </div>
          </NavLink>

          {/* Nav links */}
          <nav className="hidden xl:flex items-center gap-1 text-sm font-medium">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Activity className="w-4 h-4" />
              Dashboard
            </NavLink>
            <NavLink
              to="/studio"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Play className="w-4 h-4 text-emerald-400" />
              Simulation Studio
            </NavLink>
            <NavLink
              to="/replay"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <History className="w-4 h-4 text-indigo-400" />
              Replay
            </NavLink>
            <NavLink
              to="/analysis"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Failures
            </NavLink>
            <NavLink
              to="/scenarios"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <Layers className="w-4 h-4" />
              Scenarios
            </NavLink>
            <NavLink
              to="/compare"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </NavLink>
            <NavLink
              to="/docs"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                  isActive ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40' : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`
              }
            >
              <BookOpen className="w-4 h-4" />
              Docs
            </NavLink>
          </nav>
        </div>

        {/* Right side CTAs */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded bg-[#0D1424] border border-[#1F2D4A] text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Virtual Engine: Ready</span>
          </div>

          <NavLink
            to="/studio"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md hover:brightness-110 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Launch Studio
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `p-1.5 rounded-md transition-colors ${
                isActive ? 'text-cyan-400 bg-slate-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
            title="Database Admin"
            aria-label="Database Admin"
          >
            <Database className="w-4 h-4" />
          </NavLink>

          <NavLink
            to="/settings"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4" />
          </NavLink>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Repository"
          >
            <Code2 className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
