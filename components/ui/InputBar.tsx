"use client";

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { dispatchSpawnToken, dispatchRobotDisappointed } from '@/lib/events';
import { playSFX } from '@/lib/utils/sfx';
import { checkToxicity } from '@/lib/ai/transformers';

export default function InputBar() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim() !== '' && !isAnalyzing) {
      const trimmedInput = input.trim();
      const lowerInput = trimmedInput.toLowerCase();
      
      // Check for bad words (triggers angry emotion)
      const badWords = ['fuck', 'shit', 'damn', 'hell', 'ass', 'bitch', 'crap'];
      
      if (badWords.some(word => lowerInput.includes(word))) {
        // Robot gets angry
        window.dispatchEvent(new CustomEvent('ROBOT_EMOTION', { detail: 'angry' }));
        playSFX('error');
        setInput('');
        return;
      }
      
      // Start analysis
      setIsAnalyzing(true);
      playSFX('click');

      try {
        // Check for toxic content
        const isToxic = await checkToxicity(trimmedInput);

        if (isToxic) {
          // Robot is disappointed - 4th wall break
          dispatchRobotDisappointed(trimmedInput);
          playSFX('error');
          window.dispatchEvent(new CustomEvent('ROBOT_EMOTION', { detail: 'angry' }));
        } else {
          // Safe content - spawn token
          dispatchSpawnToken(trimmedInput);
          playSFX('dropToken');
          window.dispatchEvent(new CustomEvent('ROBOT_EMOTION', { detail: 'happy' }));
        }
      } catch (error) {
        console.error('[InputBar] Analysis failed:', error);
        // Fail open: allow content if analysis fails
        dispatchSpawnToken(trimmedInput);
        playSFX('dropToken');
      } finally {
        // Clear input and reset state
        setInput('');
        setIsAnalyzing(false);
      }
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    playSFX('focus');
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div 
      className={`
        absolute left-1/2 -translate-x-1/2 z-20
        transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
        ${isFocused ? 'scale-[1.02]' : 'scale-100'}
      `}
      style={{ bottom: '40px' }}
    >
      <div className="flex items-center gap-4 font-mono text-muted px-6 py-3 bg-white/40 backdrop-blur-sm border border-[#1C1C1C]/20 rounded-sm">
        {/* Animated plus icon */}
        <span 
          className={`
            transition-all duration-300
            ${isFocused ? 'text-ink rotate-90' : 'text-muted rotate-0'}
          `}
          style={{ fontSize: '12px' }}
        >
          +
        </span>
        
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={isAnalyzing}
          placeholder={isAnalyzing ? "Analyzing..." : "Drop an idea, skill, or image..."}
          className={`
            bg-transparent border-0 text-ink 
            font-mono
            placeholder:text-muted
            focus:outline-none focus:ring-0 
            transition-all duration-300
            ${isFocused ? 'placeholder:text-ink/40' : ''}
            ${isAnalyzing ? 'animate-pulse' : ''}
          `}
          style={{ 
            fontSize: '12px',
            width: '340px',
            caretColor: '#1C1C1C',
          }}
        />
        
        {/* Animated return indicator */}
        <span 
          className={`
            text-muted transition-all duration-300 font-mono
            ${input.length > 0 ? 'opacity-100 translate-x-0' : 'opacity-40 -translate-x-1'}
          `}
          style={{ fontSize: '11px' }}
        >
          ↵
        </span>
      </div>
    </div>
  );
}

