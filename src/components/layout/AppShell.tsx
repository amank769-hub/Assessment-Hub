import React, { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3, Briefcase, ChevronDown, ClipboardCheck, LayoutDashboard, Menu,
  MessageSquare, ScrollText, Search, ShieldCheck, Users, Video, X,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { ROLE_LABELS, ROLE_PERMISSIONS, personById } from '@/data'
import type { Role } from '@/data/types'
import { Avatar, Badge, cx, IconButton, Toasts } from '@/components/ui'
import { GlobalFilterBar } from './GlobalFilters'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, screen: 'dashboard' },
  { to: '/requisitions', label: 'Requisitions', icon: Briefcase, screen: 'requisitions' },
  { to: '/candidates', label: 'Candidates', icon: Users, screen: 'candidates' },
  { to: '/interviews', label: 'Interviews', icon: Video, screen: 'interviews' },
  { to: '/assessments', label: 'Assessments', icon: ClipboardCheck, screen: 'assessments' },
  { to: '/analysis', label: 'Analysis', icon: BarChart3, screen: 'analysis' },
]

const SECONDARY = [
  { to: '/governance', label: 'Governance & Audit', icon: ShieldCheck, screen: 'governance' },
]

const ROLES: Role[] = ['ta_admin', 'hiring_manager', 'candidate', 'leadership']

export const Logo = ({ compact }: { compact?: boolean }) => (
  <div className="flex items-center gap-2.5 select-none">
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-electric-grad shadow-sm">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M5 18V6h2.6l6.8 8.6V6H17v12h-2.6L7.6 9.4V18H5z" fill="white" />
      </svg>
    </span>
    {!compact && (
      <span className="leading-none">
        <span className="block text-[15px] font-extrabold tracking-tight text-white">Nexora AI</span>
        <span className="block text-[10px] font-medium uppercase tracking-[0.14em] text-electric-300/90">Interview Intelligence</span>
      </span>
    )}
  </div>
)

const RoleSwitcher = () => {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const person = state.role === 'candidate'
    ? { name: 'Ananya Sharma', title: 'Candidate · REQ-2049', tint: '#2A78D6' }
    : personById(state.currentUserId)!

  return (
    <div className="relative">
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 rounded-xl border border-surface-line bg-white px-2.5 py-1.5 hover:bg-surface-sunken transition-colors">
        <Avatar name={person.name} tint={person.tint} size={28} />
        <span className="hidden md:block text-left leading-tight">
          <span className="block text-[13px] font-semibold text-ink">{person.name}</span>
          <span className="block text-2xs text-ink-muted">{ROLE_LABELS[state.role]}</span>
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink-faint" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-[22rem] rounded-2xl border border-surface-line bg-white p-2 shadow-pop animate-fade-up">
            <p className="px-3 pt-2 pb-1.5 label">View the platform as</p>
            {ROLES.map(r => {
              const perms = ROLE_PERMISSIONS[r]
              const active = state.role === r
              return (
                <button key={r}
                  onClick={() => {
                    dispatch({ type: 'SET_ROLE', role: r })
                    setOpen(false)
                    nav(r === 'candidate' ? '/portal' : perms.screens.includes('dashboard') ? '/dashboard' : '/analysis')
                  }}
                  className={cx('w-full rounded-xl px-3 py-2.5 text-left transition-colors',
                    active ? 'bg-electric-50 ring-1 ring-electric-100' : 'hover:bg-surface-sunken')}>
                  <span className="flex items-center justify-between gap-2">
                    <span className={cx('text-[13px] font-semibold', active ? 'text-electric-700' : 'text-ink')}>{ROLE_LABELS[r]}</span>
                    {active && <Badge tone="blue">Current</Badge>}
                  </span>
                  <span className="mt-1 block text-xs leading-snug text-ink-muted">{perms.description}</span>
                </button>
              )
            })}
            <p className="px-3 py-2 text-2xs leading-snug text-ink-faint border-t border-surface-line mt-1">
              Role-based access control is enforced on every screen. Switching role changes what is visible, not just the label.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { state, dispatch } = useApp()
  const [mobileNav, setMobileNav] = useState(false)
  const loc = useLocation()
  const perms = ROLE_PERMISSIONS[state.role]

  const visible = NAV.filter(n => perms.screens.includes(n.screen))
  const visibleSecondary = SECONDARY.filter(n => perms.screens.includes(n.screen))
  const openTasks = state.tasks.filter(t => !t.done).length

  return (
    <div className="min-h-screen flex bg-surface-page">
      {/* ── Sidebar ── */}
      <aside className={cx(
        'fixed inset-y-0 left-0 z-40 w-[248px] shrink-0 bg-brand-grad flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static no-print',
        mobileNav ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex items-center justify-between px-5 h-16 shrink-0">
          <Logo />
          <button className="lg:hidden text-white/70 hover:text-white" onClick={() => setMobileNav(false)} aria-label="Close navigation">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-0.5">
          {visible.map(n => (
            <NavLink key={n.to} to={n.to} onClick={() => setMobileNav(false)}
              className={({ isActive }) => cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all',
                isActive ? 'bg-white/12 text-white shadow-inset' : 'text-white/62 hover:text-white hover:bg-white/[0.07]')}>
              <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              {n.label}
            </NavLink>
          ))}

          {visibleSecondary.length > 0 && (
            <>
              <div className="pt-4 pb-1.5 px-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">Platform</span>
              </div>
              {visibleSecondary.map(n => (
                <NavLink key={n.to} to={n.to} onClick={() => setMobileNav(false)}
                  className={({ isActive }) => cx(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all',
                    isActive ? 'bg-white/12 text-white' : 'text-white/62 hover:text-white hover:bg-white/[0.07]')}>
                  <n.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
                  {n.label}
                </NavLink>
              ))}
            </>
          )}

          {state.role !== 'candidate' && (
            <NavLink to="/portal" onClick={() => setMobileNav(false)}
              className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-white/62 hover:text-white hover:bg-white/[0.07] transition-all">
              <MessageSquare className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
              Candidate Portal
              <span className="ml-auto text-[10px] font-semibold text-electric-300">Preview</span>
            </NavLink>
          )}
        </nav>

        {/* Human-decision reminder, always visible. */}
        <div className="m-3 rounded-xl glass p-3.5">
          <div className="flex items-center gap-2 text-white">
            <ShieldCheck className="h-4 w-4 text-electric-300 shrink-0" strokeWidth={2.4} />
            <span className="text-[13px] font-semibold">Human decision points</span>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/70">
            AI drafts, scores and recommends. It never progresses, rejects or hires. Every decision on this platform is signed by a person.
          </p>
        </div>
      </aside>

      {mobileNav && <div className="fixed inset-0 z-30 bg-navy-950/50 lg:hidden" onClick={() => setMobileNav(false)} />}

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-surface-line bg-white/85 backdrop-blur-md no-print">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button className="lg:hidden text-ink-muted" onClick={() => setMobileNav(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>

            <div className="relative hidden sm:block flex-1 max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                placeholder="Search requisitions, candidates, competencies…"
                className="h-9 w-full rounded-xl border border-surface-line bg-surface-page pl-9 pr-3 text-[13px] text-ink placeholder:text-ink-faint focus:border-electric-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric-500/15 transition-colors"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              {state.role !== 'candidate' && openTasks > 0 && (
                <NavLink to="/dashboard#tasks" className="hidden sm:inline-flex">
                  <Badge tone="amber" dot>{openTasks} task{openTasks === 1 ? '' : 's'} need action</Badge>
                </NavLink>
              )}
              <IconButton label="Activity log" onClick={() => { }} className="hidden sm:grid">
                <ScrollText className="h-4 w-4" />
              </IconButton>
              <RoleSwitcher />
            </div>
          </div>

          {state.role !== 'candidate' && <GlobalFilterBar />}
        </header>

        <main className="flex-1 min-w-0" key={loc.pathname}>{children}</main>
      </div>

      <Toasts toasts={state.toasts} onDismiss={id => dispatch({ type: 'DISMISS_TOAST', id })} />
    </div>
  )
}
