import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Activity, ArrowRight, CalendarDays, ClipboardCheck, Clock, Download, FileText,
  GitBranch, Layers, Plus, Settings2, Trash2, UserCircle2, Users,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import {
  ASSESSMENT_TEMPLATES, CULTURAL_FITMENT, IAS_DECISIONS, RATING_LEGEND,
  candidateRollup, countryOf, personById, requisitionHealth,
} from '@/data'
import { fmtDate, fmtRelative, daysBetween } from '@/lib/dates'
import { CompetencyMapping } from './CompetencyMapping'
import {
  AiChip, Avatar, AvatarStack, Badge, Button, Card, CardHeader, cx, EmptyState,
  Field, Input, Progress, RagPill, ScoreMeter, Select, Table, Tabs, Td, Th, Textarea,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

type Tab = 'overview' | 'workflow' | 'framework' | 'pipeline' | 'templates' | 'scorecard' | 'activity'

export default function RequisitionDetail() {
  const { reqId } = useParams<{ reqId: string }>()
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('overview')

  const req = state.requisitions.find(r => r.id === reqId)
  if (!req) return <Page><Card><EmptyState title="Requisition not found" action={<Button onClick={() => nav('/requisitions')}>Back to requisitions</Button>} /></Card></Page>

  const health = requisitionHealth(req)
  const hm = personById(req.hiringManagerId)!
  const rec = personById(req.recruiterId)!
  const panel = req.panelIds.map(id => personById(id)!).filter(Boolean)
  const cands = state.candidates.filter(c => c.requisitionId === req.id)
  const country = countryOf(req.country)
  const levels = req.workflow.filter(s => s.type === 'interview')
  const activity = state.activity.filter(a => a.requisitionId === req.id)
  const audit = state.audit.filter(e => e.entityId === req.id || cands.some(c => c.id === e.entityId))

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Requisitions', to: '/requisitions' }, { label: req.id }]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="navy">{req.id}</Badge>
            <RagPill status={health.rag} />
            <Badge tone={req.priority === 'Critical' ? 'red' : req.priority === 'High' ? 'amber' : 'neutral'}>{req.priority} priority</Badge>
            <Badge tone="neutral">{req.status}</Badge>
          </div>
        }
        title={req.title}
        subtitle={`${country.flag} ${req.location} · ${req.businessUnit} · Band ${req.band} · ${req.openings} opening${req.openings === 1 ? '' : 's'} · opened ${fmtDate(req.openDate)} (${health.daysOpen} days ago)`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export</Button>
            <Button variant="primary" size="md" onClick={() => nav(`/analysis?req=${req.id}`)}>
              <ArrowRight className="h-4 w-4" />Open analysis
            </Button>
          </>
        }
        tabs={
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'overview', label: 'Overview' },
            { value: 'workflow', label: 'Interview workflow', count: levels.length },
            { value: 'framework', label: 'Skills & competency', count: req.competencies.length },
            { value: 'pipeline', label: 'Candidate pipeline', count: cands.length },
            { value: 'templates', label: 'Assessment templates' },
            { value: 'scorecard', label: 'Scorecard config' },
            { value: 'activity', label: 'Activity log' },
          ]} />
        }
      />

      <Page>
        {/* Risk banner — a computed judgement, always with its reasons. */}
        {(health.rag === 'critical' || health.rag === 'serious') && (
          <div className="rounded-2xl border p-4 animate-fade-up" style={{ borderColor: `${RAG[health.rag]}33`, background: `${RAG[health.rag]}0A` }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold" style={{ color: RAG[health.rag] }}>
                  <RagPill status={health.rag} />
                  {health.daysToTarget < 0 ? `Target close passed ${Math.abs(health.daysToTarget)} days ago` : `${health.daysToTarget} days to target close`}
                </p>
                <ul className="mt-2 space-y-1">
                  {health.reasons.map(r => (
                    <li key={r} className="flex gap-2 text-[13px] leading-snug text-ink-soft">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: RAG[health.rag] }} />{r}
                    </li>
                  ))}
                </ul>
              </div>
              <Button variant="secondary" size="sm" onClick={() => dispatch({ type: 'TOAST', toast: { kind: 'info', title: 'Escalation raised', detail: `${hm.name} and the segment lead have been notified with the risk summary.` } })}>
                Escalate to hiring manager
              </Button>
            </div>
          </div>
        )}

        {tab === 'overview' && (
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8 space-y-5 min-w-0">
              <Card>
                <CardHeader title="Role overview" icon={<FileText className="h-4 w-4" />} />
                <div className="card-pad pt-3">
                  <p className="text-[15px] leading-relaxed text-ink-soft">{req.roleOverview}</p>
                </div>
              </Card>

              <Card>
                <CardHeader title="Job description" subtitle="The source text the competency framework was extracted from" icon={<FileText className="h-4 w-4" />}
                  action={<Button size="xs" variant="ghost" onClick={() => setTab('framework')}><Layers className="h-3 w-3" />View framework</Button>} />
                <div className="card-pad pt-3 space-y-4">
                  {req.jobDescription.split('\n\n').map((p, i) => (
                    <p key={i} className="text-[13px] leading-relaxed text-ink-soft">{p}</p>
                  ))}
                  <div className="grid gap-5 md:grid-cols-2 pt-3 border-t border-surface-line">
                    <div>
                      <p className="label mb-2">Responsibilities</p>
                      <ul className="space-y-1.5">
                        {req.responsibilities.map(r => (
                          <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="label mb-2">Minimum qualifications</p>
                        <ul className="space-y-1.5">
                          {req.minimumQualifications.map(r => (
                            <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="label mb-2">Preferred qualifications</p>
                        <ul className="space-y-1.5">
                          {req.preferredQualifications.map(r => (
                            <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />{r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="xl:col-span-4 space-y-5 min-w-0">
              <Card>
                <CardHeader title="Hiring team" icon={<Users className="h-4 w-4" />} />
                <div className="card-pad pt-3 space-y-3">
                  {[{ p: hm, role: 'Hiring manager' }, { p: rec, role: 'Recruiter / TA partner' }].map(({ p, role }) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <Avatar name={p.name} tint={p.tint} size={38} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-2xs text-ink-muted truncate">{p.title}</p>
                        <p className="mt-0.5"><Badge tone="blue">{role}</Badge></p>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-surface-line pt-3">
                    <p className="label mb-2">Interview panel</p>
                    <div className="space-y-2">
                      {panel.map(p => (
                        <div key={p.id} className="flex items-center gap-2.5">
                          <Avatar name={p.name} tint={p.tint} size={26} />
                          <div className="min-w-0">
                            <p className="text-[13px] text-ink truncate">{p.name}</p>
                            <p className="text-2xs text-ink-muted truncate">{p.title} · {countryOf(p.country).flag}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Key dates & terms" icon={<CalendarDays className="h-4 w-4" />} />
                <div className="card-pad pt-3">
                  <dl className="space-y-2.5 text-[13px]">
                    {[
                      ['Opened', `${fmtDate(req.openDate)} · ${health.daysOpen} days ago`],
                      ['Target close', `${fmtDate(req.targetCloseDate)} · ${health.daysToTarget < 0 ? `${Math.abs(health.daysToTarget)}d over` : `${health.daysToTarget}d left`}`],
                      ['Timezone', `${country.timezone} (${country.utcOffset})`],
                      ['Compensation', req.salaryRange],
                      ['Job family', req.jobFamily],
                      ['Interview levels', `${levels.length} configured`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3">
                        <dt className="text-ink-muted shrink-0">{k}</dt>
                        <dd className="text-right font-medium text-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Card>

              <Card>
                <CardHeader title="Candidate-facing highlights" subtitle="Shown on the external job page" icon={<UserCircle2 className="h-4 w-4" />} />
                <ul className="card-pad pt-3 space-y-2">
                  {req.highlights.map(h => (
                    <li key={h} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />{h}
                    </li>
                  ))}
                </ul>
                <div className="card-pad pt-0">
                  <Link to="/portal" className="text-[13px] font-medium text-electric-600 hover:text-electric-700 inline-flex items-center gap-1">
                    Preview candidate experience <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'workflow' && <WorkflowTab req={req} />}
        {tab === 'framework' && <CompetencyMapping req={req} />}

        {tab === 'pipeline' && (
          <Card className="overflow-hidden">
            <CardHeader title="Candidate pipeline" subtitle={`${cands.length} candidates tracked in detail on this requisition`} icon={<Users className="h-4 w-4" />} />
            <div className="mt-4 border-t border-surface-line">
              <Table>
                <thead>
                  <tr>
                    <Th>Candidate</Th><Th>Current stage</Th><Th>Status</Th>
                    <Th align="center">AI match</Th><Th align="center">Consolidated score</Th>
                    <Th align="center">Days in stage</Th><Th>Next action</Th>
                  </tr>
                </thead>
                <tbody>
                  {cands.map(c => {
                    const roll = candidateRollup(c.id)
                    const stg = req.workflow.find(s => s.key === c.currentStageKey)
                    const prog = c.stageProgress.find(p => p.stageKey === c.currentStageKey)
                    const days = prog?.enteredAt ? daysBetween(prog.enteredAt) : 0
                    const over = stg ? days > stg.slaDays : false
                    return (
                      <tr key={c.id} className="group hover:bg-electric-50/30 transition-colors">
                        <Td>
                          <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5">
                            <Avatar name={c.name} tint={c.tint} size={30} />
                            <div className="min-w-0">
                              <p className="font-medium text-ink group-hover:text-electric-700 transition-colors">{c.name}</p>
                              <p className="text-2xs text-ink-muted truncate max-w-[14rem]">{c.currentTitle} · {c.currentOrganization}</p>
                            </div>
                          </Link>
                        </Td>
                        <Td className="text-ink-soft whitespace-nowrap">{stg?.shortName ?? '—'}</Td>
                        <Td><Badge tone={c.status === 'Offer Recommended' ? 'green' : c.status === 'Rejected' ? 'red' : c.status === 'On Hold' ? 'amber' : 'blue'}>{c.status}</Badge></Td>
                        <Td align="center"><span className="tnum font-semibold text-ink">{c.screening?.overallMatch ?? '—'}%</span></Td>
                        <Td align="center" className="min-w-[9rem]">
                          {roll && roll.consolidatedScore > 0
                            ? <ScoreMeter value={roll.consolidatedScore} tone={roll.consolidatedScore >= 5 ? RAG.good : seriesAt(0)} />
                            : <span className="text-2xs text-ink-faint">Not yet interviewed</span>}
                        </Td>
                        <Td align="center">
                          <span className={cx('tnum font-semibold', over ? 'text-rag-serious' : 'text-ink-soft')}>{days}d</span>
                          {stg && <span className="block text-2xs text-ink-faint">SLA {stg.slaDays}d</span>}
                        </Td>
                        <Td>
                          <Link to={c.status === 'AI Screened' ? `/candidates/${c.id}` : `/analysis?view=deepdive&candidate=${c.id}`}
                            className="text-[13px] font-medium text-electric-600 hover:underline whitespace-nowrap">
                            {c.status === 'AI Screened' ? 'Screen now' : c.status === 'Offer Recommended' ? 'Review offer' : 'Open deep-dive'}
                          </Link>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {tab === 'templates' && <TemplatesTab req={req} />}
        {tab === 'scorecard' && <ScorecardConfigTab req={req} />}

        {tab === 'activity' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Activity" subtitle="What happened on this requisition" icon={<Activity className="h-4 w-4" />} />
              <div className="card-pad pt-4">
                {activity.length === 0 ? <EmptyState title="No activity yet" /> : (
                  <ol className="relative space-y-4 pl-4 before:absolute before:left-[5px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-surface-line">
                    {activity.map(a => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-white bg-electric-500" />
                        <p className="text-[13px] leading-snug text-ink-soft">
                          <span className="font-semibold text-ink">{personById(a.actorId)?.name}</span> {a.text}
                        </p>
                        <p className="mt-0.5 text-2xs text-ink-faint">{fmtRelative(a.at)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Audit trail" subtitle="Every decision and configuration change, attributable to a person" icon={<ClipboardCheck className="h-4 w-4" />} />
              <div className="card-pad pt-4 space-y-3">
                {audit.slice(0, 10).map(e => (
                  <div key={e.id} className="rounded-xl border border-surface-line p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-ink">{e.action}</span>
                      {e.humanDecision && <Badge tone="green">Human decision</Badge>}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">{e.detail}</p>
                    <p className="mt-1.5 text-2xs text-ink-faint">
                      {personById(e.actorId)?.name ?? e.actorId} · {e.entity} {e.entityId} · {fmtRelative(e.at)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Page>
    </>
  )
}

/* ── Interview workflow: unlimited, dynamically configured levels ──────── */

const WorkflowTab = ({ req }: { req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => {
  const { state, dispatch } = useApp()
  const [editing, setEditing] = useState<string | null>(null)
  const cands = state.candidates.filter(c => c.requisitionId === req.id)

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Interview workflow"
          subtitle="Stages are configuration, not code. Adding a level here generates the matching assessment level for every candidate in process."
          icon={<GitBranch className="h-4 w-4" />}
          action={
            <Button size="sm" variant="primary"
              onClick={() => dispatch({ type: 'ADD_STAGE', reqId: req.id, after: [...req.workflow].reverse().find(s => s.type === 'interview')?.key ?? req.workflow[0].key })}>
              <Plus className="h-3.5 w-3.5" />Add interview level
            </Button>
          } />

        <div className="card-pad pt-4 space-y-3">
          {req.workflow.map((s, i) => {
            const isInterview = s.type === 'interview'
            const here = cands.filter(c => c.currentStageKey === s.key)
            const done = cands.filter(c => c.stageProgress.find(p => p.stageKey === s.key)?.status === 'completed')
            const open = editing === s.key
            const comps = req.competencies.filter(c => s.competencyIds.includes(c.id))

            return (
              <div key={s.key} className={cx('rounded-2xl border transition-all', open ? 'border-electric-300 shadow-card' : 'border-surface-line')}>
                <div className="flex flex-wrap items-start gap-4 p-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-[13px] font-bold',
                      isInterview ? 'bg-electric-600 text-white' : s.type === 'offer' || s.type === 'hired' ? 'bg-emerald-600 text-white' : 'bg-surface-sunken text-ink-soft')}>
                      {i + 1}
                    </span>
                    <div className="w-px h-9 bg-surface-line hidden sm:block" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-semibold text-ink">{s.name}</h4>
                      <Badge tone={isInterview ? 'blue' : s.type === 'ai_screening' ? 'violet' : 'neutral'}>{s.type.replace('_', ' ')}</Badge>
                      {s.durationMins > 0 && <span className="text-2xs text-ink-muted inline-flex items-center gap-1"><Clock className="h-3 w-3" />{s.durationMins} min</span>}
                      <span className="text-2xs text-ink-muted">SLA {s.slaDays}d</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{s.objective}</p>

                    {comps.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {comps.map(c => (
                          <span key={c.id} className="rounded-md border border-surface-line bg-surface-page px-1.5 py-0.5 text-2xs text-ink-soft">
                            {c.name} <span className="text-ink-faint tnum">{Math.round(c.weight * 100)}%</span>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      {s.interviewerIds.length > 0 && (
                        <span className="inline-flex items-center gap-2">
                          <AvatarStack people={s.interviewerIds.map(id => personById(id)!).filter(Boolean).map(p => ({ name: p.name, tint: p.tint }))} size={22} max={3} />
                          <span className="text-2xs text-ink-muted">{s.interviewerIds.map(id => personById(id)?.name.split(' ')[0]).join(', ')}</span>
                        </span>
                      )}
                      {isInterview && <span className="text-2xs font-medium text-violet-700">{s.format}</span>}
                      <span className="text-2xs text-ink-muted">{here.length} here now · {done.length} completed</span>
                    </div>
                  </div>

                  {isInterview && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="xs" variant="ghost" onClick={() => setEditing(open ? null : s.key)}>
                        <Settings2 className="h-3 w-3" />{open ? 'Close' : 'Configure'}
                      </Button>
                      <Button size="xs" variant="ghost" onClick={() => dispatch({ type: 'REMOVE_STAGE', reqId: req.id, stageKey: s.key })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {open && (
                  <div className="border-t border-surface-line bg-electric-50/25 p-5 animate-fade-up">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <Field label="Stage name">
                        <Input value={s.name} onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { name: e.target.value } })} />
                      </Field>
                      <Field label="Short label" hint="Used in tables, funnels and the candidate portal.">
                        <Input value={s.shortName} onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { shortName: e.target.value } })} />
                      </Field>
                      <Field label="Stage objective" className="lg:col-span-2">
                        <Textarea rows={2} value={s.objective}
                          onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { objective: e.target.value } })} />
                      </Field>
                      <Field label="Assessment format">
                        <Select value={s.format} onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { format: e.target.value as typeof s.format } })}>
                          {ASSESSMENT_TEMPLATES.map(t => <option key={t.id} value={t.format}>{t.format}</option>)}
                        </Select>
                      </Field>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Duration (min)">
                          <Input type="number" min={15} step={15} value={s.durationMins}
                            onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { durationMins: Number(e.target.value) } })} />
                        </Field>
                        <Field label="SLA (days)">
                          <Input type="number" min={1} value={s.slaDays}
                            onChange={e => dispatch({ type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key, patch: { slaDays: Number(e.target.value) } })} />
                        </Field>
                      </div>
                      <Field label="Competencies assessed at this level" className="lg:col-span-2"
                        hint="Only these are pre-drafted with high confidence. The full framework still appears on the scorecard, as it does on the IAS sheet.">
                        <div className="flex flex-wrap gap-1.5">
                          {req.competencies.map(c => {
                            const on = s.competencyIds.includes(c.id)
                            return (
                              <button key={c.id}
                                onClick={() => dispatch({
                                  type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key,
                                  patch: { competencyIds: on ? s.competencyIds.filter(x => x !== c.id) : [...s.competencyIds, c.id] },
                                })}
                                className={cx('rounded-lg border px-2 py-1 text-2xs font-medium transition-colors',
                                  on ? 'border-electric-300 bg-electric-50 text-electric-700' : 'border-surface-line bg-white text-ink-muted hover:border-slate-300')}>
                                {c.name}
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                      <Field label="Assigned interviewers" className="lg:col-span-2">
                        <div className="flex flex-wrap gap-1.5">
                          {[req.hiringManagerId, req.recruiterId, ...req.panelIds].filter((v, i, a) => a.indexOf(v) === i).map(id => {
                            const p = personById(id)!
                            const on = s.interviewerIds.includes(id)
                            return (
                              <button key={id}
                                onClick={() => dispatch({
                                  type: 'UPDATE_STAGE', reqId: req.id, stageKey: s.key,
                                  patch: { interviewerIds: on ? s.interviewerIds.filter(x => x !== id) : [...s.interviewerIds, id] },
                                })}
                                className={cx('inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-2xs font-medium transition-colors',
                                  on ? 'border-electric-300 bg-electric-50 text-electric-700' : 'border-surface-line bg-white text-ink-muted hover:border-slate-300')}>
                                <Avatar name={p.name} tint={p.tint} size={16} />{p.name}
                              </button>
                            )
                          })}
                        </div>
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

/* ── Assessment templates ─────────────────────────────────────────────── */

const TemplatesTab = ({ req }: { req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => {
  const levels = req.workflow.filter(s => s.type === 'interview')
  const used = new Set(levels.map(l => l.format))
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Templates in use on this requisition"
          subtitle="Each interview level draws its scorecard structure from a template. Templates adapt by role, country, function and level."
          icon={<ClipboardCheck className="h-4 w-4" />} />
        <div className="card-pad pt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {ASSESSMENT_TEMPLATES.filter(t => used.has(t.format)).map(t => {
            const at = levels.filter(l => l.format === t.format)
            return (
              <div key={t.id} className="rounded-xl border border-electric-200 bg-electric-50/30 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-snug text-ink">{t.name}</p>
                  <Badge tone="blue">In use</Badge>
                </div>
                <p className="mt-1 text-2xs text-ink-muted">{t.format}</p>
                <div className="mt-3 space-y-1.5">
                  {t.sections.map(sec => (
                    <div key={sec.title}>
                      <p className="text-2xs font-semibold text-ink-soft">{sec.title}</p>
                      <p className="text-2xs text-ink-muted leading-snug line-clamp-2">{sec.fields.join(' · ')}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-electric-200/60 pt-2.5">
                  {at.map(l => <Badge key={l.key} tone="neutral">{l.shortName}</Badge>)}
                </div>
                {t.mandatorySignOff && <p className="mt-2 text-2xs font-medium text-emerald-700">Interviewer sign-off is mandatory</p>}
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Available in the template library"
          subtitle="Every assessment format the platform supports. Attach one to any interview level from the workflow tab."
          icon={<Layers className="h-4 w-4" />} />
        <div className="card-pad pt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ASSESSMENT_TEMPLATES.filter(t => !used.has(t.format)).map(t => (
            <div key={t.id} className="rounded-xl border border-surface-line p-4 hover:border-slate-300 transition-colors">
              <p className="text-[13px] font-semibold leading-snug text-ink">{t.name}</p>
              <p className="mt-1 text-2xs text-ink-muted">{t.format}</p>
              <p className="mt-2 text-2xs text-ink-muted">
                {t.band === 'Any' ? 'All bands' : (t.band as string[]).join(', ')} · {t.jobFamily === 'Any' ? 'All functions' : t.jobFamily}
              </p>
              <p className="mt-2 text-2xs text-ink-faint">Used {t.usageCount} times across the org</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ── Scorecard configuration — the IAS rating scales made explicit ────── */

const ScorecardConfigTab = ({ req }: { req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => {
  const total = req.competencies.reduce((a, c) => a + c.weight, 0)
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader title="Interview rating scale"
          subtitle="Six points, no decimals — carried directly from the Interview Assessment Sheet."
          icon={<Settings2 className="h-4 w-4" />} />
        <div className="card-pad pt-4 space-y-2">
          {RATING_LEGEND.map(r => (
            <div key={r.value} className="flex items-center gap-3 rounded-xl border border-surface-line p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-electric-50 text-[15px] font-bold text-electric-700 tnum">{r.value}</span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">{r.label}</p>
                <p className="text-2xs text-ink-muted">Shown to interviewers as “{r.short}”</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Cultural fitment scale" subtitle="Three points, from the IAS dropdown" icon={<Settings2 className="h-4 w-4" />} />
          <div className="card-pad pt-4 space-y-2">
            {CULTURAL_FITMENT.map(c => (
              <div key={c.value} className="flex items-center gap-3 rounded-xl border border-surface-line p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-violet-50 text-[13px] font-bold text-violet-700 tnum">{c.value}</span>
                <p className="text-[13px] text-ink-soft">{c.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Final decision options" subtitle="Every scorecard closes on one of these three" icon={<Settings2 className="h-4 w-4" />} />
          <div className="card-pad pt-4 space-y-2">
            {IAS_DECISIONS.map((d, i) => (
              <div key={d} className="flex items-center gap-2.5 rounded-xl border border-surface-line p-3">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: [RAG.good, RAG.warning, RAG.critical][i] }} />
                <p className="text-[13px] text-ink-soft">{d}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Weighted average" subtitle="How the consolidated score is computed" icon={<Settings2 className="h-4 w-4" />} />
          <div className="card-pad pt-4">
            <div className="rounded-xl bg-surface-page p-4 font-mono text-[13px] leading-relaxed text-ink-soft">
              weighted average = Σ(rating × weight) ÷ Σ(weight)
              <span className="block mt-1 text-2xs text-ink-muted">taken over rated rows only, so a partially completed scorecard is never understated</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[13px]">
              <span className="text-ink-muted">Framework weights total</span>
              <span className={cx('tnum font-bold', Math.abs(total - 1) < 0.005 ? 'text-rag-good' : 'text-rag-serious')}>{(total * 100).toFixed(0)}%</span>
            </div>
            <Progress className="mt-2" value={total * 100} tone={Math.abs(total - 1) < 0.005 ? RAG.good : RAG.serious} />
            <p className="mt-3 text-2xs leading-relaxed text-ink-muted">
              Sign-off is blocked until every competency row carries a rating, a cultural fitment value is selected and a final decision is chosen. That constraint comes from the IAS, and the platform enforces it rather than trusting the interviewer to remember.
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
