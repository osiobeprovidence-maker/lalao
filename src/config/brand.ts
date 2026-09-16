/**
 * src/config/brand.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source-of-truth for all brand-level tokens used across the onboarding
 * and auth flows.  Change values here and every screen that reads this config
 * will update automatically — no need to hunt through page components.
 *
 * HOW TO SWAP THE MASCOT
 * ──────────────────────
 *   Option A (inline SVG — recommended, no white box, scales perfectly):
 *     • Create a new component in src/components/mascot/
 *     • Set `MascotComponent` to point at it
 *     • Leave `mascotImageSrc` undefined
 *
 *   Option B (PNG / SVG asset file):
 *     • Drop your file in /public  (e.g. /public/my-mascot.png)
 *     • Set `mascotImageSrc: '/my-mascot.png'`
 *     • The <img> will use object-fit:contain + transparent background
 *     • MascotComponent is ignored when mascotImageSrc is set
 *
 * HOW TO CHANGE THE WORDMARK FONT
 * ────────────────────────────────
 *   1. Add the font to index.html Google Fonts <link>
 *   2. Update wordmark.fontFamily below — done.
 */

import type React from 'react';
import { LalaoMascot } from '../components/mascot/LalaoMascot';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BrandWordmark {
  /** Text on the first line above the brand name, e.g. "Welcome to" */
  prefix: string;
  /** The brand name rendered in the script/display font, e.g. "Lalao!" */
  name: string;
  /**
   * CSS font-family string for the brand name.
   * Must be loaded in index.html before use.
   * @example "'Pacifico', cursive"
   */
  fontFamily: string;
}

export interface BrandConfig {
  /** Background colour for onboarding / auth screens */
  primaryColor: string;
  /** Slightly darker shade — used for the mascot body and decorative blobs */
  primaryColorDark: string;

  /**
   * Inline SVG mascot component.
   * Used when mascotImageSrc is undefined (preferred: no image-box artefacts).
   * Accepts `className` and `style` props for sizing.
   */
  MascotComponent: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
    bodyColor?: string;
  }>;

  /**
   * Optional path to a PNG or SVG mascot asset in /public.
   * When provided, overrides MascotComponent and renders an <img> element
   * with `background: transparent` and `object-fit: contain`.
   */
  mascotImageSrc?: string;

  wordmark: BrandWordmark;

  /** Full tagline string — rendered as a single <p> so words never merge */
  tagline: string;

  /** Label for the primary CTA button */
  buttonText: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

export const brand: BrandConfig = {
  // ── Colours ──────────────────────────────────────────────────────────────
  primaryColor:     '#1877F2',   // ← brand blue (background)
  primaryColorDark: '#1560C8',   // ← mascot body + decorative shapes

  // ── Mascot ───────────────────────────────────────────────────────────────
  MascotComponent: LalaoMascot,  // ← swap to your new component, or…
  mascotImageSrc: undefined,     // ← …set a '/public/...' path to use an image

  // ── Wordmark ─────────────────────────────────────────────────────────────
  wordmark: {
    prefix:     'Welcome to',
    name:       'Lalao!',
    fontFamily: "'Pacifico', cursive",  // ← change font here
  },

  // ── Copy ─────────────────────────────────────────────────────────────────
  tagline:    'Discover people, places, events and opportunities happening around you.',
  buttonText: 'Get Started',
};

