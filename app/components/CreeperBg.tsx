import * as React from "react";

/**
 * Full-bleed creeper animation that sits BEHIND your content.
 * Pointer-events are off so it never blocks clicks.
 */
export default function CreeperBg({
  duration = "6s",        // CSS time
  startOffset = 22,       // % translateY start (relative to container height)
  startScale = 0.18,
  endScale = 1.05,
}: {
  duration?: string;
  startOffset?: number;
  startScale?: number;
  endScale?: number;
}) {
  return (
    <div
      className="qb-root"
      aria-hidden
      style={
        {
          ["--qb-duration" as any]: duration,
          ["--qb-startOffset" as any]: `${startOffset}%`,
          ["--qb-startScale" as any]: startScale,
          ["--qb-endScale" as any]: endScale,
        } as React.CSSProperties
      }
    >
      <style>{`
        .qb-root {
          position:absolute; inset:0; z-index:0;
          pointer-events:none; /* never block UI */
        }
        .qb-shadow {
          position:absolute; left:50%; bottom:4%;
          width:34vmin; height:12vmin; transform:translateX(-50%);
          background: radial-gradient(ellipse at center,
            rgba(0,0,0,0.42) 0%,
            rgba(0,0,0,0.08) 70%,
            transparent 80%);
          filter: blur(8px);
          opacity:.22;
          animation: qb-shadowGrow var(--qb-duration) ease-out forwards;
        }
        .qb-creeper {
          position:absolute; left:50%; bottom:12%;
          transform:translateX(-50%) translateY(var(--qb-startOffset)) scale(var(--qb-startScale));
          transform-origin:50% 100%;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,.45));
          animation: qb-approach var(--qb-duration) cubic-bezier(.25,.9,.2,1) forwards;
        }
        .qb-creeper-inner {
          display:inline-block;
          animation: qb-bob calc(var(--qb-duration)/18) ease-in-out infinite alternate;
        }
        svg { display:block; width:min(44vmin,460px); height:auto }

        @media (prefers-reduced-motion: reduce){
          .qb-creeper,.qb-creeper-inner,.qb-shadow { animation:none }
          .qb-creeper { transform:translateX(-50%) translateY(0) scale(1) }
        }

        @keyframes qb-approach {
          0%   { transform:translateX(-50%) translateY(var(--qb-startOffset)) scale(var(--qb-startScale));
                 filter:drop-shadow(0 3px 6px rgba(0,0,0,.3)) blur(.3px); opacity:.85; }
          60%  { transform:translateX(-50%) translateY(6%) scale(.65);
                 filter:drop-shadow(0 10px 18px rgba(0,0,0,.4)); }
          100% { transform:translateX(-50%) translateY(0) scale(var(--qb-endScale));
                 filter:drop-shadow(0 16px 28px rgba(0,0,0,.5)); opacity:1; }
        }
        @keyframes qb-bob {
          from { transform:translateY(-0.8%) rotateZ(-0.4deg) }
          to   { transform:translateY( 0.8%) rotateZ( 0.4deg) }
        }
        @keyframes qb-shadowGrow {
          0%   { transform:translateX(-50%) scale(0.5,0.35); opacity:.12 }
          100% { transform:translateX(-50%) scale(1,1);     opacity:.28 }
        }
      `}</style>

      {/* soft ground shadow */}
      <div className="qb-shadow" />

      {/* creeper */}
      <div className="qb-creeper">
        <div className="qb-creeper-inner">
          <svg viewBox="0 0 160 280" role="img" aria-label="Minecraft creeper">
            <defs>
              <pattern id="qb-mosaic" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#1f8a2b"/>
                <rect x="0" y="0" width="8" height="8" fill="#2aa03a"/>
                <rect x="8" y="8" width="8" height="8" fill="#106d1f"/>
                <rect x="0" y="8" width="8" height="8" fill="#1a7b27"/>
                <rect x="8" y="0" width="8" height="8" fill="#169132"/>
              </pattern>
              <pattern id="qb-mosaicDark" width="16" height="16" patternUnits="userSpaceOnUse">
                <rect width="16" height="16" fill="#13681e"/>
                <rect x="0" y="0" width="8" height="8" fill="#0f5a19"/>
                <rect x="8" y="8" width="8" height="8" fill="#1e7b28"/>
                <rect x="0" y="8" width="8" height="8" fill="#125e1b"/>
                <rect x="8" y="0" width="8" height="8" fill="#1a7b27"/>
              </pattern>
            </defs>

            {/* Head */}
            <g transform="translate(24,0)">
              <rect x="0" y="0" width="112" height="112" rx="2" fill="url(#qb-mosaic)" stroke="#0e3f14" strokeWidth="2"/>
              <rect x="28" y="44" width="22" height="22" fill="#0b0f0c"/>
              <rect x="62" y="44" width="22" height="22" fill="#0b0f0c"/>
              <rect x="48" y="68" width="16" height="18" fill="#0b0f0c"/>
              <rect x="36" y="86" width="24" height="16" fill="#0b0f0c"/>
              <rect x="60" y="86" width="24" height="16" fill="#0b0f0c"/>
            </g>

            {/* Neck */}
            <rect x="64" y="110" width="32" height="10" fill="url(#qb-mosaicDark)" />

            {/* Body */}
            <g transform="translate(32,120)">
              <rect x="0" y="0" width="96" height="100" rx="2" fill="url(#qb-mosaic)" stroke="#0e3f14" strokeWidth="2"/>
            </g>

            {/* Legs */}
            <g transform="translate(16,220)">
              <rect x="0"  y="0" width="48" height="60" rx="2" fill="url(#qb-mosaicDark)" stroke="#0e3f14" strokeWidth="2"/>
              <rect x="80" y="0" width="48" height="60" rx="2" fill="url(#qb-mosaicDark)" stroke="#0e3f14" strokeWidth="2"/>
              <rect x="48" y="0" width="32" height="60" fill="transparent"/>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
