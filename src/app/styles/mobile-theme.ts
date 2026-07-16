import type { CSSProperties } from 'react';

/**
 * Shared design tokens for the /app/* mobile shell — one place for the
 * premium visual language (gradients, glass, glows, card shadows) instead
 * of re-typing the same magic strings across every screen.
 */
export const MOBILE_COLORS = {
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  darkSurface: '#0F172A',
  textPrimary: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  border: '#E5E7EB',
} as const;

export const BLUE_GRADIENT = 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)';
export const DARK_GRADIENT = 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)';

/** Base page background — subtle depth instead of a flat fill. */
export const MOBILE_BG_GRADIENT = 'linear-gradient(180deg, #F8FAFC 0%, #EEF4FF 100%)';

/** Ambient glows layered behind content — keep opacity low, this is meant
 * to read as premium depth, not a decorative gamer-style glow. */
export const GLOW_TOP_RIGHT = 'radial-gradient(circle at 100% 0%, rgba(37,99,235,0.14), transparent 55%)';
export const GLOW_TOP_LEFT = 'radial-gradient(circle at 0% 0%, rgba(79,70,229,0.10), transparent 50%)';

export const CARD_RADIUS = 24;
export const CARD_SHADOW = '0 20px 40px rgba(15,23,42,0.08)';

/** Frosted-glass surface — reserved for the top header and bottom nav
 * only, per design spec (not the whole app). High opacity on purpose:
 * on Android WebViews with weak/no backdrop-filter support, a low-opacity
 * background alone (without the blur actually rendering) reads as a
 * washed-out smudge instead of glass — this stays visually solid even
 * when the blur silently no-ops, and still gets the glass edge where
 * blur *is* supported. */
export const GLASS_SURFACE: CSSProperties = {
  background: 'rgba(255,255,255,0.97)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
};

export const springTap = { scale: 0.96 };
