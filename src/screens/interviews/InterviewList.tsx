import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clock, Globe2, Mail, Play,
  Radio, Users, Video,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import { countryOf, interviewQuality, personById } from '@/data'
import { fmtDate, fmtInTz, fmtRelative, isSameDay, isFuture, daysBetween } from '@/lib/dates'
import { TalkRatioBar } from '@/components/charts'
import {
  Avatar, AvatarStack, Badge, Button, Card, CardHeader, cx, EmptyState,
  Progress, Segmented, Table, Tabs, Td, Th,
} from '@/components/ui'
import { Page, PageHeader, StatTile } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

type Tab = 'upcoming' | 'today' | 'completed' | 'quality'

export default function InterviewList() {
  const { state, dispatch } = useApp()
  const reqs = useFilteredReqs()
  const reqIds = reqs.map(r => r.id)
  const [tab, setTab] = useState<Tab>('today')

  const all = useMemo(() => state.interviews.filter(i => reqIds.includes(i.requisitionId)), [state.interviews, reqIds])
  const today = all.filter(i => i.status === 'Scheduled' && isSameDay(i.scheduledAt))
  const upcoming = all.filter(i => i.status === 'Scheduled' && isFuture(i.scheduledAt))
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
  const completed = all.filter(i => i.status === 'Completed')
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt))
  const noShows = all.filter(i => i.status === 'No Show')
  const quality = useMemo(() => interviewQuality(reqIds), [reqIds])

  const overdueFeedback = state.assessments.filter(a => reqIds.includes(a.requisitionId) && a.status === 'overdue')

  return (
    <>
      <PageHeader
        title="Interviews"
        subtitle="Every conversation across every level, in its own timezone. Join from here — the room carries the CV, the JD, the scorecard and live coverage."
        tabs={
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'today', label: 'Today', count: today.length },
            { value: 'upcoming', label: 'Upcoming', count: upcoming.length },
            { value: 'completed', label: 'Completed', count: completed.length },
            { value: 'quality', label: 'Interview quality' },
          ]} />
        }
      />

      <Page>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatTile label="Scheduled today" value={today.length} icon={<Video className="h-3.5 w-3.5" />} accent={seriesAt(0)}
            hint={today.length ? `Next ${fmtRelative(today.sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))[0].scheduledAt)}` : 'Nothing booked'} />
          <StatTile label="Completed" value={completed.length} icon={<CheckCircle2 className="h-3.5 w-3.5" />} accent={RAG.good}
            hint={`${completed.filter(i => i.recordingAvailable).length} with a recording and transcript`} />
          <StatTile label="No-shows" value={noShows.length} icon={<AlertTriangle className="h-3.5 w-3.5" />} accent={RAG.serious}
            hint={all.length ? `${((noShows.length / all.length) * 100).toFixed(1)}% of all interviews` : '—'} />
          <StatTile label="Feedback overdue" value={overdueFeedback.length} icon={<Clock className="h-3.5 w-3.5" />} accent={RAG.critical}
            hint={overdueFeedback.length ? 'Scorecards are drafted — they need review and a signature' : 'All feedback in on time'} />
        </div>

        {overdueFeedback.length > 0 && tab !== 'quality' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rag-critical/25 bg-rag-critical/[0.04] p-4">
            <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rag-critical" />
              <span>
                <span className="font-semibold text-ink">
                  {Array.from(new Set(overdueFeedback.flatMap(a => a.interviewerIds))).map(id => personById(id)?.name).join(' and ')}
                </span>{' '}
                {overdueFeedback.length === 1 ? 'has' : 'have'} {overdueFeedback.length} scorecard{overdueFeedback.length === 1 ? '' : 's'} past SLA.
                The AI draft is already sitting at 80% coverage — it needs review and a signature, not authoring.
              </span>
            </p>
            <div className="flex gap-2 shrink-0">
              <Button variant="secondary" size="sm"
                onClick={() => dispatch({ type: 'TOAST', toast: { kind: 'success', title: 'Reminder sent', detail: 'Email and calendar nudge issued to each panel member.' } })}>
                <Mail className="h-3.5 w-3.5" />Send reminder
              </Button>
              <Link to="/assessments?filter=overdue"><Button variant="primary" size="sm">Open scorecards</Button></Link>
            </div>
          </div>
        )}

        {(tab === 'today' || tab === 'upcoming') && (
          (tab === 'today' ? today : upcoming).length === 0
            ? <Card><EmptyState icon={<CalendarClock className="h-5 w-5" />} title="Nothing scheduled"
              detail={tab === 'today' ? 'No interviews are booked for today under the current filters.' : 'No upcoming interviews match the current filters.'} /></Card>
            : <div className="space-y-3">
              {(tab === 'today' ? today : upcoming).map(iv => <InterviewCard key={iv.id} interviewId={iv.id} />)}
            </div>
        )}

        {tab === 'completed' && (
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Candidate</Th><Th>Level</Th><Th>Date</Th><Th>Mode</Th><Th>Panel</Th>
                  <Th align="center">Coverage</Th><Th align="center">Score</Th><Th>Feedback</Th><Th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {completed.map(iv => {
                  const cand = state.candidates.find(c => c.id === iv.candidateId)!
                  const req = state.requisitions.find(r => r.id === iv.requisitionId)!
                  const stg = req.workflow.find(s => s.key === iv.stageKey)!
                  const asm = state.assessments.find(a => a.interviewId === iv.id)
                  return (
                    <tr key={iv.id} className="group hover:bg-electric-50/25 transition-colors">
                      <Td>
                        <Link to={`/candidates/${cand.id}`} className="flex items-center gap-2.5">
                          <Avatar name={cand.name} tint={cand.tint} size={28} />
                          <span className="font-medium text-ink whitespace-nowrap group-hover:text-electric-700 transition-colors">{cand.name}</span>
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft">{stg.shortName}</Td>
                      <Td className="whitespace-nowrap text-ink-soft tnum">{fmtDate(iv.scheduledAt)}</Td>
                      <Td className="whitespace-nowrap text-ink-muted text-2xs">{iv.mode}</Td>
                      <Td>
                        <AvatarStack people={iv.interviewerIds.map(id => personById(id)!).filter(Boolean).map(p => ({ name: p.name, tint: p.tint }))} size={22} max={3} />
                      </Td>
                      <Td align="center" className="min-w-[6rem]">
                        {iv.aiSummary ? (
                          <>
                            <span className="tnum text-2xs font-semibold text-ink-soft">{iv.aiSummary.coveragePct}%</span>
                            <Progress className="mt-1" value={iv.aiSummary.coveragePct} height={4}
                              tone={iv.aiSummary.coveragePct >= 90 ? RAG.good : iv.aiSummary.coveragePct >= 70 ? RAG.warning : RAG.critical} />
                          </>
                        ) : '—'}
                      </Td>
                      <Td align="center">
                        {asm?.status === 'submitted'
                          ? <span className="tnum font-bold" style={{ color: asm.weightedAverage >= 5 ? RAG.good : seriesAt(0) }}>{asm.weightedAverage.toFixed(2)}</span>
                          : <span className="text-2xs text-ink-faint">—</span>}
                      </Td>
                      <Td>
                        <Badge tone={asm?.status === 'submitted' ? 'green' : asm?.status === 'overdue' ? 'red' : 'amber'}>
                          {asm?.status === 'submitted' ? 'Submitted' : asm?.status === 'overdue' ? 'Overdue' : 'In review'}
                        </Badge>
                      </Td>
                      <Td>
                        <Link to={`/interviews/${iv.id}`} className="text-[13px] font-medium text-electric-600 hover:underline whitespace-nowrap">
                          Open summary
                        </Link>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        )}

        {tab === 'quality' && (
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardHeader title="Interview quality signals"
                subtitle="Coverage against the competencies the stage was meant to assess, how the talking time split, and how quickly feedback landed."
                icon={<Radio className="h-4 w-4" />} />
              <div className="mt-4 border-t border-surface-line">
                <Table>
                  <thead>
                    <tr>
                      <Th>Interview</Th><Th>Panel</Th><Th align="center">Competency coverage</Th>
                      <Th className="min-w-[11rem]">Talk time</Th><Th align="center">Duration</Th>
                      <Th align="center">Feedback words</Th><Th align="center">Turnaround</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {quality.map(q => (
                      <tr key={q.interviewId} className="hover:bg-surface-page/60 align-top">
                        <Td>
                          <p className="font-medium text-ink whitespace-nowrap">{q.candidateName}</p>
                          <p className="text-2xs text-ink-muted">{q.stage}</p>
                        </Td>
                        <Td className="text-2xs text-ink-muted whitespace-nowrap">
                          {q.interviewerIds.map(id => personById(id)?.name.split(' ')[0]).join(', ')}
                        </Td>
                        <Td align="center" className="min-w-[7rem]">
                          <span className="tnum text-[13px] font-semibold"
                            style={{ color: q.coveragePct >= 90 ? RAG.good : q.coveragePct >= 70 ? RAG.warning : RAG.critical }}>
                            {q.coveragePct}%
                          </span>
                          <Progress className="mt-1" value={q.coveragePct} height={4}
                            tone={q.coveragePct >= 90 ? RAG.good : q.coveragePct >= 70 ? RAG.warning : RAG.critical} />
                        </Td>
                        <Td><TalkRatioBar interviewer={q.talkRatio.interviewer} candidate={q.talkRatio.candidate} /></Td>
                        <Td align="center" className="text-ink-soft">{q.durationMins}m</Td>
                        <Td align="center">
                          <span className={cx('tnum font-semibold', q.feedbackWords < 200 ? 'text-rag-serious' : 'text-ink-soft')}>{q.feedbackWords}</span>
                          {q.feedbackWords < 200 && <span className="block text-2xs text-rag-serious">Thin</span>}
                        </Td>
                        <Td align="center">
                          {q.turnaroundDays == null ? <Badge tone="red">Not submitted</Badge> : (
                            <span className={cx('tnum font-semibold', q.turnaroundDays > q.slaDays ? 'text-rag-serious' : 'text-rag-good')}>
                              {q.turnaroundDays}d
                              <span className="block text-2xs font-normal text-ink-faint">SLA {q.slaDays}d</span>
                            </span>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card>
          </div>
        )}
      </Page>
    </>
  )
}

/* ── An interview card that is genuinely joinable ─────────────────────── */

const InterviewCard = ({ interviewId }: { interviewId: string }) => {
  const { state } = useApp()
  const iv = state.interviews.find(i => i.id === interviewId)!
  const cand = state.candidates.find(c => c.id === iv.candidateId)!
  const req = state.requisitions.find(r => r.id === iv.requisitionId)!
  const stg = req.workflow.find(s => s.key === iv.stageKey)!
  const panel = iv.interviewerIds.map(id => personById(id)!).filter(Boolean)
  const comps = req.competencies.filter(c => stg.competencyIds.includes(c.id))
  const minsAway = Math.round((+new Date(iv.scheduledAt) - Date.now()) / 60000)
  const imminent = minsAway <= 60 && minsAway >= -30

  return (
    <Card className={cx('overflow-hidden transition-all', imminent && 'border-electric-300 shadow-card')}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className={cx('grid w-full shrink-0 place-items-center rounded-xl px-4 py-3 lg:w-28',
          imminent ? 'bg-electric-600 text-white' : 'bg-surface-sunken text-ink-soft')}>
          <span className="text-2xs font-semibold uppercase tracking-wide">
            {isSameDay(iv.scheduledAt) ? 'Today' : new Date(iv.scheduledAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          </span>
          <span className="tnum text-xl font-bold leading-tight">{fmtInTz(iv.scheduledAt, iv.timezone).split(', ')[1] ?? ''}</span>
          <span className="text-2xs opacity-80">{iv.timezone.split('/')[1].replace('_', ' ')}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/candidates/${cand.id}`} className="flex items-center gap-2">
              <Avatar name={cand.name} tint={cand.tint} size={30} />
              <span className="text-[15px] font-semibold text-ink hover:text-electric-700 transition-colors">{cand.name}</span>
            </Link>
            <Badge tone="blue">{stg.shortName}</Badge>
            <Badge tone="neutral">{req.id}</Badge>
            {imminent && <Badge tone="red" dot>Starting {minsAway > 0 ? `in ${minsAway}m` : 'now'}</Badge>}
          </div>

          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{stg.objective}</p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-2xs text-ink-muted">
            <span className="inline-flex items-center gap-1.5"><Clock className="h-3 w-3" />{iv.durationMins} min</span>
            <span className="inline-flex items-center gap-1.5"><Video className="h-3 w-3" />{iv.mode}</span>
            <span className="inline-flex items-center gap-1.5"><Globe2 className="h-3 w-3" />{countryOf(req.country).flag} {iv.timezone}</span>
            <span className="inline-flex items-center gap-1.5"><Users className="h-3 w-3" />{panel.map(p => p.name).join(', ')}</span>
          </div>

          {comps.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {comps.map(c => (
                <span key={c.id} className="rounded-md border border-surface-line bg-surface-page px-1.5 py-0.5 text-2xs text-ink-soft">
                  {c.name}<span className="ml-1 tnum text-ink-faint">{Math.round(c.weight * 100)}%</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <AvatarStack people={panel.map(p => ({ name: p.name, tint: p.tint }))} size={28} max={3} />
          <Link to={`/interviews/${iv.id}`}>
            <Button variant={imminent ? 'primary' : 'secondary'} size="md">
              <Play className="h-4 w-4" />{imminent ? 'Join now' : 'Open room'}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}
