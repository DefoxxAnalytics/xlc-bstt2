/**
 * BSTT Dashboard Color System
 *
 * Design Direction: "Data Observatory"
 * - Dark, immersive background for extended viewing
 * - Electric accent colors for status indicators
 * - High contrast for data legibility
 */

export const COLORS = {
  // Core palette - Deep space theme
  background: {
    primary: '#0a0e17',      // Deep navy-black
    secondary: '#111827',    // Elevated surfaces
    tertiary: '#1e293b',     // Cards and containers
    elevated: '#243044',     // Hover states, modals
  },

  // Text hierarchy
  text: {
    primary: '#f8fafc',      // Headlines, important data
    secondary: '#94a3b8',    // Body text, labels
    muted: '#64748b',        // Captions, hints
    inverse: '#0f172a',      // Text on light backgrounds
  },

  // Status colors - Electric and vivid
  status: {
    success: '#10b981',      // Emerald - meeting targets
    warning: '#f59e0b',      // Amber - needs attention
    danger: '#ef4444',       // Red - critical issues
    info: '#3b82f6',         // Blue - neutral information
  },

  // Accent colors - For visual interest
  accent: {
    primary: '#06b6d4',      // Cyan - primary actions
    secondary: '#8b5cf6',    // Violet - secondary elements
    tertiary: '#ec4899',     // Pink - highlights
  },

  // Chart-specific colors
  chart: {
    grid: '#1e293b',
    axis: '#475569',
    tooltip: '#1e293b',
  },

  // Border colors
  border: {
    subtle: '#1e293b',
    default: '#334155',
    strong: '#475569',
  },
};

// Entry type specific colors
export const ENTRY_TYPE_COLORS: Record<string, string> = {
  'Finger': '#10b981',           // Emerald - good
  'Write-In': '#ef4444',         // Red - attention
  'Provisional Entry': '#f59e0b', // Amber - warning
  'Missing c/o': '#3b82f6',      // Blue - info
};

// KPI thresholds for conditional formatting
export const THRESHOLDS = {
  finger_rate: {
    excellent: 95,   // >= 95% is green
    good: 90,        // 90-95% is yellow
    poor: 0,         // < 90% is red
  },
  provisional_max: 1.0,
  write_in_max: 3.0,
  missing_co_max: 2.0,
  enrollment_threshold: 2, // Provisional count triggering enrollment
};

// Get status color based on finger rate value
export const getFingerRateStatus = (rate: number): string => {
  if (rate >= THRESHOLDS.finger_rate.excellent) return COLORS.status.success;
  if (rate >= THRESHOLDS.finger_rate.good) return COLORS.status.warning;
  return COLORS.status.danger;
};

// Get status color based on rate vs threshold (lower is better)
export const getRateStatus = (rate: number, threshold: number): string => {
  if (rate <= threshold) return COLORS.status.success;
  if (rate <= threshold * 2) return COLORS.status.warning;
  return COLORS.status.danger;
};

// Gradient definitions for special effects
export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  dark: 'linear-gradient(180deg, #111827 0%, #0a0e17 100%)',
  glow: 'radial-gradient(ellipse at center, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
};
