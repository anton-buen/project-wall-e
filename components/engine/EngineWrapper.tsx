"use client";

import dynamic from 'next/dynamic';

// Strict hydration boundary: Load physics engine only on client
const CanvasCore = dynamic(() => import('./CanvasCore'), {
  ssr: false,
  loading: () => null,
});

export default function EngineWrapper() {
  return <CanvasCore />;
}
