// components/Sidebar.tsx
'use client';

import { useEffect, useState } from 'react';
import LedgerItem from './ui/LedgerItem';
import { initMatchmaker } from '@/lib/ai/matchmaker';
import { playSFX } from '@/lib/utils/sfx';
import type { PortfolioEntry } from '@/lib/types/database';

interface SidebarProps {
  entries: PortfolioEntry[];
  selectedProjectId: string | null;
  onToggleProject: (id: string) => void;
  onOpenSheet?: (id: string) => void;
}

export default function Sidebar({ entries, selectedProjectId, onToggleProject, onOpenSheet }: SidebarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    // Transform database entries to matchmaker format
    const projects = entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      summary: entry.summary,
      techTags: entry.tech_tags,
    }));

    // Initialize semantic matchmaker with live data
    initMatchmaker(projects).catch((error) => {
      console.error('[Sidebar] Failed to initialize matchmaker:', error);
    });
  }, [entries]);

  return (
    <aside className="relative w-full h-full flex flex-col bg-[#FAF9F6] border-r border-[#1C1C1C] overflow-visible z-30">
      {/* INTRODUCTION - Human-centered header with breathing room */}
      <div className="px-10 pt-12 pb-10 border-b border-[#1C1C1C]">
        {/* Name - Large, confident */}
        <h1 className="font-serif text-[42px] leading-[1.1] text-[#1C1C1C] tracking-[-0.03em] mb-3">
          Anton Buenafe
        </h1>
        
        {/* Bio - Readable, human voice */}
        <p className="font-serif text-[16px] leading-[1.5] text-[#6F6D68] mb-8">
          Building intelligent systems and exploring the edges of machine perception. 
          Focused on making tools that feel more like companions than utilities.
        </p>

        {/* Social Links - Clear CTAs with comfortable spacing */}
        <div className="flex flex-col gap-3">
          <a 
            href="mailto:anton@example.com" 
            onMouseEnter={() => playSFX('hoverLink')}
            onClick={() => playSFX('click')}
            className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.03em] text-[#1C1C1C] hover:text-[#FF2A2A] transition-all duration-300 hover:translate-x-[3px]"
          >
            <span className="text-[#6F6D68] group-hover:text-[#FF2A2A] transition-colors">→</span>
            anton@example.com
          </a>
          
          <a 
            href="https://github.com/antonbuenafe" 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseEnter={() => playSFX('hoverLink')}
            onClick={() => playSFX('click')}
            className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.03em] text-[#1C1C1C] hover:text-[#FF2A2A] transition-all duration-300 hover:translate-x-[3px]"
          >
            <span className="text-[#6F6D68] group-hover:text-[#FF2A2A] transition-colors">→</span>
            github.com/antonbuenafe
          </a>
          
          <a 
            href="https://linkedin.com/in/antonbuenafe" 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseEnter={() => playSFX('hoverLink')}
            onClick={() => playSFX('click')}
            className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.03em] text-[#1C1C1C] hover:text-[#FF2A2A] transition-all duration-300 hover:translate-x-[3px]"
          >
            <span className="text-[#6F6D68] group-hover:text-[#FF2A2A] transition-colors">→</span>
            linkedin.com/in/antonbuenafe
          </a>
          
          <a 
            href="/resume.pdf" 
            target="_blank" 
            rel="noopener noreferrer"
            onMouseEnter={() => playSFX('hoverLink')}
            onClick={() => playSFX('click')}
            className="group flex items-center gap-2 font-mono text-[11px] tracking-[0.03em] text-[#1C1C1C] hover:text-[#FF2A2A] transition-all duration-300 hover:translate-x-[3px]"
          >
            <span className="text-[#6F6D68] group-hover:text-[#FF2A2A] transition-colors">↓</span>
            Download Resume (PDF)
          </a>
        </div>
      </div>

      {/* PROJECT LEDGER - Cleaner section header */}
      <section className="pt-8 pb-4 px-10">
        <h2 className="font-mono uppercase text-[#6F6D68] text-[10px] tracking-[0.15em] mb-1">
          Selected Work
        </h2>
        <p className="font-serif text-[13px] leading-[1.4] text-[#6F6D68]">
          Systems & ML
        </p>
      </section>

      {/* LEDGER LIST - NO OVERFLOW WRAPPER */}
      <div className="flex-1">
        {entries.length === 0 ? (
          <div className="px-10 py-6">
            <p className="font-mono text-[#6F6D68] text-[11px]">
              No projects found
            </p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <LedgerItem
              key={entry.id}
              index={index}
              hoveredIndex={hoveredIndex}
              onHoverChange={setHoveredIndex}
              project={{
                id: entry.id,
                title: entry.title,
                summary: entry.summary,
                tags: entry.tech_tags,
                year: entry.year,
              }}
              isExpanded={selectedProjectId === entry.id}
              onToggle={() => onToggleProject(entry.id)}
              onOpenSheet={() => onOpenSheet?.(entry.id)}
            />
          ))
        )}
      </div>

      {/* FOOTER NOTE - Softer, more personal */}
      <section className="border-t border-[#1C1C1C] px-10 py-8">
        <h2 className="font-mono uppercase text-[#6F6D68] text-[10px] tracking-[0.15em] mb-3">
          Also Building
        </h2>
        <p className="font-serif text-[14px] leading-[1.5] text-[#6F6D68]">
          Experiments in machine perception, publishing systems, and useful little machines. 
          Most of these live in private repos or notebooks.
        </p>
      </section>
    </aside>
  );
}
