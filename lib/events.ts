// lib/events.ts
// Global Event Definitions for React ↔ Canvas Communication

export const EVENT_SPAWN_TOKEN = 'autonomous-ledger:spawn-token';
export const EVENT_ROBOT_DELIVERY = 'autonomous-ledger:robot-delivery';
export const LASER_STATE_CHANGE = 'autonomous-ledger:laser-state-change';
export const EVENT_ROBOT_DISAPPOINTED = 'autonomous-ledger:robot-disappointed';

export interface SpawnTokenPayload {
  keyword: string;
}

export interface RobotDeliveryPayload {
  targetId: string;
  tokens: string[];
}

export interface LaserStatePayload {
  active: boolean;
}

export interface RobotDisappointedPayload {
  rawText: string;
}

// Type-safe event dispatch helpers
export function dispatchSpawnToken(keyword: string) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent<SpawnTokenPayload>(EVENT_SPAWN_TOKEN, {
    detail: { keyword },
  });
  window.dispatchEvent(event);
}

export function dispatchRobotDelivery(targetId: string, tokens: string[]) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent<RobotDeliveryPayload>(EVENT_ROBOT_DELIVERY, {
    detail: { targetId, tokens },
  });
  window.dispatchEvent(event);
}

export function dispatchLaserStateChange(active: boolean) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent<LaserStatePayload>(LASER_STATE_CHANGE, {
    detail: { active },
  });
  window.dispatchEvent(event);
}

export function dispatchRobotDisappointed(rawText: string) {
  if (typeof window === 'undefined') return;
  
  const event = new CustomEvent<RobotDisappointedPayload>(EVENT_ROBOT_DISAPPOINTED, {
    detail: { rawText },
  });
  window.dispatchEvent(event);
}
