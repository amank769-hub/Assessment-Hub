import { Fragment, useMemo, useRef, useState } from 'react'
import {
  BadgeCheck, Check, ChevronDown, ChevronRight, FileText, Layers, Loader2,
  Plus, Save, Scale, Sparkles, Trash2, Upload, Wand2, X,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import {
  ASSESSMENT_METHODS, BANDS, COMPETENCY_CATEGORIES, COUNTRIES, JOB_FAMILIES,
  BU_COMPETENCY_MAP, RATING_LEGEND,
} from '@/data'
import type {
  AssessmentMethod, Competency, CompetencyCategory, Requisition,
} from '@/data/types'
import {
  AiChip, Badge, Button, Card, CardHeader, cx, Field, HumanChip, Input,
  Modal, Progress, Select, Table, Td, Textarea, Th,
} from '@/components/ui'
import { seriesAt } from '@/theme/tokens'

const CATEGORY_TONE: Record<CompetencyCategory, string> = {
  'Technical': seriesAt(0), 'Functional': seriesAt(1), 'Behavioural': seriesAt(2),
  'Leadership': seriesAt(3), 'Domain': seriesAt(4), 'Culture & Values': seriesAt(5),
}

const EXTRACTION_STEPS = [
  'Parsing job description structure',
  'Extracting technical and functional skills',
  'Identifying leadership competencies',
  'Matching against the competency repository',
  'Classifying critical versus trainable',
  'Recommending weightings and interview stages',
]

export const CompetencyMapping = ({ req }: { req: Requisition }) => {
  const { state, dispatch } = useApp()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [step, setStep] = useState(0)
  const [showInputs, setShowInputs] = useState(false)
  const [jdText, setJdText] = useState(req.jobDescription)
  const [addOpen, setAddOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [meta, setMeta] = useState({
    country: req.country as string, jobFamily: req.jobFamily as string,
    band: req.band as string, businessUnit: req.businessUnit as string,
  })

  const totalWeight = useMemo(() => req.competencies.reduce((a, c) => a + c.weight, 0), [req.competencies])
  const weightOk = Math.abs(totalWeight - 1) < 0.005
  const aiCount = req.competencies.filter(c => c.source === 'ai').length
  const humanCount = req.competencies.filter(c => c.source === 'human').length
  const mustHaves = req.competencies.filter(c => c.mustHave).length
  const interviewLevels = req.workflow.filter(s => s.type === 'interview')

  const runExtraction = () => {
    setRunning(true); setStep(0)
    const tick = (i: number) => {
      if (i >= EXTRACTION_STEPS.length) {
        setRunning(false); setShowInputs(false)
        dispatch({ type: 'TOAST', toast: { kind: 'success', title: 'Competency framework extracted', detail: `${req.competencies.length} competencies mapped from the JD. Review, edit, then approve.` } })
        return
      }
      setStep(i)
      setTimeout(() => tick(i + 1), 420)
    }
    tick(0)
  }

  const patch = (id: string, p: Partial<Competency>) =>
    dispatch({ type: 'UPDATE_COMPETENCY', reqId: req.id, competencyId: id, patch: p })

  const byCategory = useMemo(() => {
    const groups = new Map<CompetencyCategory, Competency[]>()
    for (const c of req.competencies) {
      if (!groups.has(c.category)) groups.set(c.category, [])
      groups.get(c.category)!.push(c)
    }
    return groups
  }, [req.competencies])

  return (
    <div className="space-y-5">
      {/* ── Extraction inputs ────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <div className="bg-brand-grad px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-white">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
                <Wand2 className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-[15px] font-semibold leading-tight">AI Skills &amp; Competency Mapping</h3>
                <p className="text-[11px] text-white/60">Extracts the framework from the JD, then hands it to a human to edit and approve</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowInputs(v => !v)}>
              {showInputs ? <X className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {showInputs ? 'Close' : 'Re-run extraction'}
            </Button>
          </div>
        </div>

        {showInputs && (
          <div className="border-b border-surface-line bg-surface-page/50 px-5 py-5 animate-fade-up">
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <Field label="Job description" hint="Paste the JD, upload a file, or start from a repository role."
                  action={
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => fileRef.current?.click()}
                        className="inline-flex items-center gap-1 text-2xs font-semibold text-electric-600 hover:text-electric-700">
                        <Upload className="h-3 w-3" />Upload JD
                      </button>
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) dispatch({ type: 'TOAST', toast: { kind: 'info', title: `${f.name} parsed`, detail: 'Text extracted and loaded into the editor.' } })
                        }} />
                    </div>
                  }>
                  <Textarea rows={9} value={jdText} onChange={e => setJdText(e.target.value)} className="text-[13px] leading-relaxed font-mono" />
                </Field>

                <Field label="Or start from the competency repository" hint={`${state.requisitions.length + 26} approved role templates available.`}>
                  <Select defaultValue="">
                    <option value="">Select a role template…</option>
                    <option value="tpl_rel_b8">REL/DCG · Senior Manager · Band 8 (India)</option>
                    <option value="tpl_eng_b7">Engineering · Staff Engineer · Band 7 (Global)</option>
                    <option value="tpl_fin_b9">Finance · Regional Controller · Band 9 (APAC)</option>
                    <option value="tpl_smb_b7">SMB · Channel Sales Manager · Band 7 (India)</option>
                  </Select>
                </Field>
              </div>

              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Country">
                    <Select value={meta.country} onChange={e => setMeta(m => ({ ...m, country: e.target.value }))}>
                      {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                    </Select>
                  </Field>
                  <Field label="Function / job family">
                    <Select value={meta.jobFamily} onChange={e => setMeta(m => ({ ...m, jobFamily: e.target.value }))}>
                      {JOB_FAMILIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </Select>
                  </Field>
                  <Field label="Level / band">
                    <Select value={meta.band} onChange={e => setMeta(m => ({ ...m, band: e.target.value }))}>
                      {BANDS.map(b => <option key={b} value={b}>{b}</option>)}
                    </Select>
                  </Field>
                  <Field label="Business unit">
                    <Select value={meta.businessUnit} onChange={e => setMeta(m => ({ ...m, businessUnit: e.target.value }))}>
                      {Object.keys(BU_COMPETENCY_MAP).concat(['HR', 'Technology']).map(b => <option key={b} value={b}>{b}</option>)}
                    </Select>
                  </Field>
                </div>

                <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-violet-700">What the model will produce</p>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {['Technical skills', 'Functional skills', 'Leadership competencies', 'Domain experience',
                      'Minimum qualifications', 'Preferred qualifications', 'Critical vs trainable', 'Recommended weightings',
                      'Interview questions per competency', 'Suggested stages and formats'].map(t => (
                        <li key={t} className="flex items-center gap-1.5 text-2xs text-ink-soft">
                          <Check className="h-3 w-3 shrink-0 text-violet-600" strokeWidth={3} />{t}
                        </li>
                      ))}
                  </ul>
                </div>

                {running ? (
                  <div className="rounded-xl border border-electric-200 bg-electric-50/60 p-4">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-electric-800">
                      <Loader2 className="h-4 w-4 animate-spin" />{EXTRACTION_STEPS[step]}
                    </div>
                    <Progress className="mt-3" value={((step + 1) / EXTRACTION_STEPS.length) * 100} tone="#2a78d6" />
                    <p className="mt-2 text-2xs text-electric-700">Step {step + 1} of {EXTRACTION_STEPS.length}</p>
                  </div>
                ) : (
                  <Button variant="primary" size="md" className="w-full" onClick={runExtraction}>
                    <Sparkles className="h-4 w-4" />Extract competency framework
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Framework summary strip ─────────────────────────────────── */}
        <div className="grid gap-px bg-surface-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Competencies mapped', value: req.competencies.length, note: `${mustHaves} must-have · ${req.competencies.length - mustHaves} good-to-have` },
            { label: 'Total weighting', value: `${(totalWeight * 100).toFixed(0)}%`, note: weightOk ? 'Balanced — ready to approve' : 'Must total 100% before approval', bad: !weightOk },
            { label: 'AI vs human authored', value: `${aiCount} / ${humanCount}`, note: humanCount ? `${humanCount} row${humanCount === 1 ? '' : 's'} edited by a person` : 'No human edits yet' },
            { label: 'Interview levels', value: interviewLevels.length, note: interviewLevels.map(l => l.shortName).join(' → ') },
          ].map(s => (
            <div key={s.label} className="bg-white px-5 py-4">
              <p className="label">{s.label}</p>
              <p className={cx('mt-1 tnum text-xl font-bold', s.bad ? 'text-rag-serious' : 'text-ink')}>{s.value}</p>
              <p className="mt-0.5 text-2xs leading-snug text-ink-muted line-clamp-2">{s.note}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Qualifications extracted from the JD ─────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Minimum qualifications" subtitle="Extracted from the JD — hard filters at screening" icon={<BadgeCheck className="h-4 w-4" />}
            action={<AiChip confidence={0.94} />} />
          <ul className="card-pad pt-3 space-y-2">
            {req.minimumQualifications.map(qq => (
              <li key={qq} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />{qq}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Preferred qualifications" subtitle="Differentiators — never used to exclude" icon={<Layers className="h-4 w-4" />}
            action={<AiChip confidence={0.88} />} />
          <ul className="card-pad pt-3 space-y-2">
            {req.preferredQualifications.map(qq => (
              <li key={qq} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />{qq}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ── The editable competency matrix ───────────────────────────── */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Competency matrix"
          subtitle="Every row is editable. AI-extracted rows are labelled until a person edits them, then they become human-authored."
          icon={<Scale className="h-4 w-4" />}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button size="xs" variant="ghost" onClick={() => setAddOpen(true)}><Plus className="h-3 w-3" />Add</Button>
              {!weightOk && (
                <Button size="xs" variant="subtle" onClick={() => dispatch({ type: 'NORMALISE_WEIGHTS', reqId: req.id })}>
                  <Scale className="h-3 w-3" />Normalise to 100%
                </Button>
              )}
              <Button size="xs" variant="primary" onClick={() => dispatch({ type: 'APPROVE_FRAMEWORK', reqId: req.id })}>
                <Save className="h-3 w-3" />Approve &amp; save to repository
              </Button>
            </div>
          } />

        <div className="mt-4 border-t border-surface-line">
          <Table>
            <thead>
              <tr>
                <Th className="w-8" />
                <Th>Competency / skill</Th>
                <Th>Category</Th>
                <Th align="center">Required proficiency</Th>
                <Th align="center">Weightage</Th>
                <Th align="center">Priority</Th>
                <Th align="center">Criticality</Th>
                <Th>Assessment method</Th>
                <Th>Assessed at</Th>
                <Th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {req.competencies.map(c => {
                const open = expanded === c.id
                const stage = req.workflow.find(s => s.key === c.assessAtStage)
                return (
                  <Fragment key={c.id}>
                    <tr className={cx('transition-colors', open ? 'bg-electric-50/40' : 'hover:bg-surface-page/60')}>
                      <Td>
                        <button onClick={() => setExpanded(open ? null : c.id)} className="text-ink-faint hover:text-ink" aria-label="Toggle detail">
                          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </Td>
                      <Td className="max-w-[16rem]">
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: CATEGORY_TONE[c.category] }} />
                          <div className="min-w-0">
                            <p className="font-medium text-ink leading-snug">{c.name}</p>
                            <div className="mt-1">{c.source === 'human' ? <HumanChip label="Edited by a person" /> : c.source === 'repository' ? <Badge tone="neutral">From repository</Badge> : <AiChip confidence={c.aiConfidence} />}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        <Select value={c.category} onChange={e => patch(c.id, { category: e.target.value as CompetencyCategory })}
                          className="!py-1 !text-xs !rounded-lg min-w-[8.5rem]">
                          {COMPETENCY_CATEGORIES.map(x => <option key={x} value={x}>{x}</option>)}
                        </Select>
                      </Td>
                      <Td align="center">
                        <Select value={c.requiredProficiency} onChange={e => patch(c.id, { requiredProficiency: Number(e.target.value) })}
                          className="!py-1 !text-xs !rounded-lg !w-16 mx-auto">
                          {RATING_LEGEND.map(r => <option key={r.value} value={r.value}>{r.value}</option>)}
                        </Select>
                      </Td>
                      <Td align="center">
                        <div className="inline-flex items-center gap-1">
                          <Input type="number" min={0} max={100} step={1} value={Math.round(c.weight * 100)}
                            onChange={e => patch(c.id, { weight: Math.max(0, Math.min(100, Number(e.target.value))) / 100 })}
                            className="!w-16 !py-1 !text-xs !rounded-lg text-center tnum" />
                          <span className="text-2xs text-ink-faint">%</span>
                        </div>
                      </Td>
                      <Td align="center">
                        <button onClick={() => patch(c.id, { mustHave: !c.mustHave })}
                          className={cx('rounded-full border px-2 py-0.5 text-2xs font-semibold transition-colors whitespace-nowrap',
                            c.mustHave ? 'border-electric-200 bg-electric-50 text-electric-700' : 'border-surface-line bg-white text-ink-muted hover:border-slate-300')}>
                          {c.mustHave ? 'Must-have' : 'Good-to-have'}
                        </button>
                      </Td>
                      <Td align="center">
                        <button onClick={() => patch(c.id, { criticality: c.criticality === 'Critical' ? 'Trainable' : 'Critical' })}
                          className={cx('rounded-full border px-2 py-0.5 text-2xs font-semibold transition-colors whitespace-nowrap',
                            c.criticality === 'Critical' ? 'border-rag-critical/30 bg-rag-critical/[0.07] text-rag-critical' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
                          {c.criticality}
                        </button>
                      </Td>
                      <Td>
                        <Select value={c.assessmentMethod} onChange={e => patch(c.id, { assessmentMethod: e.target.value as AssessmentMethod })}
                          className="!py-1 !text-xs !rounded-lg min-w-[13rem]">
                          {ASSESSMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </Select>
                      </Td>
                      <Td>
                        <Select value={c.assessAtStage} onChange={e => patch(c.id, { assessAtStage: e.target.value })}
                          className="!py-1 !text-xs !rounded-lg min-w-[9.5rem]">
                          {req.workflow.filter(s => s.type === 'interview' || s.type === 'recruiter_screen')
                            .map(s => <option key={s.key} value={s.key}>{s.shortName}</option>)}
                        </Select>
                      </Td>
                      <Td>
                        <button onClick={() => dispatch({ type: 'REMOVE_COMPETENCY', reqId: req.id, competencyId: c.id })}
                          className="text-ink-faint hover:text-rag-critical transition-colors" aria-label="Remove competency">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </Td>
                    </tr>

                    {open && (
                      <tr>
                        <td colSpan={10} className="border-b border-surface-line bg-electric-50/25 px-5 py-5">
                          <div className="grid gap-5 lg:grid-cols-2 animate-fade-up">
                            <div className="space-y-4">
                              <Field label="Evidence to look for" hint="What a strong answer actually contains. This text appears on the interviewer's scorecard.">
                                <Textarea rows={4} value={c.evidenceToLookFor}
                                  onChange={e => patch(c.id, { evidenceToLookFor: e.target.value })} className="text-[13px]" />
                              </Field>
                              {c.aiRationale && (
                                <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                                  <p className="flex items-center gap-1.5 text-2xs font-semibold uppercase tracking-wider text-violet-700">
                                    <Sparkles className="h-3 w-3" />Why the model extracted this
                                  </p>
                                  <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{c.aiRationale}</p>
                                  {c.aiConfidence != null && (
                                    <div className="mt-2.5 flex items-center gap-2">
                                      <Progress value={c.aiConfidence * 100} tone={seriesAt(1)} className="flex-1" />
                                      <span className="tnum text-2xs font-semibold text-violet-700">{Math.round(c.aiConfidence * 100)}% confidence</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {c.editedBy && (
                                <p className="text-2xs text-ink-muted">
                                  Last edited by a person on {new Date(c.editedAt ?? '').toLocaleString('en-GB')}. Audit entry recorded.
                                </p>
                              )}
                            </div>

                            <div>
                              <div className="mb-2 flex items-center justify-between">
                                <span className="label">Suggested interview questions</span>
                                <span className="text-2xs text-ink-faint">Assessed at {stage?.name ?? '—'}</span>
                              </div>
                              <div className="space-y-2">
                                {c.suggestedQuestions.map((qq, i) => (
                                  <div key={i} className="flex gap-2.5 rounded-xl border border-surface-line bg-white p-3">
                                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-electric-50 text-2xs font-bold text-electric-700">{i + 1}</span>
                                    <Textarea rows={2} value={qq}
                                      onChange={e => patch(c.id, { suggestedQuestions: c.suggestedQuestions.map((x, j) => j === i ? e.target.value : x) })}
                                      className="!border-0 !p-0 !text-[13px] !ring-0 focus:!ring-0 leading-relaxed" />
                                    <button onClick={() => patch(c.id, { suggestedQuestions: c.suggestedQuestions.filter((_, j) => j !== i) })}
                                      className="shrink-0 text-ink-faint hover:text-rag-critical" aria-label="Remove question">
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ))}
                                <Button size="xs" variant="ghost"
                                  onClick={() => patch(c.id, { suggestedQuestions: [...c.suggestedQuestions, 'New question — describe what you want the candidate to demonstrate.'] })}>
                                  <Plus className="h-3 w-3" />Add question
                                </Button>
                              </div>
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
                <Td colSpan={4} className="font-semibold text-ink">Total weighting</Td>
                <Td align="center">
                  <span className={cx('tnum font-bold', weightOk ? 'text-rag-good' : 'text-rag-serious')}>
                    {(totalWeight * 100).toFixed(0)}%
                  </span>
                </Td>
                <Td colSpan={5} className="text-2xs text-ink-muted">
                  {weightOk ? 'Weights total 100% — the framework can be approved and reused.' : 'The IAS requires weights to total 100% before a scorecard can be generated.'}
                </Td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </Card>

      {/* ── Recommended stages by category ───────────────────────────── */}
      <Card>
        <CardHeader title="Recommended interview stages and formats"
          subtitle="Derived from the mapped competencies. Editing the workflow re-generates the matching assessment levels."
          icon={<Layers className="h-4 w-4" />} action={<AiChip confidence={0.86} label="AI recommended" />} />
        <div className="card-pad pt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {interviewLevels.map((s, i) => {
            const comps = req.competencies.filter(c => s.competencyIds.includes(c.id))
            const weight = comps.reduce((a, c) => a + c.weight, 0)
            return (
              <div key={s.key} className="rounded-xl border border-surface-line p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="blue">Level {i + 1}</Badge>
                  <span className="text-2xs text-ink-muted">{s.durationMins} min</span>
                </div>
                <p className="mt-2 text-[13px] font-semibold leading-snug text-ink">{s.shortName}</p>
                <p className="mt-1 text-2xs leading-snug text-ink-muted line-clamp-3">{s.objective}</p>
                <p className="mt-2.5 text-2xs font-medium text-violet-700">{s.format}</p>
                <div className="mt-3 space-y-1">
                  {comps.map(c => (
                    <div key={c.id} className="flex items-center gap-1.5 text-2xs text-ink-soft">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: CATEGORY_TONE[c.category] }} />
                      <span className="truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-surface-line pt-2.5">
                  <div className="flex items-center justify-between text-2xs">
                    <span className="text-ink-muted">Framework covered</span>
                    <span className="tnum font-semibold text-ink">{Math.round(weight * 100)}%</span>
                  </div>
                  <Progress className="mt-1" value={weight * 100} tone={seriesAt(i % 4)} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* ── Category coverage ────────────────────────────────────────── */}
      <Card>
        <CardHeader title="Coverage by competency category" subtitle="Weight distribution across the framework" icon={<FileText className="h-4 w-4" />} />
        <div className="card-pad pt-4 space-y-2.5">
          {[...byCategory.entries()].map(([cat, comps]) => {
            const w = comps.reduce((a, c) => a + c.weight, 0)
            return (
              <div key={cat} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-[13px] font-medium text-ink-soft">{cat}</span>
                <div className="relative h-6 flex-1 min-w-0 rounded-md bg-surface-sunken/70">
                  <div className="h-full rounded-md transition-all duration-700" style={{ width: `${w * 100}%`, background: CATEGORY_TONE[cat] }} />
                </div>
                <span className="w-10 shrink-0 text-right tnum text-[13px] font-semibold text-ink">{Math.round(w * 100)}%</span>
                <span className="w-24 shrink-0 text-right text-2xs text-ink-muted">{comps.length} competenc{comps.length === 1 ? 'y' : 'ies'}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <AddCompetencyModal open={addOpen} onClose={() => setAddOpen(false)} req={req} />
    </div>
  )
}

/* ── Add a competency by hand ─────────────────────────────────────────── */

const AddCompetencyModal = ({ open, onClose, req }: { open: boolean; onClose: () => void; req: Requisition }) => {
  const { dispatch } = useApp()
  const [form, setForm] = useState({
    name: '', category: 'Behavioural' as CompetencyCategory, requiredProficiency: 4,
    weight: 10, mustHave: true, criticality: 'Critical' as 'Critical' | 'Trainable',
    evidence: '', question: '', method: 'Structured competency interview' as AssessmentMethod,
    stage: req.workflow.find(s => s.type === 'interview')?.key ?? '',
  })

  const submit = () => {
    if (!form.name.trim()) return
    dispatch({
      type: 'ADD_COMPETENCY', reqId: req.id,
      competency: {
        id: `c_${Date.now().toString(36)}`, name: form.name.trim(), category: form.category,
        requiredProficiency: form.requiredProficiency, weight: form.weight / 100,
        mustHave: form.mustHave, criticality: form.criticality,
        evidenceToLookFor: form.evidence || 'Describe what strong evidence looks like for this competency.',
        suggestedQuestions: form.question ? [form.question] : ['Add an interview question for this competency.'],
        assessmentMethod: form.method, assessAtStage: form.stage, source: 'human',
        editedBy: 'u_priya', editedAt: new Date().toISOString(),
      },
    })
    setForm(f => ({ ...f, name: '', evidence: '', question: '' }))
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add a competency"
      subtitle="Anything you add here is marked as human-authored and carries no AI confidence score."
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant="primary" onClick={submit}>Add competency</Button></>}>
      <div className="space-y-4">
        <Field label="Competency or skill" required>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Commercial negotiation" autoFocus />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as CompetencyCategory }))}>
              {COMPETENCY_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Required proficiency" hint="On the IAS six-point scale.">
            <Select value={form.requiredProficiency} onChange={e => setForm(f => ({ ...f, requiredProficiency: Number(e.target.value) }))}>
              {RATING_LEGEND.map(r => <option key={r.value} value={r.value}>{r.value} — {r.label}</option>)}
            </Select>
          </Field>
          <Field label="Weightage (%)">
            <Input type="number" min={1} max={100} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} />
          </Field>
          <Field label="Assessed at">
            <Select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
              {req.workflow.filter(s => s.type === 'interview' || s.type === 'recruiter_screen').map(s => <option key={s.key} value={s.key}>{s.name}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Assessment method">
          <Select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value as AssessmentMethod }))}>
            {ASSESSMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Evidence to look for">
          <Textarea rows={3} value={form.evidence} onChange={e => setForm(f => ({ ...f, evidence: e.target.value }))}
            placeholder="What does a strong answer actually contain?" />
        </Field>
        <Field label="First interview question">
          <Textarea rows={2} value={form.question} onChange={e => setForm(f => ({ ...f, question: e.target.value }))} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setForm(f => ({ ...f, mustHave: !f.mustHave }))}
            className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              form.mustHave ? 'border-electric-200 bg-electric-50 text-electric-700' : 'border-surface-line text-ink-muted')}>
            {form.mustHave ? 'Must-have' : 'Good-to-have'}
          </button>
          <button onClick={() => setForm(f => ({ ...f, criticality: f.criticality === 'Critical' ? 'Trainable' : 'Critical' }))}
            className={cx('rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
              form.criticality === 'Critical' ? 'border-rag-critical/30 bg-rag-critical/[0.07] text-rag-critical' : 'border-emerald-200 bg-emerald-50 text-emerald-700')}>
            {form.criticality}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default CompetencyMapping
