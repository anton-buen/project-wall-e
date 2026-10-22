// app/page.tsx
"use client";

import { useState, useEffect } from 'react';
import { fetchPortfolioEntries } from '../lib/supabase/client';
import { PortfolioEntry } from '../lib/types/database';
import InputBar from '../components/ui/InputBar';
import TopControls from '../components/ui/TopControls';
import ProjectSheet from '../components/ui/ProjectSheet';
import EngineWrapper from '../components/engine/EngineWrapper';
import PixelRobot from '../components/engine/PixelRobot';
import Sidebar from '../components/Sidebar';

// Mock data for development/testing
const MOCK_PROJECTS: PortfolioEntry[] = [
  {
    id: '01',
    type: 'system_ml' as const,
    title: 'Model Garden',
    summary: 'A visual research environment for comparing small language models in the wild. Built to make evaluation feel less like a spreadsheet and more like fieldwork.',
    tech_tags: ['PYTHON', 'PYTORCH', 'REACT'],
    year: 2025,
  },
  {
    id: '02',
    type: 'system_ml' as const,
    title: 'Archive of Small Signals',
    summary: 'Collecting and indexing the ephemeral: browser tabs, screenshots, half-thoughts. A personal knowledge graph that learns what you care about without asking.',
    tech_tags: ['RUST', 'SQLITE', 'TRANSFORMERS'],
    year: 2024,
  },
  {
    id: '03',
    type: 'system_ml' as const,
    title: 'Morrow Type Engine',
    summary: 'Variable font interpolation as a real-time design tool. Explores the boundary between typography and animation, controlled by sensor input.',
    tech_tags: ['TYPESCRIPT', 'WASM', 'OPENTYPE'],
    year: 2024,
  },
];

export default function Home() {
  const [entries, setEntries] = useState<PortfolioEntry[]>(MOCK_PROJECTS);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  useEffect(() => {
    // Try to fetch from Supabase, fallback to mock data
    fetchPortfolioEntries()
      .then((data) => {
        if (data && data.length > 0) {
          setEntries(data);
        }
      })
      .catch((error) => {
        console.warn('[Page] Failed to fetch from Supabase, using mock data:', error);
      });
  }, []);

  const handleToggleProject = (id: string) => {
    setExpandedProjectId(expandedProjectId === id ? null : id);
  };

  const handleOpenSheet = (id: string) => {
    setSelectedProjectId(id);
  };

  const handleCloseSheet = () => {
    setSelectedProjectId(null);
  };

  const selectedProject = entries.find((entry) => entry.id === selectedProjectId) || null;

  return (
    <main className="relative w-full h-screen overflow-hidden bg-[#FAF9F6]">
      {/* Physics Canvas - Full screen background at z-0 */}
      <div className="absolute inset-0 z-0">
        <EngineWrapper />
      </div>

      {/* Main Layout: 40% Ledger | 60% Canvas - Better balance */}
      <div className="relative z-10 flex w-full h-full">
        {/* LEFT: The Ledger Sidebar (40%) - More breathing room */}
        <div className="w-[40%] h-full bg-[#FAF9F6]">
          <Sidebar 
            entries={entries} 
            selectedProjectId={expandedProjectId}
            onToggleProject={handleToggleProject}
            onOpenSheet={handleOpenSheet} 
          />
        </div>

        {/* RIGHT: The Canvas Area (60%) - Purposeful workspace - TRANSPARENT for physics */}
        <div className="relative w-[60%] h-full bg-transparent">
          {/* Top Right: Floating Controls */}
          <TopControls />

          {/* Bottom Center: Floating Input */}
          <InputBar />
        </div>
      </div>

      {/* Pixel Robot - Physics-driven positioning */}
      <PixelRobot />

      {/* Project Sheet: State 3 (Full Read) Overlay */}
      <ProjectSheet project={selectedProject} onClose={handleCloseSheet} />
    </main>
  );
}
