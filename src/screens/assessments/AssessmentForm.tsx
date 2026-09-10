import { Fragment, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Check, CheckCircle2, ChevronDown, ChevronRight,
  Download, FileSignature, Info, PenLine, Sparkles, Undo2, X,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import {
  CULTURAL_FITMENT, IAS_DECISIONS, IDEAL_CANDIDATE_TRAITS,
  RATING_LEGEND, countryOf, personById,
} from '@/data'
import { fmtDate, fmtRelative } from '@/lib/dates'
import {
  AiChip, Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, Field,
  HumanChip, Progress, RatingScale, Select, Table, Td, Textarea, Th,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'
import type { Assessment, CulturalFitment, IasDecision } from '@/data/types'

export default function AssessmentForm() {
  const { assessmentId } = useParams<{ assessmentId: string }>()
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [expanded, setExpanded] = useState<string | null>(null)

  const asm = state.assessments.find(a => a.id === assessmentId)
  if (!asm) return <Page><Card><EmptyState title="Assessment not found" action={<Button onClick={() => nav('/assessments')}>Back to assessments</Button>} /></Card></Page>

  const cand = state.candidates.find(c => c.id === asm.candidateId)!
  const req = state.requisitions.find(r => r.id === asm.requisitionId)!
  const stg = req.workflow.find(s => s.key === asm.stageKey)!
  const iv = state.interviews.find(i => i.id === asm.interviewId)
  const locked = asm.status === 'submitted'
  const canEdit = !locked && (state.role === 'ta_admin' || state.role === 'hiring_manager')

  const rated = asm.scores.filter(s => s.rating != null).length
  const confirmed = asm.scores.filter(s => s.interviewerConfirmed).length
  const edited = asm.scores.filter(s => s.aiSuggested && s.rating != null && s.rating !== s.aiSuggested.rating).length
  const focusIds = new Set(stg.competencyIds)

  const blockers = useMemo(() => {
    const out: string[] = []
    if (rated < asm.scores.length) out.push(`${asm.scores.length - rated} competency row${asm.scores.length - rated === 1 ? '' : 's'} still unrated`)
    if (asm.culturalFitment == null) out.push('Overall cultural fitment not selected')
    if (!asm.finalDecision) out.push('Final decision not recorded')
    return out
  }, [rated, asm.scores.length, asm.culturalFitment, asm.finalDecision])

  type FieldPatch = Partial<Pick<Assessment,
    'culturalFitment' | 'culturalRationale' | 'inputsForNextInterviewer'
    | 'overallComments' | 'reasonForJobChange' | 'finalDecision'>>
  const set = (patch: FieldPatch) => dispatch({ type: 'ASSESSMENT_FIELD', assessmentId: asm.id, patch })

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Assessments', to: '/assessments' }, { label: asm.label }]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={locked ? 'green' : asm.status === 'overdue' ? 'red' : 'violet'} dot>
              {locked ? 'Signed off' : asm.status === 'overdue' ? 'Overdue' : asm.status === 'ai_draft' ? 'AI draft ready' : 'In review'}
            </Badge>
            <Badge tone="neutral">{asm.format}</Badge>
            <Link to={`/requisitions/${req.id}`}><Badge tone="blue">{req.id}</Badge></Link>
            {asm.dueAt && !locked && <span className="text-2xs text-ink-muted">Due {fmtRelative(asm.dueAt)}</span>}
          </div>
        }
        title={`${asm.label} — ${cand.name}`}
        subtitle={`${stg.objective}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export PDF</Button>
            {iv && <Link to={`/interviews/${iv.id}`}><Button variant="secondary">Interview record</Button></Link>}
            {canEdit && (
              <Button variant="primary" size="md" disabled={blockers.length > 0}
                onClick={() => dispatch({ type: 'SIGN_OFF', assessmentId: asm.id })}>
                <FileSignature className="h-4 w-4" />Sign off and submit
              </Button>
            )}
          </>
        }
      />

      <Page>
        {/* ── AI draft banner ─────────────────────────────────────────── */}
        {!locked && (
          <Card className="overflow-hidden border-violet-200">
            <div className="flex flex-col gap-4 bg-brand-grad px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3 text-white">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/15">
                  <Sparkles className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold leading-tight">
                    AI has drafted {Math.round(asm.aiDraftCoverage * 100)}% of this scorecard
                  </h3>
                  <p className="text-[11px] leading-snug text-white/65">
                    Built from the job description, competency framework, CV, application data
                    {iv?.transcript.length ? ', the interview transcript' : ''} and previous rounds. None of it counts until you confirm it.
                  </p>
                </div>
              </div>
              {canEdit && (
                <Button variant="secondary" size="sm" className="shrink-0"
                  onClick={() => dispatch({ type: 'ACCEPT_AI', assessmentId: asm.id })}>
                  <Check className="h-3.5 w-3.5" />Accept the full draft, then edit
                </Button>
              )}
            </div>

            <div className="grid gap-px bg-surface-line sm:grid-cols-4">
              {[
                { l: 'Rows rated', v: `${rated}/${asm.scores.length}`, pct: (rated / asm.scores.length) * 100, tone: rated === asm.scores.length ? RAG.good : seriesAt(0) },
                { l: 'Interviewer-confirmed', v: `${confirmed}/${asm.scores.length}`, pct: (confirmed / asm.scores.length) * 100, tone: confirmed === asm.scores.length ? RAG.good : seriesAt(1) },
                { l: 'AI ratings changed', v: String(edited), pct: (edited / asm.scores.length) * 100, tone: seriesAt(2) },
                { l: 'Weighted average', v: asm.weightedAverage > 0 ? `${asm.weightedAverage.toFixed(2)}/6` : '—', pct: (asm.weightedAverage / 6) * 100, tone: asm.weightedAverage >= 5 ? RAG.good : seriesAt(0) },
              ].map(x => (
                <div key={x.l} className="bg-white px-5 py-3.5">
                  <p className="label">{x.l}</p>
                  <p className="mt-0.5 tnum text-xl font-bold text-ink">{x.v}</p>
                  <Progress className="mt-1.5" value={x.pct} height={4} tone={x.tone} />
                </div>
              ))}
            </div>
          </Card>
        )}

        {locked && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-soft">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-rag-good" />
              <span>
                Signed off by <span className="font-semibold text-ink">{personById(asm.signOff.byId ?? '')?.name ?? 'the interviewer'}</span>
                {asm.signOff.at && ` on ${fmtDate(asm.signOff.at)}`}. Weighted average <span className="font-semibold text-ink tnum">{asm.weightedAverage.toFixed(2)}/6</span>,
                decision <span className="font-semibold text-ink">{asm.finalDecision}</span>.
                {edited > 0 && ` ${edited} of ${asm.scores.length} AI-suggested ratings were changed before signing.`}
              </span>
            </p>
          </div>
        )}

        {/* ── Candidate & interview context — the IAS header block ────── */}
        <Card>
          <CardHeader title="Candidate and interview context"
            subtitle="The header block from the Interview Assessment Sheet, filled from the application rather than retyped" />
          <div className="card-pad pt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Candidate's name", cand.name],
              ['Interview date', fmtDate(asm.interviewDate)],
              ['Current organisation', cand.currentOrganization],
              ['TA partner', personById(req.recruiterId)?.name ?? '—'],
              ['Role / position & band', `${req.title} · ${req.band}`],
              ['Interviewer', asm.interviewerIds.map(id => personById(id)?.name).filter(Boolean).join(', ') || '—'],
              ['Ex-employee check', cand.isExEmployee ? 'Yes, check done' : 'No, not applicable'],
              ['Current location', `${countryOf(cand.country).flag} ${cand.location}`],
              ['Highest education institute', cand.education[0]?.institute ?? '—'],
              ['Experience post qualification', `${cand.experiencePostQualification} years`],
              ['Business segment / function', `${req.businessUnit} · ${req.jobFamily}`],
              ['Mode of interview', asm.mode],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="label">{k}</p>
                <p className="mt-0.5 text-[13px] text-ink">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Rating legend ───────────────────────────────────────────── */}
        <Card className="card-pad">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="label">Rating legend</span>
            {RATING_LEGEND.map(r => (
              <span key={r.value} className="inline-flex items-center gap-1.5 text-2xs text-ink-soft">
                <span className="grid h-5 w-5 place-items-center rounded-md text-2xs font-bold tnum text-white"
                  style={{ background: r.value >= 5 ? RAG.good : r.value >= 4 ? seriesAt(0) : r.value >= 3 ? RAG.warning : RAG.critical }}>
                  {r.value}
                </span>
                {r.label}
              </span>
            ))}
          </div>
        </Card>

        {/* ── The competency matrix ───────────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader title="Competency assessment"
            subtitle={`All ${asm.scores.length} framework competencies appear, as they do on every IAS sheet. The ${focusIds.size} this level is designed to test are marked as primary.`}
            action={
              canEdit ? <Button size="xs" variant="subtle" onClick={() => dispatch({ type: 'ACCEPT_AI', assessmentId: asm.id })}>
                <Sparkles className="h-3 w-3" />Accept all AI rows
              </Button> : undefined
            } />
          <div className="mt-4 border-t border-surface-line">
            <Table>
              <thead>
                <tr>
                  <Th className="w-8" />
                  <Th>Competency evaluated</Th>
                  <Th align="center">Weightage</Th>
                  <Th align="center" className="min-w-[15rem]">Interview rating (scale of 6, no decimals)</Th>
                  <Th align="center">Source</Th>
                  <Th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {asm.scores.map(row => {
                  const comp = req.competencies.find(c => c.id === row.competencyId)
                  const open = expanded === row.competencyId
                  const isFocus = focusIds.has(row.competencyId)
                  const changed = row.aiSuggested && row.rating != null && row.rating !== row.aiSuggested.rating
                  return (
                    <Fragment key={row.competencyId}>
                      <tr className={cx('transition-colors', open ? 'bg-electric-50/40' : 'hover:bg-surface-page/60')}>
                        <Td>
                          <button onClick={() => setExpanded(open ? null : row.competencyId)} className="text-ink-faint hover:text-ink" aria-label="Toggle detail">
                            {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </button>
                        </Td>
                        <Td className="max-w-[18rem]">
                          <p className="font-medium leading-snug text-ink">{row.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className="text-2xs text-ink-muted">{row.category}</span>
                            {isFocus && <Badge tone="blue">Primary at this level</Badge>}
                            {comp?.mustHave && <Badge tone="neutral">Must-have</Badge>}
                          </div>
                        </Td>
                        <Td align="center"><span className="tnum font-semibold text-ink-soft">{Math.round(row.weight * 100)}%</span></Td>
                        <Td align="center">
                          <div className="flex flex-col items-center gap-1.5">
                            <RatingScale value={row.rating} disabled={!canEdit}
                              onChange={v => dispatch({ type: 'SCORE_ROW', assessmentId: asm.id, competencyId: row.competencyId, patch: { rating: v } })} />
                            {row.rating != null && (
                              <span className="text-2xs text-ink-muted">
                                {RATING_LEGEND[row.rating - 1].label}
                                {comp && <span className={cx('ml-1.5 font-semibold', row.rating >= comp.requiredProficiency ? 'text-rag-good' : 'text-rag-serious')}>
                                  {row.rating >= comp.requiredProficiency ? 'meets' : 'below'} the required {comp.requiredProficiency}
                                </span>}
                              </span>
                            )}
                          </div>
                        </Td>
                        <Td align="center">
                          {row.interviewerConfirmed ? <HumanChip label="Confirmed" /> : row.aiSuggested ? <AiChip label="Draft" confidence={row.aiSuggested.confidence} /> : <span className="text-2xs text-ink-faint">Empty</span>}
                          {changed && <span className="mt-1 block text-2xs font-medium text-violet-700">AI said {row.aiSuggested!.rating}</span>}
                        </Td>
                        <Td>
                          {canEdit && row.aiSuggested && !row.interviewerConfirmed && (
                            <Button size="xs" variant="ghost"
                              onClick={() => dispatch({ type: 'ACCEPT_AI', assessmentId: asm.id, competencyId: row.competencyId })}>
                              <Check className="h-3 w-3" />Accept
                            </Button>
                          )}
                          {canEdit && row.interviewerConfirmed && row.aiSuggested && changed && (
                            <Button size="xs" variant="ghost"
                              onClick={() => dispatch({ type: 'SCORE_ROW', assessmentId: asm.id, competencyId: row.competencyId, patch: { rating: row.aiSuggested!.rating } })}>
                              <Undo2 className="h-3 w-3" />Revert
                            </Button>
                          )}
                        </Td>
                      </tr>

                      {open && (
                        <tr>
                          <td colSpan={6} className="border-b border-surface-line bg-electric-50/25 px-5 py-5">
                            <div className="grid gap-5 lg:grid-cols-2 animate-fade-up">
                              <div className="space-y-4">
                                {comp && (
                                  <div className="rounded-xl border border-surface-line bg-white p-3.5">
                                    <p className="label">Evidence to look for</p>
                                    <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{comp.evidenceToLookFor}</p>
                                  </div>
                                )}
                                {row.aiSuggested && row.aiSuggested.evidence.length > 0 && (
                                  <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3.5">
                                    <p className="flex items-center gap-1.5 label text-violet-700">
                                      <Sparkles className="h-3 w-3" />What the model heard
                                    </p>
                                    <ul className="mt-1.5 space-y-1.5">
                                      {row.aiSuggested.evidence.map((e, i) => (
                                        <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-violet-400" />{e}
                                        </li>
                                      ))}
                                    </ul>
                                    <div className="mt-2.5 flex items-center gap-2">
                                      <Progress value={row.aiSuggested.confidence * 100} tone={seriesAt(1)} className="flex-1" height={4} />
                                      <span className="tnum text-2xs font-semibold text-violet-700">{Math.round(row.aiSuggested.confidence * 100)}% confidence</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-3">
                                <Field label={<span className="inline-flex items-center gap-2">Positives observed {row.interviewerConfirmed ? <HumanChip label="Your words" /> : <AiChip label="AI draft" />}</span>}>
                                  <Textarea rows={4} value={row.positives} disabled={!canEdit}
                                    onChange={e => dispatch({ type: 'SCORE_ROW', assessmentId: asm.id, competencyId: row.competencyId, patch: { positives: e.target.value } })}
                                    className="text-[13px]" />
                                </Field>
                                <Field label={<span className="inline-flex items-center gap-2">Negatives observed {row.interviewerConfirmed ? <HumanChip label="Your words" /> : <AiChip label="AI draft" />}</span>}>
                                  <Textarea rows={3} value={row.negatives} disabled={!canEdit}
                                    onChange={e => dispatch({ type: 'SCORE_ROW', assessmentId: asm.id, competencyId: row.competencyId, patch: { negatives: e.target.value } })}
                                    className="text-[13px]" />
                                </Field>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-surface-page">
                  <Td colSpan={2} className="font-semibold text-ink">Weighted average</Td>
                  <Td align="center" className="font-semibold text-ink">100%</Td>
                  <Td align="center">
                    {rated === 0 ? (
                      <span className="text-2xs text-ink-faint">Nothing rated yet</span>
                    ) : (
                      <span className="tnum text-xl font-bold" style={{ color: asm.weightedAverage >= 5 ? RAG.good : asm.weightedAverage >= 4 ? seriesAt(0) : RAG.warning }}>
                        {asm.weightedAverage.toFixed(2)}<span className="text-2xs font-normal text-ink-faint">/6</span>
                      </span>
                    )}
                  </Td>
                  <Td colSpan={2} className="text-2xs leading-snug text-ink-muted">
                    Σ(rating × weight) ÷ Σ(weight) over rated rows only
                  </Td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </Card>

        {/* ── Culture, handover, decision ─────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Overall cultural fitment"
              subtitle="Scored against the ideal-candidate traits from the assessment sheet" />
            <div className="card-pad pt-4 space-y-3">
              <div className="space-y-2">
                {CULTURAL_FITMENT.map(c => (
                  <button key={c.value} disabled={!canEdit}
                    onClick={() => set({ culturalFitment: c.value as CulturalFitment })}
                    className={cx('flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                      asm.culturalFitment === c.value ? 'border-electric-500 bg-electric-50' : 'border-surface-line hover:border-slate-300',
                      !canEdit && 'cursor-default')}>
                    <span className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                      asm.culturalFitment === c.value ? 'border-electric-600 bg-electric-600' : 'border-slate-300')}>
                      {asm.culturalFitment === c.value && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-[13px] leading-snug text-ink-soft">{c.label}</span>
                  </button>
                ))}
              </div>
              <Field label="Rationale for cultural fitment">
                <Textarea rows={4} value={asm.culturalRationale} disabled={!canEdit}
                  onChange={e => set({ culturalRationale: e.target.value })}
                  placeholder="Which traits did you actually see, and where?" className="text-[13px]" />
              </Field>
              <details className="rounded-xl border border-surface-line p-3">
                <summary className="cursor-pointer text-2xs font-semibold uppercase tracking-wider text-ink-muted">
                  The fifteen ideal-candidate traits
                </summary>
                <div className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
                  {IDEAL_CANDIDATE_TRAITS.map(t => (
                    <div key={t.trait} className="text-2xs leading-snug">
                      <span className="font-semibold text-ink">{t.trait}</span>
                      <span className="text-ink-muted"> — {t.detail}</span>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          </Card>

          <div className="space-y-5">
            <Card>
              <CardHeader title="Handover to the next interviewer"
                subtitle="What the next level should spend its time on — the single most useful field on the sheet"
                action={!locked && asm.inputsForNextInterviewer ? <AiChip label="AI draft" /> : undefined} />
              <div className="card-pad pt-4">
                <Textarea rows={5} value={asm.inputsForNextInterviewer} disabled={!canEdit}
                  onChange={e => set({ inputsForNextInterviewer: e.target.value })}
                  placeholder="What did you not get to? What should they push on?" className="text-[13px]" />
              </div>
            </Card>

            <Card>
              <CardHeader title="Overall comments"
                action={!locked && asm.overallComments ? <AiChip label="AI draft" /> : undefined} />
              <div className="card-pad pt-4 space-y-3">
                <Textarea rows={4} value={asm.overallComments} disabled={!canEdit}
                  onChange={e => set({ overallComments: e.target.value })} className="text-[13px]"
                  placeholder="Your read on the conversation, in your own words." />
                <Field label="Candidate's reason for job change">
                  <Textarea rows={2} value={asm.reasonForJobChange} disabled={!canEdit}
                    onChange={e => set({ reasonForJobChange: e.target.value })} className="text-[13px]" />
                </Field>
              </div>
            </Card>
          </div>
        </div>

        {/* ── Final decision & sign-off ───────────────────────────────── */}
        <Card className="overflow-hidden">
          <CardHeader title="Final decision and sign-off"
            subtitle="The scorecard does not count until a named person signs it. That is deliberate." />
          <div className="card-pad pt-4">
            <div className="grid gap-2 sm:grid-cols-3">
              {IAS_DECISIONS.map((d, i) => {
                const tone = [RAG.good, RAG.warning, RAG.critical][i]
                const active = asm.finalDecision === d
                return (
                  <button key={d} disabled={!canEdit} onClick={() => set({ finalDecision: d as IasDecision })}
                    className={cx('rounded-xl border p-4 text-left transition-all', !canEdit && 'cursor-default')}
                    style={active ? { borderColor: tone, background: `${tone}0F`, boxShadow: `0 0 0 1px ${tone}` } : undefined}>
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tone }} />
                      <span className={cx('text-[13px] font-semibold', active ? 'text-ink' : 'text-ink-soft')}>{d.split(' - ')[0]}</span>
                    </span>
                    <span className="mt-1 block text-2xs leading-snug text-ink-muted">{d.split(' - ')[1] ?? ''}</span>
                  </button>
                )
              })}
            </div>

            {blockers.length > 0 && !locked && (
              <div className="mt-4 rounded-xl border border-rag-warning/30 bg-rag-warning/[0.06] p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  <AlertTriangle className="h-4 w-4 text-rag-warning" />Sign-off is blocked
                </p>
                <ul className="mt-2 space-y-1">
                  {blockers.map(b => (
                    <li key={b} className="flex gap-2 text-[13px] text-ink-soft">
                      <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-warning" />{b}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-2xs leading-relaxed text-ink-muted">
                  These constraints come from the assessment sheet itself. The platform enforces them rather than trusting anyone to remember.
                </p>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-surface-line bg-surface-page p-4">
              <div className="flex items-center gap-3">
                {locked ? (
                  <>
                    <Avatar name={personById(asm.signOff.byId ?? '')?.name ?? 'Interviewer'} tint={personById(asm.signOff.byId ?? '')?.tint} size={38} />
                    <div>
                      <p className="text-[13px] font-semibold text-ink">
                        Signed by {personById(asm.signOff.byId ?? '')?.name ?? 'the interviewer'}
                      </p>
                      <p className="text-2xs text-ink-muted">{asm.signOff.at ? `${fmtDate(asm.signOff.at)} · ${fmtRelative(asm.signOff.at)}` : ''}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-ink-muted border border-surface-line">
                      <PenLine className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold text-ink">Not yet signed</p>
                      <p className="text-2xs text-ink-muted">
                        Signing records your name, the timestamp, and how many AI suggestions you changed.
                      </p>
                    </div>
                  </>
                )}
              </div>

              {canEdit && (
                <Button variant="primary" size="md" disabled={blockers.length > 0}
                  onClick={() => dispatch({ type: 'SIGN_OFF', assessmentId: asm.id })}>
                  <FileSignature className="h-4 w-4" />Sign off and submit
                </Button>
              )}
            </div>

            <p className="mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-muted">
              <Info className="mt-0.5 h-3 w-3 shrink-0" />
              AI drafted this scorecard and will keep learning from what you change. It does not make the recommendation, and it never makes the hire.
            </p>
          </div>
        </Card>

        {/* ── Previous levels for context ─────────────────────────────── */}
        <PreviousLevels asm={asm} />
      </Page>
    </>
  )
}

const PreviousLevels = ({ asm }: { asm: ReturnType<typeof useApp>['state']['assessments'][number] }) => {
  const { state } = useApp()
  const req = state.requisitions.find(r => r.id === asm.requisitionId)!
  const levels = req.workflow.filter(s => s.type === 'interview')
  const idx = levels.findIndex(l => l.key === asm.stageKey)
  const prior = levels.slice(0, idx)
    .map(l => state.assessments.find(a => a.candidateId === asm.candidateId && a.stageKey === l.key))
    .filter((a): a is NonNullable<typeof a> => !!a && a.status === 'submitted')

  if (!prior.length) return null

  return (
    <Card>
      <CardHeader title="What the earlier levels found"
        subtitle="Context the AI draft already used. Worth reading before you disagree with it."
        icon={<ArrowRight className="h-4 w-4" />} />
      <div className="card-pad pt-4 space-y-3">
        {prior.map(p => (
          <div key={p.id} className="rounded-xl border border-surface-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Link to={`/assessments/${p.id}`} className="text-[13px] font-semibold text-ink hover:text-electric-700 transition-colors">{p.label}</Link>
              <div className="flex items-center gap-2">
                <span className="tnum text-[15px] font-bold" style={{ color: p.weightedAverage >= 5 ? RAG.good : seriesAt(0) }}>{p.weightedAverage.toFixed(2)}/6</span>
                <Badge tone={p.finalDecision?.startsWith('Good') ? 'green' : p.finalDecision?.startsWith('Can') ? 'amber' : 'red'}>
                  {p.finalDecision?.split(' - ')[0]}
                </Badge>
              </div>
            </div>
            <p className="mt-1 text-2xs text-ink-muted">
              {p.interviewerIds.map(id => personById(id)?.name).filter(Boolean).join(', ')} · {fmtDate(p.interviewDate)}
            </p>
            {p.inputsForNextInterviewer && (
              <div className="mt-2.5 rounded-lg bg-electric-50/50 p-3">
                <p className="label text-electric-700">Handed to you</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{p.inputsForNextInterviewer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
