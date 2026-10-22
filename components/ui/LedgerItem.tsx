// components/ui/LedgerItem.tsx
"use client";

import { useEffect, useRef } from 'react';
import { playSFX } from '@/lib/utils/sfx';
import { EVENT_ROBOT_DELIVERY, RobotDeliveryPayload } from '@/lib/events';

interface LedgerItemProps {
  index: number;
  hoveredIndex: number | null;
  onHoverChange: (index: number | null) => void;
  project: {
    id: string;
    title: string;
    summary: string;
    tags: string[];
    year?: number;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onOpenSheet: () => void;
}

export default function LedgerItem({ 
  index, 
  hoveredIndex, 
  onHoverChange, 
  project, 
  isExpanded, 
  onToggle, 
  onOpenSheet 
}: LedgerItemProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleRobotDelivery = (e: Event) => {
      const event = e as CustomEvent<RobotDeliveryPayload>;

      if (event.detail.targetId === project.id) {
        playSFX('hoverTab');
        // Auto-expand when robot delivers
        onToggle();
      }
    };

    window.addEventListener(EVENT_ROBOT_DELIVERY, handleRobotDelivery);

    return () => {
      window.removeEventListener(EVENT_ROBOT_DELIVERY, handleRobotDelivery);
    };
  }, [project.id, onToggle]);

  // Click-outside-to-close: Push the folder back into the cabinet
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        onToggle(); // Retract the drawer
      }
    };

    // Add slight delay to avoid immediate closure on the opening click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, onToggle]);

  // macOS Dock-style 5-tier cascade physics
  const distance = hoveredIndex !== null ? Math.abs(hoveredIndex - index) : null;

  let translateClass = "translate-x-0";
  let bgClass = "bg-[#FAF9F6]";

  if (distance === 0) {
    translateClass = "translate-x-[24px]"; // The finger is exactly on this tab
    bgClass = "bg-[#F4F2ED]";
  } else if (distance === 1) {
    translateClass = "translate-x-[12px]"; // Adjacent folder pulled slightly by friction
  } else if (distance === 2) {
    translateClass = "translate-x-[4px]"; // Outer edge of the physical ripple
  }

  // Build wrapper classes with kinetic displacement - MORE PADDING
  const restingClasses = `relative w-full text-left px-10 py-8 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] border-b border-[#1C1C1C] ${translateClass} ${bgClass}`;

  const isHovered = distance === 0;

  return (
    <div className="relative w-full">
      {/* STATE 0 & 1: Collapsed - Resting / Hover with Kinetic Cascade */}
      {!isExpanded && (
        <button
          onClick={() => {
            onToggle();
            playSFX('clickOpen');
          }}
          onMouseEnter={() => {
            onHoverChange(index);
            playSFX('hoverTab');
          }}
          onMouseLeave={() => {
            onHoverChange(null);
          }}
          className={restingClasses}
        >
          {/* 3px Tactile Tab - More prominent */}
          {isHovered && (
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#1C1C1C]" />
          )}
          
          {/* Project Title - Larger, more readable */}
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="font-serif text-[28px] leading-[1.2] text-[#1C1C1C]">
              {project.title}
            </h3>
            {project.year && (
              <span className="font-mono text-[11px] text-[#6F6D68] tracking-[0.03em]">
                {project.year}
              </span>
            )}
          </div>
          
          {/* Summary hint on hover - subtle preview */}
          {isHovered && (
            <p className="font-serif text-[13px] leading-[1.4] text-[#6F6D68] mt-2 transition-opacity duration-300">
              {project.summary.slice(0, 80)}...
            </p>
          )}
        </button>
      )}

      {/* STATE 2: Expanded - Invisible spacer + absolutely positioned pull-out drawer */}
      {isExpanded && (
        <>
          {/* Invisible Spacer: Creates vertical space without visible border */}
          <div className="w-full border-b border-[#1C1C1C]" style={{ height: '340px' }} />
          
          {/* Drawer: Absolutely positioned to physically overflow left-to-right */}
          <div
            ref={drawerRef}
            className="absolute top-0 left-0 z-[100] bg-[#FAF9F6] border border-[#1C1C1C] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              width: 'calc(100% + 48px)', // Extends 48px beyond sidebar edge
              boxShadow: '4px 4px 0px #1C1C1C', // Hard tactile shadow
            }}
            onClick={() => {
              onToggle();
              playSFX('clickOpen');
            }}
          >
            {/* 3px Solid Left Tab */}
            <div className="absolute top-0 left-0 w-[3px] h-full bg-[#1C1C1C]" />

            {/* Drawer Content - Better spacing and typography */}
            <div className="px-12 pt-8 pb-10 bg-[#F4F2ED]">
              {/* Header Row */}
              <div className="flex items-baseline justify-between mb-4">
                <h3 className="font-serif text-[28px] leading-[1.2] text-[#1C1C1C]">
                  {project.title}
                </h3>
                {project.year && (
                  <span className="font-mono text-[11px] text-[#6F6D68] tracking-[0.03em]">
                    {project.year}
                  </span>
                )}
              </div>

              {/* Summary - More readable */}
              <p className="font-serif text-[14px] leading-[1.6] text-[#1C1C1C] mb-6">
                {project.summary}
              </p>

              {/* Tags - Better spacing */}
              <div className="flex flex-wrap gap-2 mb-8">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-[#1C1C1C] rounded-full px-4 py-1.5 font-mono text-[9px] tracking-[0.05em] uppercase bg-white transition-all duration-300 hover:bg-[#F4F2ED] hover:scale-105"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* CTA Link - More prominent */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenSheet();
                  playSFX('click');
                }}
                onMouseEnter={() => playSFX('hoverLink')}
                className="group font-mono text-[11px] uppercase border-b-2 border-[#1C1C1C] pb-[2px] hover:text-[#FF2A2A] hover:border-[#FF2A2A] transition-all duration-300 tracking-[0.06em] flex items-center gap-2"
              >
                Read Full Case Study
                <span className="inline-block transition-transform duration-300 group-hover:translate-x-[4px]">→</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
