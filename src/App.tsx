import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import SimulationStudio from './pages/SimulationStudio';
import ReplayStudio from './pages/ReplayStudio';
import FailureAnalysis from './pages/FailureAnalysis';
import ScenariosPage from './pages/ScenariosPage';
import ComparePage from './pages/ComparePage';
import AnalyticsPage from './pages/AnalyticsPage';
import DocsPage from './pages/DocsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/studio" element={<SimulationStudio />} />
            <Route path="/replay" element={<ReplayStudio />} />
            <Route path="/analysis" element={<FailureAnalysis />} />
            <Route path="/scenarios" element={<ScenariosPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
