'use client';
import { useEffect, useState } from 'react';
import { LASER_STATE_CHANGE } from '@/lib/events';

export default function PixelRobot() {
  const [frame, setFrame] = useState(0); 
  const [lockedEmotion, setLockedEmotion] = useState(false);
  const [isLaserOn, setIsLaserOn] = useState(false);

  // 1. Listen for Text Input Emotions (Angry, Happy & Sleep)
  useEffect(() => {
    const handleEmotion = (e: any) => {
      const emotion = e.detail;
      if (emotion === 'angry') {
        setLockedEmotion(true);
        setFrame(5); // Angry
        setTimeout(() => {
          setLockedEmotion(false);
          // Revert back to frame 4 if laser is on, else 0
          setFrame(isLaserOn ? 4 : 0); 
        }, 3000);
      } else if (emotion === 'happy') {
        setLockedEmotion(true);
        setFrame(3); // Happy
        setTimeout(() => {
          setLockedEmotion(false);
          setFrame(isLaserOn ? 4 : 0);
        }, 3000);
      } else if (emotion === 'sleep') {
        // Sleep mode - show closed eyes continuously
        if (!lockedEmotion && !isLaserOn) {
          setFrame(3); // Use happy/closed eyes for sleeping
        }
      }
    };
    window.addEventListener('ROBOT_EMOTION', handleEmotion);
    return () => window.removeEventListener('ROBOT_EMOTION', handleEmotion);
  }, [isLaserOn, lockedEmotion]);

  // 2. Listen for Laser Pointer State
  useEffect(() => {
    const handleLaser = (e: any) => {
      const laserActive = e.detail.active;
      setIsLaserOn(laserActive);
      if (!lockedEmotion) {
        setFrame(laserActive ? 4 : 0); // Frame 4 is Cat
      }
    };
    window.addEventListener(LASER_STATE_CHANGE, handleLaser);
    return () => window.removeEventListener(LASER_STATE_CHANGE, handleLaser);
  }, [lockedEmotion]);

  // 3. Mouse Tracking (Only if NOT locked by emotion and Laser is OFF)
  useEffect(() => {
    if (lockedEmotion || isLaserOn) return; 

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX } = e;
      const width = window.innerWidth;
      if (clientX < width * 0.3) setFrame(1);
      else if (clientX > width * 0.7) setFrame(2);
      else setFrame(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [lockedEmotion, isLaserOn]);

  return (
    <div 
      id="pixel-robot-agent"
      className="fixed top-0 left-0 z-50 pointer-events-none"
      style={{ willChange: 'transform' }}
    >
      <div className="w-[96px] h-[96px] overflow-hidden">
        <div 
          className="h-full flex transition-transform duration-100"
          style={{ width: '600%', transform: `translateX(-${frame * 16.666}%)` }}
        >
          {/* 6-Frame Sprite Sheet (96x16 grid) */}
          <svg viewBox="0 0 96 16" className="w-full h-full fill-[#1C1C1C]" shapeRendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
            {/* Base shapes for all 6 frames */}
            <path d="
              M4 4h8v1h1v3h-1v1H4V8H3V5h1V4z m-1 7h10v1H3v-1z m-1 1h12v1H2v-1z m0 1h2v1H2v-1z m10 0h2v1h-2v-1z
              M20 4h8v1h1v3h-1v1h-8V8h-1V5h1V4z m-1 7h10v1h-10v-1z m-1 1h12v1h-12v-1z m0 1h2v1h-2v-1z m10 0h2v1h-2v-1z
              M36 4h8v1h1v3h-1v1h-8V8h-1V5h1V4z m-1 7h10v1h-10v-1z m-1 1h12v1h-12v-1z m0 1h2v1h-2v-1z m10 0h2v1h-2v-1z
              M52 4h8v1h1v3h-1v1h-8V8h-1V5h1V4z m-1 7h10v1h-10v-1z m-1 1h12v1h-12v-1z m0 1h2v1h-2v-1z m10 0h2v1h-2v-1z
              M68 4h8v1h1v3h-1v1h-8V8h-1V5h1V4z m-1 7h10v1h-10v-1z m-1 1h12v1h-12v-1z m0 1h2v1h-2v-1z m10 0h2v1h-2v-1z
              M84 4h8v1h1v3h-1v1h-8V8h-1V5h1V4z m-1 7h10v1h-10v-1z m-1 1h12v1h-12v-1z m0 1h2v1h-2v-1z m10 0h2v1h-2v-1z
            " />
            
            {/* 0: Idle Eyes */} <rect x="5" y="6" width="2" height="2" fill="#FAF9F6" /><rect x="9" y="6" width="2" height="2" fill="#FAF9F6" />
            {/* 1: Left Eyes */} <rect x="20" y="6" width="2" height="2" fill="#FAF9F6" /><rect x="24" y="6" width="2" height="2" fill="#FAF9F6" />
            {/* 2: Right Eyes */} <rect x="39" y="6" width="2" height="2" fill="#FAF9F6" /><rect x="43" y="6" width="2" height="2" fill="#FAF9F6" />
            {/* 3: Happy Eyes */} <rect x="53" y="7" width="2" height="1" fill="#FAF9F6" /><rect x="57" y="7" width="2" height="1" fill="#FAF9F6" />
            
            {/* 4: Cat (Ears + Whiskers + Eyes) */}
            <rect x="68" y="2" width="2" height="2" fill="#1C1C1C" /> {/* L Ear */}
            <rect x="74" y="2" width="2" height="2" fill="#1C1C1C" /> {/* R Ear */}
            <rect x="69" y="6" width="2" height="2" fill="#FAF9F6" /><rect x="73" y="6" width="2" height="2" fill="#FAF9F6" />
            <rect x="65" y="7" width="2" height="1" fill="#1C1C1C" /> {/* Whiskers */}
            <rect x="77" y="7" width="2" height="1" fill="#1C1C1C" />

            {/* 5: Angry (Red Eyes + Squint) */}
            <rect x="85" y="6" width="2" height="1" fill="#FF2A2A" /><rect x="89" y="6" width="2" height="1" fill="#FF2A2A" />
          </svg>
        </div>
      </div>
    </div>
  );
}
