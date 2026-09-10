import React, { useState } from 'react'
import { BarChart3, TableProperties } from 'lucide-react'
import { cx, Table, Td, Th } from '@/components/ui'

export interface TableView {
  columns: string[]
  rows: (string | number)[][]
}

/**
 * Every chart ships inside this frame, which guarantees three things the
 * dataviz rules require: a legend whenever there is more than one series, a
 * table view so identity and value never depend on colour alone, and a place
 * for the "what am I looking at" caption.
 */
export const ChartFrame = ({
  title, subtitle, legend, table, height, children, action, className, footnote,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  legend?: { label: string; color: string; note?: string }[]
  table?: TableView
  height?: number
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
  footnote?: React.ReactNode
}) => {
  const [asTable, setAsTable] = useState(false)

  return (
    <div className={cx('flex flex-col min-w-0', className)}>
      {(title || action || table) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {title && <h4 className="text-[13px] font-semibold text-ink leading-tight">{title}</h4>}
            {subtitle && <p className="mt-0.5 text-xs text-ink-muted leading-snug">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {action}
            {table && (
              <button
                onClick={() => setAsTable(v => !v)}
                aria-pressed={asTable}
                title={asTable ? 'Show chart' : 'Show the underlying numbers'}
                className="inline-flex items-center gap-1.5 rounded-lg border border-surface-line bg-white px-2 py-1 text-2xs font-semibold text-ink-muted hover:text-ink hover:border-slate-300 transition-colors no-print"
              >
                {asTable ? <BarChart3 className="h-3 w-3" /> : <TableProperties className="h-3 w-3" />}
                {asTable ? 'Chart' : 'Table'}
              </button>
            )}
          </div>
        </div>
      )}

      {asTable && table ? (
        <div className="rounded-xl border border-surface-line overflow-hidden">
          <Table>
            <thead><tr>{table.columns.map((c, i) => <Th key={c} align={i ? 'right' : 'left'}>{c}</Th>)}</tr></thead>
            <tbody>
              {table.rows.map((r, i) => (
                <tr key={i} className="hover:bg-surface-page/60">
                  {r.map((cell, j) => (
                    <Td key={j} align={j ? 'right' : 'left'} className={j === 0 ? 'font-medium text-ink' : 'text-ink-soft'}>
                      {typeof cell === 'number' ? cell.toLocaleString() : cell}
                    </Td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div style={height ? { height } : undefined} className="min-w-0">{children}</div>
      )}

      {legend && legend.length > 1 && !asTable && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {legend.map(l => (
            <span key={l.label} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-[3px] shrink-0 ring-1 ring-white" style={{ background: l.color }} />
              {l.label}
              {l.note && <span className="text-ink-faint">{l.note}</span>}
            </span>
          ))}
        </div>
      )}

      {footnote && !asTable && <p className="mt-2.5 text-xs text-ink-muted leading-snug">{footnote}</p>}
    </div>
  )
}

/** Shared tooltip shell so every chart's hover layer looks identical. */
export const TipShell = ({ title, rows, note }: { title: React.ReactNode; rows: { label: string; value: React.ReactNode; color?: string }[]; note?: React.ReactNode }) => (
  <div className="rounded-xl border border-surface-line bg-white px-3 py-2.5 shadow-lift min-w-[10rem] max-w-[18rem]">
    <p className="text-[13px] font-semibold text-ink leading-tight">{title}</p>
    <div className="mt-1.5 space-y-1">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-ink-muted min-w-0">
            {r.color && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />}
            <span className="truncate">{r.label}</span>
          </span>
          <span className="tnum font-semibold text-ink shrink-0">{r.value}</span>
        </div>
      ))}
    </div>
    {note && <p className="mt-2 pt-2 border-t border-surface-line text-xs text-ink-muted leading-snug">{note}</p>}
  </div>
)
