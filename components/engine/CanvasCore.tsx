"use client";

import { useEffect, useRef } from 'react';
import Matter from 'matter-js';
import {
  EVENT_SPAWN_TOKEN,
  SpawnTokenPayload,
  LASER_STATE_CHANGE,
  LaserStatePayload,
  EVENT_ROBOT_DISAPPOINTED,
  RobotDisappointedPayload,
  dispatchRobotDelivery,
} from '@/lib/events';
import { QAgent } from '@/lib/ai/qAgent';
import { StateMachine, Target } from '@/lib/ai/stateMachine';
import { playSFX } from '@/lib/utils/sfx';
import { routeToken } from '@/lib/ai/matchmaker';

// ── Compaction threshold ─────────────────────────────────────────────────────
const COMPACTION_THRESHOLD = 4;

export default function CanvasCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const gazeAngleRef = useRef(0);
  const isLaserActiveRef = useRef(false);
  const robotBodyRef = useRef<Matter.Body | null>(null);

  // All live token bodies
  const activeTokensRef = useRef<Matter.Body[]>([]);
  // Subset of tokens that have been dragged to the Sorting Zone
  const sortedTokensRef = useRef<Set<Matter.Body>>(new Set());

  const currentTargetRef = useRef<Target>({ type: 'idle', pos: null });
  const qAgentRef = useRef(new QAgent());
  const stateMachineRef = useRef(new StateMachine());
  const previousStateRef = useRef<string | null>(null);
  const previousActionRef = useRef<number | null>(null);
  const previousRobotPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDisappointedRef = useRef(false);
  // Guards the async compaction flow so it only fires once per batch
  const isCompactingRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── Canvas sizing with ResizeObserver ────────────────────────────────────
    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    
    updateCanvasSize();
    
    // Use ResizeObserver to track parent container dimensions
    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
      
      // Recreate walls when canvas resizes
      if (engineRef.current) {
        const wallThickness = 60;
        const oldWalls = Matter.Composite.allBodies(engineRef.current.world)
          .filter(body => body.isStatic && body.label !== 'robot');
        
        oldWalls.forEach(wall => Matter.Composite.remove(engineRef.current!.world, wall));
        
        const newWalls = [
          Matter.Bodies.rectangle(canvas.width / 2, canvas.height + wallThickness / 2, canvas.width, wallThickness, { isStatic: true, label: 'floor' }),
          Matter.Bodies.rectangle(canvas.width / 2, -wallThickness / 2, canvas.width, wallThickness, { isStatic: true, label: 'ceiling' }),
          Matter.Bodies.rectangle(-wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true, label: 'leftWall' }),
          Matter.Bodies.rectangle(canvas.width + wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true, label: 'rightWall' }),
        ];
        
        Matter.Composite.add(engineRef.current.world, newWalls);
      }
    });
    
    const parent = canvas.parentElement;
    if (parent) {
      resizeObserver.observe(parent);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    // ── Engine: top-down desk, zero gravity ──────────────────────────────────
    const engine = Matter.Engine.create({
      gravity: { x: 0, y: 0, scale: 0.001 },
    });
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    // ── 4-wall boundary ──────────────────────────────────────────────────────
    const wallThickness = 60;
    const walls = [
      Matter.Bodies.rectangle(canvas.width / 2, canvas.height + wallThickness / 2, canvas.width, wallThickness, { isStatic: true, label: 'floor' }),
      Matter.Bodies.rectangle(canvas.width / 2, -wallThickness / 2, canvas.width, wallThickness, { isStatic: true, label: 'ceiling' }),
      Matter.Bodies.rectangle(-wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true, label: 'leftWall' }),
      Matter.Bodies.rectangle(canvas.width + wallThickness / 2, canvas.height / 2, wallThickness, canvas.height, { isStatic: true, label: 'rightWall' }),
    ];

    // ── Robot: Physical agent with snappy physics ───────────────────────────
    const robotBody = Matter.Bodies.rectangle(
      canvas.width * 0.8, 
      canvas.height - 100, 
      96, 
      96, 
      {
        frictionAir: 0.01,
        inertia: Infinity,
        label: 'robot',
        density: 0.001,
        restitution: 0.5,
      }
    );
    robotBodyRef.current = robotBody;

    Matter.Composite.add(engine.world, [...walls, robotBody]);

    // ── Sorting Zone: bottom-right corner ───────────────────────────────────
    // Computed once at setup; tokens are teleported here when sorted.
    const getSortingZone = () => ({
      x: canvas.width - 150,
      y: canvas.height - 150,
    });

    // ── Low-frequency State Machine tick (500 ms) ────────────────────────────
    // Drives target selection and monitors the pile for compaction.
    const stateMachineInterval = setInterval(() => {
      if (!robotBodyRef.current || isDisappointedRef.current || isCompactingRef.current) return;

      // ── Compaction check: pile reached threshold ─────────────────────────
      const pile = Array.from(sortedTokensRef.current);
      if (pile.length >= COMPACTION_THRESHOLD) {
        isCompactingRef.current = true;
        playSFX('crunch');

        // Take exactly 4 tokens from the pile
        const batch = pile.slice(0, COMPACTION_THRESHOLD);
        const combinedLabel = batch.map((b) => b.label).join(' ');

        // Remove them from the world and all tracking refs
        for (const token of batch) {
          Matter.Composite.remove(engine.world, token);
          sortedTokensRef.current.delete(token);
          const idx = activeTokensRef.current.indexOf(token);
          if (idx > -1) activeTokensRef.current.splice(idx, 1);
        }

        console.log('[CanvasCore] Compacting batch:', combinedLabel);

        // Semantic routing on combined label
        routeToken(combinedLabel)
          .then((targetId) => {
            if (targetId) {
              console.log('[CanvasCore] Batch matched to project:', targetId);
              currentTargetRef.current = {
                type: 'delivery',
                pos: { x: 80, y: canvas.height / 2 },
                targetId,
                tokens: batch.map((b) => b.label),
              };
            } else {
              console.log('[CanvasCore] Batch did not match any project');
              currentTargetRef.current = { type: 'idle', pos: null };
            }
            isCompactingRef.current = false;
            previousStateRef.current = null;
            previousActionRef.current = null;
          })
          .catch((err) => {
            console.error('[CanvasCore] Compaction routing failed:', err);
            currentTargetRef.current = { type: 'idle', pos: null };
            isCompactingRef.current = false;
          });

        return; // skip normal target selection this tick
      }

      // ── Normal target selection ──────────────────────────────────────────
      const target = stateMachineRef.current.determineTarget(
        isLaserActiveRef.current,
        mouseRef.current,
        activeTokensRef.current,
        sortedTokensRef.current,
        robotBodyRef.current.position
      );

      // Never override an active delivery
      if (currentTargetRef.current.type !== 'delivery') {
        currentTargetRef.current = target;
      }
    }, 500);

    // ── Physics update loop ──────────────────────────────────────────────────
    Matter.Events.on(engine, 'beforeUpdate', () => {
      if (!robotBodyRef.current) return;

      // Disappointed state: robot brakes hard, no movement
      if (isDisappointedRef.current) {
        robotBodyRef.current.frictionAir = 0.5;
        return;
      }

      const target = currentTargetRef.current;

      // ── Mode B: Laser / Feline Override ─────────────────────────────────
      if (target.type === 'laser') {
        robotBodyRef.current.frictionAir = 0.02;

        const dx = mouseRef.current.x - robotBodyRef.current.position.x;
        const dy = mouseRef.current.y - robotBodyRef.current.position.y;

        // Dampened spring — drifts playfully, never lunges
        Matter.Body.applyForce(robotBodyRef.current, robotBodyRef.current.position, {
          x: dx * 0.00005,
          y: dy * 0.00005,
        });

      // ── Tidy-Up: chase and sort unsorted tokens ──────────────────────────
      } else if (target.type === 'token' && target.pos && target.body) {
        robotBodyRef.current.frictionAir = 0.1;

        const distance = Math.hypot(
          target.pos.x - robotBodyRef.current.position.x,
          target.pos.y - robotBodyRef.current.position.y
        );

        if (distance < 30) {
          // ── Pickup: teleport token to Sorting Zone ─────────────────────
          const zone = getSortingZone();
          const scatter = 40;
          const destX = zone.x + (Math.random() - 0.5) * scatter;
          const destY = zone.y + (Math.random() - 0.5) * scatter;

          Matter.Body.setPosition(target.body, { x: destX, y: destY });
          Matter.Body.setVelocity(target.body, { x: 0, y: 0 });
          sortedTokensRef.current.add(target.body);

          playSFX('dropToken');
          console.log(
            `[CanvasCore] Sorted token "${target.body.label}" → pile size ${sortedTokensRef.current.size}`
          );

          // Clear target so state machine picks the next unsorted token
          currentTargetRef.current = { type: 'idle', pos: null };
          previousStateRef.current = null;
          previousActionRef.current = null;
        } else {
          driveToward(target.pos);
        }

      // ── Delivery: carry compacted bundle to left margin ──────────────────
      } else if (target.type === 'delivery' && target.pos && target.targetId) {
        robotBodyRef.current.frictionAir = 0.1;

        if (robotBodyRef.current.position.x < 100) {
          console.log('[CanvasCore] Delivery complete to:', target.targetId);

          dispatchRobotDelivery(target.targetId, target.tokens ?? []);
          playSFX('clickOpen');

          currentTargetRef.current = { type: 'idle', pos: null };
          previousStateRef.current = null;
          previousActionRef.current = null;
        } else {
          driveToward(target.pos);
        }

      // ── Idle ─────────────────────────────────────────────────────────────
      } else {
        robotBodyRef.current.frictionAir = 0.1;
        previousStateRef.current = null;
        previousActionRef.current = null;
      }
    });

    // ── DOM Sync & Aggressive AI (afterUpdate) ───────────────────────────────
    let wanderTime = 0;
    Matter.Events.on(engine, 'afterUpdate', () => {
      if (!robotBodyRef.current) return;

      wanderTime += 0.05;

      // Aggressive Token-Chasing AI
      if (currentTargetRef.current.type === 'idle' && !isDisappointedRef.current) {
        // Find all unsorted tokens
        const unsortedTokens = activeTokensRef.current.filter(
          token => !sortedTokensRef.current.has(token)
        );

        if (unsortedTokens.length > 0) {
          // Find closest token
          let closestToken = unsortedTokens[0];
          let minDistance = Math.abs(closestToken.position.x - robotBodyRef.current.position.x);

          for (const token of unsortedTokens) {
            const distance = Math.abs(token.position.x - robotBodyRef.current.position.x);
            if (distance < minDistance) {
              minDistance = distance;
              closestToken = token;
            }
          }

          // Apply aggressive force toward closest token
          const dx = closestToken.position.x - robotBodyRef.current.position.x;
          const forceX = dx * 0.0008; // Strong push
          Matter.Body.applyForce(robotBodyRef.current, robotBodyRef.current.position, {
            x: forceX,
            y: 0
          });
        } else {
          // No tokens: energetic wander
          Matter.Body.setVelocity(robotBodyRef.current, {
            x: Math.sin(wanderTime) * 3,
            y: robotBodyRef.current.velocity.y
          });
        }
      }

      // Sync DOM to Physics Body
      const robotDOM = document.getElementById('pixel-robot-agent');
      if (robotDOM) {
        // Subtract half the width/height (48px) to center the sprite on the physics body
        const x = robotBodyRef.current.position.x - 48;
        const y = robotBodyRef.current.position.y - 48;
        robotDOM.style.transform = `translate(${x}px, ${y}px)`;
      }
    });

    // ── Q-Agent locomotion helper ────────────────────────────────────────────
    // Used by both token-chase and delivery modes.
    function driveToward(pos: { x: number; y: number }) {
      if (!robotBodyRef.current) return;

      const currentState = qAgentRef.current.getState(robotBodyRef.current.position, pos);
      const actionIndex = qAgentRef.current.getBestAction(currentState);
      const actionVector = qAgentRef.current.getActionVector(actionIndex);

      Matter.Body.applyForce(robotBodyRef.current, robotBodyRef.current.position, {
        x: actionVector.x * 0.002,
        y: actionVector.y * 0.002,
      });

      if (
        previousStateRef.current !== null &&
        previousActionRef.current !== null &&
        previousRobotPosRef.current !== null
      ) {
        const reward = qAgentRef.current.calculateReward(
          previousRobotPosRef.current,
          robotBodyRef.current.position,
          pos
        );
        qAgentRef.current.update(previousStateRef.current, previousActionRef.current, reward, currentState);
      }

      previousStateRef.current = currentState;
      previousActionRef.current = actionIndex;
      previousRobotPosRef.current = { ...robotBodyRef.current.position };
    }

    // ── Render loop ──────────────────────────────────────────────────────────
    let animationFrameId: number;

    const STATIC_LABELS = new Set(['floor', 'ceiling', 'leftWall', 'rightWall']);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bodies = Matter.Composite.allBodies(engine.world);

      bodies.forEach((body) => {
        // Skip robot (rendered by PixelRobot component)
        if (body.label === 'robot') return;

        // Skip walls
        if (body.isStatic || !body.label || STATIC_LABELS.has(body.label)) return;

        // ── Token: Data-Token Pills (White background, 1px solid, DM Mono 9px) ──
        const { position, angle } = body;
        const isSorted = sortedTokensRef.current.has(body);

        ctx.save();
        ctx.translate(position.x, position.y);
        ctx.rotate(angle);

        // Measure text for pill dimensions using DM Mono
        ctx.font = '9px DM Mono, monospace';
        const textMetrics = ctx.measureText(body.label.toUpperCase());
        const textWidth = textMetrics.width;
        
        const markerRadius = 4; // 4px outlined circle before text
        const markerGap = 8; // Gap between marker and text
        const pillPadding = 14; // Horizontal padding
        const pillWidth = markerRadius * 2 + markerGap + textWidth + pillPadding * 2;
        const pillHeight = 28;
        const pillRadius = 14; // Fully rounded pill

        // Draw rounded rectangle (pill shape) - White background, 1px solid
        ctx.beginPath();
        ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, pillRadius);
        
        // Fill: White for unsorted, subtle for sorted
        ctx.fillStyle = isSorted ? '#F4F2ED' : '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = isSorted ? 'rgba(28,28,28,0.4)' : '#1C1C1C';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw 4px outlined circular marker before text
        const markerX = -pillWidth / 2 + pillPadding + markerRadius;
        ctx.beginPath();
        ctx.arc(markerX, 0, markerRadius, 0, Math.PI * 2);
        ctx.strokeStyle = isSorted ? 'rgba(28,28,28,0.4)' : '#1C1C1C';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Draw text (DM Mono, 9px)
        const textX = markerX + markerRadius + markerGap;
        ctx.fillStyle = isSorted ? 'rgba(28,28,28,0.4)' : '#1C1C1C';
        ctx.font = '9px DM Mono, monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(body.label.toUpperCase(), textX, 0);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // ── Event handlers ───────────────────────────────────────────────────────
    const handleSpawnToken = (e: Event) => {
      const event = e as CustomEvent<SpawnTokenPayload>;
      const keyword = event.detail.keyword;

      // Measure text width accurately using DM Mono 9px
      ctx.font = '9px DM Mono, monospace';
      const textMetrics = ctx.measureText(keyword.toUpperCase());
      const textWidth = textMetrics.width;

      const markerRadius = 4;
      const markerGap = 8;
      const pillPadding = 14;
      const bodyWidth = markerRadius * 2 + markerGap + textWidth + pillPadding * 2;
      const bodyHeight = 28;

      // Random horizontal variance to prevent vertical stacking
      const spawnX = canvas.width / 2 + (Math.random() * 200 - 100);
      const spawnY = canvas.height / 2 + (Math.random() * 200 - 100);

      const newBody = Matter.Bodies.rectangle(spawnX, spawnY, bodyWidth, bodyHeight, {
        friction: 0.3,
        frictionAir: 0.05,
        restitution: 0.2,
        density: 0.001,
        label: keyword,
        chamfer: { radius: 14 }, // Fully rounded pill physics
      });

      // Random initial rotation for natural scatter
      Matter.Body.setAngle(newBody, Math.random() * Math.PI);

      // Scatter impulse
      Matter.Body.applyForce(newBody, newBody.position, {
        x: (Math.random() - 0.5) * 0.0015,
        y: (Math.random() - 0.5) * 0.0015,
      });

      Matter.Composite.add(engine.world, newBody);
      activeTokensRef.current.push(newBody);
    };

    const handleLaserStateChange = (e: Event) => {
      const event = e as CustomEvent<LaserStatePayload>;
      isLaserActiveRef.current = event.detail.active;
    };

    const handleRobotDisappointed = (e: Event) => {
      const event = e as CustomEvent<RobotDisappointedPayload>;
      console.log('[Robot] Disappointed by toxic input:', event.detail.rawText);
      playSFX('error');
      isDisappointedRef.current = true;
      setTimeout(() => { isDisappointedRef.current = false; }, 2000);
    };

    window.addEventListener(EVENT_SPAWN_TOKEN, handleSpawnToken);
    window.addEventListener(LASER_STATE_CHANGE, handleLaserStateChange);
    window.addEventListener(EVENT_ROBOT_DISAPPOINTED, handleRobotDisappointed);

    // ── Cleanup ──────────────────────────────────────────────────────────────
    return () => {
      clearInterval(stateMachineInterval);
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener(EVENT_SPAWN_TOKEN, handleSpawnToken);
      window.removeEventListener(LASER_STATE_CHANGE, handleLaserStateChange);
      window.removeEventListener(EVENT_ROBOT_DISAPPOINTED, handleRobotDisappointed);
      cancelAnimationFrame(animationFrameId);
      if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
        Matter.World.clear(engineRef.current.world, false);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
