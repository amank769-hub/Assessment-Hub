import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity, ArrowRight, Briefcase, CalendarClock, CheckCircle2, ClipboardCheck,
  Clock, Download, Gauge, Plus, Sparkles, Timer, TrendingDown, Users, Video, Zap,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import {
  CYCLE_TREND, candidateRollup, dashboardMetrics, generateInsights,
  personById, personName, requisitionHealth, countryOf,
} from '@/data'
import { fmtInTz, fmtRelative, isSameDay, daysBetween } from '@/lib/dates'
import { FunnelChart, Sparkline, TrendLines } from '@/components/charts'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardHeader, cx, EmptyState,
  Progress, RagPill, ScoreMeter,
} from '@/components/ui'
import { Page, PageHeader, StatTile } from '@/components/layout/PageHeader'
import { RAG } from '@/theme/tokens'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

export default function Dashboard() {
  const { state, dispatch } = useApp()
  const reqs = useFilteredReqs()
  const nav = useNavigate()
  const reqIds = reqs.map(r => r.id)
  const isLeadership = state.role === 'leadership'

  const m = useMemo(() => dashboardMetrics(reqIds), [reqIds])
  const insights = useMemo(() => generateInsights(reqIds), [reqIds])
  const health = useMemo(() => reqs.map(requisitionHealth), [reqs])

  const upcoming = useMemo(() => state.interviews
    .filter(i => reqIds.includes(i.requisitionId) && i.status === 'Scheduled')
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt)), [state.interviews, reqIds])

  const myTasks = useMemo(() => state.tasks
    .filter(t => !t.requisitionId || reqIds.includes(t.requisitionId))
    .sort((a, b) => Number(a.done) - Number(b.done) || +new Date(a.dueAt) - +new Date(b.dueAt)), [state.tasks, reqIds])

  const topCandidates = useMemo(() => state.candidates
    .filter(c => reqIds.includes(c.requisitionId) && !['Rejected', 'Withdrawn'].includes(c.status))
    .map(c => ({ c, roll: candidateRollup(c.id) }))
    .sort((a, b) => (b.roll?.consolidatedScore ?? 0) - (a.roll?.consolidatedScore ?? 0)
      || (b.c.screening?.overallMatch ?? 0) - (a.c.screening?.overallMatch ?? 0))
    .slice(0, 4), [state.candidates, reqIds])

  const activity = state.activity.filter(a => !a.requisitionId || reqIds.includes(a.requisitionId)).slice(0, 8)

  const person = personById(state.currentUserId)

  return (
    <>
      <PageHeader
        eyebrow={<Badge tone="blue" dot>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</Badge>}
        title={`${greeting()}, ${person?.name.split(' ')[0] ?? 'there'}`}
        subtitle={isLeadership
          ? 'Aggregate hiring health across every requisition in scope. Candidate names and CVs are masked under your role policy.'
          : `${m.interviewsToday} interview${m.interviewsToday === 1 ? '' : 's'} today, ${m.decisionsAwaiting} decision${m.decisionsAwaiting === 1 ? '' : 's'} waiting on you, and ${m.assessmentsPending} scorecard${m.assessmentsPending === 1 ? '' : 's'} still open. Here is where the pipeline actually stands.`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" /> Export</Button>
            {!isLeadership && (
              <Button variant="primary" size="md" onClick={() => nav('/requisitions')}>
                <Plus className="h-4 w-4" /> New requisition
              </Button>
            )}
          </>
        }
      />

      <Page>
        {/* ── Headline metrics ────────────────────────────────────────── */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Active requisitions" value={m.activeRequisitions}
            icon={<Briefcase className="h-3.5 w-3.5" />} accent="#2a78d6"
            hint={`${health.filter(h => h.rag === 'critical' || h.rag === 'serious').length} at risk of missing target close`}
            onClick={() => nav('/requisitions')} />

          <StatTile label="Candidates in pipeline" value={m.candidatesInPipeline}
            icon={<Users className="h-3.5 w-3.5" />} accent="#4a3aa7"
            hint={`${m.trackedCandidates} tracked in detail across all stages`}
            onClick={() => nav('/candidates')} />

          <StatTile label="Interviews today" value={m.interviewsToday}
            icon={<Video className="h-3.5 w-3.5" />} accent="#eb6834"
            hint={upcoming.filter(i => isSameDay(i.scheduledAt)).length
              ? `Next at ${fmtInTz(upcoming.filter(i => isSameDay(i.scheduledAt))[0].scheduledAt, upcoming.filter(i => isSameDay(i.scheduledAt))[0].timezone).split(', ')[1] ?? ''}`
              : 'Nothing else scheduled today'}
            onClick={() => nav('/interviews')} />

          <StatTile label="Assessments pending" value={m.assessmentsPending}
            icon={<ClipboardCheck className="h-3.5 w-3.5" />} accent="#1baf7a"
            hint={m.assessmentsOverdue ? `${m.assessmentsOverdue} past SLA` : 'All within SLA'}
            delta={m.assessmentsOverdue ? `${m.assessmentsOverdue} overdue` : undefined} deltaGood={false}
            onClick={() => nav('/assessments')} />

          <StatTile label="Decisions awaiting action" value={m.decisionsAwaiting}
            icon={<Gauge className="h-3.5 w-3.5" />} accent="#d03b3b"
            hint="AI has recommended. A person still has to decide."
            onClick={() => nav('/candidates')} />
        </div>

        <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatTile label="Time to shortlist" value={m.timeToShortlist} unit="days"
            icon={<Timer className="h-3.5 w-3.5" />} accent="#2a78d6"
            delta="−2.1 days vs last quarter" deltaGood
            footer={<Sparkline points={CYCLE_TREND.map(t => -t.timeToShortlist)} color="#2a78d6" height={26} />} />

          <StatTile label="Average time in stage" value={m.timeInStage} unit="days"
            icon={<Clock className="h-3.5 w-3.5" />} accent="#4a3aa7"
            hint="Across every candidate currently in process" />

          <StatTile label="Interview completion rate" value={m.interviewCompletionRate} unit="%"
            icon={<CheckCircle2 className="h-3.5 w-3.5" />} accent="#0CA30C"
            footer={<Progress value={m.interviewCompletionRate} tone={RAG.good} />}
            hint="Completed against completed plus no-shows" />

          <StatTile label="Candidate drop-off" value={m.dropOffRate} unit="%"
            icon={<TrendingDown className="h-3.5 w-3.5" />} accent="#EC835A"
            hint="Applied through to interviewing"
            footer={<Progress value={m.dropOffRate} tone={RAG.serious} />} />

          <StatTile label="AI screening completion" value={m.aiScreeningCompletionRate} unit="%"
            icon={<Zap className="h-3.5 w-3.5" />} accent="#eb6834"
            footer={<Progress value={m.aiScreeningCompletionRate} tone="#eb6834" />}
            hint={`${m.awaitingScreening} screened profile${m.awaitingScreening === 1 ? '' : 's'} waiting on a recruiter`} />
        </div>

        {/* ── Main grid ───────────────────────────────────────────────── */}
        <div className="grid gap-5 xl:grid-cols-12">
          <div className="xl:col-span-8 space-y-5 min-w-0">

            <Card>
              <CardHeader
                title="Hiring pipeline"
                subtitle={`Applied through to hired across ${reqs.length} requisition${reqs.length === 1 ? '' : 's'} in scope`}
                icon={<Activity className="h-4 w-4" />}
                action={<Link to="/analysis" className="text-[13px] font-medium text-electric-600 hover:text-electric-700 inline-flex items-center gap-1">
                  Full analysis <ArrowRight className="h-3.5 w-3.5" />
                </Link>} />
              <div className="card-pad pt-4">
                <FunnelChart data={m.funnel} />
              </div>
            </Card>

            <Card>
              <CardHeader title="Requisition health" subtitle="RAG status is computed from days open, stages remaining against SLA, and depth of pipeline"
                icon={<Briefcase className="h-4 w-4" />} />
              <div className="card-pad pt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {health.map(h => (
                  <Link key={h.req.id} to={`/requisitions/${h.req.id}`}
                    className="group rounded-xl border border-surface-line p-4 hover:shadow-lift hover:-translate-y-px transition-all bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xs font-semibold tracking-wide text-ink-faint">{h.req.id}</span>
                      <RagPill status={h.rag} />
                    </div>
                    <p className="mt-1.5 text-[13px] font-semibold text-ink leading-snug line-clamp-2 group-hover:text-electric-700 transition-colors">
                      {h.req.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {countryOf(h.req.country).flag} {h.req.location.split(',')[0]} · {h.req.band} · {h.req.businessUnit}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-2xs text-ink-muted">
                      <span>At {h.atStage}</span>
                      <span className="tnum">{h.progressPct}% through workflow</span>
                    </div>
                    <Progress className="mt-1.5" value={h.progressPct} tone={RAG[h.rag]} />

                    <div className="mt-3 flex items-center justify-between gap-2 pt-3 border-t border-surface-line">
                      <span className="text-2xs text-ink-muted">{h.inProcess} in process</span>
                      <span className={cx('text-2xs font-semibold', h.daysToTarget < 7 ? 'text-rag-critical' : 'text-ink-soft')}>
                        {h.daysToTarget < 0 ? `${Math.abs(h.daysToTarget)}d past target` : `${h.daysToTarget}d to target`}
                      </span>
                    </div>
                    <p className="mt-2 text-2xs leading-snug text-ink-muted line-clamp-2">{h.reasons[0]}</p>
                  </Link>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="Upcoming interviews" subtitle="Shown in each interview's own timezone — this pipeline spans four countries"
                icon={<CalendarClock className="h-4 w-4" />}
                action={<Link to="/interviews" className="text-[13px] font-medium text-electric-600 hover:text-electric-700">View all</Link>} />
              <div className="card-pad pt-4">
                {upcoming.length === 0 ? (
                  <EmptyState icon={<CalendarClock className="h-5 w-5" />} title="Nothing scheduled" detail="No interviews are booked for the current filter selection." />
                ) : (
                  <div className="space-y-2">
                    {upcoming.slice(0, 5).map(iv => {
                      const cand = state.candidates.find(c => c.id === iv.candidateId)!
                      const req = state.requisitions.find(r => r.id === iv.requisitionId)!
                      const stg = req.workflow.find(s => s.key === iv.stageKey)!
                      const today = isSameDay(iv.scheduledAt)
                      return (
                        <Link key={iv.id} to={`/interviews/${iv.id}`}
                          className={cx('flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-card hover:-translate-y-px',
                            today ? 'border-electric-200 bg-electric-50/40' : 'border-surface-line bg-white')}>
                          <div className={cx('grid w-14 shrink-0 place-items-center rounded-lg py-1.5',
                            today ? 'bg-electric-600 text-white' : 'bg-surface-sunken text-ink-soft')}>
                            <span className="text-2xs font-semibold uppercase">{today ? 'Today' : new Date(iv.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                            <span className="tnum text-[15px] font-bold leading-tight">
                              {fmtInTz(iv.scheduledAt, iv.timezone).split(', ')[1] ?? ''}
                            </span>
                          </div>
                          <Avatar name={isLeadership ? 'Candidate' : cand.name} tint={cand.tint} size={34} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-semibold text-ink truncate">
                              {isLeadership ? `Candidate ${cand.id}` : cand.name}
                              <span className="ml-2 font-normal text-ink-muted">{stg.shortName}</span>
                            </p>
                            <p className="text-xs text-ink-muted truncate">
                              {req.id} · {iv.mode} · {countryOf(req.country).flag} {iv.timezone.split('/')[1].replace('_', ' ')} · {iv.durationMins}m
                            </p>
                          </div>
                          <div className="hidden sm:block shrink-0">
                            <AvatarStack people={iv.interviewerIds.map(id => personById(id)!).filter(Boolean).map(p => ({ name: p.name, tint: p.tint }))} size={24} />
                          </div>
                          <span className="shrink-0 text-2xs text-ink-muted tnum w-14 text-right">{fmtRelative(iv.scheduledAt)}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>

            <Card className="card-pad">
              <TrendLines
                title="Cycle time, twelve-week trend"
                subtitle="Time to shortlist and end-to-end interview cycle, both in days"
                data={CYCLE_TREND as unknown as Record<string, string | number>[]}
                xKey="week" unit="d" area
                keys={[
                  { key: 'timeToShortlist', label: 'Time to shortlist' },
                  { key: 'interviewCycle', label: 'Interview cycle' },
                  { key: 'feedbackTurnaround', label: 'Feedback turnaround' },
                ]}
                height={220} />
            </Card>
          </div>

          {/* ── Right rail ─────────────────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-5 min-w-0">

            <Card className="overflow-hidden">
              <div className="bg-brand-grad px-5 pt-5 pb-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/15">
                    <Sparkles className="h-4 w-4 text-electric-300" strokeWidth={2.4} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold leading-tight">AI Insights</h3>
                    <p className="text-[11px] text-white/60">Computed from live pipeline state · every claim shows its evidence</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-surface-line">
                {insights.map(ins => <InsightRow key={ins.id} insight={ins} />)}
                {!insights.length && <EmptyState title="Nothing needs attention" detail="No risks detected across the requisitions in scope." />}
              </div>
            </Card>

            <Card id="tasks">
              <CardHeader title="Tasks requiring action"
                subtitle={`${myTasks.filter(t => !t.done).length} open`}
                icon={<CheckCircle2 className="h-4 w-4" />} />
              <div className="card-pad pt-4 space-y-2">
                {myTasks.slice(0, 6).map(t => {
                  const overdue = !t.done && new Date(t.dueAt) < new Date()
                  return (
                    <div key={t.id} className={cx('flex items-start gap-3 rounded-xl border p-3 transition-colors',
                      t.done ? 'border-surface-line bg-surface-page/50 opacity-60' : overdue ? 'border-rag-critical/25 bg-rag-critical/[0.04]' : 'border-surface-line bg-white')}>
                      <button onClick={() => dispatch({ type: 'TOGGLE_TASK', taskId: t.id })}
                        aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                        className={cx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-[5px] border transition-colors',
                          t.done ? 'border-electric-600 bg-electric-600 text-white' : 'border-slate-300 hover:border-electric-500')}>
                        {t.done && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className={cx('text-[13px] font-semibold leading-snug', t.done ? 'text-ink-muted line-through' : 'text-ink')}>{t.title}</p>
                        <p className="mt-0.5 text-xs leading-snug text-ink-muted line-clamp-2">{t.detail}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={cx('text-2xs font-semibold', overdue ? 'text-rag-critical' : 'text-ink-faint')}>
                            {overdue ? 'Overdue · ' : 'Due '}{fmtRelative(t.dueAt)}
                          </span>
                          <span className="text-2xs text-ink-faint">· {personName(t.ownerId)}</span>
                          {t.candidateId && (
                            <Link to={`/candidates/${t.candidateId}`} className="text-2xs font-medium text-electric-600 hover:underline">Open</Link>
                          )}
                        </div>
                      </div>
                      {t.priority === 'high' && !t.done && <Badge tone="red">High</Badge>}
                    </div>
                  )
                })}
              </div>
            </Card>

            {!isLeadership && (
              <Card>
                <CardHeader title="Top candidate alerts" subtitle="Ranked on consolidated interview score, then AI match"
                  icon={<Users className="h-4 w-4" />} />
                <div className="card-pad pt-4 space-y-2.5">
                  {topCandidates.map(({ c, roll }) => {
                    const req = state.requisitions.find(r => r.id === c.requisitionId)!
                    return (
                      <Link key={c.id} to={`/candidates/${c.id}`}
                        className="flex items-center gap-3 rounded-xl border border-surface-line p-3 hover:shadow-card hover:-translate-y-px transition-all bg-white">
                        <Avatar name={c.name} tint={c.tint} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-semibold text-ink truncate">{c.name}</p>
                          <p className="text-xs text-ink-muted truncate">{c.currentTitle} · {req.id}</p>
                          <div className="mt-1.5">
                            {roll && roll.consolidatedScore > 0
                              ? <ScoreMeter value={roll.consolidatedScore} tone={roll.consolidatedScore >= 5 ? RAG.good : '#2a78d6'} />
                              : <span className="text-2xs text-ink-faint">{c.screening?.overallMatch}% AI match · not yet interviewed</span>}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </Card>
            )}

            <Card>
              <CardHeader title="Recent activity" icon={<Activity className="h-4 w-4" />} />
              <div className="card-pad pt-4">
                <ol className="relative space-y-3.5 pl-4 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-surface-line">
                  {activity.map(a => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white"
                        style={{ background: a.kind === 'decision' ? '#4a3aa7' : a.kind === 'assessment' ? '#1baf7a' : a.kind === 'interview' ? '#eb6834' : '#2a78d6' }} />
                      <p className="text-[13px] leading-snug text-ink-soft">
                        <span className="font-semibold text-ink">{personName(a.actorId)}</span> {a.text}
                      </p>
                      <p className="mt-0.5 text-2xs text-ink-faint">{fmtRelative(a.at)}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </Card>
          </div>
        </div>
      </Page>
    </>
  )
}

/* ── AI insight row with an expandable evidence trail ──────────────────── */

const InsightRow = ({ insight }: { insight: ReturnType<typeof generateInsights>[number] }) => {
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  return (
    <div className="px-5 py-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: RAG[insight.severity] }} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-ink">{insight.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-muted">{insight.detail}</p>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button onClick={() => setOpen(v => !v)}
              className="text-2xs font-semibold text-violet-700 hover:text-violet-800 inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {open ? 'Hide evidence' : `Why this? (${insight.evidence.length})`}
            </button>
            <button onClick={() => nav(insight.actionTarget)}
              className="text-2xs font-semibold text-electric-600 hover:text-electric-700 inline-flex items-center gap-1">
              {insight.actionLabel} <ArrowRight className="h-3 w-3" />
            </button>
          </div>

          {open && (
            <ul className="mt-2.5 space-y-1.5 rounded-lg border border-violet-100 bg-violet-50/50 p-2.5 animate-fade-up">
              {insight.evidence.map((e, i) => (
                <li key={i} className="flex gap-2 text-2xs leading-relaxed text-ink-soft">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-violet-400" />
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
