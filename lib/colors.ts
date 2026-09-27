/**
 * React Native-readable mirrors of the semantic colours in global.css.
 * Native icon props cannot consume oklch() values from Uniwind.
 */
export const COLORS = {
  /** --accent, SmartSave violet */
  accent: '#7567F4',
  /** --accent-foreground */
  onAccent: '#FFFFFF',
  /** --foreground */
  ink: '#F8F7FF',
  /** --muted */
  muted: '#B8B5C8',
  /** Decorative marks and quiet controls */
  subtle: '#817E91',
  /** Navy app canvas */
  canvas: '#080810',
  /** Translucent card border */
  glassBorder: 'rgba(255,255,255,0.14)',
  /** --color-urgent */
  urgent: '#FF8A85',
  /** --color-soon */
  soon: '#F4C96B',
  /** --color-calm */
  calm: '#BDB8CD',
} as const;

/** Native-only palette for the cinematic signed-out welcome flow. */
export const WELCOME_COLORS = {
  navy: '#01040F',
  navyFade: 'rgba(1, 4, 15, 0.96)',
  transparentNavy: 'rgba(1, 4, 15, 0)',
  violet: '#5B4BCC',
  violetGlow: '#7567F4',
  white: '#FFFFFF',
} as const;
