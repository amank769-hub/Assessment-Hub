import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, Building2, CalendarClock, CheckCircle2, ChevronRight,
  Clock, FileText, Globe2, Linkedin, Loader2, Mail, MapPin, Paperclip, Shield,
  Sparkles, Upload, Users, Video,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { countryOf, personById } from '@/data'
import { daysBetween, fmtDate, fmtInTz, fmtRelative, isFuture } from '@/lib/dates'
import {
  AiChip, Avatar, Badge, Button, Card, cx, Field, Input, Modal, Progress,
  Select, Textarea,
} from '@/components/ui'
import { RAG, seriesAt } from '@/theme/tokens'
import { Logo } from '@/components/layout/AppShell'

type Section = 'status' | 'role' | 'messages' | 'documents' | 'apply'

export default function CandidatePortal() {
  const { section } = useParams<{ section?: string }>()
  const { state } = useApp()
  const [tab, setTab] = useState<Section>((section as Section) ?? 'status')
  const isPreview = state.role !== 'candidate'

  const cand = state.candidates.find(c => c.id === state.portalCandidateId)!
  const req = state.requisitions.find(r => r.id === cand.requisitionId)!

  return (
    <div className="min-h-screen bg-surface-page">
      {/* Candidate-facing chrome — deliberately not the recruiter shell. */}
      <header className="sticky top-0 z-30 bg-navy-900">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            {isPreview && <Badge tone="blue" className="hidden sm:inline-flex">Recruiter preview</Badge>}
            <Avatar name={cand.name} tint={cand.tint} size={30} />
          </div>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-1 overflow-x-auto no-scrollbar px-2 pb-1">
          {([
            ['status', 'My application'], ['role', 'The role'],
            ['messages', 'Messages'], ['documents', 'Documents'], ['apply', 'Apply to a role'],
          ] as [Section, string][]).map(([k, label]) => {
            const unread = k === 'messages' ? state.messages.filter(m => !m.read).length : 0
            return (
              <button key={k} onClick={() => setTab(k)}
                className={cx('relative whitespace-nowrap rounded-t-lg px-3 py-2 text-[13px] font-medium transition-colors',
                  tab === k ? 'bg-surface-page text-navy-900' : 'text-white/60 hover:text-white')}>
                {label}
                {unread > 0 && <span className="ml-1.5 rounded-full bg-electric-500 px-1.5 py-0.5 text-[10px] font-bold text-white tnum">{unread}</span>}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-5 pb-16 space-y-4">
        {isPreview && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-electric-200 bg-electric-50/60 p-3">
            <p className="text-[13px] text-ink-soft">
              You are previewing what <span className="font-semibold text-ink">{cand.name}</span> sees. Nothing internal is exposed here — no scores, no notes, no other candidates.
            </p>
            <Link to="/dashboard" className="shrink-0">
              <Button size="xs" variant="secondary"><ArrowLeft className="h-3 w-3" />Back</Button>
            </Link>
          </div>
        )}

        {tab === 'status' && <StatusSection cand={cand} req={req} onOpenRole={() => setTab('role')} />}
        {tab === 'role' && <RoleSection req={req} onApply={() => setTab('apply')} />}
        {tab === 'messages' && <MessagesSection />}
        {tab === 'documents' && <DocumentsSection />}
        {tab === 'apply' && <ApplySection />}
      </main>

      <footer className="border-t border-surface-line bg-white py-6">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-2xs leading-relaxed text-ink-muted">
            Nexora AI processes your application under privacy policy {cand.consent.policyVersion}, retained for {cand.consent.dataRetentionMonths} months.
            You can withdraw consent or request deletion at any time from this portal.
          </p>
        </div>
      </footer>
    </div>
  )
}

/* ── Application status tracker ───────────────────────────────────────── */

const StatusSection = ({
  cand, req, onOpenRole,
}: { cand: ReturnType<typeof useApp>['state']['candidates'][number]; req: ReturnType<typeof useApp>['state']['requisitions'][number]; onOpenRole: () => void }) => {
  const { state, dispatch } = useApp()
  const [reschedule, setReschedule] = useState<string | null>(null)

  const visible = req.workflow.filter(s => s.type !== 'ai_screening')
  const currentIdx = visible.findIndex(s => s.key === cand.currentStageKey)
  const pct = Math.round(((currentIdx + 1) / visible.length) * 100)

  const upcoming = state.interviews
    .filter(i => i.candidateId === cand.id && i.status === 'Scheduled' && isFuture(i.scheduledAt))
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-brand-grad px-5 py-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-electric-300">Your application</p>
          <h1 className="mt-1 text-xl font-bold leading-tight">{req.title}</h1>
          <p className="mt-1 text-[13px] text-white/70">
            {countryOf(req.country).flag} {req.location} · {req.businessUnit}
          </p>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-white/70">
              <span>Applied {fmtDate(cand.appliedAt)}</span>
              <span className="tnum">{pct}% through the process</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-electric-400 transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
          </div>
          <button onClick={onOpenRole} className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-electric-300 hover:text-white transition-colors">
            View the role <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="p-5">
          <p className="label mb-3">Where you are</p>
          <ol className="relative space-y-3 pl-6 before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-surface-line">
            {visible.map((s, i) => {
              const p = cand.stageProgress.find(x => x.stageKey === s.key)
              const done = p?.status === 'completed'
              const current = cand.currentStageKey === s.key
              return (
                <li key={s.key} className="relative">
                  <span className={cx('absolute -left-6 top-0.5 grid h-[18px] w-[18px] place-items-center rounded-full ring-2 ring-white',
                    done ? 'bg-rag-good' : current ? 'bg-electric-600 animate-pulse-ring' : 'bg-slate-200')}>
                    {done && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  <p className={cx('text-[13px] font-semibold', current ? 'text-electric-700' : done ? 'text-ink' : 'text-ink-faint')}>
                    {s.shortName}
                    {current && <span className="ml-2 font-normal text-2xs text-electric-600">You are here</span>}
                  </p>
                  <p className="text-2xs leading-snug text-ink-muted">
                    {done && p?.completedAt ? `Completed ${fmtDate(p.completedAt)}`
                      : current ? s.objective
                        : `${s.durationMins ? `${s.durationMins} minutes · ` : ''}${s.format}`}
                  </p>
                </li>
              )
            })}
          </ol>
        </div>
      </Card>

      {upcoming.map(iv => {
        const stg = req.workflow.find(s => s.key === iv.stageKey)!
        const panel = iv.interviewerIds.map(id => personById(id)!).filter(Boolean)
        const canReschedule = daysBetween(new Date().toISOString(), iv.scheduledAt) >= 1
        return (
          <Card key={iv.id} className="border-electric-200">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <Badge tone="blue" dot>Upcoming interview</Badge>
                  <h2 className="mt-2 text-[17px] font-bold leading-tight text-ink">{stg.name}</h2>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                    <span className="inline-flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />{fmtInTz(iv.scheduledAt, iv.timezone)}</span>
                    <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{iv.durationMins} minutes</span>
                    <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3.5 w-3.5" />{iv.timezone.replace('_', ' ')}</span>
                  </p>
                  <p className="mt-0.5 text-2xs text-electric-700 font-medium">{fmtRelative(iv.scheduledAt)}</p>
                </div>
                <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="shrink-0">
                  <Button variant="primary" size="md"><Video className="h-4 w-4" />Join</Button>
                </a>
              </div>

              <div className="mt-4 border-t border-surface-line pt-4">
                <p className="label mb-2">Who you will meet</p>
                <div className="space-y-2">
                  {panel.map(p => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <Avatar name={p.name} tint={p.tint} size={30} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">{p.name}</p>
                        <p className="text-2xs text-ink-muted">{p.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-electric-100 bg-electric-50/50 p-4">
                <p className="text-[13px] font-semibold text-ink">How to prepare</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{stg.objective}</p>
                <p className="mt-2.5 label">What will be discussed</p>
                <ul className="mt-1.5 space-y-1">
                  {req.competencies.filter(c => stg.competencyIds.includes(c.id)).map(c => (
                    <li key={c.id} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />
                      <span><span className="font-medium">{c.name}</span> — {c.evidenceToLookFor}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-2xs leading-relaxed text-ink-muted">
                  We publish what we assess. There are no trick questions, and you are welcome to bring notes.
                </p>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button variant="secondary" size="sm" disabled={!canReschedule} onClick={() => setReschedule(iv.id)}>
                  <CalendarClock className="h-3.5 w-3.5" />Reschedule
                </Button>
                <span className="text-2xs text-ink-muted">
                  {canReschedule ? 'You can reschedule once, up to 24 hours before the start time.' : 'Rescheduling closes 24 hours before the interview. Contact your recruiter if something urgent comes up.'}
                </span>
              </div>
            </div>
          </Card>
        )
      })}

      <Card className="p-5">
        <p className="label mb-3">Assessments</p>
        {state.assessments.filter(a => a.candidateId === cand.id && a.format === 'Written assessment' && a.status !== 'submitted').length === 0 ? (
          <p className="text-[13px] leading-relaxed text-ink-muted">
            No assessments are waiting on you. If one is assigned, the link appears here and you will get an email.
          </p>
        ) : (
          <div className="space-y-2">
            {state.assessments.filter(a => a.candidateId === cand.id && a.format === 'Written assessment' && a.status !== 'submitted').map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-surface-line p-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-ink">{a.format}</p>
                  <p className="text-2xs text-ink-muted">Due {a.dueAt ? fmtDate(a.dueAt) : 'on request'}</p>
                </div>
                <Button size="sm" variant="primary">Start</Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <RescheduleModal interviewId={reschedule} onClose={() => setReschedule(null)} />
    </div>
  )
}

const RescheduleModal = ({ interviewId, onClose }: { interviewId: string | null; onClose: () => void }) => {
  const { state, dispatch } = useApp()
  const [slot, setSlot] = useState(0)
  if (!interviewId) return null
  const iv = state.interviews.find(i => i.id === interviewId)!

  const slots = [1, 2, 3].flatMap(d => [10, 14].map(h => {
    const dt = new Date(iv.scheduledAt)
    dt.setDate(dt.getDate() + d); dt.setHours(h, 0, 0, 0)
    return dt.toISOString()
  }))

  return (
    <Modal open onClose={onClose} title="Reschedule your interview"
      subtitle="Pick a slot that works. Everyone on the panel is available at all of these."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Keep the original time</Button>
          <Button variant="primary" onClick={() => { dispatch({ type: 'RESCHEDULE', interviewId, iso: slots[slot] }); onClose() }}>
            Confirm new time
          </Button>
        </>
      }>
      <div className="space-y-2">
        {slots.map((s, i) => (
          <button key={s} onClick={() => setSlot(i)}
            className={cx('flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors',
              slot === i ? 'border-electric-500 bg-electric-50' : 'border-surface-line hover:border-slate-300')}>
            <span className="text-[13px] font-medium text-ink">{fmtInTz(s, iv.timezone)}</span>
            <span className="text-2xs text-ink-muted">{iv.timezone.replace('_', ' ')}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-2xs leading-relaxed text-ink-muted">
        Rescheduling is allowed once per interview. Your recruiter is notified automatically and a new invite is sent to everyone.
      </p>
    </Modal>
  )
}

/* ── The role ─────────────────────────────────────────────────────────── */

const RoleSection = ({ req, onApply }: { req: ReturnType<typeof useApp>['state']['requisitions'][number]; onApply: () => void }) => {
  const hm = personById(req.hiringManagerId)!
  const panel = req.panelIds.map(id => personById(id)!).filter(Boolean)
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="bg-brand-grad px-5 py-6 text-white">
          <Badge tone="blue">{req.businessUnit}</Badge>
          <h1 className="mt-2.5 text-[22px] font-bold leading-tight">{req.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-white/75">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{req.location}</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />Band {req.band}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{req.openings} opening{req.openings === 1 ? '' : 's'}</span>
          </p>
        </div>
        <div className="p-5">
          <p className="text-[15px] leading-relaxed text-ink-soft">{req.roleOverview}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {req.highlights.map(h => (
              <div key={h} className="flex gap-2.5 rounded-xl border border-surface-line p-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-electric-600" strokeWidth={2.4} />
                <span className="text-[13px] leading-snug text-ink-soft">{h}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <p className="label mb-2">What we will assess</p>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          We publish our competency framework because guessing what an interviewer wants is not a useful test of anything.
        </p>
        <div className="mt-3 space-y-2">
          {req.competencies.filter(c => c.mustHave).map(c => (
            <div key={c.id} className="rounded-xl border border-surface-line p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink">{c.name}</p>
                <Badge tone="neutral">{c.category}</Badge>
              </div>
              <p className="mt-1 text-2xs leading-relaxed text-ink-muted">{c.evidenceToLookFor}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="label mb-3">The team you would join</p>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar name={hm.name} tint={hm.tint} size={40} />
            <div>
              <p className="text-[13px] font-semibold text-ink">{hm.name}</p>
              <p className="text-2xs text-ink-muted">{hm.title} · you would report here</p>
            </div>
          </div>
          {panel.slice(0, 3).map(p => (
            <div key={p.id} className="flex items-center gap-3">
              <Avatar name={p.name} tint={p.tint} size={32} />
              <div>
                <p className="text-[13px] text-ink">{p.name}</p>
                <p className="text-2xs text-ink-muted">{p.title}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <p className="label mb-2">Full job description</p>
        <div className="space-y-3">
          {req.jobDescription.split('\n\n').map((p, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-ink-soft">{p}</p>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 border-t border-surface-line pt-4">
          <div>
            <p className="label mb-2">What you would own</p>
            <ul className="space-y-1.5">
              {req.responsibilities.map(r => (
                <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-electric-500" />{r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label mb-2">What we need</p>
            <ul className="space-y-1.5">
              {req.minimumQualifications.map(r => (
                <li key={r} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-400" />{r}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface-page p-4">
          <p className="label">Compensation</p>
          <p className="mt-0.5 text-[15px] font-semibold text-ink">{req.salaryRange}</p>
          <p className="mt-1 text-2xs text-ink-muted">Published upfront. We do not ask for your current salary before making an offer.</p>
        </div>
        <Button variant="primary" size="md" className="mt-4 w-full" onClick={onApply}>
          Apply for this role <ArrowRight className="h-4 w-4" />
        </Button>
      </Card>
    </div>
  )
}

/* ── Messages & documents ─────────────────────────────────────────────── */

const MessagesSection = () => {
  const { state, dispatch } = useApp()
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="space-y-3">
      {state.messages.map(m => {
        const expanded = open === m.id
        return (
          <Card key={m.id} className={cx('p-4 transition-colors cursor-pointer', !m.read && 'border-electric-200 bg-electric-50/30')}
            onClick={() => { setOpen(expanded ? null : m.id); if (!m.read) dispatch({ type: 'READ_MESSAGE', id: m.id }) }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                  {!m.read && <span className="h-2 w-2 shrink-0 rounded-full bg-electric-500" />}
                  {m.subject}
                </p>
                <p className="mt-0.5 text-2xs text-ink-muted">{m.from} · {fmtRelative(m.at)}</p>
              </div>
              <Mail className="h-4 w-4 shrink-0 text-ink-faint" />
            </div>
            {expanded && (
              <div className="mt-3 space-y-2.5 border-t border-surface-line pt-3 animate-fade-up">
                {m.body.split('\n\n').map((p, i) => (
                  <p key={i} className="text-[13px] leading-relaxed text-ink-soft">{p}</p>
                ))}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

const DocumentsSection = () => {
  const { state, dispatch } = useApp()
  return (
    <div className="space-y-3">
      <Card className="p-5">
        <p className="label mb-1">Documents we have asked for</p>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Nothing here is required before an interview. We only ask for documents when a process is progressing.
        </p>
      </Card>
      {state.documents.map(d => (
        <Card key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl',
              d.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : d.status === 'uploaded' ? 'bg-electric-50 text-electric-600' : 'bg-surface-sunken text-ink-muted')}>
              {d.status === 'verified' ? <CheckCircle2 className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">{d.name}</p>
              <p className="text-2xs text-ink-muted">
                {d.status === 'verified' ? 'Verified' : d.status === 'uploaded' ? 'Uploaded, awaiting verification' : `Requested · due ${fmtDate(d.dueAt)}`}
              </p>
            </div>
          </div>
          {d.status === 'requested' && (
            <Button size="sm" variant="secondary" onClick={() => dispatch({ type: 'UPLOAD_DOC', id: d.id })}>
              <Upload className="h-3.5 w-3.5" />Upload
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}

/* ── Apply flow ───────────────────────────────────────────────────────── */

const PARSE_STEPS = ['Reading the document', 'Extracting roles and dates', 'Extracting education', 'Mapping skills to the role', 'Preparing your form']

const ApplySection = () => {
  const { state, dispatch } = useApp()
  const nav = useNavigate()
  const [reqId, setReqId] = useState(state.requisitions[0].id)
  const [step, setStep] = useState<'choose' | 'method' | 'parsing' | 'review' | 'consent' | 'done'>('choose')
  const [parseStep, setParseStep] = useState(0)
  const [method, setMethod] = useState<'cv' | 'linkedin' | 'manual'>('cv')
  const [consent, setConsent] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', phone: '', location: '', currentTitle: '', currentOrganization: '',
    experience: '', education: '', expectedSalary: '', noticePeriod: '30',
    workAuth: 'Citizen — no sponsorship required', reason: '',
  })

  const req = state.requisitions.find(r => r.id === reqId)!

  const runParse = (m: 'cv' | 'linkedin' | 'manual') => {
    setMethod(m)
    if (m === 'manual') { setStep('review'); return }
    setStep('parsing'); setParseStep(0)
    const tick = (i: number) => {
      if (i >= PARSE_STEPS.length) {
        // Pre-fills from a parsed document, shown back for correction before anything is accepted.
        setForm({
          name: 'Devika Menon', email: 'devika.menon@mailbox.com', phone: '+91 98800 34412',
          location: 'Bangalore, India', currentTitle: 'Senior Escalation Manager',
          currentOrganization: 'Cisco Systems', experience: '10',
          education: 'B.Tech, Computer Science — RV College of Engineering, 2015',
          expectedSalary: '₹55,00,000', noticePeriod: '60',
          workAuth: 'Indian citizen — no sponsorship required',
          reason: 'Looking for a role with direct customer ownership rather than internal escalation only.',
        })
        setStep('review'); return
      }
      setParseStep(i); setTimeout(() => tick(i + 1), 500)
    }
    tick(0)
  }

  const submit = () => {
    const id = `CAN-${Math.floor(4200 + Math.random() * 90)}`
    dispatch({
      type: 'SUBMIT_APPLICATION',
      candidate: {
        id, requisitionId: req.id, name: form.name || 'New Applicant',
        initials: (form.name || 'NA').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
        tint: seriesAt(3), email: form.email, phone: form.phone,
        currentTitle: form.currentTitle, currentOrganization: form.currentOrganization,
        isExEmployee: false, location: form.location, country: req.country,
        totalExperienceYears: Number(form.experience) || 0,
        experiencePostQualification: Number(form.experience) || 0,
        education: [{ institute: form.education.split('—')[1]?.trim() ?? form.education, qualification: form.education.split('—')[0]?.trim() ?? form.education, year: '2015' }],
        workHistory: [{ company: form.currentOrganization, title: form.currentTitle, from: '2021', to: 'Present', location: form.location, highlights: [] }],
        skills: [], source: 'Careers Site', appliedAt: new Date().toISOString(),
        noticePeriodDays: Number(form.noticePeriod) || 30, currentSalary: '—',
        expectedSalary: form.expectedSalary, workAuthorisation: form.workAuth,
        reasonForChange: form.reason, status: 'Applied',
        currentStageKey: req.workflow[1].key,
        stageProgress: [{ stageKey: req.workflow[0].key, status: 'completed', enteredAt: new Date().toISOString(), completedAt: new Date().toISOString() }],
        consent: { given: true, at: new Date().toISOString(), policyVersion: 'v3.1', dataRetentionMonths: 24 },
        cvFileName: method === 'cv' ? 'uploaded_cv.pdf' : method === 'linkedin' ? 'linkedin_profile.json' : 'manual_entry',
        cvSummary: `${form.experience} years, currently ${form.currentTitle} at ${form.currentOrganization}.`,
        recruiterNotes: [],
      },
    })
    setStep('done')
  }

  if (step === 'done') {
    return (
      <Card className="p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" strokeWidth={2.2} />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">Application submitted</h2>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-muted">
          Thanks. Your application for <span className="font-semibold text-ink">{req.title}</span> is in.
          A recruiter reviews every application personally — our AI scores and summarises, but it never rejects anyone.
          You will hear from us within three working days either way.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={() => nav('/portal')}>Track your application</Button>
          <Button variant="secondary" onClick={() => { setStep('choose'); setConsent(false) }}>Apply to another role</Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center gap-2">
          {(['choose', 'method', 'review', 'consent'] as const).map((s, i) => {
            const order = ['choose', 'method', 'parsing', 'review', 'consent']
            const active = order.indexOf(step) >= order.indexOf(s)
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-2xs font-bold',
                  active ? 'bg-electric-600 text-white' : 'bg-surface-sunken text-ink-faint')}>{i + 1}</span>
                {i < 3 && <span className={cx('h-px flex-1', active ? 'bg-electric-400' : 'bg-surface-line')} />}
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[13px] font-semibold text-ink">
          {step === 'choose' ? 'Choose a role' : step === 'method' ? 'How would you like to apply?'
            : step === 'parsing' ? 'Reading your document' : step === 'review' ? 'Check what we read' : 'Consent and privacy'}
        </p>
      </Card>

      {step === 'choose' && (
        <div className="space-y-3">
          {state.requisitions.map(r => (
            <Card key={r.id} className={cx('p-4 cursor-pointer transition-all', reqId === r.id && 'border-electric-300 ring-1 ring-electric-200')}
              onClick={() => setReqId(r.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold leading-snug text-ink">{r.title}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">
                    {countryOf(r.country).flag} {r.location} · {r.businessUnit} · Band {r.band}
                  </p>
                  <p className="mt-1.5 text-2xs text-ink-muted line-clamp-2">{r.roleOverview}</p>
                </div>
                <span className={cx('mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2',
                  reqId === r.id ? 'border-electric-600 bg-electric-600' : 'border-slate-300')}>
                  {reqId === r.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
              </div>
            </Card>
          ))}
          <Button variant="primary" size="md" className="w-full" onClick={() => setStep('method')}>
            Continue <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {step === 'method' && (
        <div className="space-y-3">
          {([
            { k: 'cv', icon: <Upload className="h-5 w-5" />, title: 'Upload your CV', detail: 'We read it and fill the form in for you. You check it before anything is submitted.' },
            { k: 'linkedin', icon: <Linkedin className="h-5 w-5" />, title: 'Import from LinkedIn', detail: 'Pulls your public profile. Same review step before submission.' },
            { k: 'manual', icon: <FileText className="h-5 w-5" />, title: 'Fill it in myself', detail: 'Takes about four minutes. No document needed.' },
          ] as const).map(o => (
            <Card key={o.k} className="p-4 cursor-pointer hover:border-electric-300 hover:shadow-card transition-all" onClick={() => runParse(o.k)}>
              <div className="flex items-center gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-electric-50 text-electric-600">{o.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-ink">{o.title}</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-ink-muted">{o.detail}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" />
              </div>
            </Card>
          ))}
          <Button variant="ghost" onClick={() => setStep('choose')}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
        </div>
      )}

      {step === 'parsing' && (
        <Card className="p-6">
          <div className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
            <Loader2 className="h-5 w-5 animate-spin text-electric-600" />{PARSE_STEPS[parseStep]}
          </div>
          <Progress className="mt-4" value={((parseStep + 1) / PARSE_STEPS.length) * 100} tone={seriesAt(0)} />
          <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
            Whatever we extract, you get to correct before it is submitted. Nothing is treated as fact until you confirm it.
          </p>
        </Card>
      )}

      {step === 'review' && (
        <div className="space-y-4">
          {method !== 'manual' && (
            <div className="flex items-start gap-2.5 rounded-xl border border-violet-200 bg-violet-50/60 p-3.5">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
              <p className="text-[13px] leading-relaxed text-ink-soft">
                We filled this in from your {method === 'cv' ? 'CV' : 'LinkedIn profile'}. <span className="font-semibold text-ink">Please check every field</span> — parsing gets things wrong, and a mistake here follows you through the whole process.
              </p>
            </div>
          )}
          <Card className="p-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></Field>
              <Field label="Email" required><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></Field>
              <Field label="Phone"><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></Field>
              <Field label="Current location"><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} /></Field>
              <Field label="Current title"><Input value={form.currentTitle} onChange={e => setForm(f => ({ ...f, currentTitle: e.target.value }))} /></Field>
              <Field label="Current organisation"><Input value={form.currentOrganization} onChange={e => setForm(f => ({ ...f, currentOrganization: e.target.value }))} /></Field>
              <Field label="Total experience (years)"><Input type="number" value={form.experience} onChange={e => setForm(f => ({ ...f, experience: e.target.value }))} /></Field>
              <Field label="Notice period (days)"><Input type="number" value={form.noticePeriod} onChange={e => setForm(f => ({ ...f, noticePeriod: e.target.value }))} /></Field>
              <Field label="Highest qualification" className="sm:col-span-2"><Input value={form.education} onChange={e => setForm(f => ({ ...f, education: e.target.value }))} /></Field>
              <Field label="Salary expectation" hint="We publish our range. Tell us yours and we will be straight with you about fit.">
                <Input value={form.expectedSalary} onChange={e => setForm(f => ({ ...f, expectedSalary: e.target.value }))} />
              </Field>
              <Field label="Work authorisation">
                <Select value={form.workAuth} onChange={e => setForm(f => ({ ...f, workAuth: e.target.value }))}>
                  <option>Citizen — no sponsorship required</option>
                  <option>Permanent resident — no sponsorship required</option>
                  <option>Valid work visa — transfer required</option>
                  <option>Sponsorship required</option>
                </Select>
              </Field>
              <Field label="Why are you looking to move?" className="sm:col-span-2">
                <Textarea rows={3} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </Field>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep('method')}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
            <Button variant="primary" size="md" className="flex-1" onClick={() => setStep('consent')}>Continue <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {step === 'consent' && (
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-electric-50 text-electric-600"><Shield className="h-4 w-4" /></span>
              <div>
                <p className="text-[15px] font-semibold text-ink">How we will use your data</p>
                <p className="text-2xs text-ink-muted">Privacy policy v3.1</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {[
                'Your CV and application are used to assess you against this role\'s published competency framework, and nothing else.',
                'AI produces a match score and a summary. It never progresses, rejects or hires — a person makes every decision.',
                'Your data is retained for 24 months, after which it is deleted automatically.',
                'You can withdraw consent, request a copy or request deletion at any time from this portal.',
                'We do not sell, share or use your data to train models outside this hiring process.',
              ].map(t => (
                <li key={t} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-electric-600" strokeWidth={2.4} />{t}
                </li>
              ))}
            </ul>
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-surface-line p-3.5">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-electric-600" />
              <span className="text-[13px] leading-relaxed text-ink-soft">
                I have read and accept the privacy policy, and I consent to Nexora AI processing my application on this basis.
              </span>
            </label>
          </Card>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setStep('review')}><ArrowLeft className="h-3.5 w-3.5" />Back</Button>
            <Button variant="primary" size="md" className="flex-1" disabled={!consent} onClick={submit}>Submit application</Button>
          </div>
        </div>
      )}
    </div>
  )
}
