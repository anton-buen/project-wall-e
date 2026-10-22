"use client";

import { useState } from 'react';
import { dispatchLaserStateChange } from '@/lib/events';
import { playSFX, toggleMute, isMuted } from '@/lib/utils/sfx';

export default function TopControls() {
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [isSoundOn, setIsSoundOn] = useState(!isMuted);

  const handleLaserToggle = () => {
    const newState = !isLaserActive;
    setIsLaserActive(newState);
    dispatchLaserStateChange(newState);
    playSFX('laserToggle');
  };

  const handleSoundToggle = () => {
    toggleMute();
    const newState = !isMuted;
    setIsSoundOn(newState);
    playSFX('toggle');
  };

  return (
    <div className="absolute top-10 right-10 z-20 flex gap-3">
      {/* Sound Toggle only - Laser moved to double-click */}
      <button
        onClick={handleSoundToggle}
        onMouseEnter={() => playSFX('hoverLink')}
        className={`
          group
          flex items-center justify-center gap-2.5
          h-[42px] px-5
          bg-transparent border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          font-mono uppercase
          hover:scale-[1.02] active:scale-[0.98]
          ${isSoundOn 
            ? 'text-ink border-ink hover:bg-white/50' 
            : 'text-muted border-muted hover:text-ink hover:border-ink'
          }
        `}
        style={{
          fontSize: '11px',
          letterSpacing: '0.06em',
        }}
      >
        <span className="transition-transform duration-300 group-hover:scale-110 text-[14px]">
          {isSoundOn ? '🔈' : '🔇'}
        </span>
        {isSoundOn ? 'On' : 'Off'}
      </button>
    </div>
  );
}

