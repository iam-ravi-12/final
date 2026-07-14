/**
 * Centralized app-wide theme colours.
 * Every screen should import `useAppTheme()` and use the returned `colors`
 * object instead of hardcoding colour values.
 *
 * Palette philosophy
 * ──────────────────
 * Light mode  — clean white/grey with blue (#0A66C2) accent.
 * Dark mode   — rich deep-space dark (#0A0E1A) with electric cyan-blue accents.
 *               Premium feel with warm midnight navy surfaces, vivid accents,
 *               and elevated contrast for maximum readability.
 */

import { useColorScheme } from 'react-native';

// ── Core palette extracted from reference ─────────────────────────────────────
const palette = {
  c001D39: '#001D39', // Deep Midnight Navy
  c0A4174: '#0A4174', // Dark Ocean Blue
  c49769F: '#49769F', // Muted Steel Blue
  c4E8EA2: '#4E8EA2', // Teal Blue
  c6EA2B3: '#6EA2B3', // Soft Cyan Blue
  c7BBDE8: '#7BBDE8', // Sky Blue
  cBDD8E9: '#BDD8E9', // Ice / Powder Blue

  // Standard utility neutrals
  white: '#FFFFFF',
  offWhite: '#F4F8FA',
  darkSurface: '#051B33',
  darkCard: '#0A2542',

  // Premium dark mode palette
  darkBg: '#080C16',         // Near-black deep space
  darkBg2: '#0D1220',        // Slightly lighter base
  darkSurface2: '#121828',   // Card surface — warm midnight
  darkSurface3: '#1A2235',   // Elevated card / modal
  darkSurface4: '#1E2A40',   // Hover / pressed state
  darkBorder: '#1E2D45',     // Subtle border
  darkBorderBright: '#243350', // Visible border

  // Electric accent palette for dark mode
  accentCyan: '#38BDF8',     // Vivid sky blue (main accent)
  accentCyanGlow: '#7DD3FC', // Lighter glow variant
  accentCyanDim: '#0EA5E9',  // Deeper saturated cyan
  accentPurple: '#A78BFA',   // Soft violet accent
  accentTeal: '#2DD4BF',     // Teal highlight

  // Semantic
  red: '#E5534B',
  green: '#3FB950',
  orange: '#D29922',

  // Premium semantic overrides for dark
  dangerDark: '#F87171',     // Softer red on dark
  successDark: '#4ADE80',    // Vivid green on dark
  warningDark: '#FCD34D',    // Gold on dark
};

// ── Theme tokens ────────────────────────────────────────────────────────────
export interface AppThemeColors {
  // Backgrounds
  background: string;       // page background
  surface: string;          // card / elevated surface
  surfaceHover: string;     // subtle hover / pressed state
  surfaceBorder: string;    // card border / separator

  // Cards (elevated above surface)
  cardBg: string;           // solid card background
  cardBorder: string;       // card border
  cardGlassBg: string;      // glass/frosted card background
  cardGlassBorder: string;  // glass card border

  // Text
  textPrimary: string;      // headings, body text
  textSecondary: string;    // subtitles, meta info
  textTertiary: string;     // placeholders, disabled
  textInverse: string;      // text on accent backgrounds

  // Accent / brand
  accent: string;           // primary action colour
  accentLight: string;      // lighter tint for badges / backgrounds
  accentText: string;       // text over accentLight

  // Input fields
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;

  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;

  // Status
  danger: string;
  success: string;
  warning: string;

  // Misc
  shadow: string;           // shadow colour
  overlay: string;          // modal overlay
  skeleton: string;         // loading skeleton
  icon: string;             // default icon colour
}

const lightColors: AppThemeColors = {
  background: palette.offWhite,
  surface: palette.white,
  surfaceHover: '#E8F2F8',
  surfaceBorder: palette.cBDD8E9,

  cardBg: palette.white,
  cardBorder: palette.cBDD8E9,
  cardGlassBg: 'rgba(255, 255, 255, 0.78)',
  cardGlassBorder: 'rgba(189, 216, 233, 0.6)',

  textPrimary: palette.c001D39,
  textSecondary: palette.c49769F,
  textTertiary: palette.c6EA2B3,
  textInverse: palette.white,

  accent: palette.c0A4174,
  accentLight: 'rgba(189, 216, 233, 0.35)',
  accentText: palette.c0A4174,

  inputBg: '#EBF4F9',
  inputBorder: palette.c6EA2B3,
  inputText: palette.c001D39,
  inputPlaceholder: palette.c49769F,

  tabBar: palette.white,
  tabBarBorder: palette.cBDD8E9,
  tabActive: palette.c0A4174,
  tabInactive: palette.c49769F,

  danger: palette.red,
  success: palette.green,
  warning: palette.orange,

  shadow: 'rgba(0, 29, 57, 0.08)',
  overlay: 'rgba(0, 29, 57, 0.55)',
  skeleton: palette.cBDD8E9,
  icon: palette.c49769F,
};

const darkColors: AppThemeColors = {
  // Rich deep-space backgrounds
  background: palette.darkBg,
  surface: palette.darkSurface2,
  surfaceHover: palette.darkSurface4,
  surfaceBorder: palette.darkBorder,

  // Cards — elevated, glowing, premium
  cardBg: '#16202E',                          // Rich navy-slate card
  cardBorder: '#253347',                      // Visible but subtle border
  cardGlassBg: 'rgba(20, 30, 50, 0.82)',      // Deep glass with navy tint
  cardGlassBorder: 'rgba(56, 189, 248, 0.18)',// Faint cyan glow border

  // High-contrast text on deep dark backgrounds
  textPrimary: '#E8F4FF',        // Crisp near-white with blue tint
  textSecondary: '#8BAFC8',      // Muted blue-grey
  textTertiary: '#4A6480',       // Dim placeholder / disabled
  textInverse: palette.darkBg,

  // Electric cyan accent
  accent: palette.accentCyan,
  accentLight: 'rgba(56, 189, 248, 0.12)',
  accentText: palette.accentCyan,

  // Input fields — subtle elevated surface
  inputBg: palette.darkSurface3,
  inputBorder: palette.darkBorderBright,
  inputText: '#E8F4FF',
  inputPlaceholder: '#4A6480',

  // Tab bar — glassy deep midnight
  tabBar: palette.darkBg2,
  tabBarBorder: 'rgba(56, 189, 248, 0.25)',
  tabActive: palette.accentCyan,
  tabInactive: '#4A6480',

  // Status — vivid on dark
  danger: palette.dangerDark,
  success: palette.successDark,
  warning: palette.warningDark,

  shadow: 'rgba(0, 0, 0, 0.6)',
  overlay: 'rgba(5, 8, 18, 0.85)',
  skeleton: palette.darkSurface3,
  icon: '#8BAFC8',
};

// ── Typography ──────────────────────────────────────────────────────────────
export const typography = {
  fontFamily: 'SF Pro Display',
  fontFamilyRounded: 'SF Pro Rounded',
};

// ── Hook ────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { colors, isDark, typography };
}

// Re-export legacy Colors for backwards-compat with existing components
export { Colors } from './theme';
