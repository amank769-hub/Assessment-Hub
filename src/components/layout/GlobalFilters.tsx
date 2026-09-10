import { useState } from 'react'
import { Filter, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { BANDS, BUSINESS_UNITS, COUNTRIES, HIRING_MANAGERS, RECRUITERS } from '@/data'
import type { Band, BusinessUnit, CountryCode, GlobalFilters } from '@/data/types'
import { Badge, Button, cx } from '@/components/ui'

const DATE_RANGES: { value: GlobalFilters['dateRange']; label: string }[] = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'all', label: 'All time' },
]

const Pick = ({
  label, value, onChange, options, width = 'w-auto',
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; width?: string }) => {
  const active = value !== 'all'
  return (
    <label className={cx('relative inline-flex items-center', width)}>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className={cx('h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[13px] font-medium cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-electric-500/20',
          active ? 'border-electric-200 bg-electric-50 text-electric-700' : 'border-surface-line bg-white text-ink-soft hover:border-slate-300')}>
        <option value="all">{label}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <svg className="pointer-events-none absolute right-2 h-3 w-3 text-current opacity-50" viewBox="0 0 12 12" fill="none">
        <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </label>
  )
}

/**
 * One filter row above the content, as the interaction rules require — never
 * a filter panel that hides what is being filtered.
 */
export const GlobalFilterBar = () => {
  const { state, dispatch } = useApp()
  const f = state.filters
  const [expanded, setExpanded] = useState(false)

  const activeCount = [f.country, f.businessUnit, f.hiringManagerId, f.recruiterId, f.requisitionId, f.band]
    .filter(v => v !== 'all').length

  const set = (patch: Partial<GlobalFilters>) => dispatch({ type: 'SET_FILTERS', filters: patch })

  return (
    <div className="border-t border-surface-line/70 bg-white/70">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 sm:px-6 py-2">
        <span className="inline-flex items-center gap-1.5 shrink-0 text-2xs font-semibold uppercase tracking-wider text-ink-faint">
          <Filter className="h-3 w-3" /> Filters
        </span>

        <Pick label="Country" value={f.country}
          onChange={v => set({ country: v as CountryCode | 'all' })}
          options={COUNTRIES.map(c => ({ value: c.code, label: `${c.flag} ${c.name}` }))} />

        <Pick label="Business unit" value={f.businessUnit}
          onChange={v => set({ businessUnit: v as BusinessUnit | 'all' })}
          options={BUSINESS_UNITS.map(b => ({ value: b, label: b }))} />

        <Pick label="Hiring manager" value={f.hiringManagerId}
          onChange={v => set({ hiringManagerId: v })}
          options={HIRING_MANAGERS.map(p => ({ value: p.id, label: p.name }))} />

        <Pick label="Recruiter" value={f.recruiterId}
          onChange={v => set({ recruiterId: v })}
          options={RECRUITERS.map(p => ({ value: p.id, label: p.name }))} />

        {expanded && (
          <>
            <Pick label="Requisition" value={f.requisitionId}
              onChange={v => set({ requisitionId: v })}
              options={state.requisitions.map(r => ({ value: r.id, label: `${r.id} · ${r.title.slice(0, 28)}` }))} />
            <Pick label="Band" value={f.band}
              onChange={v => set({ band: v as Band | 'all' })}
              options={BANDS.map(b => ({ value: b, label: b }))} />
          </>
        )}

        <label className="relative inline-flex items-center shrink-0">
          <span className="sr-only">Date range</span>
          <select value={f.dateRange} onChange={e => set({ dateRange: e.target.value as GlobalFilters['dateRange'] })}
            className="h-8 appearance-none rounded-lg border border-surface-line bg-white pl-2.5 pr-7 text-[13px] font-medium text-ink-soft cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-electric-500/20">
            {DATE_RANGES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-2 h-3 w-3 text-ink-faint" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </label>

        <button onClick={() => setExpanded(v => !v)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-surface-line bg-white px-2.5 h-8 text-[13px] font-medium text-ink-soft hover:border-slate-300 transition-colors">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {expanded ? 'Fewer' : 'More'}
        </button>

        {activeCount > 0 && (
          <>
            <Badge tone="blue" className="shrink-0">{activeCount} active</Badge>
            <Button size="xs" variant="ghost" onClick={() => dispatch({ type: 'RESET_FILTERS' })} className="shrink-0">
              <RotateCcw className="h-3 w-3" /> Clear
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
