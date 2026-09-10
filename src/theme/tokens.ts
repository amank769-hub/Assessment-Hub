/**
 * Data-visualisation tokens. The categorical order was chosen by running the
 * dataviz palette validator over candidate orderings and keeping only those
 * that clear every gate: worst adjacent CVD ΔE 9.2 (target ≥8) and worst
 * adjacent normal-vision ΔE 15.6 (floor ≥15) on a white surface.
 *
 * Slots 1–4 additionally clear the all-pairs test, which is why any chart
 * where two marks can sit side by side (radar overlays, scatter) is capped at
 * four series and falls back to small multiples beyond that.
 */
export const SERIES = [
  '#2a78d6', // 1 electric blue
  '#4a3aa7', // 2 violet
  '#eb6834', // 3 orange
  '#1baf7a', // 4 aqua
  '#008300', // 5 green
  '#e87ba4', // 6 magenta
  '#eda100', // 7 yellow
  '#e34948', // 8 red
] as const

/** Series that fall below 3:1 on white — these always ship direct labels. */
export const LOW_CONTRAST_SERIES = new Set(['#1baf7a', '#eda100', '#e87ba4'])

/** Beyond this, an all-pairs chart form switches to small multiples. */
export const ALL_PAIRS_SERIES_CAP = 4

/** Ordinal blue for funnel stages: monotone lightness, adjacent ΔL ≥ 0.06. */
export const ORDINAL = ['#73a7ec', '#5090e4', '#2e79d8', '#0763c4', '#004ea9', '#003c88', '#002b65'] as const

/** Sequential blue for heat maps — continuous magnitude, light end may recede. */
export const SEQUENTIAL = ['#eff5fe', '#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'] as const

/** Diverging: two poles with a neutral gray midpoint — never a hue in the middle. */
export const DIVERGING = ['#d03b3b', '#ec9a9a', '#eef0f4', '#86b6ef', '#2a78d6'] as const

/** Status is reserved and never reused as a series colour. Always icon + label. */
export const RAG = {
  good: '#0CA30C', warning: '#FAB219', serious: '#EC835A', critical: '#D03B3B',
} as const

export const GRID = '#E8EDF6'
export const AXIS_TEXT = '#64748B'

export const seriesAt = (i: number) => SERIES[i % SERIES.length]

/** Picks a sequential step for a 0–1 magnitude. */
export const seqFor = (t: number) =>
  SEQUENTIAL[Math.max(0, Math.min(SEQUENTIAL.length - 1, Math.round(t * (SEQUENTIAL.length - 1))))]

/** Picks a diverging step for a -1..1 polarity. */
export const divFor = (t: number) =>
  DIVERGING[Math.max(0, Math.min(DIVERGING.length - 1, Math.round(((t + 1) / 2) * (DIVERGING.length - 1))))]

/** Ink for text sitting on a sequential fill — flips at the midpoint. */
export const seqInk = (t: number) => (t > 0.55 ? '#FFFFFF' : '#0F172A')
