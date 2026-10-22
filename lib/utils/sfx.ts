// lib/utils/sfx.ts
export let isMuted = false;

export function toggleMute() {
  isMuted = !isMuted;
}

type SFXType = 'hoverTab' | 'clickOpen' | 'error' | 'dropToken' | 'laserToggle' | 'crunch' | 'hoverLink' | 'click' | 'slideIn' | 'slideOut' | 'toggle' | 'focus' | 'success';

const sfxProfiles: Record<SFXType, number[]> = {
  hoverTab: [1.01, 0, 50, 0.01, 0.01, 0.01, 1, 1.14, 0, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.01],
  clickOpen: [1.05, 0, 150, 0.02, 0.02, 0.05, 1, 1.5, 0, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.02],
  error: [1.0, 0, 90, 0.1, 0.2, 0.4, 0, 0.4, -5, 0, 0, 0, 0, 0.8, 0, 0.2, 0, 0, 0.1],
  dropToken: [1.2, 0, 70, 0.01, 0.03, 0.01, 2, 0.8, 0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.05],
  laserToggle: [1.1, 0, 400, 0.01, 0.01, 0.02, 0, 2.1, 0, 0, 0, 0, 0, 0, 0.1, 0, 0, 0, 0.01],
  crunch: [1.5, 0, 200, 0.05, 0.1, 0.2, 3, 0.5, 0, 0, 0, 0, 0.5, 0, 0.5, 0.1, 0, 0, 0.05],
  // New tactile sounds
  hoverLink: [1.02, 0, 35, 0.005, 0.005, 0.005, 1, 1.05, 0, 0, 0, 0, 0, 0, 0.05, 0, 0, 0, 0.005],
  click: [1.0, 0, 120, 0.01, 0.01, 0.03, 1, 1.3, 0, 0, 0, 0, 0, 0, 0.08, 0, 0, 0, 0.015],
  slideIn: [1.15, 0, 250, 0.02, 0.05, 0.08, 0, 1.8, 0, 0, 0, 0, 0, 0, 0.12, 0, 0, 0, 0.03],
  slideOut: [0.95, 0, 180, 0.02, 0.04, 0.06, 0, 1.2, 0, 0, 0, 0, 0, 0, 0.08, 0, 0, 0, 0.02],
  toggle: [1.08, 0, 100, 0.01, 0.01, 0.02, 1, 1.6, 0, 0, 0, 0, 0, 0, 0.09, 0, 0, 0, 0.01],
  focus: [1.03, 0, 60, 0.008, 0.008, 0.01, 1, 1.2, 0, 0, 0, 0, 0, 0, 0.06, 0, 0, 0, 0.008],
  success: [1.25, 0, 300, 0.015, 0.03, 0.05, 2, 2.0, 0, 0, 0, 0, 0, 0, 0.15, 0, 0, 0, 0.025],
};

export async function playSFX(type: SFXType) {
  // Only execute in browser context
  if (typeof window === 'undefined') return;
  if (isMuted) return;
  
  const profile = sfxProfiles[type];
  if (profile) {
    // Dynamic import to avoid SSR issues
    // @ts-expect-error -- zzfx does not ship TypeScript declarations
    const { zzfx } = await import('zzfx');
    zzfx(...profile);
  }
}
