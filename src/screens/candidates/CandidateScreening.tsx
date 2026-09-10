import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, Briefcase, Building2, CalendarDays, CheckCircle2,
  Copy, Download, FileText, GitCompare, GraduationCap, Info, MapPin, MessageSquarePlus,
  PauseCircle, Send, ShieldCheck, Sparkles, ThumbsUp, UserPlus, Wallet, XCircle,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import {
  HIRING_MANAGERS, candidateRollup, countryOf, personById, RATING_LEGEND,
} from '@/data'
import { daysBetween, fmtDate, fmtRelative } from '@/lib/dates'
import { RadarCompare, ScoreRing } from '@/components/charts'
import {
  AiChip, Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, Field, Hint,
  Modal, Progress, Select, Table, Tabs, Td, Textarea, Th,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

type Tab = 'screening' | 'profile' | 'cv' | 'journey' | 'notes'

export default function CandidateScreening() {
  const { candidateId } = useParams<{ candidateId: string }>()
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [tab, setTab] = useState<Tab>('screening')
  const [decision, setDecision] = useState<null | 'Hold' | 'Reject' | 'Request Info' | 'Assign'>(null)
  const [note, setNote] = useState('')

  const cand = state.candidates.find(c => c.id === candidateId)
  if (!cand) return <Page><Card><EmptyState title="Candidate not found" action={<Button onClick={() => nav('/candidates')}>Back to candidates</Button>} /></Card></Page>

  const req = state.requisitions.find(r => r.id === cand.requisitionId)!
  const sc = cand.screening
  const roll = candidateRollup(cand.id)
  const country = countryOf(cand.country)
  const stage = req.workflow.find(s => s.key === cand.currentStageKey)
  const canDecide = state.role === 'ta_admin' || state.role === 'hiring_manager'
  const awaiting = cand.status === 'AI Screened'

  const mustHaves = sc?.skillMatches.filter(s => s.mustHave) ?? []
  const niceToHaves = sc?.skillMatches.filter(s => !s.mustHave) ?? []
  const gaps = (sc?.skillMatches ?? []).filter(s => s.match < 70).sort((a, b) => a.match - b.match)

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Candidates', to: '/candidates' }, { label: cand.name }]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={cand.status === 'Offer Recommended' ? 'green' : cand.status === 'Rejected' ? 'red' : cand.status === 'On Hold' ? 'amber' : 'violet'}>{cand.status}</Badge>
            <Badge tone="neutral">{cand.id}</Badge>
            <Link to={`/requisitions/${req.id}`}><Badge tone="blue">{req.id} · {req.title.slice(0, 34)}</Badge></Link>
            {cand.isExEmployee && <Badge tone="violet">Ex-employee</Badge>}
            {cand.consent.given && <Badge tone="green" dot>Consent {cand.consent.policyVersion}</Badge>}
          </div>
        }
        title={cand.name}
        subtitle={`${cand.currentTitle} at ${cand.currentOrganization} · ${country.flag} ${cand.location} · ${cand.totalExperienceYears} years experience · applied ${fmtRelative(cand.appliedAt)} via ${cand.source}`}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export PDF</Button>
            <Link to={`/analysis?view=compare&candidates=${cand.id}`}>
              <Button variant="secondary"><GitCompare className="h-3.5 w-3.5" />Compare</Button>
            </Link>
            {roll && roll.consolidatedScore > 0 && (
              <Link to={`/analysis?view=deepdive&candidate=${cand.id}`}>
                <Button variant="primary" size="md"><ArrowRight className="h-4 w-4" />Deep-dive</Button>
              </Link>
            )}
          </>
        }
        tabs={
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'screening', label: 'AI screening' },
            { value: 'profile', label: 'Profile & application' },
            { value: 'cv', label: 'CV' },
            { value: 'journey', label: 'Journey', count: cand.stageProgress.filter(p => p.status === 'completed').length },
            { value: 'notes', label: 'Notes', count: cand.recruiterNotes.length },
          ]} />
        }
      />

      <Page>
        {/* ── The human decision gate ──────────────────────────────────── */}
        {canDecide && awaiting && sc && (
          <Card className="overflow-hidden border-violet-200">
            <div className="bg-brand-grad px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 text-white">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                    <ShieldCheck className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold leading-tight">This decision is yours</h3>
                    <p className="text-[11px] text-white/65">
                      AI suggests <span className="font-semibold text-electric-300">{sc.suggestedDecision}</span> — it has not progressed or rejected anyone. It never will.
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-white/50">Screened {fmtRelative(sc.screenedAt)} · {sc.modelVersion}</span>
              </div>
            </div>

            <div className="p-5">
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Why the model landed here: </span>{sc.rationale}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="primary" size="md" onClick={() => dispatch({ type: 'SCREEN_DECISION', candidateId: cand.id, decision: 'Progress' })}>
                  <ThumbsUp className="h-4 w-4" />Progress to {req.workflow.find(w => w.type === 'interview')?.shortName}
                </Button>
                <Button variant="secondary" size="md" onClick={() => setDecision('Hold')}><PauseCircle className="h-4 w-4" />Put on hold</Button>
                <Button variant="secondary" size="md" onClick={() => setDecision('Request Info')}><Send className="h-4 w-4" />Request more information</Button>
                <Button variant="secondary" size="md" onClick={() => setDecision('Assign')}><UserPlus className="h-4 w-4" />Assign to hiring manager</Button>
                <Button variant="danger" size="md" onClick={() => setDecision('Reject')}><XCircle className="h-4 w-4" />Reject with reason</Button>
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-2xs leading-relaxed text-ink-muted">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                Whichever you choose is written to the audit trail against your name, alongside what the model suggested — including when the two differ.
              </p>
            </div>
          </Card>
        )}

        {!awaiting && cand.status !== 'Rejected' && canDecide && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-surface-line bg-white p-4">
            <p className="text-[13px] text-ink-soft">
              <span className="font-semibold text-ink">{cand.name}</span> is at <span className="font-semibold text-ink">{stage?.name ?? cand.status}</span>
              {cand.stageProgress.find(p => p.stageKey === cand.currentStageKey)?.enteredAt &&
                ` — ${daysBetween(cand.stageProgress.find(p => p.stageKey === cand.currentStageKey)!.enteredAt!)} days in stage against a ${stage?.slaDays ?? '—'}-day SLA.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDecision('Hold')}><PauseCircle className="h-3.5 w-3.5" />Hold</Button>
              <Button variant="secondary" size="sm" onClick={() => setDecision('Assign')}><UserPlus className="h-3.5 w-3.5" />Assign</Button>
              <Button variant="danger" size="sm" onClick={() => setDecision('Reject')}><XCircle className="h-3.5 w-3.5" />Reject</Button>
            </div>
          </div>
        )}

        {tab === 'screening' && (sc ? (
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="xl:col-span-8 space-y-5 min-w-0">

              <Card>
                <CardHeader title="Match summary" subtitle={`Scored against the ${req.competencies.length}-competency framework on ${req.id}`}
                  icon={<Sparkles className="h-4 w-4" />} action={<AiChip label="AI generated" />} />
                <div className="card-pad pt-4">
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-4">
                      <ScoreRing value={sc.overallMatch} size={92} />
                      <div>
                        <p className="label">Overall match</p>
                        <p className="mt-0.5 text-[13px] leading-snug text-ink-muted max-w-[15rem]">
                          Weighted across every competency, with must-haves counting double.
                        </p>
                      </div>
                    </div>
                    <div className="grid flex-1 min-w-[16rem] grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { l: 'Must-have skills', v: sc.mustHaveMatch },
                        { l: 'Nice-to-have', v: sc.niceToHaveMatch },
                        { l: 'Experience relevance', v: sc.experienceRelevance },
                        { l: 'Domain / industry', v: sc.domainMatch },
                      ].map(s => (
                        <div key={s.l}>
                          <p className="tnum text-xl font-bold text-ink">{s.v}%</p>
                          <p className="text-2xs leading-snug text-ink-muted">{s.l}</p>
                          <Progress className="mt-1.5" value={s.v} height={4}
                            tone={s.v >= 85 ? RAG.good : s.v >= 70 ? seriesAt(0) : s.v >= 55 ? RAG.warning : RAG.critical} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                    <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-violet-700">
                      <Sparkles className="h-3 w-3" />Competency evidence summary
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{sc.competencyEvidenceSummary}</p>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Skills match against the competency framework"
                  subtitle="Every score traces back to specific lines in the CV or application. Expand a row to read them."
                  icon={<CheckCircle2 className="h-4 w-4" />} />
                <div className="mt-4 border-t border-surface-line">
                  <Table>
                    <thead>
                      <tr>
                        <Th>Competency</Th><Th>Category</Th><Th align="center">Priority</Th>
                        <Th align="center">Required</Th><Th align="center">Match</Th><Th>Evidence</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...mustHaves, ...niceToHaves].map(s => {
                        const comp = req.competencies.find(c => c.id === s.competencyId)!
                        const short = s.match >= 80 ? 'good' : s.match >= 65 ? 'warning' : 'critical'
                        return (
                          <tr key={s.competencyId} className="hover:bg-surface-page/60 align-top">
                            <Td className="max-w-[14rem]"><span className="font-medium text-ink leading-snug">{s.name}</span></Td>
                            <Td className="whitespace-nowrap text-ink-muted text-2xs">{s.category}</Td>
                            <Td align="center">
                              <Badge tone={s.mustHave ? 'blue' : 'neutral'}>{s.mustHave ? 'Must-have' : 'Good-to-have'}</Badge>
                            </Td>
                            <Td align="center"><span className="tnum text-ink-soft">{comp.requiredProficiency}/6</span></Td>
                            <Td align="center" className="min-w-[6.5rem]">
                              <span className="tnum font-bold" style={{ color: RAG[short] }}>{s.match}%</span>
                              <Progress className="mt-1" value={s.match} height={4} tone={RAG[short]} />
                            </Td>
                            <Td className="max-w-[24rem]">
                              <ul className="space-y-1">
                                {s.evidence.map((e, i) => (
                                  <li key={i} className="flex gap-1.5 text-2xs leading-relaxed text-ink-muted">
                                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-electric-400" />
                                    <span>{e}</span>
                                  </li>
                                ))}
                              </ul>
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card>

              <Card className="card-pad">
                <RadarCompare
                  title="Competency profile against required proficiency"
                  subtitle="Blue is the candidate's evidenced level; violet is what the framework requires."
                  axes={req.competencies.map(c => c.name)}
                  max={6}
                  series={[
                    { id: 'cand', name: cand.name, values: req.competencies.map(c => ((sc.skillMatches.find(s => s.competencyId === c.id)?.match ?? 0) / 100) * 6) },
                    { id: 'req', name: 'Required proficiency', values: req.competencies.map(c => c.requiredProficiency), reference: true },
                  ]}
                  height={330} />
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader title="Strengths" icon={<ThumbsUp className="h-4 w-4" />} action={<AiChip />} />
                  <ul className="card-pad pt-3 space-y-2.5">
                    {sc.strengths.map(s => (
                      <li key={s} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-good" strokeWidth={2.5} />{s}
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card>
                  <CardHeader title="Risks and gaps" icon={<AlertTriangle className="h-4 w-4" />} action={<AiChip />} />
                  <ul className="card-pad pt-3 space-y-2.5">
                    {sc.risks.map(s => (
                      <li key={s} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-serious" strokeWidth={2.5} />{s}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {gaps.length > 0 && (
                <Card>
                  <CardHeader title="Potential gaps to probe"
                    subtitle="Competencies scoring below 70%. Critical gaps cannot be trained away inside a ramp; trainable ones can."
                    icon={<AlertTriangle className="h-4 w-4" />} />
                  <div className="card-pad pt-4 space-y-3">
                    {gaps.map(g => {
                      const comp = req.competencies.find(c => c.id === g.competencyId)!
                      return (
                        <div key={g.competencyId} className="rounded-xl border border-surface-line p-3.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[13px] font-semibold text-ink">{g.name}</p>
                            <div className="flex items-center gap-1.5">
                              <Badge tone={comp.criticality === 'Critical' ? 'red' : 'green'}>{comp.criticality}</Badge>
                              <span className="tnum text-[13px] font-bold" style={{ color: g.match >= 65 ? RAG.warning : RAG.critical }}>{g.match}%</span>
                            </div>
                          </div>
                          <p className="mt-1.5 text-2xs leading-relaxed text-ink-muted">
                            Requires proficiency {comp.requiredProficiency}/6 at {Math.round(comp.weight * 100)}% of the framework weighting.
                            {comp.criticality === 'Critical'
                              ? ' Marked critical — this gap will not close during ramp.'
                              : ' Marked trainable — closeable with the right support.'}
                          </p>
                          <p className="mt-2 text-2xs leading-relaxed text-ink-soft">
                            <span className="font-semibold">Look for: </span>{comp.evidenceToLookFor}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}
            </div>

            {/* ── Right rail ────────────────────────────────────────────── */}
            <div className="xl:col-span-4 space-y-5 min-w-0">
              <Card>
                <CardHeader title="Fit checks" icon={<ShieldCheck className="h-4 w-4" />} />
                <div className="card-pad pt-3 space-y-3">
                  <FitRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location & work authorisation"
                    value={`${country.flag} ${cand.location}`} detail={cand.workAuthorisation}
                    score={sc.locationFit} />
                  <FitRow icon={<Wallet className="h-3.5 w-3.5" />} label="Compensation"
                    value={state.role === 'hiring_manager' ? 'Restricted by role policy' : `Expects ${cand.expectedSalary}`}
                    detail={state.role === 'hiring_manager' ? 'Compensation is visible to TA and leadership only.' : `Currently on ${cand.currentSalary}. Range for this role is ${req.salaryRange}.`} />
                  <FitRow icon={<CalendarDays className="h-3.5 w-3.5" />} label="Notice period"
                    value={`${cand.noticePeriodDays} days`}
                    detail={cand.noticePeriodDays > 60 ? 'Longer than the target close window — flag early.' : 'Workable against the target close date.'} />
                  <FitRow icon={<Building2 className="h-3.5 w-3.5" />} label="Domain / industry"
                    value={cand.currentOrganization} detail={`Domain match ${sc.domainMatch}%`} score={sc.domainMatch} />
                </div>
              </Card>

              <Card>
                <CardHeader title="Duplicate profile check" icon={<Copy className="h-4 w-4" />} />
                <div className="card-pad pt-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md"
                      style={{
                        background: sc.duplicateCheck.status === 'clear' ? `${RAG.good}18` : `${RAG.warning}18`,
                        color: sc.duplicateCheck.status === 'clear' ? RAG.good : RAG.warning,
                      }}>
                      {sc.duplicateCheck.status === 'clear' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold capitalize text-ink">{sc.duplicateCheck.status}</p>
                      <p className="mt-0.5 text-2xs leading-relaxed text-ink-muted">{sc.duplicateCheck.note}</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <CardHeader title="Recommended screening questions"
                  subtitle="Targeted at this candidate's specific gaps, not a generic list"
                  icon={<Sparkles className="h-4 w-4" />} action={<AiChip />} />
                <div className="card-pad pt-3 space-y-2">
                  {sc.recommendedQuestions.map((q, i) => (
                    <div key={i} className="flex gap-2.5 rounded-xl border border-surface-line p-3">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-violet-50 text-2xs font-bold text-violet-700">{i + 1}</span>
                      <p className="text-[13px] leading-relaxed text-ink-soft">{q}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card>
                <CardHeader title="Add a note" icon={<MessageSquarePlus className="h-4 w-4" />} />
                <div className="card-pad pt-3">
                  <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                    placeholder="What did you learn that the model could not see?" />
                  <Button className="mt-2" variant="secondary" size="sm" disabled={!note.trim()}
                    onClick={() => { dispatch({ type: 'ADD_NOTE', candidateId: cand.id, text: note.trim() }); setNote('') }}>
                    Save note
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card><EmptyState icon={<Sparkles className="h-5 w-5" />} title="No AI screening on file"
            detail="This candidate was sourced internally rather than applying externally, so the screening workspace does not apply." /></Card>
        ))}

        {tab === 'profile' && <ProfileTab cand={cand} req={req} />}
        {tab === 'cv' && <CvTab cand={cand} />}
        {tab === 'journey' && <JourneyTab cand={cand} req={req} />}

        {tab === 'notes' && (
          <Card>
            <CardHeader title="Recruiter notes" subtitle="Human observations, kept separate from anything the model produced" />
            <div className="card-pad pt-4 space-y-3">
              <div className="rounded-xl border border-surface-line p-3">
                <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" />
                <Button className="mt-2" variant="primary" size="sm" disabled={!note.trim()}
                  onClick={() => { dispatch({ type: 'ADD_NOTE', candidateId: cand.id, text: note.trim() }); setNote('') }}>
                  Save note
                </Button>
              </div>
              {cand.recruiterNotes.length === 0
                ? <EmptyState title="No notes yet" detail="Anything you record here is attributed to you and timestamped." />
                : cand.recruiterNotes.map(n => (
                  <div key={n.id} className="rounded-xl border border-surface-line p-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={personById(n.authorId)?.name ?? 'Unknown'} tint={personById(n.authorId)?.tint} size={26} />
                      <div>
                        <p className="text-[13px] font-semibold text-ink">{personById(n.authorId)?.name}</p>
                        <p className="text-2xs text-ink-faint">{fmtRelative(n.at)} · {fmtDate(n.at)}</p>
                      </div>
                    </div>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-ink-soft">{n.text}</p>
                  </div>
                ))}
            </div>
          </Card>
        )}
      </Page>

      <DecisionModal kind={decision} onClose={() => setDecision(null)} candidateId={cand.id} candidateName={cand.name} />
    </>
  )
}

/* ── Pieces ───────────────────────────────────────────────────────────── */

const FitRow = ({ icon, label, value, detail, score }: { icon: React.ReactNode; label: string; value: string; detail: string; score?: number }) => (
  <div className="flex items-start gap-2.5">
    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-surface-sunken text-ink-muted">{icon}</span>
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <p className="label">{label}</p>
        {score != null && (
          <span className="tnum text-2xs font-bold" style={{ color: score >= 80 ? RAG.good : score >= 60 ? RAG.warning : RAG.critical }}>{score}%</span>
        )}
      </div>
      <p className="mt-0.5 text-[13px] font-medium text-ink">{value}</p>
      <p className="mt-0.5 text-2xs leading-relaxed text-ink-muted">{detail}</p>
    </div>
  </div>
)

const ProfileTab = ({ cand, req }: { cand: NonNullable<ReturnType<typeof useApp>['state']['candidates'][number]>; req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => (
  <div className="grid gap-5 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <CardHeader title="Application responses" subtitle="Captured at the point of application, parsed from the CV and confirmed by the candidate"
        icon={<FileText className="h-4 w-4" />} />
      <div className="card-pad pt-4 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
        {[
          ['Full name', cand.name], ['Email', cand.email], ['Phone', cand.phone],
          ['Current location', cand.location], ['Current title', cand.currentTitle],
          ['Current organisation', cand.currentOrganization],
          ['Total experience', `${cand.totalExperienceYears} years`],
          ['Experience post highest qualification', `${cand.experiencePostQualification} years`],
          ['Work authorisation', cand.workAuthorisation],
          ['Notice period', `${cand.noticePeriodDays} days`],
          ['Current compensation', cand.currentSalary], ['Expected compensation', cand.expectedSalary],
          ['Ex-employee', cand.isExEmployee ? 'Yes — internal record matched' : 'No, not applicable'],
          ['Source', cand.source],
        ].map(([k, v]) => (
          <div key={k}>
            <p className="label">{k}</p>
            <p className="mt-0.5 text-[13px] text-ink">{v}</p>
          </div>
        ))}
        <div className="sm:col-span-2">
          <p className="label">Reason for job change</p>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink">{cand.reasonForChange}</p>
        </div>
      </div>
    </Card>

    <div className="space-y-5">
      <Card>
        <CardHeader title="Consent & privacy" icon={<ShieldCheck className="h-4 w-4" />} />
        <div className="card-pad pt-3 space-y-2.5 text-[13px]">
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Consent given</span>
            <Badge tone={cand.consent.given ? 'green' : 'red'}>{cand.consent.given ? 'Yes' : 'No'}</Badge>
          </div>
          <div className="flex items-center justify-between"><span className="text-ink-muted">Policy version</span><span className="font-medium text-ink">{cand.consent.policyVersion}</span></div>
          <div className="flex items-center justify-between"><span className="text-ink-muted">Recorded</span><span className="font-medium text-ink">{fmtDate(cand.consent.at)}</span></div>
          <div className="flex items-center justify-between"><span className="text-ink-muted">Retention</span><span className="font-medium text-ink">{cand.consent.dataRetentionMonths} months</span></div>
          <p className="pt-2 text-2xs leading-relaxed text-ink-muted border-t border-surface-line">
            The candidate can withdraw consent from their portal at any time. Doing so removes the profile from screening and analysis within 24 hours.
          </p>
          {!countryOf(cand.country).diversityReportingPermitted && (
            <p className="text-2xs leading-relaxed text-ink-muted">
              Demographic data is not collected for {countryOf(cand.country).name} — reporting is not permitted in this jurisdiction.
            </p>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Education" icon={<GraduationCap className="h-4 w-4" />} />
        <div className="card-pad pt-3 space-y-3">
          {cand.education.map(e => (
            <div key={e.institute}>
              <p className="text-[13px] font-semibold text-ink">{e.qualification}</p>
              <p className="text-2xs text-ink-muted">{e.institute} · {e.year}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Skills declared" icon={<Briefcase className="h-4 w-4" />} />
        <div className="card-pad pt-3 flex flex-wrap gap-1.5">
          {cand.skills.map(s => {
            const matched = req.competencies.some(c => c.name.toLowerCase().includes(s.toLowerCase().split(' ')[0]))
            return (
              <span key={s} className={cx('rounded-md px-2 py-0.5 text-2xs font-medium',
                matched ? 'bg-electric-50 text-electric-700 border border-electric-100' : 'bg-surface-sunken text-ink-soft')}>{s}</span>
            )
          })}
        </div>
      </Card>
    </div>
  </div>
)

const CvTab = ({ cand }: { cand: ReturnType<typeof useApp>['state']['candidates'][number] }) => (
  <div className="grid gap-5 lg:grid-cols-3">
    <Card className="lg:col-span-2">
      <CardHeader title={cand.cvFileName} subtitle={cand.cvSummary} icon={<FileText className="h-4 w-4" />}
        action={<Button size="xs" variant="secondary"><Download className="h-3 w-3" />Download</Button>} />
      <div className="card-pad pt-4 space-y-5">
        {cand.workHistory.map((w, i) => (
          <div key={i} className="relative pl-5 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-electric-500
            after:absolute after:left-[3px] after:top-5 after:bottom-[-1rem] after:w-px after:bg-surface-line last:after:hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-[15px] font-semibold text-ink">{w.title}</h4>
              <span className="text-2xs text-ink-muted tnum">{w.from} – {w.to}</span>
            </div>
            <p className="text-[13px] text-ink-muted">{w.company} · {w.location}</p>
            <ul className="mt-2 space-y-1.5">
              {w.highlights.map(h => (
                <li key={h} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-faint" />{h}
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div className="border-t border-surface-line pt-4">
          <p className="label mb-2">Education</p>
          {cand.education.map(e => (
            <p key={e.institute} className="text-[13px] text-ink-soft">{e.qualification} — {e.institute}, {e.year}</p>
          ))}
        </div>
      </div>
    </Card>

    <Card>
      <CardHeader title="How the CV was read" subtitle="Parsed, then confirmed by the candidate before submission"
        icon={<Sparkles className="h-4 w-4" />} action={<AiChip />} />
      <div className="card-pad pt-3 space-y-3">
        {[
          ['Roles extracted', `${cand.workHistory.length} positions across ${cand.totalExperienceYears} years`],
          ['Education extracted', `${cand.education.length} qualification${cand.education.length === 1 ? '' : 's'}`],
          ['Skills extracted', `${cand.skills.length} skills, mapped to the requisition framework`],
          ['Corrections by candidate', '2 fields adjusted before submission'],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-surface-line p-3">
            <p className="label">{k}</p>
            <p className="mt-0.5 text-[13px] text-ink-soft">{v}</p>
          </div>
        ))}
        <p className="text-2xs leading-relaxed text-ink-muted">
          Parsed fields are always shown back to the candidate for correction before an application is accepted. Nothing extracted is treated as fact until they confirm it.
        </p>
      </div>
    </Card>
  </div>
)

const JourneyTab = ({ cand, req }: { cand: ReturnType<typeof useApp>['state']['candidates'][number]; req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => {
  const { state } = useApp()
  return (
    <Card>
      <CardHeader title="Stage journey" subtitle="Every stage this candidate has entered, with the score and decision recorded at each" />
      <div className="card-pad pt-4">
        <ol className="relative space-y-4 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-surface-line">
          {req.workflow.map(stg => {
            const p = cand.stageProgress.find(x => x.stageKey === stg.key)
            const done = p?.status === 'completed'
            const current = cand.currentStageKey === stg.key
            const asm = state.assessments.find(a => a.candidateId === cand.id && a.stageKey === stg.key)
            return (
              <li key={stg.key} className="relative">
                <span className={cx('absolute -left-6 top-1 grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-white',
                  done ? 'bg-rag-good' : current ? 'bg-electric-600' : 'bg-slate-200')}>
                  {done && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />}
                </span>
                <div className={cx('rounded-xl border p-3.5', current ? 'border-electric-200 bg-electric-50/30' : done ? 'border-surface-line' : 'border-dashed border-surface-line opacity-60')}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-ink">{stg.name}</p>
                    <div className="flex items-center gap-1.5">
                      {p?.score != null && (
                        <span className="tnum text-[13px] font-bold" style={{ color: p.score >= 5 ? RAG.good : p.score >= 4 ? seriesAt(0) : RAG.warning }}>
                          {p.score.toFixed(2)}/6
                        </span>
                      )}
                      {current && <Badge tone="blue">Current</Badge>}
                      {p?.decision && <Badge tone={p.decision.startsWith('Good') ? 'green' : p.decision.startsWith('Can') ? 'amber' : 'red'}>{p.decision.split(' - ')[0]}</Badge>}
                    </div>
                  </div>
                  <p className="mt-1 text-2xs leading-snug text-ink-muted">{stg.objective}</p>
                  {p?.enteredAt && (
                    <p className="mt-1.5 text-2xs text-ink-faint tnum">
                      Entered {fmtDate(p.enteredAt)}{p.completedAt && ` · completed ${fmtDate(p.completedAt)} · ${daysBetween(p.enteredAt, p.completedAt)} days in stage`}
                    </p>
                  )}
                  {asm && (
                    <Link to={`/assessments/${asm.id}`} className="mt-2 inline-flex items-center gap-1 text-2xs font-medium text-electric-600 hover:underline">
                      Open {asm.label} <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}

/* ── Decision modals — a reason is always required ─────────────────────── */

const REJECT_REASONS = [
  'Does not meet the must-have technical requirements',
  'Experience level below the band requirement',
  'Compensation expectation outside the approved range',
  'Notice period incompatible with the target close date',
  'Work authorisation cannot be supported for this location',
  'Stronger candidates already at a later stage',
  'Withdrew from the process',
]

const DecisionModal = ({
  kind, onClose, candidateId, candidateName,
}: { kind: null | 'Hold' | 'Reject' | 'Request Info' | 'Assign'; onClose: () => void; candidateId: string; candidateName: string }) => {
  const { dispatch } = useApp()
  const [reason, setReason] = useState(REJECT_REASONS[0])
  const [detail, setDetail] = useState('')
  const [hm, setHm] = useState(HIRING_MANAGERS[0].id)

  if (!kind) return null

  const submit = () => {
    if (kind === 'Assign') dispatch({ type: 'ASSIGN_HM', candidateId, personId: hm })
    else dispatch({
      type: 'SCREEN_DECISION', candidateId,
      decision: kind,
      reason: kind === 'Reject' ? `${reason}${detail ? ` — ${detail}` : ''}` : detail || undefined,
    })
    onClose(); setDetail('')
  }

  const titles = {
    'Hold': 'Put on hold', 'Reject': 'Reject with reason',
    'Request Info': 'Request more information', 'Assign': 'Assign to a hiring manager',
  }

  return (
    <Modal open onClose={onClose} title={titles[kind]} subtitle={`${candidateName} · this action is recorded against your name`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={kind === 'Reject' ? 'danger' : 'primary'} onClick={submit}
            disabled={kind === 'Reject' && !reason}>
            {kind === 'Reject' ? 'Reject candidate' : kind === 'Assign' ? 'Assign' : 'Confirm'}
          </Button>
        </>
      }>
      <div className="space-y-4">
        {kind === 'Reject' && (
          <>
            <div className="rounded-xl border border-rag-critical/25 bg-rag-critical/[0.05] p-3.5">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-critical" />
                <span>
                  A rejection is final for this requisition and is communicated to the candidate. The model never reaches this decision on its own —
                  you are making it, and the audit trail will say so.
                </span>
              </p>
            </div>
            <Field label="Reason" required hint="The reason is stored for reporting and, where policy requires it, shared with the candidate.">
              <Select value={reason} onChange={e => setReason(e.target.value)}>
                {REJECT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </Field>
          </>
        )}

        {kind === 'Assign' && (
          <Field label="Hiring manager" hint="They will get the profile, the AI screening summary and the evidence trail.">
            <Select value={hm} onChange={e => setHm(e.target.value)}>
              {HIRING_MANAGERS.map(p => <option key={p.id} value={p.id}>{p.name} — {p.title}</option>)}
            </Select>
          </Field>
        )}

        <Field label={kind === 'Request Info' ? 'What do you need from the candidate?' : 'Additional context'}
          hint={kind === 'Request Info' ? 'Sent to the candidate portal and by email.' : 'Optional, but future-you will thank present-you.'}>
          <Textarea rows={4} value={detail} onChange={e => setDetail(e.target.value)}
            placeholder={kind === 'Hold' ? 'e.g. Strong profile but we want to see the L2 outcomes on the other two first.' : ''} />
        </Field>
      </div>
    </Modal>
  )
}
