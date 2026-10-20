import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { brand } from '../../config/brand';

/* ─────────────────────────────────────────────────────────────────────────────
   DecorativeBlobs
   SVG curves rendered behind the content — slightly darker blue in each
   corner, matching the reference design.
   ───────────────────────────────────────────────────────────────────────────── */
const DecorativeBlobs: React.FC<{ color: string }> = ({ color }) => (
  <svg
    aria-hidden="true"
    style={{
      position: 'absolute',
      inset: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      overflow: 'visible',
    }}
    viewBox="0 0 430 932"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Top-left swirl */}
    <path d="M -55 45 C 30 -15,185 12,125 148 C 65 284,-28 215,-55 45 Z" fill={color} opacity="0.38" />
    <path d="M -85 130 C 8 35,205 72,145 238 C 85 404,-52 305,-85 130 Z" fill={color} opacity="0.22" />
    {/* Top-right arc */}
    <path d="M 402 -24 C 504 72,462 215,355 175 C 248 135,292 12,402 -24 Z" fill={color} opacity="0.36" />
    {/* Bottom-right curl */}
    <path d="M 458 748 C 562 706,584 868,464 910 C 344 952,322 818,458 748 Z" fill={color} opacity="0.38" />
    <path d="M 396 832 C 528 788,568 958,412 978 C 256 998,242 868,396 832 Z" fill={color} opacity="0.22" />
    {/* Bottom-left accent */}
    <path d="M -32 895 C 42 835,136 875,94 956 C 52 1037,-68 975,-32 895 Z" fill={color} opacity="0.32" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
   WelcomePage
   ───────────────────────────────────────────────────────────────────────────── */
export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const {
    primaryColor,
    primaryColorDark,
    MascotComponent,
    mascotImageSrc,
    wordmark,
    tagline,
    buttonText,
  } = brand;

  const fadeUp = (delayMs: number): React.CSSProperties => ({
    opacity:    mounted ? 1 : 0,
    transform:  mounted ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 0.62s ease ${delayMs}ms, transform 0.62s ease ${delayMs}ms`,
  });

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{ background: primaryColor }}
    >
      {/* Mobile column — max 430 px; stays centered on desktop */}
      <div
        className="relative flex flex-col items-center overflow-hidden w-full"
        style={{ maxWidth: 430, minHeight: '100vh', background: primaryColor }}
      >
        <DecorativeBlobs color={primaryColorDark} />

        {/* Content */}
        <div
          className="relative z-10 flex flex-col items-center w-full flex-1 px-8"
          style={{ paddingTop: '9vh', paddingBottom: '8vh' }}
        >
          {/* ── Mascot ── */}
          <div style={{ ...fadeUp(0), marginBottom: '2.25rem' }}>
            {mascotImageSrc ? (
              <img
                src={mascotImageSrc}
                alt="Lalao mascot"
                style={{ width: 210, height: 210, objectFit: 'contain', background: 'transparent', display: 'block' }}
              />
            ) : (
              <MascotComponent style={{ width: 210, height: 210 }} bodyColor={primaryColorDark} />
            )}
          </div>

          {/* ── Headline + tagline ── */}
          <div className="text-center" style={fadeUp(90)}>
            <h1
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '2.3rem', fontWeight: 800,
                color: '#ffffff', lineHeight: 1.15, margin: 0,
              }}
            >
              {wordmark.prefix}
            </h1>
            <p
              aria-label={wordmark.name}
              style={{
                fontFamily: wordmark.fontFamily, fontSize: '2.85rem',
                fontWeight: 400, color: '#ffffff', lineHeight: 1.28,
                margin: '0 0 1.1rem 0',
              }}
            >
              {wordmark.name}
            </p>
            {/*
              Single unbroken string — the browser wraps naturally.
              Eliminates the "aroundyou" merge caused by manual <br /> splits.
            */}
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '0.975rem', fontWeight: 400,
                color: 'rgba(255,255,255,0.88)', lineHeight: 1.65,
                maxWidth: '268px', margin: '0 auto',
                wordSpacing: 'normal', letterSpacing: 'normal',
              }}
            >
              {tagline}
            </p>
          </div>

          {/* Push CTA to bottom */}
          <div style={{ flex: 1, minHeight: '2rem' }} />

          {/* ── CTA area ── */}
          <div className="w-full" style={{ ...fadeUp(180), maxWidth: 348 }}>
            {/* Get Started button */}
            <button
              id="btn-welcome-get-started"
              type="button"
              onClick={() => navigate('/signup')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '10px', width: '100%', padding: '16px 0',
                borderRadius: '999px', background: '#ffffff', border: 'none',
                cursor: 'pointer',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '1.05rem', fontWeight: 700, color: primaryColor,
                boxShadow: '0 4px 22px rgba(0,0,0,0.14)',
                transition: 'transform 0.14s ease, box-shadow 0.14s ease',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.025)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 22px rgba(0,0,0,0.14)';
              }}
              onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.975)'; }}
              onMouseUp={e =>   { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.025)'; }}
            >
              <span>{buttonText}</span>
              <span aria-hidden="true" style={{ fontSize: '1.2rem', lineHeight: 1 }}>→</span>
            </button>

            {/* Sign-in link */}
            <p
              className="text-center"
              style={{
                marginTop: '1.2rem',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                fontSize: '0.875rem', fontWeight: 400,
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              Already have an account?{' '}
              <button
                id="btn-welcome-sign-in"
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 700,
                  color: '#ffffff', textDecoration: 'underline',
                  textUnderlineOffset: '2px', padding: 0,
                }}
              >
                Sign in
              </button>
            </p>

            {/* Pagination dots */}
            <div
              role="tablist"
              aria-label="Onboarding progress"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px', marginTop: '1.6rem' }}
            >
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  role="tab"
                  aria-selected={i === 0}
                  style={{
                    height: 8, width: i === 0 ? 24 : 8,
                    borderRadius: 999,
                    background: i === 0 ? '#ffffff' : 'rgba(255,255,255,0.32)',
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
