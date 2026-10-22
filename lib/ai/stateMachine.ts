// lib/ai/stateMachine.ts
// Priority-based State Machine for target selection

import Matter from 'matter-js';

interface Vector2D {
  x: number;
  y: number;
}

export interface Target {
  type: 'laser' | 'token' | 'delivery' | 'idle';
  pos: Vector2D | null;
  body?: Matter.Body;
  targetId?: string;
  /** Labels of the compacted token batch carried during delivery */
  tokens?: string[];
}

export class StateMachine {
  /**
   * Determine the highest priority target for the robot.
   *
   * Priority order:
   *   1. Laser pointer (Mode B — feline override)
   *   2. Closest UNSORTED token (sorted tokens are already in the pile — ignore them)
   *   3. Idle
   *
   * Delivery targets are set externally by the compaction flow and are never
   * overridden here — CanvasCore guards that with a type check.
   */
  determineTarget(
    isLaserActive: boolean,
    mousePos: Vector2D,
    tokens: Matter.Body[],
    sortedTokens: Set<Matter.Body>,
    robotPos: Vector2D
  ): Target {
    // ── Priority 1: Laser pointer ──────────────────────────────────────────
    if (isLaserActive) {
      return { type: 'laser', pos: mousePos };
    }

    // ── Priority 2: Closest unsorted token ────────────────────────────────
    // Sorted tokens are sitting in the Sorting Zone pile waiting for
    // compaction — the robot must not re-pick them up.
    const unsorted = tokens.filter((t) => !sortedTokens.has(t));

    if (unsorted.length > 0) {
      let closestToken: Matter.Body | null = null;
      let minDistance = Infinity;

      for (const token of unsorted) {
        const distance = Math.hypot(
          token.position.x - robotPos.x,
          token.position.y - robotPos.y
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestToken = token;
        }
      }

      if (closestToken) {
        return {
          type: 'token',
          pos: closestToken.position,
          body: closestToken,
        };
      }
    }

    // ── Priority 3: Idle ───────────────────────────────────────────────────
    return { type: 'idle', pos: null };
  }
}
