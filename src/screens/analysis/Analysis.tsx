import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, BarChart3, CheckCircle2, Download, GitCompare,
  Layers, Radio, Shield, Sparkles, Target, TrendingUp, Users,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import {
  ASSESSMENT_COMPLETION_RATE, CYCLE_TREND, DEMAND_BY_BAND, DEMAND_BY_FUNCTION,
  DIVERSITY_BY_STAGE, INTERVIEWER_STATS, NO_SHOW_RATE, SOURCE_PERFORMANCE,
  STAGE_AGEING, candidateRollup, countryOf, dashboardMetrics, funnelFor,
  interviewQuality, interviewStages, personById, requisitionHealth,
} from '@/data'
import { daysBetween, fmtDate } from '@/lib/dates'
import {
  CompareBars, FunnelChart, Heatmap, RadarCompare, ScoreRing, StackedBars,
  StageAgeingTable, TalkRatioBar, TrendLines,
} from '@/components/charts'
import {
  AiChip, Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, Progress,
  RagPill, ScoreMeter, Segmented, Select, Table, Tabs, Td, Th,
} from '@/components/ui'
import { Page, PageHeader, StatTile } from '@/components/layout/PageHeader'
import { ALL_PAIRS_SERIES_CAP, RAG, seriesAt } from '@/theme/tokens'

type View = 'compare' | 'deepdive' | 'requisition' | 'quality' | 'leadership'

const VIEWS: { value: View; label: string }[] = [
  { value: 'compare', label: 'Candidate comparison' },
  { value: 'deepdive', label: 'Candidate deep-dive' },
  { value: 'requisition', label: 'Requisition analytics' },
  { value: 'quality', label: 'Interview quality' },
  { value: 'leadership', label: 'Leadership' },
]

export default function Analysis() {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const [params, setParams] = useSearchParams()
  const view = (params.get('view') as View) ?? (state.role === 'leadership' ? 'leadership' : 'compare')

  const allowed = state.role === 'leadership'
    ? VIEWS.filter(v => v.value === 'leadership' || v.value === 'requisition')
    : VIEWS

  return (
    <>
      <PageHeader
        title="Analysis & decision intelligence"
        subtitle="Compare candidates on evidence rather than impression, trace a hiring recommendation back to the statements behind it, and see where the process is actually losing time."
        actions={<Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export to branded PDF</Button>}
        tabs={
          <Tabs value={view} onChange={v => setParams(p => { p.set('view', v); return p })} tabs={allowed} />
        }
      />
      <Page>
        {view === 'compare' && <CompareView />}
        {view === 'deepdive' && <DeepDiveView />}
        {view === 'requisition' && <RequisitionAnalytics reqs={reqs} />}
        {view === 'quality' && <QualityView reqs={reqs} />}
        {view === 'leadership' && <LeadershipView reqs={reqs} />}
      </Page>
    </>
  )
}

/* ══ 1 · Candidate comparison ═════════════════════════════════════════ */

const CompareView = () => {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const [params, setParams] = useSearchParams()
  const [reqId, setReqId] = useState(params.get('req') ?? reqs[0]?.id ?? '')

  const req = state.requisitions.find(r => r.id === reqId) ?? reqs[0]
  const pool = state.candidates.filter(c => c.requisitionId === req?.id && !['Rejected', 'Withdrawn'].includes(c.status))

  const preset = (params.get('candidates') ?? '').split(',').filter(Boolean)
  const [selected, setSelected] = useState<string[]>(
    preset.length ? preset : pool.slice(0, Math.min(3, pool.length)).map(c => c.id))

  const chosen = pool.filter(c => selected.includes(c.id))
  const rolls = chosen.map(c => ({ cand: c, roll: candidateRollup(c.id)! })).filter(x => x.roll)
  const levels = req ? interviewStages(req) : []

  const toggle = (id: string) => setSelected(s =>
    s.includes(id) ? s.filter(x => x !== id) : s.length >= 6 ? s : [...s, id])

  if (!req) return <Card><EmptyState title="No requisitions in scope" /></Card>

  return (
    <div className="space-y-5">
      <Card className="card-pad">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[16rem]">
            <p className="label mb-1.5">Requisition</p>
            <Select value={req.id} onChange={e => { setReqId(e.target.value); setSelected([]) }}>
              {reqs.map(r => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}
            </Select>
          </div>
          <div className="flex-1 min-w-[16rem]">
            <p className="label mb-1.5">Candidates — pick between two and six</p>
            <div className="flex flex-wrap gap-1.5">
              {pool.map(c => {
                const on = selected.includes(c.id)
                return (
                  <button key={c.id} onClick={() => toggle(c.id)}
                    className={cx('inline-flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                      on ? 'border-electric-300 bg-electric-50 text-electric-700' : 'border-surface-line bg-white text-ink-muted hover:border-slate-300')}>
                    <Avatar name={c.name} tint={c.tint} size={20} />{c.name}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
        {selected.length >= 6 && <p className="mt-2 text-2xs text-rag-serious">Six is the maximum — beyond that a side-by-side stops being readable.</p>}
      </Card>

      {rolls.length < 2 ? (
        <Card><EmptyState icon={<GitCompare className="h-5 w-5" />} title="Pick at least two candidates"
          detail="A comparison needs something to compare. Select two or more from the list above." /></Card>
      ) : (
        <>
          <div className={cx('grid gap-4', rolls.length <= 2 ? 'md:grid-cols-2' : rolls.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 xl:grid-cols-4')}>
            {rolls.map(({ cand, roll }, i) => {
              const best = Math.max(...rolls.map(r => r.roll.consolidatedScore))
              const isBest = roll.consolidatedScore === best && best > 0
              return (
                <Card key={cand.id} className={cx('card-pad', isBest && 'ring-2 ring-electric-500')}>
                  <div className="flex items-start gap-3">
                    <Avatar name={cand.name} tint={cand.tint} size={40} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/candidates/${cand.id}`} className="text-[15px] font-semibold text-ink hover:text-electric-700 transition-colors">{cand.name}</Link>
                      <p className="text-2xs text-ink-muted truncate">{cand.currentTitle}</p>
                      <p className="text-2xs text-ink-faint truncate">{cand.currentOrganization}</p>
                    </div>
                    <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white" style={{ background: seriesAt(i) }} title={`Series colour for ${cand.name}`} />
                  </div>

                  {isBest && <Badge tone="blue" className="mt-2">Highest consolidated score</Badge>}

                  <div className="mt-4 flex items-center gap-4">
                    <ScoreRing value={(roll.consolidatedScore / 6) * 100} size={68} stroke={7} />
                    <div>
                      <p className="tnum text-xl font-bold text-ink">{roll.consolidatedScore.toFixed(2)}<span className="text-2xs font-normal text-ink-faint">/6</span></p>
                      <p className="text-2xs text-ink-muted">Consolidated across {roll.perStage.filter(s => s.score != null).length} level{roll.perStage.filter(s => s.score != null).length === 1 ? '' : 's'}</p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-[13px]">
                    {[
                      ['AI match', `${roll.overallMatch}%`],
                      ['Must-have skills', `${cand.screening?.mustHaveMatch ?? '—'}%`],
                      ['Experience relevance', `${cand.screening?.experienceRelevance ?? '—'}%`],
                      ['Notice period', `${cand.noticePeriodDays} days`],
                      ['Status', cand.status],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <dt className="text-ink-muted">{k}</dt><dd className="font-medium text-ink tnum">{v}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-3 border-t border-surface-line pt-3">
                    <p className="label mb-1.5">Stage-by-stage</p>
                    <div className="space-y-1.5">
                      {roll.perStage.map(s => (
                        <div key={s.stageKey} className="flex items-center gap-2">
                          <span className="w-24 shrink-0 truncate text-2xs text-ink-muted">{s.label}</span>
                          {s.score != null ? (
                            <>
                              <Progress value={s.score} max={6} className="flex-1" height={5}
                                tone={s.score >= 5 ? RAG.good : s.score >= 4 ? seriesAt(0) : RAG.warning} />
                              <span className="w-9 shrink-0 text-right tnum text-2xs font-semibold text-ink">{s.score.toFixed(1)}</span>
                            </>
                          ) : <span className="flex-1 text-2xs text-ink-faint">Not reached</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          <Card className="card-pad">
            <RadarCompare
              title="Core competency comparison"
              subtitle={rolls.length > ALL_PAIRS_SERIES_CAP
                ? undefined
                : 'Averaged across every completed level, on the six-point scale'}
              axes={req.competencies.map(c => c.name)}
              max={6}
              series={rolls.map(r => ({ id: r.cand.id, name: r.cand.name, values: req.competencies.map(c => r.roll.perCompetency.find(p => p.competencyId === c.id)?.avg ?? 0) }))}
              height={380} />
          </Card>

          <Card className="card-pad">
            <Heatmap
              title="Comparison matrix"
              subtitle="Every competency against every candidate. Darker is stronger."
              rows={req.competencies.map(c => `${c.name} (${Math.round(c.weight * 100)}%)`)}
              columns={rolls.map(r => r.cand.name.split(' ')[0])}
              values={req.competencies.map(c => rolls.map(r => {
                const v = r.roll.perCompetency.find(p => p.competencyId === c.id)?.avg ?? 0
                return v > 0 ? Number(v.toFixed(1)) : null
              }))}
              max={6} rowLabelWidth={230} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {rolls.map(({ cand, roll }, i) => (
              <Card key={cand.id}>
                <CardHeader
                  title={<span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: seriesAt(i) }} />{cand.name}
                  </span>}
                  subtitle="Strengths and risks drawn from the signed scorecards" action={<AiChip />} />
                <div className="card-pad pt-3 space-y-3">
                  {roll.strengths.length > 0 && (
                    <div>
                      <p className="label mb-1.5">Strengths</p>
                      <ul className="space-y-1.5">
                        {roll.strengths.map(s => (
                          <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-good" strokeWidth={2.5} />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {roll.concerns.length > 0 && (
                    <div>
                      <p className="label mb-1.5">Risks</p>
                      <ul className="space-y-1.5">
                        {roll.concerns.map(s => (
                          <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-serious" strokeWidth={2.5} />{s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                    <p className="flex items-center gap-1.5 label text-violet-700"><Sparkles className="h-3 w-3" />Evidence-based recommendation</p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{roll.recommendation}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <CardHeader title="Side-by-side summary" subtitle="The whole comparison as numbers, for the people who would rather read a table" />
            <div className="mt-4 border-t border-surface-line">
              <Table>
                <thead>
                  <tr><Th>Measure</Th>{rolls.map(r => <Th key={r.cand.id} align="center">{r.cand.name}</Th>)}</tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Overall AI match', get: (r: typeof rolls[number]) => `${r.roll.overallMatch}%` },
                    { label: 'Consolidated interview score', get: (r: typeof rolls[number]) => `${r.roll.consolidatedScore.toFixed(2)}/6` },
                    { label: 'Must-have skills match', get: (r: typeof rolls[number]) => `${r.cand.screening?.mustHaveMatch ?? '—'}%` },
                    { label: 'Experience relevance', get: (r: typeof rolls[number]) => `${r.cand.screening?.experienceRelevance ?? '—'}%` },
                    { label: 'Domain match', get: (r: typeof rolls[number]) => `${r.cand.screening?.domainMatch ?? '—'}%` },
                    { label: 'Levels completed', get: (r: typeof rolls[number]) => `${r.roll.perStage.filter(s => s.score != null).length} of ${levels.length}` },
                    { label: 'Notice period', get: (r: typeof rolls[number]) => `${r.cand.noticePeriodDays} days` },
                    { label: 'Days in process', get: (r: typeof rolls[number]) => `${daysBetween(r.cand.appliedAt)}` },
                    { label: 'Source', get: (r: typeof rolls[number]) => r.cand.source },
                    { label: 'Current status', get: (r: typeof rolls[number]) => r.cand.status },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-surface-page/60">
                      <Td className="font-medium text-ink">{row.label}</Td>
                      {rolls.map(r => <Td key={r.cand.id} align="center" className="text-ink-soft">{row.get(r)}</Td>)}
                    </tr>
                  ))}
                  <tr className="bg-surface-page">
                    <Td className="font-semibold text-ink">Final recommendation</Td>
                    {rolls.map(r => {
                      const last = [...r.roll.perStage].reverse().find(s => s.decision)
                      return (
                        <Td key={r.cand.id} align="center">
                          <Badge tone={last?.decision?.startsWith('Good') ? 'green' : last?.decision?.startsWith('Can') ? 'amber' : 'neutral'}>
                            {last?.decision?.split(' - ')[0] ?? 'Pending'}
                          </Badge>
                        </Td>
                      )
                    })}
                  </tr>
                </tbody>
              </Table>
            </div>
            <div className="card-pad pt-3">
              <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-ink-muted">
                <Shield className="mt-0.5 h-3 w-3 shrink-0" />
                This comparison ranks evidence. It does not pick a hire — that decision belongs to the hiring manager, and the platform will not make it for them.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

/* ══ 2 · Candidate deep-dive ═════════════════════════════════════════ */

const DeepDiveView = () => {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const [params, setParams] = useSearchParams()
  const pool = state.candidates.filter(c => reqs.some(r => r.id === c.requisitionId))
  const [candId, setCandId] = useState(params.get('candidate') ?? pool[0]?.id ?? '')

  const cand = state.candidates.find(c => c.id === candId) ?? pool[0]
  if (!cand) return <Card><EmptyState title="No candidates in scope" /></Card>

  const req = state.requisitions.find(r => r.id === cand.requisitionId)!
  const roll = candidateRollup(cand.id)!
  const levels = interviewStages(req)
  const asms = state.assessments.filter(a => a.candidateId === cand.id)
  const ivs = state.interviews.filter(i => i.candidateId === cand.id)

  const trend = levels.map((l, i) => {
    const row: Record<string, string | number> = { level: l.shortName }
    roll.perCompetency.forEach(p => { const v = p.byStage[i]; if (v != null) row[p.competencyId] = v })
    return row
  }).filter(r => Object.keys(r).length > 1)

  const tracked = roll.perCompetency.filter(p => p.byStage.filter(v => v != null).length >= 2).slice(0, 4)

  return (
    <div className="space-y-5">
      <Card className="card-pad">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[18rem]">
            <p className="label mb-1.5">Candidate</p>
            <Select value={cand.id} onChange={e => { setCandId(e.target.value); setParams(p => { p.set('candidate', e.target.value); return p }) }}>
              {pool.map(c => <option key={c.id} value={c.id}>{c.name} — {c.requisitionId}</option>)}
            </Select>
          </div>
          <Link to={`/candidates/${cand.id}`}><Button variant="secondary">Open full profile <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
          <Avatar name={cand.name} tint={cand.tint} size={64} />
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-ink">{cand.name}</h2>
            <p className="text-[13px] text-ink-muted">
              {cand.currentTitle} at {cand.currentOrganization} · {countryOf(cand.country).flag} {cand.location} · {cand.totalExperienceYears} years
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="blue">{req.id}</Badge>
              <Badge tone={cand.status === 'Offer Recommended' ? 'green' : 'violet'}>{cand.status}</Badge>
              <Badge tone="neutral">{cand.source}</Badge>
              <Badge tone="neutral">{daysBetween(cand.appliedAt)} days in process</Badge>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <div className="text-center">
              <ScoreRing value={roll.overallMatch} size={72} stroke={7} />
              <p className="mt-1 text-2xs text-ink-muted">AI match</p>
            </div>
            <div className="text-center">
              <ScoreRing value={(roll.consolidatedScore / 6) * 100} size={72} stroke={7} />
              <p className="mt-1 text-2xs text-ink-muted">Consolidated {roll.consolidatedScore.toFixed(2)}/6</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7 space-y-5 min-w-0">
          <Card>
            <CardHeader title="Every stage, in order" subtitle="With the score, decision and how long it took"
              icon={<Layers className="h-4 w-4" />} />
            <div className="card-pad pt-4">
              <ol className="relative space-y-3 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-surface-line">
                {req.workflow.map(stg => {
                  const p = cand.stageProgress.find(x => x.stageKey === stg.key)
                  const done = p?.status === 'completed'
                  const current = cand.currentStageKey === stg.key
                  const iv = ivs.find(i => i.stageKey === stg.key)
                  const asm = asms.find(a => a.stageKey === stg.key)
                  return (
                    <li key={stg.key} className="relative">
                      <span className={cx('absolute -left-6 top-1 grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-white',
                        done ? 'bg-rag-good' : current ? 'bg-electric-600' : 'bg-slate-200')}>
                        {done && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />}
                      </span>
                      <div className={cx('rounded-xl border p-3.5', current ? 'border-electric-200 bg-electric-50/30' : done ? 'border-surface-line' : 'border-dashed border-surface-line opacity-55')}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[13px] font-semibold text-ink">{stg.name}</p>
                          <div className="flex items-center gap-2">
                            {p?.score != null && <span className="tnum text-[13px] font-bold" style={{ color: p.score >= 5 ? RAG.good : seriesAt(0) }}>{p.score.toFixed(2)}/6</span>}
                            {p?.decision && <Badge tone={p.decision.startsWith('Good') ? 'green' : p.decision.startsWith('Can') ? 'amber' : 'red'}>{p.decision.split(' - ')[0]}</Badge>}
                          </div>
                        </div>
                        {p?.enteredAt && (
                          <p className="mt-1 text-2xs text-ink-faint">
                            {fmtDate(p.enteredAt)}{p.completedAt && ` → ${fmtDate(p.completedAt)} · ${daysBetween(p.enteredAt, p.completedAt)}d`}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap gap-3">
                          {iv?.recordingAvailable && (
                            <Link to={`/interviews/${iv.id}`} className="inline-flex items-center gap-1 text-2xs font-medium text-electric-600 hover:underline">
                              <Radio className="h-3 w-3" />Recording &amp; transcript
                            </Link>
                          )}
                          {asm && (
                            <Link to={`/assessments/${asm.id}`} className="inline-flex items-center gap-1 text-2xs font-medium text-electric-600 hover:underline">
                              <BarChart3 className="h-3 w-3" />{asm.label}
                            </Link>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
              {roll.interviewAgeingDays.length > 0 && (
                <div className="mt-4 rounded-xl bg-surface-page p-3.5">
                  <p className="label mb-2">Interview ageing — days between consecutive levels</p>
                  <div className="flex flex-wrap gap-2">
                    {roll.interviewAgeingDays.map((d, i) => (
                      <span key={i} className={cx('rounded-lg border px-2.5 py-1 text-2xs font-semibold tnum',
                        d > 10 ? 'border-rag-serious/30 bg-rag-serious/[0.07] text-rag-serious' : 'border-surface-line bg-white text-ink-soft')}>
                        L{i + 1} → L{i + 2}: {d}d
                      </span>
                    ))}
                  </div>
                  <p className="mt-2 text-2xs leading-relaxed text-ink-muted">
                    Straight from the assessment sheet's ageing row. Gaps beyond ten days are where candidates go cold and accept elsewhere.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {tracked.length > 0 && trend.length >= 2 && (
            <Card className="card-pad">
              <TrendLines
                title="Competency score trend across levels"
                subtitle="How the read on each competency changed as different panels tested it"
                data={trend} xKey="level"
                keys={tracked.map(t => ({ key: t.competencyId, label: t.name }))}
                height={250} />
            </Card>
          )}
        </div>

        <div className="xl:col-span-5 space-y-5 min-w-0">
          <Card className="overflow-hidden">
            <div className="bg-brand-grad px-5 py-4">
              <div className="flex items-center gap-3 text-white">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                  <Sparkles className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-[15px] font-semibold leading-tight">Hiring recommendation</h3>
                  <p className="text-[11px] text-white/60">Assembled from signed scorecards · the decision stays with the hiring manager</p>
                </div>
              </div>
            </div>
            <div className="p-5">
              <p className="text-[13px] leading-relaxed text-ink-soft">{roll.recommendation}</p>
              <div className="mt-4">
                <p className="label mb-2">Evidence cited</p>
                <div className="space-y-2">
                  {asms.filter(a => a.status === 'submitted').flatMap(a =>
                    a.scores.filter(s => s.aiSuggested?.evidence.length).slice(0, 2).map(s => ({ a, s })))
                    .slice(0, 5).map(({ a, s }, i) => (
                      <div key={i} className="rounded-xl border border-surface-line p-3">
                        <p className="flex flex-wrap items-center justify-between gap-2 text-2xs">
                          <span className="font-semibold text-ink">{s.name}</span>
                          <Link to={`/assessments/${a.id}`} className="text-electric-600 hover:underline">{a.label}</Link>
                        </p>
                        <p className="mt-1 text-2xs leading-relaxed text-ink-soft">{s.aiSuggested!.evidence[0]}</p>
                        <p className="mt-1 text-2xs text-ink-faint">Rated {s.rating}/6 by {personById(a.signOff.byId ?? '')?.name ?? 'the interviewer'}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="card-pad">
            <Heatmap
              title="Competency score by level"
              subtitle="Where different panels agreed, and where they did not"
              rows={roll.perCompetency.map(p => p.name)}
              columns={levels.map(l => l.shortName)}
              values={roll.perCompetency.map(p => p.byStage)}
              max={6} rowLabelWidth={170} />
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader title="Consolidated strengths" icon={<CheckCircle2 className="h-4 w-4" />} />
              <ul className="card-pad pt-3 space-y-2">
                {roll.strengths.map(s => (
                  <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-good" strokeWidth={2.5} />{s}
                  </li>
                ))}
                {!roll.strengths.length && <p className="text-[13px] text-ink-muted">No signed scorecards yet.</p>}
              </ul>
            </Card>
            <Card>
              <CardHeader title="Consolidated concerns" icon={<AlertTriangle className="h-4 w-4" />} />
              <ul className="card-pad pt-3 space-y-2">
                {roll.concerns.map(s => (
                  <li key={s} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-serious" strokeWidth={2.5} />{s}
                  </li>
                ))}
                {!roll.concerns.length && <p className="text-[13px] text-ink-muted">Nothing material recorded.</p>}
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══ 3 · Requisition analytics ═══════════════════════════════════════ */

const RequisitionAnalytics = ({ reqs }: { reqs: ReturnType<typeof useFilteredReqs> }) => {
  const { state } = useApp()
  const [reqId, setReqId] = useState<string>('all')
  const scope = reqId === 'all' ? reqs.map(r => r.id) : [reqId]
  const m = useMemo(() => dashboardMetrics(scope), [scope.join(',')])
  const funnel = funnelFor(scope)
  // Combining stages across requisitions is a count-weighted average, not a mean
  // of medians — a stage with nine candidates should not weigh the same as one.
  const ageing = useMemo(() => {
    if (reqId !== 'all') return STAGE_AGEING[reqId] ?? []
    const acc: (typeof STAGE_AGEING[string][number] & { _w: number })[] = []
    for (const row of reqs.flatMap(r => STAGE_AGEING[r.id] ?? [])) {
      const hit = acc.find(a => a.stage === row.stage)
      const w = Math.max(row.count, 1)
      if (hit) {
        const total = hit._w + w
        hit.medianDays = Number(((hit.medianDays * hit._w + row.medianDays * w) / total).toFixed(1))
        hit.slaDays = Math.round((hit.slaDays * hit._w + row.slaDays * w) / total)
        hit.oldestDays = Math.max(hit.oldestDays, row.oldestDays)
        hit.count += row.count
        hit._w = total
      } else {
        acc.push({ ...row, _w: w })
      }
    }
    return acc.map(({ _w, ...rest }) => rest)
  }, [reqId, reqs])

  const diversityPermitted = (reqId === 'all' ? reqs : reqs.filter(r => r.id === reqId))
    .every(r => countryOf(r.country).diversityReportingPermitted)

  return (
    <div className="space-y-5">
      <Card className="card-pad">
        <div className="min-w-[18rem] max-w-md">
          <p className="label mb-1.5">Scope</p>
          <Select value={reqId} onChange={e => setReqId(e.target.value)}>
            <option value="all">All requisitions in scope ({reqs.length})</option>
            {reqs.map(r => <option key={r.id} value={r.id}>{r.id} · {r.title}</option>)}
          </Select>
        </div>
      </Card>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { l: 'Applied', v: funnel[0].count, h: 'Total applications' },
          { l: 'Recruiter screening conversion', v: `${funnel[1].count ? ((funnel[2].count / funnel[1].count) * 100).toFixed(1) : 0}%`, h: 'AI screened → shortlisted' },
          { l: 'Interview no-show rate', v: `${NO_SHOW_RATE}%`, h: 'Against all scheduled interviews' },
          { l: 'Assessment completion', v: `${ASSESSMENT_COMPLETION_RATE}%`, h: 'Scorecards signed within SLA' },
          { l: 'Feedback turnaround', v: `${CYCLE_TREND[CYCLE_TREND.length - 1].feedbackTurnaround}d`, h: 'Interview to signed scorecard' },
          { l: 'Offer pipeline', v: funnel[5].count, h: 'Recommendations in build' },
        ].map(s => <StatTile key={s.l} label={s.l} value={s.v} hint={s.h} />)}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="card-pad">
          <FunnelChart title="Funnel conversion by stage" subtitle="Applied through to hired, with step conversion" data={funnel} />
        </Card>
        <Card className="card-pad">
          <StageAgeingTable title="Time spent in each stage"
            subtitle="Median days against the configured SLA — the notch marks the SLA" data={ageing} />
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="card-pad">
          <StackedBars
            title="Candidate source performance"
            subtitle="Volume through the funnel by channel — referrals are small and convert best"
            data={SOURCE_PERFORMANCE as unknown as Record<string, string | number>[]}
            xKey="source" horizontal height={280}
            keys={[
              { key: 'shortlisted', label: 'Shortlisted' },
              { key: 'interviewed', label: 'Interviewed' },
              { key: 'offered', label: 'Offered' },
            ]} />
        </Card>
        <Card className="card-pad">
          <CompareBars
            title="Source quality score"
            subtitle="Weighted on progression depth rather than raw volume"
            items={SOURCE_PERFORMANCE.map(s => ({ label: s.source, value: s.quality, note: `${s.applied} applied` }))}
            max={100} unit=""
            colorFn={v => v >= 80 ? RAG.good : v >= 65 ? seriesAt(0) : v >= 55 ? RAG.warning : RAG.critical} />
        </Card>
      </div>

      <Card className="card-pad">
        <TrendLines
          title="Cycle time trend"
          subtitle="Twelve weeks of time-to-shortlist, interview cycle and feedback turnaround, all in days"
          data={CYCLE_TREND as unknown as Record<string, string | number>[]}
          xKey="week" unit="d" area
          keys={[
            { key: 'timeToShortlist', label: 'Time to shortlist' },
            { key: 'interviewCycle', label: 'Interview cycle' },
            { key: 'feedbackTurnaround', label: 'Feedback turnaround' },
          ]}
          height={260} />
      </Card>

      <Card className="card-pad">
        {diversityPermitted ? (
          <StackedBars
            title="Representation by stage"
            subtitle="Self-declared, aggregated, and only shown where the jurisdiction permits reporting"
            data={DIVERSITY_BY_STAGE as unknown as Record<string, string | number>[]}
            xKey="stage" unit="%" height={250}
            keys={[
              { key: 'female', label: 'Female' },
              { key: 'male', label: 'Male' },
              { key: 'undisclosed', label: 'Undisclosed' },
            ]} />
        ) : (
          <EmptyState icon={<Shield className="h-5 w-5" />} title="Diversity reporting is not available for this scope"
            detail="One or more requisitions sit in a jurisdiction where collecting or reporting demographic data is not permitted. The platform does not collect it there, so there is nothing to show." />
        )}
      </Card>
    </div>
  )
}

/* ══ 4 · Interview quality ═══════════════════════════════════════════ */

const QualityView = ({ reqs }: { reqs: ReturnType<typeof useFilteredReqs> }) => {
  const { state } = useApp()
  const reqIds = reqs.map(r => r.id)
  const quality = useMemo(() => interviewQuality(reqIds), [reqIds.join(',')])
  const overdue = state.assessments.filter(a => reqIds.includes(a.requisitionId) && a.status !== 'submitted')

  const avgCoverage = quality.length ? quality.reduce((s, q) => s + q.coveragePct, 0) / quality.length : 0
  const avgCandidateTalk = quality.length ? quality.reduce((s, q) => s + q.talkRatio.candidate, 0) / quality.length : 0
  const thin = quality.filter(q => q.feedbackWords < 200).length

  const people = INTERVIEWER_STATS.filter(s => reqs.some(r => r.panelIds.includes(s.personId) || r.hiringManagerId === s.personId))

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile label="Average competency coverage" value={avgCoverage.toFixed(0)} unit="%"
          footer={<Progress value={avgCoverage} tone={avgCoverage >= 90 ? RAG.good : RAG.warning} />}
          hint="Share of the competencies a stage was meant to test that actually came up" />
        <StatTile label="Average candidate talk share" value={avgCandidateTalk.toFixed(0)} unit="%"
          footer={<Progress value={avgCandidateTalk} tone={avgCandidateTalk >= 60 ? RAG.good : RAG.serious} />}
          hint="Target is roughly 70%" />
        <StatTile label="Thin scorecards" value={thin}
          hint="Under 200 words of evidence — usually a sign the panel wrote it from memory" />
        <StatTile label="Feedback outstanding" value={overdue.length}
          hint={`${overdue.filter(a => a.status === 'overdue').length} past SLA`} />
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Interview-by-interview quality"
          subtitle="Coverage, talk-time split, evidence depth and turnaround, per conversation" icon={<Target className="h-4 w-4" />} />
        <div className="mt-4 border-t border-surface-line">
          <Table>
            <thead>
              <tr>
                <Th>Interview</Th><Th>Panel</Th><Th align="center">Coverage</Th>
                <Th className="min-w-[11rem]">Talk time</Th><Th align="center">Duration</Th>
                <Th align="center">Questions</Th><Th align="center">Evidence words</Th><Th align="center">Turnaround</Th>
              </tr>
            </thead>
            <tbody>
              {quality.map(q => (
                <tr key={q.interviewId} className="hover:bg-surface-page/60 align-top">
                  <Td>
                    <Link to={`/interviews/${q.interviewId}`} className="font-medium text-ink hover:text-electric-700 transition-colors whitespace-nowrap">{q.candidateName}</Link>
                    <p className="text-2xs text-ink-muted">{q.stage}</p>
                  </Td>
                  <Td className="text-2xs text-ink-muted whitespace-nowrap">{q.interviewerIds.map(id => personById(id)?.name.split(' ')[0]).join(', ')}</Td>
                  <Td align="center" className="min-w-[6.5rem]">
                    <span className="tnum text-[13px] font-semibold" style={{ color: q.coveragePct >= 90 ? RAG.good : q.coveragePct >= 70 ? RAG.warning : RAG.critical }}>{q.coveragePct}%</span>
                    <Progress className="mt-1" value={q.coveragePct} height={4} tone={q.coveragePct >= 90 ? RAG.good : q.coveragePct >= 70 ? RAG.warning : RAG.critical} />
                  </Td>
                  <Td><TalkRatioBar interviewer={q.talkRatio.interviewer} candidate={q.talkRatio.candidate} /></Td>
                  <Td align="center" className="text-ink-soft">{q.durationMins}m</Td>
                  <Td align="center" className="text-ink-soft">{q.questionsCovered}</Td>
                  <Td align="center">
                    <span className={cx('tnum font-semibold', q.feedbackWords < 200 ? 'text-rag-serious' : 'text-ink-soft')}>{q.feedbackWords}</span>
                    {q.feedbackWords < 200 && <span className="block text-2xs text-rag-serious">Thin</span>}
                  </Td>
                  <Td align="center">
                    {q.turnaroundDays == null ? <Badge tone="red">Not submitted</Badge> : (
                      <span className={cx('tnum font-semibold', q.turnaroundDays > q.slaDays ? 'text-rag-serious' : 'text-rag-good')}>
                        {q.turnaroundDays}d<span className="block text-2xs font-normal text-ink-faint">SLA {q.slaDays}d</span>
                      </span>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="card-pad">
          <CompareBars
            title="Interviewer feedback quality"
            subtitle="Average words of evidence per scorecard — depth, not verbosity, but under 150 is a red flag"
            items={people.map(p => ({ label: personById(p.personId)?.name ?? p.personId, value: p.avgWordsPerScorecard, note: `${p.interviews} interviews` }))}
            colorFn={v => v >= 350 ? RAG.good : v >= 200 ? seriesAt(0) : RAG.critical} />
        </Card>
        <Card className="card-pad">
          <CompareBars
            title="Feedback turnaround by interviewer"
            subtitle="Days from interview to signed scorecard. Lower is better."
            items={people.map(p => ({ label: personById(p.personId)?.name ?? p.personId, value: p.avgTurnaroundDays, note: p.overdue ? `${p.overdue} overdue` : 'none overdue' }))}
            unit="d"
            colorFn={v => v <= 2 ? RAG.good : v <= 4 ? RAG.warning : RAG.critical} />
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Overdue feedback tracker" subtitle="Who is holding up which decision, and for how long"
          icon={<AlertTriangle className="h-4 w-4" />} />
        {overdue.length === 0 ? (
          <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="Nothing outstanding" detail="Every scorecard in scope has been signed." />
        ) : (
          <div className="mt-4 border-t border-surface-line">
            <Table>
              <thead>
                <tr><Th>Scorecard</Th><Th>Candidate</Th><Th>Owner</Th><Th align="center">Due</Th><Th align="center">Status</Th><Th className="w-24" /></tr>
              </thead>
              <tbody>
                {overdue.map(a => {
                  const c = state.candidates.find(x => x.id === a.candidateId)!
                  const late = a.dueAt ? daysBetween(a.dueAt) : 0
                  return (
                    <tr key={a.id} className="hover:bg-surface-page/60">
                      <Td className="font-medium text-ink">{a.label}</Td>
                      <Td>
                        <Link to={`/candidates/${c.id}`} className="inline-flex items-center gap-2">
                          <Avatar name={c.name} tint={c.tint} size={22} /><span className="text-ink-soft">{c.name}</span>
                        </Link>
                      </Td>
                      <Td className="text-ink-soft whitespace-nowrap">{a.interviewerIds.map(id => personById(id)?.name).filter(Boolean).join(', ')}</Td>
                      <Td align="center" className="text-ink-soft">{a.dueAt ? fmtDate(a.dueAt) : '—'}</Td>
                      <Td align="center">
                        {late > 0 ? <Badge tone="red">{late}d past SLA</Badge> : <Badge tone="amber">In review</Badge>}
                      </Td>
                      <Td><Link to={`/assessments/${a.id}`} className="text-[13px] font-medium text-electric-600 hover:underline">Open</Link></Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ══ 5 · Leadership ══════════════════════════════════════════════════ */

const LeadershipView = ({ reqs }: { reqs: ReturnType<typeof useFilteredReqs> }) => {
  const { state } = useApp()
  const reqIds = reqs.map(r => r.id)
  const health = reqs.map(requisitionHealth)
  const m = useMemo(() => dashboardMetrics(reqIds), [reqIds.join(',')])
  const atRisk = health.filter(h => h.rag === 'critical' || h.rag === 'serious')

  const bottlenecks = useMemo(() => {
    const rows = reqs.flatMap(r => (STAGE_AGEING[r.id] ?? []).map(s => ({ ...s, reqId: r.id })))
    return rows.filter(s => s.medianDays > s.slaDays)
      .sort((a, b) => (b.medianDays - b.slaDays) - (a.medianDays - a.slaDays))
      .slice(0, 6)
  }, [reqs])

  const slowest = [...INTERVIEWER_STATS].sort((a, b) => b.avgTurnaroundDays - a.avgTurnaroundDays).slice(0, 4)

  return (
    <div className="space-y-5">
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatTile label="Open requisitions" value={m.activeRequisitions} hint={`${atRisk.length} at risk`} />
        <StatTile label="Candidates in pipeline" value={m.candidatesInPipeline} hint="Shortlist through to offer" />
        <StatTile label="Interview cycle time" value={CYCLE_TREND[CYCLE_TREND.length - 1].interviewCycle} unit="days"
          delta="−5.6 days across twelve weeks" deltaGood />
        <StatTile label="Time to shortlist" value={m.timeToShortlist} unit="days" delta="−2.1 vs last quarter" deltaGood />
        <StatTile label="Offer conversion" value={m.offerRate} unit="%" hint="Shortlist through to offer recommendation" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="card-pad">
          <StackedBars
            title="Hiring demand by function and country"
            subtitle="Open requisitions across the portfolio"
            data={DEMAND_BY_FUNCTION as unknown as Record<string, string | number>[]}
            xKey="function" horizontal height={300}
            keys={[
              { key: 'IN', label: 'India' }, { key: 'GB', label: 'United Kingdom' },
              { key: 'SG', label: 'Singapore' }, { key: 'US', label: 'United States' },
            ]} />
        </Card>
        <Card className="card-pad">
          <StackedBars
            title="Demand by band"
            subtitle="Open against filled — senior bands are where the shortfall sits"
            data={DEMAND_BY_BAND as unknown as Record<string, string | number>[]}
            xKey="band" stacked={false} height={300}
            keys={[{ key: 'open', label: 'Open' }, { key: 'filled', label: 'Filled' }]} />
        </Card>
      </div>

      <Card>
        <CardHeader title="Open requisition health" subtitle="RAG computed from days open, remaining stages against SLA and pipeline depth"
          icon={<Target className="h-4 w-4" />} />
        <div className="card-pad pt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {health.map(h => (
            <div key={h.req.id} className="rounded-xl border border-surface-line p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-2xs font-semibold text-ink-faint">{h.req.id}</span>
                  <p className="mt-0.5 text-[13px] font-semibold leading-snug text-ink line-clamp-2">{h.req.title}</p>
                </div>
                <RagPill status={h.rag} />
              </div>
              <p className="mt-1.5 text-2xs text-ink-muted">
                {countryOf(h.req.country).flag} {h.req.location.split(',')[0]} · {h.req.band} · {personById(h.req.hiringManagerId)?.name}
              </p>
              <Progress className="mt-3" value={h.progressPct} tone={RAG[h.rag]} />
              <div className="mt-2 flex items-center justify-between text-2xs">
                <span className="text-ink-muted">{h.daysOpen}d open · {h.inProcess} in process</span>
                <span className={cx('font-semibold', h.daysToTarget < 7 ? 'text-rag-critical' : 'text-ink-soft')}>
                  {h.daysToTarget < 0 ? `${Math.abs(h.daysToTarget)}d over` : `${h.daysToTarget}d left`}
                </span>
              </div>
              <p className="mt-2 text-2xs leading-snug text-ink-muted line-clamp-2">{h.reasons[0]}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader title="Where the process is losing time" subtitle="Stages running past their SLA, worst overrun first"
            icon={<TrendingUp className="h-4 w-4" />} />
          <div className="card-pad pt-4 space-y-2.5">
            {bottlenecks.length === 0 ? <p className="text-[13px] text-ink-muted">Every stage is inside its SLA.</p> : bottlenecks.map((b, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-line p-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-rag-serious/10 text-2xs font-bold text-rag-serious tnum">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink">{b.stage}</p>
                  <p className="text-2xs text-ink-muted">{b.reqId} · {b.count} candidate{b.count === 1 ? '' : 's'} · oldest {b.oldestDays} days</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="tnum text-[15px] font-bold text-rag-serious">+{(b.medianDays - b.slaDays).toFixed(1)}d</p>
                  <p className="text-2xs text-ink-faint">over SLA</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Hiring team responsiveness" subtitle="Slowest feedback turnaround — the cheapest cycle time to recover"
            icon={<Users className="h-4 w-4" />} />
          <div className="card-pad pt-4 space-y-2.5">
            {slowest.map(s => {
              const p = personById(s.personId)!
              return (
                <div key={s.personId} className="flex items-center gap-3 rounded-xl border border-surface-line p-3">
                  <Avatar name={p.name} tint={p.tint} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                    <p className="text-2xs text-ink-muted">{s.interviews} interviews · {s.avgWordsPerScorecard} words per scorecard · {s.coveragePct}% coverage</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cx('tnum text-[15px] font-bold', s.avgTurnaroundDays > 4 ? 'text-rag-critical' : s.avgTurnaroundDays > 2 ? 'text-rag-warning' : 'text-rag-good')}>
                      {s.avgTurnaroundDays}d
                    </p>
                    {s.overdue > 0 && <p className="text-2xs text-rag-critical">{s.overdue} overdue</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="bg-brand-grad px-5 py-4">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <AlertTriangle className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-[15px] font-semibold leading-tight">Top risks and recommended actions</h3>
              <p className="text-[11px] text-white/60">Derived from live pipeline state · each item names what it is based on</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-surface-line">
          {atRisk.map(h => (
            <div key={h.req.id} className="flex flex-col gap-3 p-5 lg:flex-row lg:items-start">
              <RagPill status={h.rag} className="shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{h.req.id} · {h.req.title}</p>
                <ul className="mt-1.5 space-y-1">
                  {h.reasons.map(r => (
                    <li key={r} className="flex gap-2 text-[13px] leading-snug text-ink-soft">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: RAG[h.rag] }} />{r}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
                  <span className="font-semibold text-ink">Recommended: </span>
                  {h.inProcess <= 1
                    ? `Reopen sourcing immediately or agree an extension with ${personById(h.req.hiringManagerId)?.name}. A single candidate at this stage means no fallback if they decline.`
                    : h.daysToTarget < 7
                      ? `Compress the remaining stages — run the last two levels as a single panel and pre-book the slots with ${personById(h.req.hiringManagerId)?.name}.`
                      : 'Hold the current plan and re-check at the next weekly review.'}
                </p>
              </div>
              <Link to={`/requisitions/${h.req.id}`} className="shrink-0">
                <Button variant="secondary" size="sm">Open requisition</Button>
              </Link>
            </div>
          ))}
          {atRisk.length === 0 && <EmptyState icon={<CheckCircle2 className="h-5 w-5" />} title="No requisitions at risk" detail="Everything in scope is tracking to plan." />}
        </div>
      </Card>

      {state.role === 'leadership' && (
        <div className="rounded-2xl border border-surface-line bg-white p-4">
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
            You are viewing as a Leadership Viewer. Candidate names, CVs and individual scorecards are masked under your role policy — this view is aggregate by design.
          </p>
        </div>
      )}
    </div>
  )
}
