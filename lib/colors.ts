/**
 * Hex mirrors of the theme tokens in global.css.
 *
 * Uniwind classes cannot reach icon `color` props or other native colour
 * props, and React Native cannot parse `oklch(...)`, so those places read
 * from here instead of hard-coding a value.
 */
export const COLORS = {
  /** --accent, deep blue */
  accent: '#1E40AF',
  /** --accent-foreground, text and icons on top of the accent */
  onAccent: '#FFFFFF',
  /** --foreground, titles */
  ink: '#1B1F2A',
  /** --muted, metadata */
  muted: '#6B7280',
  /** Lighter than muted, for chevrons and other decorative marks */
  subtle: '#9AA3B2',
  /** --color-urgent, red badge */
  urgent: '#B42318',
  /** --color-soon, amber badge */
  soon: '#92400E',
  /** --color-calm, grey badge */
  calm: '#525A69',
} as const;
