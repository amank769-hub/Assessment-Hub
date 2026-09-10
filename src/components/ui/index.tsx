import React, { useEffect, useRef, useState } from 'react'
import {
  AlertTriangle, Check, ChevronDown, Info, Loader2, ShieldAlert, Sparkles, X, XCircle,
} from 'lucide-react'
import { RAG } from '@/theme/tokens'
import type { RagStatus } from '@/data/types'

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(' ')

/* ── Card ─────────────────────────────────────────────────────────────── */

export const Card = ({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx('card', className)} {...rest}>{children}</div>
)

export const CardHeader = ({
  title, subtitle, action, icon, className,
}: { title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode; className?: string }) => (
  <div className={cx('flex items-start justify-between gap-4 px-5 pt-5', className)}>
    <div className="flex items-start gap-3 min-w-0">
      {icon && <div className="mt-0.5 shrink-0 grid place-items-center h-8 w-8 rounded-lg bg-electric-50 text-electric-600">{icon}</div>}
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold text-ink leading-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-[13px] text-ink-muted leading-snug">{subtitle}</p>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
)

/* ── Button ───────────────────────────────────────────────────────────── */

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle' | 'dark'
type BtnSize = 'xs' | 'sm' | 'md'

const BTN: Record<BtnVariant, string> = {
  primary: 'bg-electric-600 text-white hover:bg-electric-700 shadow-sm border border-electric-700/20',
  secondary: 'bg-white text-ink border border-surface-line hover:bg-surface-sunken hover:border-slate-300',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-sunken border border-transparent',
  subtle: 'bg-electric-50 text-electric-700 border border-electric-100 hover:bg-electric-100',
  danger: 'bg-white text-rag-critical border border-rag-critical/30 hover:bg-rag-critical/5',
  dark: 'bg-navy-800 text-white hover:bg-navy-700 border border-navy-900/40',
}
const BTN_SIZE: Record<BtnSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
}

export const Button = ({
  variant = 'secondary', size = 'sm', loading, className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: BtnSize; loading?: boolean }) => (
  <button
    className={cx('inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
      BTN[variant], BTN_SIZE[size], className)}
    {...rest}
  >
    {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
    {children}
  </button>
)

export const IconButton = ({ label, className, children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
  <button aria-label={label} title={label}
    className={cx('grid place-items-center h-8 w-8 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors', className)}
    {...rest}>{children}</button>
)

/* ── Badge & pills ────────────────────────────────────────────────────── */

export const Badge = ({
  children, tone = 'neutral', className, dot,
}: { children: React.ReactNode; tone?: 'neutral' | 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'navy'; className?: string; dot?: boolean }) => {
  const tones = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    blue: 'bg-electric-50 text-electric-700 border-electric-100',
    violet: 'bg-violet-50 text-violet-700 border-violet-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    navy: 'bg-navy-800 text-white border-navy-900',
  }
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-semibold', tones[tone], className)}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  )
}

const RAG_META: Record<RagStatus, { label: string; Icon: typeof Check }> = {
  good: { label: 'On track', Icon: Check },
  warning: { label: 'Watch', Icon: Info },
  serious: { label: 'At risk', Icon: AlertTriangle },
  critical: { label: 'Critical', Icon: ShieldAlert },
}

/** Status never travels on colour alone — always an icon and a word. */
export const RagPill = ({ status, label, className }: { status: RagStatus; label?: string; className?: string }) => {
  const { label: def, Icon } = RAG_META[status]
  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-2xs font-semibold border', className)}
      style={{ color: RAG[status], borderColor: `${RAG[status]}44`, background: `${RAG[status]}0F` }}>
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {label ?? def}
    </span>
  )
}

export const RagDot = ({ status, className }: { status: RagStatus; className?: string }) => (
  <span className={cx('inline-block h-2 w-2 rounded-full ring-2 ring-white', className)} style={{ background: RAG[status] }} />
)

/** Marks AI-generated content so it can never be mistaken for a human's words. */
export const AiChip = ({ label = 'AI suggested', className, confidence }: { label?: string; className?: string; confidence?: number }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-2xs font-semibold text-violet-700', className)}>
    <Sparkles className="h-3 w-3" strokeWidth={2.5} />
    {label}
    {confidence != null && <span className="tnum opacity-70">{Math.round(confidence * 100)}%</span>}
  </span>
)

export const HumanChip = ({ className, label = 'Interviewer confirmed' }: { className?: string; label?: string }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-2xs font-semibold text-emerald-700', className)}>
    <Check className="h-3 w-3" strokeWidth={3} />{label}
  </span>
)

/* ── Avatar ───────────────────────────────────────────────────────────── */

export const Avatar = ({
  name, tint = '#2A78D6', size = 32, className, ring,
}: { name: string; tint?: string; size?: number; className?: string; ring?: boolean }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  return (
    <span
      className={cx('inline-grid place-items-center rounded-full font-semibold text-white shrink-0 select-none', ring && 'ring-2 ring-white', className)}
      style={{ width: size, height: size, background: tint, fontSize: size * 0.36 }}
      title={name}
    >{initials}</span>
  )
}

export const AvatarStack = ({ people, max = 4, size = 26 }: { people: { name: string; tint: string }[]; max?: number; size?: number }) => (
  <div className="flex items-center">
    {people.slice(0, max).map((p, i) => (
      <span key={i} style={{ marginLeft: i ? -8 : 0, zIndex: max - i }}>
        <Avatar name={p.name} tint={p.tint} size={size} ring />
      </span>
    ))}
    {people.length > max && (
      <span className="ml-[-8px] grid place-items-center rounded-full bg-slate-200 text-slate-700 text-2xs font-semibold ring-2 ring-white"
        style={{ width: size, height: size }}>+{people.length - max}</span>
    )}
  </div>
)

/* ── Progress & meters ────────────────────────────────────────────────── */

export const Progress = ({
  value, max = 100, tone = '#2a78d6', height = 6, className, track = '#E8EDF6',
}: { value: number; max?: number; tone?: string; height?: number; className?: string; track?: string }) => (
  <div className={cx('w-full overflow-hidden rounded-full', className)} style={{ height, background: track }}>
    <div className="h-full rounded-full transition-[width] duration-700 ease-out"
      style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, background: tone }} />
  </div>
)

/** A score meter that always states the number — the fill is supporting, not sole, encoding. */
export const ScoreMeter = ({
  value, max = 6, tone = '#2a78d6', label,
}: { value: number; max?: number; tone?: string; label?: string }) => (
  <div className="flex items-center gap-2.5 min-w-0">
    <div className="flex-1 min-w-[52px]"><Progress value={value} max={max} tone={tone} /></div>
    <span className="tnum text-[13px] font-semibold text-ink shrink-0">
      {value.toFixed(value % 1 === 0 ? 0 : 2)}<span className="text-ink-faint font-normal">/{max}</span>
    </span>
    {label && <span className="text-2xs text-ink-muted shrink-0">{label}</span>}
  </div>
)

/* ── Tabs & segmented ─────────────────────────────────────────────────── */

export const Tabs = <T extends string>({
  tabs, value, onChange, className, size = 'md',
}: { tabs: { value: T; label: React.ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; className?: string; size?: 'sm' | 'md' }) => (
  <div className={cx('flex items-center gap-1 border-b border-surface-line overflow-x-auto no-scrollbar', className)} role="tablist">
    {tabs.map(t => {
      const active = t.value === value
      return (
        <button key={t.value} role="tab" aria-selected={active} onClick={() => onChange(t.value)}
          className={cx('relative whitespace-nowrap font-medium transition-colors -mb-px border-b-2',
            size === 'sm' ? 'px-3 py-2 text-[13px]' : 'px-4 py-2.5 text-sm',
            active ? 'border-electric-600 text-electric-700' : 'border-transparent text-ink-muted hover:text-ink-soft')}>
          {t.label}
          {t.count != null && (
            <span className={cx('ml-1.5 rounded-full px-1.5 py-0.5 text-2xs tnum font-semibold',
              active ? 'bg-electric-50 text-electric-700' : 'bg-slate-100 text-slate-600')}>{t.count}</span>
          )}
        </button>
      )
    })}
  </div>
)

export const Segmented = <T extends string>({
  options, value, onChange, className,
}: { options: { value: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) => (
  <div className={cx('inline-flex items-center gap-0.5 rounded-xl bg-surface-sunken p-0.5', className)}>
    {options.map(o => (
      <button key={o.value} onClick={() => onChange(o.value)}
        className={cx('rounded-[10px] px-3 py-1.5 text-[13px] font-medium transition-all whitespace-nowrap',
          o.value === value ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink-soft')}>
        {o.label}
      </button>
    ))}
  </div>
)

/* ── Form fields ──────────────────────────────────────────────────────── */

export const Field = ({
  label, hint, required, children, className, action,
}: { label: React.ReactNode; hint?: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string; action?: React.ReactNode }) => (
  <label className={cx('block', className)}>
    <div className="flex items-center justify-between gap-2 mb-1.5">
      <span className="text-[13px] font-medium text-ink-soft">
        {label}{required && <span className="text-rag-critical ml-0.5">*</span>}
      </span>
      {action}
    </div>
    {children}
    {hint && <p className="mt-1.5 text-xs text-ink-muted leading-snug">{hint}</p>}
  </label>
)

const inputBase = 'w-full rounded-xl border border-surface-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint transition-colors hover:border-slate-300 focus:border-electric-500 focus:outline-none focus:ring-2 focus:ring-electric-500/20'

export const Input = ({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cx(inputBase, className)} {...rest} />
)

export const Textarea = ({ className, ...rest }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cx(inputBase, 'resize-y leading-relaxed', className)} {...rest} />
)

export const Select = ({ className, children, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="relative">
    <select className={cx(inputBase, 'appearance-none pr-9 cursor-pointer', className)} {...rest}>{children}</select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-faint" />
  </div>
)

/** IAS rating input — six discrete values, no decimals, as the sheet specifies. */
export const RatingScale = ({
  value, onChange, max = 6, disabled, size = 'md',
}: { value: number | null; onChange?: (v: number) => void; max?: number; disabled?: boolean; size?: 'sm' | 'md' }) => (
  <div className="inline-flex items-center gap-1" role="radiogroup">
    {Array.from({ length: max }, (_, i) => i + 1).map(n => {
      const active = value === n
      const filled = value != null && n <= value
      return (
        <button key={n} type="button" role="radio" aria-checked={active} disabled={disabled}
          onClick={() => onChange?.(n)}
          className={cx('grid place-items-center rounded-lg border font-semibold tnum transition-all',
            size === 'sm' ? 'h-6 w-6 text-2xs' : 'h-8 w-8 text-[13px]',
            disabled && 'cursor-default',
            active ? 'border-electric-600 bg-electric-600 text-white shadow-sm'
              : filled ? 'border-electric-200 bg-electric-50 text-electric-700'
                : 'border-surface-line bg-white text-ink-faint hover:border-electric-300 hover:text-electric-600')}>
          {n}
        </button>
      )
    })}
  </div>
)

/* ── Modal & drawer ───────────────────────────────────────────────────── */

export const Modal = ({
  open, onClose, title, subtitle, children, footer, width = 'max-w-2xl',
}: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string }) => {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 no-print">
      <div className="absolute inset-0 bg-navy-950/45 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={cx('relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-pop animate-fade-up max-h-[92vh] flex flex-col', width)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-surface-line">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="px-6 py-5 overflow-y-auto scroll-thin flex-1">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-surface-line bg-surface-page/60 rounded-b-2xl flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

export const Drawer = ({
  open, onClose, title, subtitle, children, footer, width = 'sm:max-w-xl',
}: { open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: string }) => {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 no-print">
      <div className="absolute inset-0 bg-navy-950/40 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div className={cx('absolute right-0 top-0 h-full w-full bg-white shadow-pop flex flex-col animate-slide-in', width)}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-surface-line">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-ink-muted">{subtitle}</p>}
          </div>
          <IconButton label="Close" onClick={onClose}><X className="h-4 w-4" /></IconButton>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-surface-line bg-surface-page/60 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/* ── Table primitives ─────────────────────────────────────────────────── */

export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="overflow-x-auto scroll-thin -mx-px">
    <table className={cx('w-full text-sm border-collapse', className)}>{children}</table>
  </div>
)

export const Th = ({ children, className, align = 'left', ...rest }: React.ThHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) => (
  <th className={cx('label whitespace-nowrap px-3 py-2.5 border-b border-surface-line bg-surface-page/70 font-semibold',
    align === 'right' && 'text-right', align === 'center' && 'text-center', className)} {...rest}>{children}</th>
)

export const Td = ({ children, className, align = 'left', ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { align?: 'left' | 'right' | 'center' }) => (
  <td className={cx('px-3 py-3 border-b border-surface-line/70 align-middle',
    align === 'right' && 'text-right tnum', align === 'center' && 'text-center', className)} {...rest}>{children}</td>
)

/* ── Misc ─────────────────────────────────────────────────────────────── */

export const EmptyState = ({
  icon, title, detail, action,
}: { icon?: React.ReactNode; title: string; detail?: string; action?: React.ReactNode }) => (
  <div className="grid place-items-center py-14 px-6 text-center">
    {icon && <div className="mb-3 grid place-items-center h-11 w-11 rounded-xl bg-surface-sunken text-ink-faint">{icon}</div>}
    <p className="text-sm font-semibold text-ink-soft">{title}</p>
    {detail && <p className="mt-1.5 text-[13px] text-ink-muted max-w-sm leading-relaxed">{detail}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
)

export const Divider = ({ className, label }: { className?: string; label?: string }) => (
  label ? (
    <div className={cx('flex items-center gap-3', className)}>
      <span className="h-px flex-1 bg-surface-line" />
      <span className="label">{label}</span>
      <span className="h-px flex-1 bg-surface-line" />
    </div>
  ) : <hr className={cx('border-surface-line', className)} />
)

/** Lightweight hover explainer — used for "why is this number what it is". */
export const Hint = ({ children, content, className }: { children: React.ReactNode; content: React.ReactNode; className?: string }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  return (
    <span ref={ref} className={cx('relative inline-flex', className)}
      onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} tabIndex={0}>
      {children}
      {open && (
        <span className="absolute bottom-full left-1/2 z-40 mb-2 w-64 -translate-x-1/2 rounded-xl bg-navy-900 px-3 py-2 text-xs leading-relaxed text-white shadow-pop animate-fade-in">
          {content}
        </span>
      )}
    </span>
  )
}

export const Toasts = ({ toasts, onDismiss }: { toasts: { id: string; kind: string; title: string; detail?: string }[]; onDismiss: (id: string) => void }) => {
  useEffect(() => {
    if (!toasts.length) return
    const timers = toasts.map(t => setTimeout(() => onDismiss(t.id), 5200))
    return () => timers.forEach(clearTimeout)
  }, [toasts, onDismiss])

  const Icon = { success: Check, info: Info, warning: AlertTriangle }
  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 w-[min(23rem,calc(100vw-2.5rem))] no-print">
      {toasts.map(t => {
        const I = Icon[t.kind as keyof typeof Icon] ?? Info
        const tone = t.kind === 'warning' ? RAG.warning : t.kind === 'success' ? RAG.good : '#2a78d6'
        return (
          <div key={t.id} className="flex items-start gap-3 rounded-xl border border-surface-line bg-white px-4 py-3 shadow-lift animate-fade-up">
            <span className="mt-0.5 grid place-items-center h-5 w-5 rounded-md shrink-0" style={{ background: `${tone}1A`, color: tone }}>
              <I className="h-3.5 w-3.5" strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink leading-snug">{t.title}</p>
              {t.detail && <p className="mt-0.5 text-xs text-ink-muted leading-snug">{t.detail}</p>}
            </div>
            <button onClick={() => onDismiss(t.id)} className="text-ink-faint hover:text-ink-soft shrink-0" aria-label="Dismiss">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
