/**
 * Dates in the sample data are expressed relative to "now" so the demo always
 * reads as a live pipeline — interviews land today, SLAs age realistically.
 */

export const NOW = new Date()

/** Start of today, local. */
export const startOfToday = () => {
  const d = new Date(NOW)
  d.setHours(0, 0, 0, 0)
  return d
}

/** ISO string offset from now by whole days, optionally pinned to a clock time. */
export const rel = (days: number, hh?: number, mm = 0): string => {
  const d = new Date(NOW)
  d.setDate(d.getDate() + days)
  if (hh !== undefined) d.setHours(hh, mm, 0, 0)
  return d.toISOString()
}

/** Offset from now by hours — used for "2 hours ago" activity entries. */
export const relHours = (hours: number): string => {
  const d = new Date(NOW)
  d.setHours(d.getHours() + hours)
  return d.toISOString()
}

export const daysBetween = (a: string | Date, b: string | Date = NOW): number => {
  const d1 = typeof a === 'string' ? new Date(a) : a
  const d2 = typeof b === 'string' ? new Date(b) : b
  return Math.round((d2.getTime() - d1.getTime()) / 86_400_000)
}

export const isSameDay = (a: string | Date, b: string | Date = NOW): boolean => {
  const d1 = typeof a === 'string' ? new Date(a) : a
  const d2 = typeof b === 'string' ? new Date(b) : b
  return d1.getFullYear() === d2.getFullYear()
    && d1.getMonth() === d2.getMonth()
    && d1.getDate() === d2.getDate()
}

export const isFuture = (a: string) => new Date(a).getTime() > NOW.getTime()
export const isPast = (a: string) => new Date(a).getTime() < NOW.getTime()

export const fmtDate = (iso: string, opts: Intl.DateTimeFormatOptions = {}) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...opts })

export const fmtDateShort = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

export const fmtTime = (iso: string, timeZone?: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, ...(timeZone ? { timeZone } : {}) })

/** Renders an instant in the interview's own timezone — every schedule is multi-country. */
export const fmtInTz = (iso: string, timeZone: string) => {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      hour12: false, timeZone,
    })
  } catch {
    return fmtDate(iso) + ' ' + fmtTime(iso)
  }
}

export const fmtRelative = (iso: string): string => {
  const diffMs = new Date(iso).getTime() - NOW.getTime()
  const abs = Math.abs(diffMs)
  const mins = Math.round(abs / 60_000)
  const hrs = Math.round(abs / 3_600_000)
  const days = Math.round(abs / 86_400_000)
  const unit = mins < 60 ? `${mins}m` : hrs < 24 ? `${hrs}h` : `${days}d`
  return diffMs < 0 ? `${unit} ago` : `in ${unit}`
}

export const fmtDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
