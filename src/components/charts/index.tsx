import React, { useMemo, useState } from 'react'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  ALL_PAIRS_SERIES_CAP, AXIS_TEXT, GRID, LOW_CONTRAST_SERIES, ORDINAL,
  SEQUENTIAL, seqFor, seqInk, seriesAt,
} from '@/theme/tokens'
import { cx } from '@/components/ui'
import { ChartFrame, TipShell, type TableView } from './ChartFrame'

export { ChartFrame, TipShell }
export type { TableView }

const axis = { stroke: GRID, tick: { fill: AXIS_TEXT, fontSize: 11 }, tickLine: false, axisLine: { stroke: GRID } }

/* ══ Funnel ═══════════════════════════════════════════════════════════════
   Stages are ordinal, so they take a one-hue ramp rather than a categorical
   palette. Every bar is directly labelled, so the colour is never carrying
   the value on its own. ═════════════════════════════════════════════════ */

export const FunnelChart = ({
  data, title, subtitle, className,
}: { data: { stage: string; count: number }[]; title?: React.ReactNode; subtitle?: React.ReactNode; className?: string }) => {
  const [hover, setHover] = useState<number | null>(null)
  const top = data[0]?.count || 1

  const table: TableView = {
    columns: ['Stage', 'Candidates', 'Step conversion', 'From applied'],
    rows: data.map((d, i) => [
      d.stage, d.count,
      i === 0 ? '—' : `${((d.count / (data[i - 1].count || 1)) * 100).toFixed(1)}%`,
      `${((d.count / top) * 100).toFixed(1)}%`,
    ]),
  }

  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} className={className}
      footnote="Step conversion is the drop from the stage immediately above.">
      <div className="space-y-1.5">
        {data.map((d, i) => {
          const pct = (d.count / top) * 100
          const step = i === 0 ? null : (d.count / (data[i - 1].count || 1)) * 100
          const color = ORDINAL[Math.min(i, ORDINAL.length - 1)]
          const isHover = hover === i
          return (
            <div key={d.stage}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              className="group relative flex items-center gap-3 cursor-default">
              <span className="w-[7.5rem] shrink-0 text-xs font-medium text-ink-soft truncate">{d.stage}</span>
              <div className="relative flex-1 h-9 rounded-lg bg-surface-sunken/70 overflow-hidden min-w-0">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2.5"
                  style={{ width: `${Math.max(pct, 8)}%`, background: color, opacity: isHover ? 1 : 0.94 }}
                >
                  <span className="tnum text-[13px] font-bold text-white drop-shadow-sm">{d.count.toLocaleString()}</span>
                </div>
              </div>
              <span className="w-14 shrink-0 text-right tnum text-xs font-semibold"
                style={{ color: step == null ? AXIS_TEXT : step >= 55 ? '#0CA30C' : step >= 25 ? '#EC835A' : '#D03B3B' }}>
                {step == null ? '—' : `${step.toFixed(0)}%`}
              </span>
              {isHover && (
                <div className="absolute left-[8rem] -top-1 z-30 -translate-y-full pointer-events-none">
                  <TipShell title={d.stage}
                    rows={[
                      { label: 'Candidates', value: d.count.toLocaleString(), color },
                      { label: 'Share of applied', value: `${((d.count / top) * 100).toFixed(1)}%` },
                      ...(step != null ? [{ label: 'Conversion from previous', value: `${step.toFixed(1)}%` }] : []),
                    ]}
                    note={step != null && step < 30 ? 'Largest drop-off in the pipeline — worth a look at the stage before this one.' : undefined} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}

/* ══ Radar ════════════════════════════════════════════════════════════════
   An overlay is an all-pairs form: any two lines can sit beside each other.
   Only the first four palette slots validate all-pairs, so past four
   candidates this switches to small multiples rather than inventing hues. ══ */

export interface RadarSeries { id: string; name: string; values: number[] }

export const RadarCompare = ({
  axes, series, max = 6, title, subtitle, className, height = 300,
}: { axes: string[]; series: RadarSeries[]; max?: number; title?: React.ReactNode; subtitle?: React.ReactNode; className?: string; height?: number }) => {
  const overlay = series.length <= ALL_PAIRS_SERIES_CAP

  const data = useMemo(() => axes.map((a, i) => {
    const row: Record<string, string | number> = { axis: a.length > 22 ? a.slice(0, 20) + '…' : a, full: a }
    series.forEach((s, si) => { row[`s${si}`] = Number((s.values[i] ?? 0).toFixed(2)) })
    return row
  }), [axes, series])

  const table: TableView = {
    columns: ['Competency', ...series.map(s => s.name)],
    rows: axes.map((a, i) => [a, ...series.map(s => Number((s.values[i] ?? 0).toFixed(2)))]),
  }

  const legend = series.map((s, i) => ({ label: s.name, color: seriesAt(i) }))

  if (!overlay) {
    // Small multiples: one facet per candidate, all in the same slot-1 hue.
    return (
      <ChartFrame title={title}
        subtitle={<>Showing {series.length} candidates as small multiples — an overlay past {ALL_PAIRS_SERIES_CAP} series stops being reliably distinguishable, so each gets its own panel.</>}
        table={table} className={className}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {series.map((s, si) => (
            <div key={s.id} className="rounded-xl border border-surface-line p-2">
              <p className="text-xs font-semibold text-ink truncate px-1 mb-1">{s.name}</p>
              <div style={{ height: 168 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data} outerRadius="72%">
                    <PolarGrid stroke={GRID} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: AXIS_TEXT, fontSize: 8 }} />
                    <PolarRadiusAxis domain={[0, max]} tick={false} axisLine={false} />
                    <Radar dataKey={`s${si}`} stroke={seriesAt(0)} fill={seriesAt(0)} fillOpacity={0.22} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </ChartFrame>
    )
  }

  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} table={table} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="76%">
          <PolarGrid stroke={GRID} />
          <PolarAngleAxis dataKey="axis" tick={{ fill: AXIS_TEXT, fontSize: 10 }} />
          <PolarRadiusAxis domain={[0, max]} tickCount={4} tick={{ fill: '#94A3B8', fontSize: 9 }} axisLine={false} />
          <Tooltip content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const full = (payload[0].payload as { full: string }).full
            return <TipShell title={full}
              rows={payload.map((p, i) => ({ label: series[i]?.name ?? '', value: `${Number(p.value).toFixed(2)} / ${max}`, color: seriesAt(i) }))} />
          }} />
          {series.map((s, i) => (
            <Radar key={s.id} name={s.name} dataKey={`s${i}`}
              stroke={seriesAt(i)} fill={seriesAt(i)} fillOpacity={0.14} strokeWidth={2} />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

/* ══ Stacked / grouped bars ═══════════════════════════════════════════════ */

export const StackedBars = ({
  data, keys, xKey, title, subtitle, height = 250, stacked = true, className, unit = '', horizontal = false,
}: {
  data: Record<string, string | number>[]
  keys: { key: string; label: string }[]
  xKey: string
  title?: React.ReactNode; subtitle?: React.ReactNode; height?: number
  stacked?: boolean; className?: string; unit?: string; horizontal?: boolean
}) => {
  const legend = keys.map((k, i) => ({ label: k.label, color: seriesAt(i) }))
  const table: TableView = {
    columns: [xKey, ...keys.map(k => k.label)],
    rows: data.map(d => [String(d[xKey]), ...keys.map(k => Number(d[k.key] ?? 0))]),
  }
  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} table={table} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 6, right: 8, left: horizontal ? 4 : -18, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid stroke={GRID} vertical={horizontal} horizontal={!horizontal} strokeDasharray="0" />
          {horizontal
            ? <><XAxis type="number" {...axis} /><YAxis type="category" dataKey={xKey} width={112} {...axis} /></>
            : <><XAxis dataKey={xKey} {...axis} /><YAxis {...axis} /></>}
          <Tooltip cursor={{ fill: '#0F172A08' }} content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const total = payload.reduce((a, p) => a + Number(p.value ?? 0), 0)
            return <TipShell title={String(label)}
              rows={[
                ...payload.map(p => ({
                  label: keys.find(k => k.key === p.dataKey)?.label ?? String(p.dataKey),
                  value: `${Number(p.value).toLocaleString()}${unit}`,
                  color: p.color as string,
                })),
                ...(stacked && payload.length > 1 ? [{ label: 'Total', value: `${total.toLocaleString()}${unit}` }] : []),
              ]} />
          }} />
          {keys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} stackId={stacked ? 'a' : undefined}
              fill={seriesAt(i)} radius={stacked ? (i === keys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]) : [4, 4, 0, 0]}
              /* 2px surface gap keeps adjacent fills from bleeding into each other */
              stroke="#FFFFFF" strokeWidth={stacked ? 2 : 0} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

/* ══ Trend lines ══════════════════════════════════════════════════════════
   One axis only — measures on different scales get their own chart. ═══════ */

export const TrendLines = ({
  data, keys, xKey, title, subtitle, height = 230, className, unit = '', area = false,
}: {
  data: Record<string, string | number>[]
  keys: { key: string; label: string }[]
  xKey: string
  title?: React.ReactNode; subtitle?: React.ReactNode; height?: number; className?: string; unit?: string; area?: boolean
}) => {
  const legend = keys.map((k, i) => ({ label: k.label, color: seriesAt(i) }))
  const table: TableView = {
    columns: [xKey, ...keys.map(k => k.label)],
    rows: data.map(d => [String(d[xKey]), ...keys.map(k => Number(d[k.key] ?? 0))]),
  }
  const Chart = area ? AreaChart : LineChart
  return (
    <ChartFrame title={title} subtitle={subtitle} legend={legend} table={table} height={height} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
          <defs>
            {keys.map((k, i) => (
              <linearGradient key={k.key} id={`grad-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesAt(i)} stopOpacity={0.26} />
                <stop offset="100%" stopColor={seriesAt(i)} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey={xKey} {...axis} />
          <YAxis {...axis} />
          <Tooltip cursor={{ stroke: '#94A3B8', strokeDasharray: '3 3' }} content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return <TipShell title={String(label)} rows={payload.map(p => ({
              label: keys.find(k => k.key === p.dataKey)?.label ?? String(p.dataKey),
              value: `${Number(p.value).toFixed(1)}${unit}`, color: p.color as string,
            }))} />
          }} />
          {keys.map((k, i) => area ? (
            <Area key={k.key} type="monotone" dataKey={k.key} stroke={seriesAt(i)} strokeWidth={2}
              fill={`url(#grad-${k.key})`} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
          ) : (
            <Line key={k.key} type="monotone" dataKey={k.key} stroke={seriesAt(i)} strokeWidth={2}
              dot={false} activeDot={{ r: 4.5, strokeWidth: 2, stroke: '#fff' }} />
          ))}
        </Chart>
      </ResponsiveContainer>
    </ChartFrame>
  )
}

/* ══ Heat map ═════════════════════════════════════════════════════════════
   Continuous magnitude → one-hue sequential ramp, values printed in-cell so
   the fill never has to carry the number alone. ═══════════════════════════ */

export const Heatmap = ({
  rows, columns, values, max = 6, title, subtitle, className, rowLabelWidth = 190, formatter,
}: {
  rows: string[]
  columns: string[]
  values: (number | null)[][]
  max?: number
  title?: React.ReactNode; subtitle?: React.ReactNode; className?: string; rowLabelWidth?: number
  formatter?: (v: number) => string
}) => {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null)
  const fmt = formatter ?? ((v: number) => v.toFixed(v % 1 === 0 ? 0 : 1))
  const table: TableView = {
    columns: ['', ...columns],
    rows: rows.map((r, ri) => [r, ...values[ri].map(v => (v == null ? '—' : fmt(v)))]),
  }
  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} className={className}
      footnote={
        <span className="inline-flex items-center gap-2">
          <span>Low</span>
          <span className="inline-flex rounded overflow-hidden">
            {SEQUENTIAL.map(c => <span key={c} className="h-2.5 w-5" style={{ background: c }} />)}
          </span>
          <span>High · out of {max}</span>
        </span>
      }>
      <div className="overflow-x-auto scroll-thin">
        <div className="min-w-max">
          <div className="flex items-end gap-1 mb-1" style={{ paddingLeft: rowLabelWidth }}>
            {columns.map(c => (
              <div key={c} className="w-[74px] shrink-0 text-center text-2xs font-semibold text-ink-muted leading-tight px-1">{c}</div>
            ))}
          </div>
          {rows.map((r, ri) => (
            <div key={r} className="flex items-center gap-1 mb-1">
              <div className="shrink-0 pr-3 text-xs text-ink-soft leading-tight" style={{ width: rowLabelWidth }} title={r}>
                <span className="line-clamp-2">{r}</span>
              </div>
              {columns.map((c, ci) => {
                const v = values[ri]?.[ci]
                const t = v == null ? 0 : v / max
                const isHover = hover?.r === ri && hover?.c === ci
                return (
                  <div key={c} className="relative w-[74px] shrink-0"
                    onMouseEnter={() => setHover({ r: ri, c: ci })} onMouseLeave={() => setHover(null)}>
                    <div className={cx('h-9 rounded-md grid place-items-center tnum text-[13px] font-semibold transition-all',
                      isHover && 'ring-2 ring-offset-1 ring-electric-500')}
                      style={{
                        background: v == null ? '#F8FAFC' : seqFor(t),
                        color: v == null ? '#CBD5E1' : seqInk(t),
                        border: v == null ? '1px dashed #E2E8F0' : 'none',
                      }}>
                      {v == null ? '—' : fmt(v)}
                    </div>
                    {isHover && v != null && (
                      <div className="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 pointer-events-none">
                        <TipShell title={r} rows={[{ label: c, value: `${fmt(v)} / ${max}` }]} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </ChartFrame>
  )
}

/* ══ Stage ageing ═════════════════════════════════════════════════════════ */

export const StageAgeingTable = ({
  data, title, subtitle, className,
}: {
  data: { stage: string; medianDays: number; slaDays: number; oldestDays: number; count: number }[]
  title?: React.ReactNode; subtitle?: React.ReactNode; className?: string
}) => {
  const maxDays = Math.max(...data.map(d => Math.max(d.oldestDays, d.slaDays)), 1)
  const table: TableView = {
    columns: ['Stage', 'In stage', 'Median days', 'SLA', 'Oldest'],
    rows: data.map(d => [d.stage, d.count, d.medianDays, d.slaDays, d.oldestDays]),
  }
  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} className={className}
      footnote="The bar shows median days in stage. The notch marks the SLA — anything past it is ageing.">
      <div className="space-y-2">
        {data.map(d => {
          const over = d.medianDays > d.slaDays
          const pct = (d.medianDays / maxDays) * 100
          const slaPct = (d.slaDays / maxDays) * 100
          return (
            <div key={d.stage} className="flex items-center gap-3 group">
              <span className="w-36 shrink-0 text-xs font-medium text-ink-soft truncate">{d.stage}</span>
              <span className="w-7 shrink-0 text-center tnum text-2xs font-semibold text-ink-muted">{d.count}</span>
              <div className="relative flex-1 h-7 rounded-lg bg-surface-sunken/70 min-w-0">
                <div className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                  style={{ width: `${Math.max(pct, 2)}%`, background: over ? '#EC835A' : '#2a78d6', opacity: 0.9 }} />
                <div className="absolute inset-y-0 w-px bg-navy-800" style={{ left: `${slaPct}%` }} title={`SLA ${d.slaDays}d`} />
                <span className="absolute inset-y-0 right-2 grid place-items-center tnum text-2xs font-semibold text-ink-soft">
                  {d.medianDays}d {over && <span className="text-rag-serious">· {(d.medianDays - d.slaDays).toFixed(1)}d over</span>}
                </span>
              </div>
              <span className="w-14 shrink-0 text-right tnum text-2xs text-ink-muted">max {d.oldestDays}d</span>
            </div>
          )
        })}
      </div>
    </ChartFrame>
  )
}

/* ══ Small pieces ═════════════════════════════════════════════════════════ */

/** A hero number with a supporting sparkline — not a chart, so no legend. */
export const Sparkline = ({ points, color = seriesAt(0), height = 34, className }: { points: number[]; color?: string; height?: number; className?: string }) => {
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const w = 100
  const d = points.map((p, i) => `${(i / (points.length - 1)) * w},${height - ((p - min) / range) * (height - 4) - 2}`).join(' L ')
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className={cx('w-full', className)} style={{ height }} aria-hidden>
      <defs>
        <linearGradient id={`spark-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={`M ${d} L ${w},${height} L 0,${height} Z`} fill={`url(#spark-${color.slice(1)})`} />
      <path d={`M ${d}`} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Radial gauge for a single 0–100 score. The number is the encoding; the ring supports it. */
export const ScoreRing = ({
  value, size = 84, stroke = 8, color, label,
}: { value: number; size?: number; stroke?: number; color?: string; label?: string }) => {
  const c = color ?? (value >= 85 ? '#0CA30C' : value >= 70 ? '#2a78d6' : value >= 55 ? '#FAB219' : '#D03B3B')
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#EEF2F9" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={circ - (value / 100) * circ}
          strokeLinecap="round" className="transition-[stroke-dashoffset] duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="tnum font-bold text-ink leading-none" style={{ fontSize: size * 0.28 }}>{Math.round(value)}</span>
        {label && <span className="text-2xs text-ink-muted mt-0.5">{label}</span>}
      </div>
    </div>
  )
}

/** Horizontal comparison bars — used where identity matters more than trend. */
export const CompareBars = ({
  items, max, title, subtitle, unit = '', className, colorFn,
}: {
  items: { label: string; value: number; note?: string }[]
  max?: number; title?: React.ReactNode; subtitle?: React.ReactNode; unit?: string; className?: string
  colorFn?: (v: number, i: number) => string
}) => {
  const top = max ?? Math.max(...items.map(i => i.value), 1)
  const table: TableView = { columns: ['Item', 'Value'], rows: items.map(i => [i.label, i.value]) }
  return (
    <ChartFrame title={title} subtitle={subtitle} table={table} className={className}>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={it.label} className="flex items-center gap-3">
            <span className="w-32 shrink-0 text-xs text-ink-soft truncate" title={it.label}>{it.label}</span>
            <div className="relative flex-1 h-6 rounded-md bg-surface-sunken/70 min-w-0">
              <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
                style={{ width: `${Math.max((it.value / top) * 100, 2)}%`, background: colorFn ? colorFn(it.value, i) : seriesAt(0) }} />
            </div>
            <span className="w-16 shrink-0 text-right tnum text-xs font-semibold text-ink">{it.value.toLocaleString()}{unit}</span>
            {it.note && <span className="w-20 shrink-0 text-right text-2xs text-ink-muted truncate">{it.note}</span>}
          </div>
        ))}
      </div>
    </ChartFrame>
  )
}

/** Talk-time split. Two segments with a 2px surface gap and both directly labelled. */
export const TalkRatioBar = ({ interviewer, candidate, className }: { interviewer: number; candidate: number; className?: string }) => {
  const healthy = candidate >= 60 && candidate <= 80
  return (
    <div className={cx('min-w-0', className)}>
      <div className="flex h-7 w-full overflow-hidden rounded-lg gap-0.5">
        <div className="grid place-items-center text-2xs font-bold text-white transition-all duration-700"
          style={{ width: `${interviewer}%`, background: seriesAt(1) }}>{interviewer}%</div>
        <div className="grid place-items-center text-2xs font-bold text-white transition-all duration-700"
          style={{ width: `${candidate}%`, background: healthy ? seriesAt(0) : '#EC835A' }}>{candidate}%</div>
      </div>
      <div className="mt-1.5 flex items-center justify-between text-2xs text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: seriesAt(1) }} />Interviewer</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: healthy ? seriesAt(0) : '#EC835A' }} />Candidate</span>
      </div>
      {!healthy && (
        <p className="mt-1.5 text-2xs text-rag-serious leading-snug">
          {candidate < 60 ? 'The interviewer spoke more than the target. Less evidence gathered per minute.' : 'Very candidate-heavy — check that the competencies were actually probed.'}
        </p>
      )}
    </div>
  )
}

export { LOW_CONTRAST_SERIES, seriesAt }
