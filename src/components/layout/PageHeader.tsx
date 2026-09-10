import React from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cx } from '@/components/ui'

export const PageHeader = ({
  eyebrow, title, subtitle, actions, breadcrumbs, className, tabs,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: { label: string; to?: string }[]
  className?: string
  tabs?: React.ReactNode
}) => (
  <div className={cx('border-b border-surface-line bg-white', className)}>
    <div className="px-4 sm:px-6 pt-5 pb-4">
      {breadcrumbs && (
        <nav className="mb-2.5 flex items-center gap-1 text-xs text-ink-muted flex-wrap">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3 w-3 text-ink-faint" />}
              {b.to ? <Link to={b.to} className="hover:text-electric-600 transition-colors">{b.label}</Link> : <span className="text-ink-soft font-medium">{b.label}</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.02em] text-ink leading-tight">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-3xl text-[13px] sm:text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0 no-print">{actions}</div>}
      </div>
    </div>
    {tabs && <div className="px-4 sm:px-6">{tabs}</div>}
  </div>
)

export const Page = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cx('px-4 sm:px-6 py-5 space-y-5', className)}>{children}</div>
)

/** KPI tile. The number is the encoding; the sparkline and delta support it. */
export const StatTile = ({
  label, value, unit, delta, deltaGood, hint, icon, accent, footer, onClick, className,
}: {
  label: string
  value: React.ReactNode
  unit?: string
  delta?: string
  deltaGood?: boolean
  hint?: string
  icon?: React.ReactNode
  accent?: string
  footer?: React.ReactNode
  onClick?: () => void
  className?: string
}) => {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag onClick={onClick}
      className={cx('card card-pad text-left w-full transition-all', onClick && 'hover:shadow-lift hover:-translate-y-px cursor-pointer', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="label leading-tight">{label}</p>
        {icon && (
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
            style={{ background: `${accent ?? '#2a78d6'}14`, color: accent ?? '#2a78d6' }}>{icon}</span>
        )}
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span className="tnum text-[28px] font-bold leading-none tracking-[-0.02em] text-ink">{value}</span>
        {unit && <span className="text-sm font-medium text-ink-muted">{unit}</span>}
      </div>
      {delta && (
        <p className={cx('mt-1.5 text-xs font-semibold', deltaGood ? 'text-rag-good' : 'text-rag-serious')}>{delta}</p>
      )}
      {hint && <p className="mt-1.5 text-xs leading-snug text-ink-muted">{hint}</p>}
      {footer && <div className="mt-3">{footer}</div>}
    </Tag>
  )
}
