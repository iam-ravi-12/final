/**
 * Centralized app-wide theme colours.
 * Every screen should import `useAppTheme()` and use the returned `colors`
 * object instead of hardcoding colour values.
 *
 * Palette philosophy
 * ──────────────────
 * Light mode  — clean white/grey with blue (#0A66C2) accent.
 * Dark mode   — deep charcoal (#0D1117) with soft blue (#58A6FF) accent.
 * Both modes share a monochrome feel with minimal saturated colour.
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

  // Semantic
  red: '#E5534B',
  green: '#3FB950',
  orange: '#D29922',
};

// ── Theme tokens ────────────────────────────────────────────────────────────
export interface AppThemeColors {
  // Backgrounds
  background: string;       // page background
  surface: string;          // card / elevated surface
  surfaceHover: string;     // subtle hover / pressed state
  surfaceBorder: string;    // card border / separator

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
  background: palette.c001D39,
  surface: palette.darkCard,
  surfaceHover: palette.c0A4174,
  surfaceBorder: '#0E345A',

  textPrimary: palette.cBDD8E9,
  textSecondary: palette.c7BBDE8,
  textTertiary: palette.c6EA2B3,
  textInverse: palette.c001D39,

  accent: palette.c7BBDE8,
  accentLight: 'rgba(123, 189, 232, 0.15)',
  accentText: palette.c7BBDE8,

  inputBg: palette.darkSurface,
  inputBorder: palette.c49769F,
  inputText: palette.cBDD8E9,
  inputPlaceholder: palette.c49769F,

  tabBar: palette.darkSurface,
  tabBarBorder: '#0E345A',
  tabActive: palette.c7BBDE8,
  tabInactive: palette.c49769F,

  danger: palette.red,
  success: palette.green,
  warning: palette.orange,

  shadow: 'rgba(0, 0, 0, 0.4)',
  overlay: 'rgba(0, 15, 30, 0.8)',
  skeleton: '#0E345A',
  icon: palette.c6EA2B3,
};

// ── Hook ────────────────────────────────────────────────────────────────────
export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return { colors, isDark };
}

// Re-export legacy Colors for backwards-compat with existing components
export { Colors } from './theme';
