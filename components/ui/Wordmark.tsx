// components/ui/Wordmark.tsx
"use client";

export default function Wordmark() {
  return (
    <div className="absolute top-8 left-8 z-20">
      {/* Primary wordmark */}
      <h1 
        className="font-serif text-ink mb-1"
        style={{ 
          fontSize: '27px',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        AntonBuenafe
      </h1>
      
      {/* Subtitle */}
      <p 
        className="font-mono uppercase text-muted"
        style={{ 
          fontSize: '8px',
          letterSpacing: '0.12em',
          lineHeight: 1,
        }}
      >
        MACHINE LEARNING | CS
      </p>
    </div>
  );
}
