// components/ui/ProjectSheet.tsx
"use client";

import { useEffect, useState } from 'react';
import { PortfolioEntry } from '@/lib/types/database';
import { playSFX } from '@/lib/utils/sfx';

interface ProjectSheetProps {
  project: PortfolioEntry | null;
  onClose: () => void;
}

export default function ProjectSheet({ project, onClose }: ProjectSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (project) {
      // Trigger slide-in animation
      playSFX('slideIn');
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [project]);

  const handleClose = () => {
    playSFX('slideOut');
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation
  };

  if (!project) return null;

  return (
    <>
      {/* Backdrop with fade-in */}
      <div 
        className={`
          fixed inset-0 bg-[#1C1C1C]/20 backdrop-blur-sm z-35
          transition-opacity duration-300
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* STATE 3: Full Read Side Sheet */}
      <div
        className={`
          fixed top-0 left-0 h-screen w-[45vw] 
          bg-white border-r border-ink 
          z-40 
          transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          overflow-y-auto
          ${isVisible ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          boxShadow: '8px 0 24px rgba(28, 28, 28, 0.08)',
        }}
      >
        {/* Close Button: Tactile X with hover effects */}
        <button
          onClick={handleClose}
          onMouseEnter={() => playSFX('hoverLink')}
          className={`
            group absolute w-10 h-10 border border-ink 
            bg-transparent hover:bg-ink hover:text-white 
            transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
            flex items-center justify-center font-mono
            hover:scale-110 hover:rotate-90 active:scale-95
          `}
          style={{ 
            top: '32px',
            right: '32px',
            fontSize: '24px',
          }}
          aria-label="Close project sheet"
        >
          <span className="transition-transform duration-300">×</span>
        </button>

        {/* Content with staggered fade-in */}
        <div 
          className={`
            transition-opacity duration-700 delay-200
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          style={{ padding: '48px 48px 64px' }}
        >
          {/* Project Number */}
          <div 
            className="font-mono uppercase text-muted mb-4"
            style={{ 
              fontSize: '9px',
              letterSpacing: '0.11em',
            }}
          >
            PROJECT {String(project.id).padStart(2, '0')}
          </div>

          {/* Massive Serif Title */}
          <h1 
            className="font-serif text-ink mb-8"
            style={{ 
              fontSize: '56px',
              lineHeight: 1.1,
            }}
          >
            {project.title}
          </h1>

          {/* Year & Tech Tags */}
          <div className="flex items-center gap-6 mb-12 pb-6 border-b border-ink">
            {project.year && (
              <span 
                className="font-mono text-muted"
                style={{ 
                  fontSize: '10px',
                  letterSpacing: '0.05em',
                }}
              >
                {project.year}
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              {project.tech_tags.map((tag) => (
                <span
                  key={tag}
                  className="font-mono uppercase bg-white text-ink border border-ink rounded-full transition-all duration-300 hover:bg-[#F4F2ED] hover:scale-105"
                  style={{ 
                    fontSize: '8px',
                    letterSpacing: '0.05em',
                    padding: '4px 12px',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Summary: Instrument Serif */}
          <p 
            className="font-serif text-ink mb-12"
            style={{ 
              fontSize: '20px',
              lineHeight: 1.5,
            }}
          >
            {project.summary}
          </p>

          {/* Body Content: DM Mono */}
          <div className="space-y-8 font-mono text-muted" style={{ fontSize: '12px', lineHeight: 1.75 }}>
            <section>
              <h2 
                className="font-mono uppercase text-ink mb-4"
                style={{ 
                  fontSize: '9px',
                  letterSpacing: '0.11em',
                }}
              >
                // CONTEXT
              </h2>
              <p>
                This project emerged from a frustration with existing tools that felt more like
                spreadsheets than environments for exploration. The goal was to build something
                that invited curiosity rather than demanded precision—a space where you could
                experiment with models, compare outputs, and trace behavior without drowning in
                configuration files.
              </p>
            </section>

            <section>
              <h2 
                className="font-mono uppercase text-ink mb-4"
                style={{ 
                  fontSize: '9px',
                  letterSpacing: '0.11em',
                }}
              >
                // APPROACH
              </h2>
              <p>
                The architecture centers on a lightweight evaluation harness that runs entirely in
                the browser. Models are loaded on-demand via WebAssembly, allowing for real-time
                inference without server round-trips. The UI treats each model as a "participant"
                in a conversation, making it easy to see how different architectures respond to
                the same prompt.
              </p>
              <p className="mt-4">
                State is managed through a simple event bus, with each component subscribing to
                changes in model outputs. This keeps the interface responsive even when running
                multiple models in parallel. Visualizations are rendered using Canvas API for
                precise control over aesthetic constraints.
              </p>
            </section>

            <section>
              <h2 
                className="font-mono uppercase text-ink mb-4"
                style={{ 
                  fontSize: '9px',
                  letterSpacing: '0.11em',
                }}
              >
                // OUTCOME
              </h2>
              <p>
                The tool has been used internally for model selection decisions, A/B testing, and
                debugging edge cases. By making evaluation feel more like observation than
                measurement, it changed how the team thought about model behavior—less as a
                metric to optimize and more as a system to understand.
              </p>
            </section>

            <section>
              <h2 
                className="font-mono uppercase text-ink mb-4"
                style={{ 
                  fontSize: '9px',
                  letterSpacing: '0.11em',
                }}
              >
                // LINKS
              </h2>
              <div className="flex flex-col gap-2">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => playSFX('hoverLink')}
                    onClick={() => playSFX('click')}
                    className="group text-ink hover:text-[#FF2A2A] transition-all duration-300 border-b border-ink hover:border-[#FF2A2A] pb-1 w-fit hover:translate-x-[4px]"
                  >
                    View Source Code <span className="inline-block transition-transform duration-300 group-hover:translate-x-[2px]">→</span>
                  </a>
                )}
                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseEnter={() => playSFX('hoverLink')}
                    onClick={() => playSFX('click')}
                    className="group text-ink hover:text-[#FF2A2A] transition-all duration-300 border-b border-ink hover:border-[#FF2A2A] pb-1 w-fit hover:translate-x-[4px]"
                  >
                    View Live Demo <span className="inline-block transition-transform duration-300 group-hover:translate-x-[2px]">→</span>
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
