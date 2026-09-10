import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Clock, FileText, Layers,
  PenLine, Sparkles, Users,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import { ASSESSMENT_TEMPLATES, RATING_LEGEND, interviewStages, personById } from '@/data'
import { daysBetween, fmtDate, fmtRelative } from '@/lib/dates'
import {
  AiChip, Avatar, AvatarStack, Badge, Button, Card, CardHeader, cx, EmptyState,
  Progress, Segmented, Table, Tabs, Td, Th,
} from '@/components/ui'
import { Page, PageHeader, StatTile } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

type Tab = 'queue' | 'byLevel' | 'templates' | 'scale'

const STATUS_META = {
  ai_draft: { label: 'AI draft ready', tone: 'violet' as const },
  in_review: { label: 'In review', tone: 'amber' as const },
  submitted: { label: 'Signed off', tone: 'green' as const },
  overdue: { label: 'Overdue', tone: 'red' as const },
}

export default function AssessmentHub() {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const reqIds = reqs.map(r => r.id)
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('queue')
  const filter = params.get('filter') ?? 'open'

  const all = useMemo(() => state.assessments.filter(a => reqIds.includes(a.requisitionId)), [state.assessments, reqIds])
  const open = all.filter(a => a.status !== 'submitted')
  const overdue = all.filter(a => a.status === 'overdue')
  const submitted = all.filter(a => a.status === 'submitted')

  const queue = useMemo(() => (
    filter === 'overdue' ? overdue : filter === 'submitted' ? submitted : filter === 'all' ? all : open
  ).sort((a, b) => {
    const rank = { overdue: 0, in_review: 1, ai_draft: 2, submitted: 3 }
    return rank[a.status] - rank[b.status] || +new Date(a.dueAt ?? 0) - +new Date(b.dueAt ?? 0)
  }), [filter, all, open, overdue, submitted])

  const avgDraft = all.length ? all.reduce((s, a) => s + a.aiDraftCoverage, 0) / all.length : 0

  return (
    <>
      <PageHeader
        title="Assessments"
        subtitle="One scorecard per interview level, generated from the requisition workflow. AI drafts roughly four fifths of it; the interviewer edits, confirms and signs the rest."
        tabs={
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'queue', label: 'Scorecard queue', count: open.length },
            { value: 'byLevel', label: 'By interview level' },
            { value: 'templates', label: 'Templates', count: ASSESSMENT_TEMPLATES.length },
            { value: 'scale', label: 'Rating scale' },
          ]} />
        }
      />

      <Page>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatTile label="Open scorecards" value={open.length} icon={<ClipboardCheck className="h-3.5 w-3.5" />} accent={seriesAt(0)}
            hint={`${all.filter(a => a.status === 'ai_draft').length} drafted and waiting on a first read`} />
          <StatTile label="Overdue" value={overdue.length} icon={<AlertTriangle className="h-3.5 w-3.5" />} accent={RAG.critical}
            hint={overdue.length ? 'Past the stage SLA — chase the panel' : 'Everything is inside SLA'} />
          <StatTile label="Signed off" value={submitted.length} icon={<CheckCircle2 className="h-3.5 w-3.5" />} accent={RAG.good}
            hint={`${all.length ? Math.round((submitted.length / all.length) * 100) : 0}% of all generated scorecards`} />
          <StatTile label="AI draft coverage" value={Math.round(avgDraft * 100)} unit="%" icon={<Sparkles className="h-3.5 w-3.5" />} accent={seriesAt(1)}
            footer={<Progress value={avgDraft * 100} tone={seriesAt(1)} />}
            hint="Ratings, evidence and comments pre-filled from the JD, CV and transcript" />
        </div>

        {tab === 'queue' && (
          <>
            <Segmented value={filter} onChange={v => setParams(v === 'open' ? {} : { filter: v })} options={[
              { value: 'open', label: `Needs action (${open.length})` },
              { value: 'overdue', label: `Overdue (${overdue.length})` },
              { value: 'submitted', label: `Signed off (${submitted.length})` },
              { value: 'all', label: `All (${all.length})` },
            ]} />

            {queue.length === 0 ? (
              <Card><EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="Nothing waiting"
                detail="Every scorecard in scope has been reviewed and signed." /></Card>
            ) : (
              <div className="space-y-3">
                {queue.map(a => {
                  const cand = state.candidates.find(c => c.id === a.candidateId)!
                  const req = state.requisitions.find(r => r.id === a.requisitionId)!
                  const meta = STATUS_META[a.status]
                  const late = a.dueAt ? daysBetween(a.dueAt) : 0
                  const confirmed = a.scores.filter(s => s.interviewerConfirmed).length
                  const rated = a.scores.filter(s => s.rating != null).length
                  return (
                    <Card key={a.id} className={cx('overflow-hidden transition-all hover:shadow-lift',
                      a.status === 'overdue' && 'border-rag-critical/30')}>
                      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link to={`/candidates/${cand.id}`} className="flex items-center gap-2">
                              <Avatar name={cand.name} tint={cand.tint} size={30} />
                              <span className="text-[15px] font-semibold text-ink hover:text-electric-700 transition-colors">{cand.name}</span>
                            </Link>
                            <Badge tone={meta.tone} dot>{meta.label}</Badge>
                            <Badge tone="neutral">{req.id}</Badge>
                            {a.status === 'overdue' && late > 0 && <Badge tone="red">{late} day{late === 1 ? '' : 's'} past SLA</Badge>}
                          </div>

                          <p className="mt-1.5 text-[13px] font-medium text-ink-soft">{a.label}</p>
                          <p className="text-2xs text-ink-muted">
                            {a.format} · {a.mode} · interviewed {fmtDate(a.interviewDate)}
                            {a.dueAt && ` · due ${fmtRelative(a.dueAt)}`}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                            <div className="min-w-[10rem]">
                              <div className="flex items-center justify-between text-2xs text-ink-muted">
                                <span>Competency rows rated</span>
                                <span className="tnum">{rated}/{a.scores.length}</span>
                              </div>
                              <Progress className="mt-1" value={(rated / a.scores.length) * 100} height={4}
                                tone={rated === a.scores.length ? RAG.good : seriesAt(0)} />
                            </div>
                            <div className="min-w-[10rem]">
                              <div className="flex items-center justify-between text-2xs text-ink-muted">
                                <span>Interviewer-confirmed</span>
                                <span className="tnum">{confirmed}/{a.scores.length}</span>
                              </div>
                              <Progress className="mt-1" value={(confirmed / a.scores.length) * 100} height={4}
                                tone={confirmed === a.scores.length ? RAG.good : seriesAt(1)} />
                            </div>
                            {a.weightedAverage > 0 && (
                              <div>
                                <p className="text-2xs text-ink-muted">Weighted average</p>
                                <p className="tnum text-[15px] font-bold" style={{ color: a.weightedAverage >= 5 ? RAG.good : seriesAt(0) }}>
                                  {a.weightedAverage.toFixed(2)}<span className="text-2xs font-normal text-ink-faint">/6</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                          <AvatarStack people={a.interviewerIds.map(id => personById(id)!).filter(Boolean).map(p => ({ name: p.name, tint: p.tint }))} size={26} max={3} />
                          <Link to={`/assessments/${a.id}`}>
                            <Button variant={a.status === 'submitted' ? 'secondary' : 'primary'} size="md">
                              {a.status === 'submitted' ? <><FileText className="h-4 w-4" />View</> : <><PenLine className="h-4 w-4" />Review &amp; sign</>}
                            </Button>
                          </Link>
                        </div>
                      </div>

                      {a.status !== 'submitted' && (
                        <div className="flex flex-wrap items-center gap-2 border-t border-surface-line bg-violet-50/40 px-5 py-2.5">
                          <AiChip label={`${Math.round(a.aiDraftCoverage * 100)}% drafted`} />
                          <p className="text-2xs leading-snug text-ink-muted">
                            Ratings, evidence and comments are pre-filled from the JD, the CV, the transcript and previous rounds. You review, edit and sign.
                          </p>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === 'byLevel' && (
          <div className="space-y-5">
            {reqs.map(req => {
              const levels = interviewStages(req)
              const cands = state.candidates.filter(c => c.requisitionId === req.id)
              return (
                <Card key={req.id} className="overflow-hidden">
                  <CardHeader
                    title={<Link to={`/requisitions/${req.id}`} className="hover:text-electric-700 transition-colors">{req.id} · {req.title}</Link>}
                    subtitle={`${levels.length} interview levels configured, so ${levels.length} assessment levels are generated for every candidate`}
                    icon={<Layers className="h-4 w-4" />} />
                  <div className="mt-4 border-t border-surface-line">
                    <Table>
                      <thead>
                        <tr>
                          <Th>Candidate</Th>
                          {levels.map((l, i) => <Th key={l.key} align="center">Assessment L{i + 1}<span className="block font-normal normal-case tracking-normal text-ink-faint">{l.shortName}</span></Th>)}
                          <Th align="center">Consolidated</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {cands.map(c => {
                          const rows = levels.map(l => state.assessments.find(a => a.candidateId === c.id && a.stageKey === l.key))
                          const done = rows.filter(a => a?.status === 'submitted')
                          const consolidated = done.length ? done.reduce((s, a) => s + a!.weightedAverage, 0) / done.length : 0
                          return (
                            <tr key={c.id} className="hover:bg-surface-page/60">
                              <Td>
                                <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5">
                                  <Avatar name={c.name} tint={c.tint} size={26} />
                                  <span className="font-medium text-ink whitespace-nowrap">{c.name}</span>
                                </Link>
                              </Td>
                              {rows.map((a, i) => (
                                <Td key={i} align="center">
                                  {!a ? <span className="text-2xs text-ink-faint">—</span>
                                    : a.status === 'submitted' ? (
                                      <Link to={`/assessments/${a.id}`} className="inline-block">
                                        <span className="tnum text-[15px] font-bold" style={{ color: a.weightedAverage >= 5 ? RAG.good : a.weightedAverage >= 4 ? seriesAt(0) : RAG.warning }}>
                                          {a.weightedAverage.toFixed(2)}
                                        </span>
                                        <span className="block text-2xs text-ink-faint">{a.finalDecision?.startsWith('Good') ? 'Go' : a.finalDecision?.startsWith('Can') ? 'Hold' : 'No'}</span>
                                      </Link>
                                    ) : (
                                      <Link to={`/assessments/${a.id}`}>
                                        <Badge tone={STATUS_META[a.status].tone}>{a.status === 'overdue' ? 'Overdue' : a.status === 'ai_draft' ? 'Draft' : 'Review'}</Badge>
                                      </Link>
                                    )}
                                </Td>
                              ))}
                              <Td align="center">
                                {consolidated > 0
                                  ? <span className="tnum text-[15px] font-bold text-ink">{consolidated.toFixed(2)}<span className="text-2xs font-normal text-ink-faint">/6</span></span>
                                  : <span className="text-2xs text-ink-faint">—</span>}
                              </Td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </Table>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {tab === 'templates' && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {ASSESSMENT_TEMPLATES.map(t => (
              <Card key={t.id} className="card-pad">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-semibold leading-snug text-ink">{t.name}</p>
                  {t.mandatorySignOff && <Badge tone="green">Sign-off required</Badge>}
                </div>
                <p className="mt-1 text-2xs font-medium text-violet-700">{t.format}</p>
                <p className="mt-2 text-2xs text-ink-muted">
                  {t.band === 'Any' ? 'All bands' : (t.band as string[]).join(', ')} ·{' '}
                  {t.jobFamily === 'Any' ? 'All functions' : t.jobFamily} ·{' '}
                  {t.country === 'Any' ? 'All countries' : (t.country as string[]).join(', ')}
                </p>
                <div className="mt-3 space-y-2.5">
                  {t.sections.map(sec => (
                    <div key={sec.title}>
                      <p className="label">{sec.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {sec.fields.slice(0, 6).map(f => (
                          <span key={f} className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-2xs text-ink-soft">{f}</span>
                        ))}
                        {sec.fields.length > 6 && <span className="text-2xs text-ink-faint self-center">+{sec.fields.length - 6}</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-surface-line pt-2.5 text-2xs text-ink-faint">
                  Used {t.usageCount} times across the organisation
                </p>
              </Card>
            ))}
          </div>
        )}

        {tab === 'scale' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader title="Interview rating scale"
                subtitle="Six points, no decimals — taken directly from the Interview Assessment Sheet so scores stay comparable with historical hiring data."
                icon={<ClipboardCheck className="h-4 w-4" />} />
              <div className="card-pad pt-4 space-y-2">
                {RATING_LEGEND.map(r => (
                  <div key={r.value} className="flex items-center gap-3 rounded-xl border border-surface-line p-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[15px] font-bold tnum text-white"
                      style={{ background: r.value >= 5 ? RAG.good : r.value >= 4 ? seriesAt(0) : r.value >= 3 ? RAG.warning : RAG.critical }}>
                      {r.value}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">{r.label}</p>
                      <p className="text-2xs text-ink-muted">Shown in tables as “{r.short}”</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="How the platform separates AI from human"
                subtitle="The one distinction that determines whether a scorecard means anything"
                icon={<Sparkles className="h-4 w-4" />} />
              <div className="card-pad pt-4 space-y-3">
                {[
                  { chip: <AiChip />, title: 'AI-suggested', body: 'A rating, evidence and comment drafted from the JD, competency framework, CV, application, interview transcript and previous rounds. It is visible, labelled and never counted.' },
                  { chip: <Badge tone="green">Interviewer confirmed</Badge>, title: 'Human-confirmed', body: 'A row the interviewer has read and either accepted or changed. Only confirmed rows contribute to the weighted average.' },
                  { chip: <Badge tone="navy">Signed off</Badge>, title: 'Signed', body: 'The whole scorecard, attributed to a named person with a timestamp. Sign-off is blocked until every row is rated, cultural fitment is chosen and a final decision is recorded.' },
                ].map(x => (
                  <div key={x.title} className="rounded-xl border border-surface-line p-4">
                    <div className="flex items-center gap-2">{x.chip}<p className="text-[13px] font-semibold text-ink">{x.title}</p></div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{x.body}</p>
                  </div>
                ))}
                <p className="text-2xs leading-relaxed text-ink-muted">
                  Where an interviewer overrides an AI suggestion, both values are kept in the audit trail. That is how you find out whether the model is drifting — and in which direction.
                </p>
              </div>
            </Card>
          </div>
        )}
      </Page>
    </>
  )
}
