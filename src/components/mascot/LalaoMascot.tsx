import React from 'react';

/**
 * LalaoMascot — inline SVG blob character.
 *
 * Rendered with a transparent canvas so it sits cleanly on any background
 * colour without a white box or checker pattern.  Pass `className` or
 * `style` to control size; the SVG scales freely via its viewBox.
 */
export interface LalaoMascotProps {
  className?: string;
  style?: React.CSSProperties;
  /** Override the body fill colour (defaults to a slightly darker brand blue) */
  bodyColor?: string;
}

export const LalaoMascot: React.FC<LalaoMascotProps> = ({
  className,
  style,
  bodyColor = '#1560C8',
}) => {
  const B = bodyColor;       // body
  const W = '#FFFFFF';       // white (eyes, lines)
  const P = '#0D2E7A';       // pupil navy

  return (
    <svg
      viewBox="0 0 240 252"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Lalao mascot — friendly blue character waving hello"
      role="img"
      className={className}
      style={{ display: 'block', ...style }}
    >
      {/* ── Soft drop-shadow beneath the character ── */}
      <ellipse cx="101" cy="244" rx="71" ry="10" fill="rgba(0,0,0,0.17)" />

      {/* ────────────────────────────────────────────
          RAISED ARM  (rendered first so the body
          overlaps the arm's base naturally)
          ──────────────────────────────────────────── */}

      {/* Arm shaft — thick curved path shoulder → wrist */}
      <path
        d="M 154 92
           C 162 72, 172 52, 180 33
           C 184 23, 188 18, 188 18
           L 194 28
           C 191 30, 187 36, 183 46
           C 175 64, 164 83, 156 100
           Z"
        fill={B}
      />

      {/* Hand — small circle at tip of arm */}
      <circle cx="186" cy="22" r="17" fill={B} />

      {/* ── Motion / energy lines near raised hand ── */}
      {/* Upper-right spark */}
      <line x1="203" y1="11" x2="216" y2="3"
            stroke={W} strokeWidth="4.5" strokeLinecap="round" />
      {/* Right spark */}
      <line x1="207" y1="22" x2="221" y2="20"
            stroke={W} strokeWidth="4.5" strokeLinecap="round" />
      {/* Lower-right spark */}
      <line x1="202" y1="33" x2="215" y2="40"
            stroke={W} strokeWidth="4.5" strokeLinecap="round" />

      {/* ────────────────────────────────────────────
          CLOUD-BUMP SILHOUETTE (top of body)
          Three overlapping circles create the fluffy
          rounded-top look without any visible seams.
          ──────────────────────────────────────────── */}
      <circle cx="54"  cy="92" r="36" fill={B} />
      <circle cx="87"  cy="67" r="42" fill={B} />
      <circle cx="121" cy="65" r="39" fill={B} />

      {/* ────────────────────────────────────────────
          MAIN BODY  — tall rounded rectangle that
          covers the bottom of the cloud bumps and
          forms the torso / lower half.
          ──────────────────────────────────────────── */}
      <rect x="18" y="80" width="165" height="148" rx="54" fill={B} />

      {/* Side-fill circles to smooth the body edges */}
      <circle cx="23"  cy="148" r="28" fill={B} />   {/* left */}
      <circle cx="177" cy="112" r="20" fill={B} />   {/* right shoulder join */}

      {/* ────────────────────────────────────────────
          EYES
          ──────────────────────────────────────────── */}
      {/* Left eye white */}
      <ellipse cx="74"  cy="128" rx="22" ry="27" fill={W} />
      {/* Right eye white */}
      <ellipse cx="128" cy="128" rx="22" ry="27" fill={W} />

      {/* Left pupil */}
      <ellipse cx="80"  cy="123" rx="9"  ry="10" fill={P} />
      {/* Right pupil */}
      <ellipse cx="134" cy="123" rx="9"  ry="10" fill={P} />

      {/* Eye-shine highlight dots (top-left of each pupil) */}
      <circle cx="77"  cy="119" r="3.5" fill={W} opacity="0.9" />
      <circle cx="131" cy="119" r="3.5" fill={W} opacity="0.9" />
    </svg>
  );
};

