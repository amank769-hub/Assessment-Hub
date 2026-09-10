import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle, ArrowRight, CheckCircle2, ChevronRight, Circle, ClipboardCheck,
  FileText, MessageSquare, Mic, MicOff, MonitorUp, PhoneOff, Play, Radio, Send,
  Sparkles, Square, Users, Video as VideoIcon, VideoOff,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { RATING_LEGEND, countryOf, personById } from '@/data'
import { fmtDate, fmtDuration, fmtInTz } from '@/lib/dates'
import { TalkRatioBar } from '@/components/charts'
import {
  AiChip, Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, IconButton,
  Progress, RatingScale, Tabs, Textarea,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

type Panel = 'scorecard' | 'cv' | 'questions' | 'chat' | 'participants'

export default function InterviewRoom() {
  const { interviewId } = useParams<{ interviewId: string }>()
  const { state, dispatch } = useApp()
  const nav = useNavigate()

  const iv = state.interviews.find(i => i.id === interviewId)
  if (!iv) return <Page><Card><EmptyState title="Interview not found" action={<Button onClick={() => nav('/interviews')}>Back to interviews</Button>} /></Card></Page>

  const cand = state.candidates.find(c => c.id === iv.candidateId)!
  const req = state.requisitions.find(r => r.id === iv.requisitionId)!
  const stg = req.workflow.find(s => s.key === iv.stageKey)!
  const asm = state.assessments.find(a => a.interviewId === iv.id)
  const comps = req.competencies.filter(c => stg.competencyIds.includes(c.id))

  const isCompleted = iv.status === 'Completed'
  const [live, setLive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [cursor, setCursor] = useState(0)
  const [panel, setPanel] = useState<Panel>('scorecard')
  const [mic, setMic] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [recording, setRecording] = useState(false)
  const [chatDraft, setChatDraft] = useState('')
  const [chat, setChat] = useState<{ id: string; who: string; text: string; at: string }[]>([])
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const transcriptRef = useRef<HTMLDivElement>(null)

  // The transcript streams in against the interview clock, which is what makes
  // coverage, talk ratio and follow-up suggestions move in real time.
  useEffect(() => {
    if (!live) return
    const t = setInterval(() => setElapsed(e => e + 2), 1000)
    return () => clearInterval(t)
  }, [live])

  useEffect(() => {
    if (!live || !iv.transcript.length) return
    const next = iv.transcript.findIndex(l => l.at > elapsed)
    setCursor(next === -1 ? iv.transcript.length : next)
  }, [elapsed, live, iv.transcript])

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' })
  }, [cursor])

  const shown = isCompleted ? iv.transcript : iv.transcript.slice(0, cursor)

  const coverage = useMemo(() => {
    const seen = new Set(shown.filter(l => l.competencyId).map(l => l.competencyId!))
    return comps.map(c => ({ comp: c, covered: seen.has(c.id), lines: shown.filter(l => l.competencyId === c.id).length }))
  }, [shown, comps])

  const coveredPct = comps.length ? Math.round((coverage.filter(c => c.covered).length / comps.length) * 100) : 0

  const talk = useMemo(() => {
    if (isCompleted && iv.aiSummary) return iv.aiSummary.talkRatio
    const words = shown.reduce((a, l) => {
      const n = l.text.split(/\s+/).length
      return l.speaker === 'interviewer' ? { ...a, i: a.i + n } : { ...a, c: a.c + n }
    }, { i: 0, c: 0 })
    const total = words.i + words.c || 1
    return { interviewer: Math.round((words.i / total) * 100), candidate: Math.round((words.c / total) * 100) }
  }, [shown, isCompleted, iv.aiSummary])

  // Follow-ups are generated from what has actually been said, not from a fixed list.
  const followUps = useMemo(() => {
    const last = shown.filter(l => l.speaker === 'candidate').slice(-2)
    if (!last.length) return []
    const uncovered = coverage.filter(c => !c.covered)
    const out: { text: string; why: string; competencyId?: string }[] = []
    const lastComp = last[last.length - 1].competencyId
    if (lastComp) {
      const c = comps.find(x => x.id === lastComp)
      if (c) out.push({
        text: `They described the outcome. Ask what they would do differently, and what it cost them.`,
        why: `The last answer covered ${c.name} but stayed on the successful path. The framework asks for reflection, not just result.`,
        competencyId: c.id,
      })
    }
    for (const u of uncovered.slice(0, 2)) {
      out.push({
        text: u.comp.suggestedQuestions[0],
        why: `${u.comp.name} carries ${Math.round(u.comp.weight * 100)}% of the framework and has not come up yet. ${Math.max(0, stg.durationMins - Math.floor(elapsed / 60))} minutes left.`,
        competencyId: u.comp.id,
      })
    }
    return out.slice(0, 3)
  }, [shown, coverage, comps, elapsed, stg.durationMins])

  const end = () => {
    setLive(false); setRecording(false)
    dispatch({ type: 'COMPLETE_INTERVIEW', interviewId: iv.id })
    if (asm) setTimeout(() => nav(`/assessments/${asm.id}`), 900)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Interviews', to: '/interviews' }, { label: `${cand.name} · ${stg.shortName}` }]}
        eyebrow={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={isCompleted ? 'green' : live ? 'red' : 'blue'} dot>{isCompleted ? 'Completed' : live ? 'Live' : 'Scheduled'}</Badge>
            <Badge tone="neutral">{stg.name}</Badge>
            <Badge tone="violet">{stg.format}</Badge>
            <span className="text-2xs text-ink-muted">
              {countryOf(req.country).flag} {fmtInTz(iv.scheduledAt, iv.timezone)} {iv.timezone.split('/')[1].replace('_', ' ')} · {iv.durationMins} min · {iv.mode}
            </span>
          </div>
        }
        title={`${cand.name} — ${stg.shortName}`}
        subtitle={stg.objective}
        actions={
          isCompleted ? (
            asm && <Link to={`/assessments/${asm.id}`}><Button variant="primary" size="md"><ClipboardCheck className="h-4 w-4" />Open scorecard</Button></Link>
          ) : (
            <>
              {!live && <Button variant="primary" size="md" onClick={() => { setLive(true); setRecording(true) }}><Play className="h-4 w-4" />Start interview</Button>}
              {live && <Button variant="danger" size="md" onClick={end}><PhoneOff className="h-4 w-4" />End &amp; generate scorecard</Button>}
            </>
          )
        }
      />

      <Page>
        <div className="grid gap-5 xl:grid-cols-12">
          {/* ── Meeting stage ─────────────────────────────────────────── */}
          <div className="xl:col-span-8 space-y-5 min-w-0">
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-navy-950">
                {/* Candidate tile */}
                <div className="absolute inset-0 grid place-items-center">
                  {camOn ? (
                    <div className="text-center">
                      <Avatar name={cand.name} tint={cand.tint} size={96} />
                      <p className="mt-3 text-[15px] font-semibold text-white">{cand.name}</p>
                      <p className="text-xs text-white/50">{cand.currentTitle}</p>
                      {live && (
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-2xs font-medium text-white/80">
                          <span className="h-1.5 w-1.5 rounded-full bg-rag-good animate-pulse" />Speaking
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-white/40">
                      <VideoOff className="mx-auto h-10 w-10" />
                      <p className="mt-2 text-[13px]">Camera off</p>
                    </div>
                  )}
                </div>

                {sharing && (
                  <div className="absolute inset-4 rounded-xl border-2 border-electric-400 bg-navy-900/90 grid place-items-center">
                    <div className="text-center text-white/70">
                      <MonitorUp className="mx-auto h-8 w-8 text-electric-400" />
                      <p className="mt-2 text-[13px] font-medium">You are sharing your screen</p>
                      <p className="text-2xs text-white/40">System design canvas</p>
                    </div>
                  </div>
                )}

                {/* Interviewer thumbnails */}
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  {iv.interviewerIds.map(id => {
                    const p = personById(id)!
                    return (
                      <div key={id} className="w-28 rounded-lg glass-dark p-2 text-center">
                        <Avatar name={p.name} tint={p.tint} size={30} />
                        <p className="mt-1 truncate text-2xs font-medium text-white">{p.name.split(' ')[0]}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Live badges */}
                <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
                  {recording && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rag-critical px-2.5 py-1 text-2xs font-bold text-white">
                      <Circle className="h-2 w-2 fill-current" />REC
                    </span>
                  )}
                  {live && (
                    <span className="inline-flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 text-2xs font-semibold text-white">
                      <Radio className="h-3 w-3 text-electric-400" />Transcribing
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full glass-dark px-2.5 py-1 tnum text-2xs font-semibold text-white">
                    {fmtDuration(isCompleted ? iv.durationMins * 60 : elapsed)} / {iv.durationMins}:00
                  </span>
                </div>

                {live && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                    <div className="h-full bg-electric-400 transition-all duration-1000"
                      style={{ width: `${Math.min(100, (elapsed / (iv.durationMins * 60)) * 100)}%` }} />
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-surface-line px-4 py-3">
                <ControlBtn active={mic} onClick={() => setMic(v => !v)} on={<Mic className="h-4 w-4" />} off={<MicOff className="h-4 w-4" />} label={mic ? 'Mute' : 'Unmute'} />
                <ControlBtn active={camOn} onClick={() => setCamOn(v => !v)} on={<VideoIcon className="h-4 w-4" />} off={<VideoOff className="h-4 w-4" />} label={camOn ? 'Stop video' : 'Start video'} />
                <ControlBtn active={!sharing} onClick={() => setSharing(v => !v)} on={<MonitorUp className="h-4 w-4" />} off={<MonitorUp className="h-4 w-4" />} label={sharing ? 'Stop sharing' : 'Share screen'} />
                <ControlBtn active={!recording} onClick={() => setRecording(v => !v)} on={<Circle className="h-4 w-4" />} off={<Square className="h-4 w-4" />} label={recording ? 'Stop recording' : 'Record'} />
                <div className="mx-1 h-6 w-px bg-surface-line" />
                <Button variant="ghost" size="sm" onClick={() => setPanel('participants')}>
                  <Users className="h-3.5 w-3.5" />{iv.interviewerIds.length + 1}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setPanel('chat')}>
                  <MessageSquare className="h-3.5 w-3.5" />Chat{chat.length > 0 && <span className="tnum">{chat.length}</span>}
                </Button>
                {live && <Button variant="danger" size="sm" onClick={end}><PhoneOff className="h-3.5 w-3.5" />Leave</Button>}
              </div>
            </Card>

            {/* Transcript */}
            <Card>
              <CardHeader title="Live transcript" icon={<Radio className="h-4 w-4" />}
                subtitle={isCompleted ? 'Full transcript, retained with the recording' : live ? 'Transcribing as the conversation happens — statements are tagged to competencies automatically' : 'Starts when the interview does'}
                action={live ? <Badge tone="red" dot>Live</Badge> : isCompleted && iv.recordingAvailable ? <Button size="xs" variant="secondary"><Play className="h-3 w-3" />Recording</Button> : undefined} />
              <div ref={transcriptRef} className="card-pad pt-4 max-h-[26rem] overflow-y-auto scroll-thin space-y-3">
                {shown.length === 0 ? (
                  <EmptyState icon={<Radio className="h-5 w-5" />} title={live ? 'Listening…' : 'Transcript will appear here'}
                    detail={live ? 'The first lines land within a few seconds.' : 'Start the interview to begin live transcription and competency tagging.'} />
                ) : shown.map(l => {
                  const comp = l.competencyId ? req.competencies.find(c => c.id === l.competencyId) : null
                  const isCand = l.speaker === 'candidate'
                  return (
                    <div key={l.id} className={cx('rounded-xl p-3 animate-fade-up',
                      isCand ? 'bg-electric-50/50 border border-electric-100' : 'bg-surface-page border border-surface-line')}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cx('text-2xs font-bold', isCand ? 'text-electric-700' : 'text-ink-soft')}>{l.speakerName}</span>
                        <span className="tnum text-2xs text-ink-faint">{fmtDuration(l.at)}</span>
                        {comp && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-1.5 py-0.5 text-2xs font-semibold text-violet-700">
                            <Sparkles className="h-2.5 w-2.5" />{comp.name}
                          </span>
                        )}
                        {l.isEvidence && isCand && <Badge tone="green">Evidence captured</Badge>}
                      </div>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{l.text}</p>
                    </div>
                  )
                })}
              </div>
            </Card>

            {isCompleted && iv.aiSummary && <PostInterview iv={iv} req={req} />}
          </div>

          {/* ── Side panel ────────────────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-5 min-w-0">
            <Card>
              <CardHeader title="Competency coverage" icon={<CheckCircle2 className="h-4 w-4" />}
                subtitle={`${coverage.filter(c => c.covered).length} of ${comps.length} covered so far`} />
              <div className="card-pad pt-4">
                <div className="flex items-center gap-3">
                  <Progress value={coveredPct} tone={coveredPct >= 80 ? RAG.good : coveredPct >= 50 ? RAG.warning : RAG.critical} className="flex-1" height={8} />
                  <span className="tnum text-[15px] font-bold text-ink">{coveredPct}%</span>
                </div>
                <div className="mt-3 space-y-2">
                  {coverage.map(({ comp, covered, lines }) => (
                    <div key={comp.id} className={cx('flex items-start gap-2.5 rounded-lg border p-2.5',
                      covered ? 'border-emerald-200 bg-emerald-50/40' : 'border-dashed border-surface-line')}>
                      <span className={cx('mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full',
                        covered ? 'bg-rag-good text-white' : 'bg-slate-200')}>
                        {covered && <CheckCircle2 className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs font-semibold leading-snug text-ink">{comp.name}</p>
                        <p className="text-2xs text-ink-muted">
                          {covered ? `${lines} statement${lines === 1 ? '' : 's'} captured` : `Not covered · ${Math.round(comp.weight * 100)}% of framework`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Talk time" icon={<Radio className="h-4 w-4" />}
                subtitle="Target is roughly 70% candidate — the interviewer is there to open doors, not walk through them" />
              <div className="card-pad pt-4"><TalkRatioBar interviewer={talk.interviewer} candidate={talk.candidate} /></div>
            </Card>

            {!isCompleted && followUps.length > 0 && (
              <Card className="border-violet-200">
                <CardHeader title="Suggested follow-ups" icon={<Sparkles className="h-4 w-4" />}
                  subtitle="Based on what has actually been said, not a fixed list" action={<AiChip />} />
                <div className="card-pad pt-3 space-y-2.5">
                  {followUps.map((f, i) => (
                    <div key={i} className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                      <p className="text-[13px] leading-relaxed text-ink">{f.text}</p>
                      <p className="mt-1.5 text-2xs leading-relaxed text-violet-700">{f.why}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            <Card>
              <Tabs value={panel} onChange={setPanel} className="px-3 pt-2" size="sm" tabs={[
                { value: 'scorecard', label: 'Scorecard' },
                { value: 'cv', label: 'CV & JD' },
                { value: 'questions', label: 'Questions' },
                { value: 'chat', label: 'Chat' },
                { value: 'participants', label: 'People' },
              ]} />

              <div className="card-pad pt-4">
                {panel === 'scorecard' && (
                  <div className="space-y-3">
                    <p className="text-2xs leading-relaxed text-ink-muted">
                      Rate as you go if you like. Anything you enter here carries into the scorecard as interviewer-confirmed, ahead of the AI draft.
                    </p>
                    {comps.map(c => (
                      <div key={c.id} className="rounded-xl border border-surface-line p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-2xs font-semibold text-ink">{c.name}</p>
                          <span className="text-2xs text-ink-faint">needs {c.requiredProficiency}/6</span>
                        </div>
                        <div className="mt-2">
                          <RatingScale size="sm" value={ratings[c.id] ?? null} onChange={v => setRatings(r => ({ ...r, [c.id]: v }))} />
                        </div>
                        {ratings[c.id] != null && (
                          <p className="mt-1.5 text-2xs text-ink-muted">{RATING_LEGEND[ratings[c.id] - 1].label}</p>
                        )}
                      </div>
                    ))}
                    {asm && (
                      <Link to={`/assessments/${asm.id}`}>
                        <Button variant="secondary" size="sm" className="w-full"><ClipboardCheck className="h-3.5 w-3.5" />Open full scorecard</Button>
                      </Link>
                    )}
                  </div>
                )}

                {panel === 'cv' && (
                  <div className="space-y-4">
                    <div>
                      <p className="label mb-1.5">Candidate summary</p>
                      <p className="text-[13px] leading-relaxed text-ink-soft">{cand.cvSummary}</p>
                    </div>
                    <div>
                      <p className="label mb-1.5">Experience</p>
                      <div className="space-y-2.5">
                        {cand.workHistory.map((w, i) => (
                          <div key={i} className="rounded-lg border border-surface-line p-2.5">
                            <p className="text-2xs font-semibold text-ink">{w.title}</p>
                            <p className="text-2xs text-ink-muted">{w.company} · {w.from}–{w.to}</p>
                            {w.highlights.slice(0, 2).map(h => (
                              <p key={h} className="mt-1 text-2xs leading-snug text-ink-soft">· {h}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="label mb-1.5">Role at a glance</p>
                      <p className="text-[13px] leading-relaxed text-ink-soft">{req.roleOverview}</p>
                    </div>
                    <Link to={`/candidates/${cand.id}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-electric-600 hover:underline">
                      Full profile <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                )}

                {panel === 'questions' && (
                  <div className="space-y-3">
                    {comps.map(c => {
                      const covered = coverage.find(x => x.comp.id === c.id)?.covered
                      return (
                        <div key={c.id}>
                          <p className="flex items-center gap-1.5 label mb-1.5">
                            {c.name}
                            {covered
                              ? <Badge tone="green">Covered</Badge>
                              : <Badge tone="amber">Not yet</Badge>}
                          </p>
                          <div className="space-y-1.5">
                            {c.suggestedQuestions.map((q, i) => (
                              <p key={i} className="rounded-lg border border-surface-line p-2.5 text-2xs leading-relaxed text-ink-soft">{q}</p>
                            ))}
                          </div>
                          <p className="mt-1.5 text-2xs leading-snug text-ink-muted"><span className="font-semibold">Look for: </span>{c.evidenceToLookFor}</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {panel === 'chat' && (
                  <div className="space-y-3">
                    <div className="max-h-64 space-y-2 overflow-y-auto scroll-thin">
                      {chat.length === 0
                        ? <p className="text-2xs text-ink-muted">In-meeting chat. Useful for links and the odd note to a co-interviewer.</p>
                        : chat.map(m => (
                          <div key={m.id} className="rounded-lg bg-surface-page p-2.5">
                            <p className="text-2xs font-semibold text-ink">{m.who} <span className="font-normal text-ink-faint">{m.at}</span></p>
                            <p className="mt-0.5 text-2xs text-ink-soft">{m.text}</p>
                          </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                      <Textarea rows={2} value={chatDraft} onChange={e => setChatDraft(e.target.value)} placeholder="Message the room…" className="!text-[13px]" />
                      <Button variant="primary" size="sm" disabled={!chatDraft.trim()}
                        onClick={() => {
                          setChat(c => [...c, { id: String(Date.now()), who: personById(state.currentUserId)?.name ?? 'You', text: chatDraft.trim(), at: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }])
                          setChatDraft('')
                        }}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {panel === 'participants' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2.5 rounded-lg border border-electric-200 bg-electric-50/40 p-2.5">
                      <Avatar name={cand.name} tint={cand.tint} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xs font-semibold text-ink">{cand.name}</p>
                        <p className="text-2xs text-ink-muted">Candidate · {countryOf(cand.country).flag} {cand.location}</p>
                      </div>
                      <Mic className="h-3.5 w-3.5 text-rag-good" />
                    </div>
                    {iv.interviewerIds.map(id => {
                      const p = personById(id)!
                      return (
                        <div key={id} className="flex items-center gap-2.5 rounded-lg border border-surface-line p-2.5">
                          <Avatar name={p.name} tint={p.tint} size={30} />
                          <div className="min-w-0 flex-1">
                            <p className="text-2xs font-semibold text-ink">{p.name}</p>
                            <p className="text-2xs text-ink-muted">{p.title}</p>
                          </div>
                          <Mic className="h-3.5 w-3.5 text-ink-faint" />
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Page>
    </>
  )
}

const ControlBtn = ({ active, onClick, on, off, label }: { active: boolean; onClick: () => void; on: React.ReactNode; off: React.ReactNode; label: string }) => (
  <button onClick={onClick} title={label} aria-label={label}
    className={cx('grid h-9 w-9 place-items-center rounded-xl border transition-colors',
      active ? 'border-surface-line bg-white text-ink-soft hover:bg-surface-sunken' : 'border-rag-critical/30 bg-rag-critical/10 text-rag-critical')}>
    {active ? on : off}
  </button>
)

/* ── Post-interview summary ───────────────────────────────────────────── */

const PostInterview = ({
  iv, req,
}: { iv: NonNullable<ReturnType<typeof useApp>['state']['interviews'][number]>; req: ReturnType<typeof useApp>['state']['requisitions'][number] }) => {
  const s = iv.aiSummary!
  const { state } = useApp()
  const asm = state.assessments.find(a => a.interviewId === iv.id)

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="bg-brand-grad px-5 py-4">
          <div className="flex items-center gap-3 text-white">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15">
              <Sparkles className="h-[18px] w-[18px] text-electric-300" strokeWidth={2.2} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold leading-tight">Interview summary</h3>
              <p className="text-[11px] text-white/60">Generated from the transcript · reviewed and signed by a person before it counts</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[15px] font-semibold leading-snug text-ink">{s.headline}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{s.summary}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              { l: 'Competency coverage', v: `${s.coveragePct}%`, tone: s.coveragePct >= 90 ? RAG.good : RAG.warning },
              { l: 'Candidate talk share', v: `${s.talkRatio.candidate}%`, tone: s.talkRatio.candidate >= 60 && s.talkRatio.candidate <= 80 ? RAG.good : RAG.serious },
              { l: 'Evidence statements', v: String(iv.transcript.filter(l => l.isEvidence).length || s.evidenceByCompetency.reduce((a, e) => a + e.evidence.length, 0)), tone: seriesAt(0) },
            ].map(x => (
              <div key={x.l} className="rounded-xl bg-surface-page p-3">
                <p className="tnum text-xl font-bold" style={{ color: x.tone }}>{x.v}</p>
                <p className="text-2xs text-ink-muted">{x.l}</p>
              </div>
            ))}
          </div>
          {s.uncoveredCompetencyIds.length > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rag-warning/30 bg-rag-warning/[0.06] p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-warning" />
              <p className="text-[13px] leading-relaxed text-ink-soft">
                <span className="font-semibold text-ink">Not covered in this session: </span>
                {s.uncoveredCompetencyIds.map(id => req.competencies.find(c => c.id === id)?.name).filter(Boolean).join(', ')}.
                Carried forward to the next level rather than guessed at here.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Evidence by competency" subtitle="Suggested ratings with the statements they came from — an interviewer can accept, change or reject each one"
          icon={<FileText className="h-4 w-4" />} action={<AiChip />} />
        <div className="card-pad pt-4 space-y-3">
          {s.evidenceByCompetency.map(e => (
            <div key={e.competencyId} className="rounded-xl border border-surface-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-ink">{e.name}</p>
                <div className="flex items-center gap-2">
                  <AiChip label="Suggested" confidence={e.confidence} />
                  <span className="tnum text-[15px] font-bold" style={{ color: e.suggestedRating >= 5 ? RAG.good : e.suggestedRating >= 4 ? seriesAt(0) : RAG.warning }}>
                    {e.suggestedRating}/6
                  </span>
                </div>
              </div>
              <p className="mt-1 text-2xs text-ink-muted">{RATING_LEGEND[e.suggestedRating - 1].label}</p>
              <ul className="mt-2.5 space-y-1.5">
                {e.evidence.map((x, i) => (
                  <li key={i} className="flex gap-2 text-2xs leading-relaxed text-ink-soft">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-electric-400" />{x}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader title="Strengths" icon={<CheckCircle2 className="h-4 w-4" />} />
          <ul className="card-pad pt-3 space-y-2">
            {s.strengths.map(x => (
              <li key={x} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-good" strokeWidth={2.5} />{x}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Concerns" icon={<AlertTriangle className="h-4 w-4" />} />
          <ul className="card-pad pt-3 space-y-2">
            {s.concerns.map(x => (
              <li key={x} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-serious" strokeWidth={2.5} />{x}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Recommended for the next round" subtitle="What this session could not answer, handed to whoever runs the next level"
          icon={<ArrowRight className="h-4 w-4" />} action={<AiChip />} />
        <div className="card-pad pt-3 space-y-2">
          {s.followUpForNextRound.map((f, i) => (
            <div key={i} className="flex gap-2.5 rounded-xl border border-surface-line p-3">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-violet-50 text-2xs font-bold text-violet-700">{i + 1}</span>
              <p className="text-[13px] leading-relaxed text-ink-soft">{f}</p>
            </div>
          ))}
        </div>
        {asm && (
          <div className="card-pad pt-0">
            <div className="rounded-xl border border-electric-200 bg-electric-50/40 p-4">
              <p className="text-[13px] font-semibold text-ink">The final recommendation is the interviewer's</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
                Everything above is a draft. The scorecard is where a person confirms or overrides it, and nothing counts until it is signed.
              </p>
              <Link to={`/assessments/${asm.id}`}>
                <Button variant="primary" size="md" className="mt-3">
                  <ClipboardCheck className="h-4 w-4" />
                  {asm.status === 'submitted' ? 'View signed scorecard' : 'Review and sign the scorecard'}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
