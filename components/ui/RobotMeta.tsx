// components/ui/RobotMeta.tsx
"use client";

export default function RobotMeta() {
  return (
    <div 
      className="absolute z-20 flex items-center gap-6 font-mono text-muted"
      style={{ 
        bottom: '25px',
        right: '32px',
        fontSize: '8px',
        letterSpacing: '0.08em',
      }}
    >
      <span>BOOK.UNIT 01</span>
      <span>OBSERVING</span>
    </div>
  );
}
