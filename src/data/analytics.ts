import { daysBetween, rel } from '@/lib/dates'
import { CANDIDATES } from './candidates'
import { ASSESSMENTS } from './assessments'
import { INTERVIEWS } from './interviews'
import { REQUISITIONS, interviewStages } from './requisitions'
import type { RagStatus, Requisition } from './types'

/**
 * Aggregate pipeline volumes per requisition. Eight candidates are tracked in
 * full detail; these counts represent the whole applicant pool behind them,
 * which is what the funnel and conversion analytics are actually measuring.
 */
export const FUNNEL_STAGES = [
  'Applied', 'AI Screened', 'Recruiter Shortlist', 'Interviewing', 'Assessment', 'Offer', 'Hired',
] as const
export type FunnelStage = (typeof FUNNEL_STAGES)[number]

export const REQ_FUNNEL: Record<string, number[]> = {
  //            Applied  AIScr  Shortlist  Interviewing  Assessment  Offer  Hired
  'REQ-2049': [186, 171, 44, 19, 11, 2, 0],
  'REQ-2076': [241, 228, 63, 27, 16, 4, 1],
  'REQ-2088': [92, 88, 21, 8, 5, 1, 0],
}

export const funnelFor = (reqIds: string[]): { stage: FunnelStage; count: number }[] =>
  FUNNEL_STAGES.map((stage, i) => ({
    stage,
    count: reqIds.reduce((sum, id) => sum + (REQ_FUNNEL[id]?.[i] ?? 0), 0),
  }))

/** Median days spent in each stage — feeds the stage-ageing table. */
export const STAGE_AGEING: Record<string, { stage: string; medianDays: number; slaDays: number; oldestDays: number; count: number }[]> = {
  'REQ-2049': [
    { stage: 'AI Screening', medianDays: 0.4, slaDays: 1, oldestDays: 1, count: 3 },
    { stage: 'TA Screen', medianDays: 4.2, slaDays: 2, oldestDays: 9, count: 4 },
    { stage: 'L1 Business', medianDays: 8.1, slaDays: 3, oldestDays: 13, count: 5 },
    { stage: 'L2 Business', medianDays: 11.5, slaDays: 3, oldestDays: 16, count: 4 },
    { stage: 'L3 HR Partner', medianDays: 9.0, slaDays: 2, oldestDays: 12, count: 2 },
    { stage: 'L4 Segment Head', medianDays: 6.0, slaDays: 2, oldestDays: 6, count: 1 },
    { stage: 'Offer', medianDays: 0, slaDays: 4, oldestDays: 0, count: 0 },
  ],
  'REQ-2076': [
    { stage: 'AI Screening', medianDays: 0.3, slaDays: 1, oldestDays: 1, count: 4 },
    { stage: 'TA Screen', medianDays: 3.1, slaDays: 2, oldestDays: 5, count: 3 },
    { stage: 'L1 Technical', medianDays: 6.4, slaDays: 3, oldestDays: 10, count: 4 },
    { stage: 'L2 System Design', medianDays: 8.8, slaDays: 3, oldestDays: 9, count: 3 },
    { stage: 'L3 HM & Values', medianDays: 6.9, slaDays: 2, oldestDays: 8, count: 2 },
    { stage: 'Offer', medianDays: 5.0, slaDays: 4, oldestDays: 5, count: 1 },
  ],
  'REQ-2088': [
    { stage: 'AI Screening', medianDays: 0.5, slaDays: 1, oldestDays: 1, count: 2 },
    { stage: 'TA Screen', medianDays: 5.0, slaDays: 2, oldestDays: 7, count: 2 },
    { stage: 'L1 Functional', medianDays: 8.0, slaDays: 3, oldestDays: 8, count: 1 },
    { stage: 'L2 Case Study', medianDays: 14.0, slaDays: 4, oldestDays: 14, count: 1 },
    { stage: 'L3 Compliance', medianDays: 13.0, slaDays: 3, oldestDays: 13, count: 1 },
    { stage: 'L4 Leadership Panel', medianDays: 11.0, slaDays: 3, oldestDays: 11, count: 1 },
    { stage: 'L5 Final', medianDays: 0, slaDays: 2, oldestDays: 0, count: 0 },
  ],
}

/** Source performance across all live requisitions. */
export const SOURCE_PERFORMANCE = [
  { source: 'Referral', applied: 48, shortlisted: 22, interviewed: 12, offered: 4, quality: 88 },
  { source: 'LinkedIn', applied: 164, shortlisted: 41, interviewed: 17, offered: 2, quality: 71 },
  { source: 'Careers Site', applied: 201, shortlisted: 38, interviewed: 14, offered: 1, quality: 62 },
  { source: 'Agency', applied: 62, shortlisted: 19, interviewed: 8, offered: 2, quality: 74 },
  { source: 'Job Board', applied: 137, shortlisted: 21, interviewed: 6, offered: 0, quality: 49 },
  { source: 'Internal', applied: 24, shortlisted: 12, interviewed: 7, offered: 1, quality: 83 },
]

/** Twelve-week trend — time to shortlist and interview cycle time, in days. */
export const CYCLE_TREND = Array.from({ length: 12 }, (_, i) => {
  const w = i + 1
  return {
    week: `W${w}`,
    timeToShortlist: [14.2, 13.8, 13.1, 12.4, 12.9, 11.8, 11.2, 10.9, 11.4, 10.6, 9.8, 9.2][i],
    interviewCycle: [26.4, 25.9, 27.1, 25.2, 24.6, 24.9, 23.4, 22.8, 23.9, 22.1, 21.4, 20.8][i],
    feedbackTurnaround: [4.1, 3.9, 4.4, 3.6, 3.8, 3.2, 3.4, 2.9, 3.1, 2.7, 2.5, 2.4][i],
  }
})

/** Hiring demand for the leadership view. */
export const DEMAND_BY_FUNCTION = [
  { function: 'Sales', IN: 9, GB: 4, SG: 3, US: 6, AE: 2, DE: 3 },
  { function: 'Engineering', IN: 14, GB: 8, SG: 5, US: 11, AE: 1, DE: 6 },
  { function: 'Finance', IN: 3, GB: 2, SG: 4, US: 2, AE: 1, DE: 2 },
  { function: 'Operations', IN: 7, GB: 3, SG: 2, US: 3, AE: 3, DE: 2 },
  { function: 'Marketing', IN: 4, GB: 3, SG: 1, US: 4, AE: 1, DE: 1 },
  { function: 'Human Resources', IN: 2, GB: 1, SG: 1, US: 2, AE: 1, DE: 1 },
]

export const DEMAND_BY_BAND = [
  { band: 'B5', open: 12, filled: 9 },
  { band: 'B6', open: 21, filled: 14 },
  { band: 'B7', open: 28, filled: 16 },
  { band: 'B8', open: 19, filled: 8 },
  { band: 'B9', open: 11, filled: 3 },
  { band: 'B10', open: 4, filled: 1 },
]

/** Interviewer responsiveness — feeds hiring-team responsiveness and overdue tracking. */
export const INTERVIEWER_STATS = [
  { personId: 'u_murugan', interviews: 14, avgTurnaroundDays: 1.2, overdue: 0, avgWordsPerScorecard: 412, coveragePct: 96, talkSharePct: 26 },
  { personId: 'u_arjun', interviews: 11, avgTurnaroundDays: 2.8, overdue: 1, avgWordsPerScorecard: 388, coveragePct: 91, talkSharePct: 31 },
  { personId: 'u_soundar', interviews: 9, avgTurnaroundDays: 1.6, overdue: 0, avgWordsPerScorecard: 356, coveragePct: 94, talkSharePct: 24 },
  { personId: 'u_sophie', interviews: 12, avgTurnaroundDays: 1.1, overdue: 0, avgWordsPerScorecard: 471, coveragePct: 98, talkSharePct: 22 },
  { personId: 'u_hana', interviews: 8, avgTurnaroundDays: 5.4, overdue: 2, avgWordsPerScorecard: 143, coveragePct: 79, talkSharePct: 34 },
  { personId: 'u_ravi', interviews: 10, avgTurnaroundDays: 2.1, overdue: 0, avgWordsPerScorecard: 402, coveragePct: 93, talkSharePct: 38 },
  { personId: 'u_daniel', interviews: 6, avgTurnaroundDays: 3.2, overdue: 0, avgWordsPerScorecard: 367, coveragePct: 89, talkSharePct: 29 },
  { personId: 'u_elena', interviews: 7, avgTurnaroundDays: 1.9, overdue: 1, avgWordsPerScorecard: 428, coveragePct: 95, talkSharePct: 27 },
  { personId: 'u_tom', interviews: 5, avgTurnaroundDays: 6.1, overdue: 1, avgWordsPerScorecard: 118, coveragePct: 72, talkSharePct: 44 },
  { personId: 'u_nadia', interviews: 4, avgTurnaroundDays: 2.4, overdue: 0, avgWordsPerScorecard: 391, coveragePct: 90, talkSharePct: 30 },
]

/** Diversity is only reported where the jurisdiction permits it. */
export const DIVERSITY_BY_STAGE = [
  { stage: 'Applied', female: 34, male: 61, undisclosed: 5 },
  { stage: 'Shortlist', female: 38, male: 58, undisclosed: 4 },
  { stage: 'Interviewing', female: 41, male: 56, undisclosed: 3 },
  { stage: 'Offer', female: 44, male: 53, undisclosed: 3 },
]

export const NO_SHOW_RATE = 4.1
export const ASSESSMENT_COMPLETION_RATE = 87.3

/* ── Derived requisition health ───────────────────────────────────────── */

export interface ReqHealth {
  req: Requisition
  rag: RagStatus
  daysOpen: number
  daysToTarget: number
  inProcess: number
  atStage: string
  reasons: string[]
  progressPct: number
}

export const requisitionHealth = (req: Requisition): ReqHealth => {
  const daysOpen = daysBetween(req.openDate)
  const daysToTarget = -daysBetween(req.targetCloseDate)
  const cands = CANDIDATES.filter(c => c.requisitionId === req.id)
  const inProcess = cands.filter(c => !['Rejected', 'Withdrawn', 'Hired'].includes(c.status)).length
  const levels = interviewStages(req)
  const furthest = Math.max(0, ...cands.map(c => {
    const idx = levels.findIndex(l => l.key === c.currentStageKey)
    // The level a candidate is *sitting in* is not yet complete, so `idx`
    // (not idx + 1) is the number of levels actually behind them.
    return c.status === 'Offer Recommended' || c.status === 'Hired' ? levels.length : Math.max(0, idx)
  }))

  const reasons: string[] = []
  let rag: RagStatus = 'good'

  if (daysToTarget < 0) {
    rag = 'critical'
    reasons.push(`Target close date passed ${Math.abs(daysToTarget)} days ago`)
  } else if (daysToTarget <= 5) {
    rag = 'critical'
    reasons.push(`Only ${daysToTarget} days to target close`)
  } else if (daysToTarget <= 14) {
    rag = 'serious'
    reasons.push(`${daysToTarget} days to target close`)
  }

  if (inProcess <= 1 && req.status !== 'Offer Stage') {
    rag = rag === 'good' ? 'serious' : 'critical'
    reasons.push(`Only ${inProcess} candidate${inProcess === 1 ? '' : 's'} left in process — no fallback if this one declines`)
  }

  const remainingStages = levels.length - furthest
  const daysNeeded = levels.slice(furthest).reduce((a, s) => a + s.slaDays, 0) + 4
  if (daysToTarget > 0 && daysNeeded > daysToTarget) {
    if (rag === 'good') rag = 'warning'
    reasons.push(`${remainingStages} stage${remainingStages === 1 ? '' : 's'} remaining needs ~${daysNeeded} days against ${daysToTarget} available`)
  }

  if (daysOpen > 70 && req.status !== 'Offer Stage') {
    rag = 'critical'
    reasons.push(`Open ${daysOpen} days — well beyond the 45-day benchmark for this band`)
  }

  if (req.status === 'Offer Stage') {
    rag = 'good'
    reasons.length = 0
    reasons.push('Offer recommendation in build — on track')
  }

  if (!reasons.length) reasons.push('Tracking to plan')

  return {
    req, rag, daysOpen, daysToTarget, inProcess,
    atStage: furthest >= levels.length ? 'Offer' : (levels[furthest]?.shortName ?? 'Screening'),
    reasons,
    progressPct: Math.round((furthest / Math.max(1, levels.length)) * 100),
  }
}

/* ── Headline metrics for the dashboard ───────────────────────────────── */

export const dashboardMetrics = (reqIds: string[]) => {
  const reqs = REQUISITIONS.filter(r => reqIds.includes(r.id))
  const cands = CANDIDATES.filter(c => reqIds.includes(c.requisitionId))
  const ivs = INTERVIEWS.filter(i => reqIds.includes(i.requisitionId))
  const asms = ASSESSMENTS.filter(a => reqIds.includes(a.requisitionId))

  const funnel = funnelFor(reqIds)
  const applied = funnel[0].count
  const shortlisted = funnel[2].count
  const interviewing = funnel[3].count
  const offered = funnel[5].count

  const scheduled = ivs.filter(i => i.status === 'Scheduled')
  const completedIvs = ivs.filter(i => i.status === 'Completed')
  const noShows = ivs.filter(i => i.status === 'No Show')

  const pendingAssessments = asms.filter(a => a.status !== 'submitted')
  const overdueAssessments = asms.filter(a => a.status === 'overdue')
  const awaitingScreening = cands.filter(c => c.status === 'AI Screened')
  const decisionsWaiting = cands.filter(c =>
    c.status === 'AI Screened' || c.status === 'Offer Recommended' || c.status === 'On Hold')

  const timeToShortlist = cands
    .map(c => {
      const ta = c.stageProgress.find(p => p.stageKey.endsWith('_ta'))
      return ta?.completedAt ? daysBetween(c.appliedAt, ta.completedAt) : null
    })
    .filter((n): n is number => n != null)

  const avgTimeInStage = cands
    .map(c => {
      const cur = c.stageProgress.find(p => p.stageKey === c.currentStageKey)
      return cur?.enteredAt ? daysBetween(cur.enteredAt) : null
    })
    .filter((n): n is number => n != null)

  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

  return {
    activeRequisitions: reqs.filter(r => r.status !== 'Closed').length,
    candidatesInPipeline: interviewing + shortlisted,
    trackedCandidates: cands.length,
    interviewsToday: scheduled.filter(i => {
      const d = new Date(i.scheduledAt); const n = new Date()
      return d.toDateString() === n.toDateString()
    }).length,
    assessmentsPending: pendingAssessments.length,
    assessmentsOverdue: overdueAssessments.length,
    decisionsAwaiting: decisionsWaiting.length,
    awaitingScreening: awaitingScreening.length,
    timeToShortlist: Number(mean(timeToShortlist).toFixed(1)),
    timeInStage: Number(mean(avgTimeInStage).toFixed(1)),
    interviewCompletionRate: ivs.length
      ? Number(((completedIvs.length / (completedIvs.length + noShows.length || 1)) * 100).toFixed(1))
      : 0,
    dropOffRate: applied ? Number((((applied - interviewing) / applied) * 100).toFixed(1)) : 0,
    aiScreeningCompletionRate: applied ? Number(((funnel[1].count / applied) * 100).toFixed(1)) : 0,
    offerRate: shortlisted ? Number(((offered / shortlisted) * 100).toFixed(1)) : 0,
    funnel,
  }
}

/* ── Candidate scoring rollup — the IAS "Overall Summary" sheet ───────── */

export interface CandidateRollup {
  candidateId: string
  name: string
  overallMatch: number
  /** IAS weighted average across every submitted level, weighted by competency. */
  consolidatedScore: number
  perStage: { stageKey: string; label: string; score: number | null; decision: string | null }[]
  perCompetency: { competencyId: string; name: string; avg: number; weight: number; byStage: (number | null)[] }[]
  strengths: string[]
  concerns: string[]
  recommendation: string
  interviewAgeingDays: number[]
}

export const candidateRollup = (candidateId: string): CandidateRollup | null => {
  const cand = CANDIDATES.find(c => c.id === candidateId)
  if (!cand) return null
  const req = REQUISITIONS.find(r => r.id === cand.requisitionId)!
  const levels = interviewStages(req)
  const asms = ASSESSMENTS.filter(a => a.candidateId === candidateId)

  const perStage = levels.map(l => {
    const a = asms.find(x => x.stageKey === l.key)
    return {
      stageKey: l.key, label: l.shortName,
      score: a && a.status === 'submitted' ? Number(a.weightedAverage.toFixed(2)) : null,
      decision: a?.finalDecision ?? null,
    }
  })

  const perCompetency = req.competencies.map(comp => {
    const byStage = levels.map(l => {
      const a = asms.find(x => x.stageKey === l.key && x.status === 'submitted')
      const row = a?.scores.find(s => s.competencyId === comp.id)
      return row?.rating ?? null
    })
    const rated = byStage.filter((v): v is number => v != null)
    return {
      competencyId: comp.id, name: comp.name, weight: comp.weight,
      avg: rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0,
      byStage,
    }
  })

  const wsum = perCompetency.filter(c => c.avg > 0).reduce((a, c) => a + c.weight, 0)
  const consolidated = wsum
    ? perCompetency.filter(c => c.avg > 0).reduce((a, c) => a + c.avg * c.weight, 0) / wsum
    : 0

  // Interview ageing — the IAS "Time Taken between 2 interviews" row.
  const dates = levels
    .map(l => asms.find(a => a.stageKey === l.key && a.status === 'submitted')?.submittedAt)
    .filter((d): d is string => !!d)
  const ageing = dates.slice(1).map((d, i) => daysBetween(dates[i], d))

  const strengths = Array.from(new Set(
    asms.filter(a => a.status === 'submitted')
      .flatMap(a => INTERVIEWS.find(i => i.id === a.interviewId)?.aiSummary?.strengths ?? []),
  )).slice(0, 5)

  const concerns = Array.from(new Set(
    asms.filter(a => a.status === 'submitted')
      .flatMap(a => INTERVIEWS.find(i => i.id === a.interviewId)?.aiSummary?.concerns ?? [])
      .filter(c => c && !/^none/i.test(c)),
  )).slice(0, 5)

  const top = [...perCompetency].filter(c => c.avg > 0).sort((a, b) => b.avg - a.avg)[0]
  const bottom = [...perCompetency].filter(c => c.avg > 0).sort((a, b) => a.avg - b.avg)[0]

  const recommendation = consolidated >= 5
    ? `Consolidated ${consolidated.toFixed(2)} of 6 across ${perStage.filter(s => s.score != null).length} completed levels. Strongest on ${top?.name} (${top?.avg.toFixed(1)}); weakest on ${bottom?.name} (${bottom?.avg.toFixed(1)}). Evidence supports an offer recommendation — the decision remains with the hiring manager.`
    : consolidated >= 4
      ? `Consolidated ${consolidated.toFixed(2)} of 6. Clears the bar on ${top?.name} but ${bottom?.name} sits at ${bottom?.avg.toFixed(1)} against a required proficiency of ${req.competencies.find(c => c.id === bottom?.competencyId)?.requiredProficiency}. Recommend the remaining stages target that gap explicitly before any decision.`
      : `Consolidated ${consolidated.toFixed(2)} of 6 — below the threshold for this band. The evidence does not currently support progression; a recruiter or hiring manager should confirm before any communication to the candidate.`

  return {
    candidateId, name: cand.name,
    overallMatch: cand.screening?.overallMatch ?? 0,
    consolidatedScore: Number(consolidated.toFixed(2)),
    perStage, perCompetency, strengths, concerns, recommendation,
    interviewAgeingDays: ageing,
  }
}

/* ── Interview quality signals ────────────────────────────────────────── */

export const interviewQuality = (reqIds: string[]) => {
  const ivs = INTERVIEWS.filter(i => reqIds.includes(i.requisitionId) && i.aiSummary)
  return ivs.map(i => {
    const cand = CANDIDATES.find(c => c.id === i.candidateId)!
    const req = REQUISITIONS.find(r => r.id === i.requisitionId)!
    const stg = req.workflow.find(s => s.key === i.stageKey)!
    const asm = ASSESSMENTS.find(a => a.interviewId === i.id)
    const words = asm
      ? asm.scores.reduce((a, s) => a + s.positives.split(/\s+/).filter(Boolean).length + s.negatives.split(/\s+/).filter(Boolean).length, 0)
      : 0
    return {
      interviewId: i.id, candidateName: cand.name, stage: stg.shortName,
      interviewerIds: i.interviewerIds,
      coveragePct: i.aiSummary!.coveragePct,
      talkRatio: i.aiSummary!.talkRatio,
      durationMins: i.durationMins,
      questionsCovered: stg.competencyIds.length,
      feedbackWords: words,
      feedbackStatus: asm?.status ?? 'not_started',
      turnaroundDays: asm?.submittedAt ? daysBetween(i.scheduledAt, asm.submittedAt) : null,
      slaDays: stg.slaDays,
    }
  })
}

/* ── Activity, tasks, insights, audit ─────────────────────────────────── */

export const ACTIVITY: import('./types').ActivityItem[] = [
  { id: 'a1', at: rel(0, 9, 12), actorId: 'u_priya', kind: 'screening', text: 'ran AI screening on Vikram Shetty for REQ-2049 — 68% match, recruiter review required', requisitionId: 'REQ-2049', candidateId: 'CAN-4104' },
  { id: 'a2', at: rel(0, 8, 40), actorId: 'u_marcus', kind: 'decision', text: 'moved Elif Demir to Offer Recommended on REQ-2076', requisitionId: 'REQ-2076', candidateId: 'CAN-4105' },
  { id: 'a3', at: rel(-1, 17, 25), actorId: 'u_arjun', kind: 'assessment', text: 'signed off Assessment Level 2 for Kavya Nair — 5.15 weighted, Good to Go', requisitionId: 'REQ-2049', candidateId: 'CAN-4103' },
  { id: 'a4', at: rel(-1, 14, 3), actorId: 'u_sophie', kind: 'interview', text: 'completed Interview Level 3 with Elif Demir — feedback submitted same day', requisitionId: 'REQ-2076', candidateId: 'CAN-4105' },
  { id: 'a5', at: rel(-1, 11, 50), actorId: 'u_leena', kind: 'system', text: 'approved the updated competency template for Band 8 REL/DCG roles' },
  { id: 'a6', at: rel(-2, 16, 15), actorId: 'u_priya', kind: 'decision', text: 'escalated REQ-2088 to Daniel Okafor — 80 days open with a single panel-stage candidate', requisitionId: 'REQ-2088' },
  { id: 'a7', at: rel(-2, 10, 8), actorId: 'u_elena', kind: 'assessment', text: 'signed off Assessment Level 3 for Carlos Mendes — 5.5 weighted, Good to Go', requisitionId: 'REQ-2088', candidateId: 'CAN-4108' },
  { id: 'a8', at: rel(-3, 15, 30), actorId: 'u_marcus', kind: 'application', text: 'received an application from Mei Lin Tan for REQ-2076 via LinkedIn', requisitionId: 'REQ-2076', candidateId: 'CAN-4107' },
  { id: 'a9', at: rel(-3, 9, 45), actorId: 'u_murugan', kind: 'interview', text: 'rated Rohit Desai 6/6 on PC hardware at Interview Level 1', requisitionId: 'REQ-2049', candidateId: 'CAN-4102' },
  { id: 'a10', at: rel(-4, 13, 20), actorId: 'u_priya', kind: 'system', text: 'updated the interview workflow on REQ-2049 — added Level 4 Segment Head', requisitionId: 'REQ-2049' },
]

export const TASKS: import('./types').TaskItem[] = [
  { id: 't1', title: 'Screen Vikram Shetty', detail: 'AI flagged Recruiter Review Required — first-time manager at Band 8, networking rather than PC hardware.', ownerId: 'u_priya', dueAt: rel(0, 17), priority: 'high', kind: 'screening', requisitionId: 'REQ-2049', candidateId: 'CAN-4104', done: false },
  { id: 't2', title: 'Screen Mei Lin Tan', detail: 'Strong design evidence but needs UK sponsorship and 90 days notice. Decide whether to run in parallel with the offer-stage candidate.', ownerId: 'u_marcus', dueAt: rel(0, 17), priority: 'high', kind: 'screening', requisitionId: 'REQ-2076', candidateId: 'CAN-4107', done: false },
  { id: 't3', title: 'Chase L1 feedback from Hana Suzuki', detail: 'James Okonkwo Level 1 scorecard is 4 days past SLA and L2 runs today.', ownerId: 'u_marcus', dueAt: rel(0, 12), priority: 'high', kind: 'feedback', requisitionId: 'REQ-2076', candidateId: 'CAN-4106', done: false },
  { id: 't4', title: 'Review and sign off Kavya Nair L2', detail: 'AI draft is complete at 80% coverage and waiting on your edits and signature.', ownerId: 'u_arjun', dueAt: rel(1, 18), priority: 'medium', kind: 'feedback', requisitionId: 'REQ-2049', candidateId: 'CAN-4103', done: false },
  { id: 't5', title: 'Decision required — Elif Demir offer', detail: 'Four levels complete at 5.35 consolidated. Competing process in play; visa transfer adds 3–5 weeks.', ownerId: 'u_sophie', dueAt: rel(1, 12), priority: 'high', kind: 'decision', requisitionId: 'REQ-2076', candidateId: 'CAN-4105', done: false },
  { id: 't6', title: 'REQ-2088 sourcing reset or extension', detail: 'Target close is 2 days out with one candidate at panel stage. Needs a call from Daniel.', ownerId: 'u_priya', dueAt: rel(1, 10), priority: 'high', kind: 'approval', requisitionId: 'REQ-2088', done: false },
  { id: 't7', title: 'Confirm Segment Head slot for Ananya Sharma', detail: 'Level 4 is scheduled for 15:00 IST today. Tom has not accepted the invite.', ownerId: 'u_priya', dueAt: rel(0, 14), priority: 'medium', kind: 'scheduling', requisitionId: 'REQ-2049', candidateId: 'CAN-4101', done: false },
  { id: 't8', title: 'Approve REQ-2049 competency template for reuse', detail: 'Framework has been edited twice since approval. Re-approval needed before it can be reused.', ownerId: 'u_leena', dueAt: rel(2, 17), priority: 'low', kind: 'approval', requisitionId: 'REQ-2049', done: false },
]

export const AUDIT: import('./types').AuditEvent[] = [
  { id: 'ev1', at: rel(0, 9, 12), actorId: 'u_priya', actorRole: 'ta_admin', action: 'AI screening executed', entity: 'Candidate', entityId: 'CAN-4104', detail: 'nexora-screen-v4.2 produced a 68% match with suggested decision "Recruiter Review Required". No automated status change applied.' },
  { id: 'ev2', at: rel(0, 8, 40), actorId: 'u_marcus', actorRole: 'ta_admin', action: 'Status changed', entity: 'Candidate', entityId: 'CAN-4105', detail: 'In Interview → Offer Recommended. Recruiter override of no AI suggestion; four levels complete.', humanDecision: true },
  { id: 'ev3', at: rel(-1, 17, 25), actorId: 'u_arjun', actorRole: 'hiring_manager', action: 'Assessment signed off', entity: 'Assessment', entityId: 'ASM-4103-s_l2', detail: 'Weighted average 5.15. Interviewer edited 3 of 8 AI-suggested ratings before signing.', humanDecision: true },
  { id: 'ev4', at: rel(-1, 16, 2), actorId: 'u_arjun', actorRole: 'hiring_manager', action: 'AI suggestion overridden', entity: 'Assessment', entityId: 'ASM-4103-s_l2', detail: 'Strategic Acumen: AI suggested 5, interviewer recorded 6 with rationale "the $22M P&L example is stronger than the model credited".', humanDecision: true },
  { id: 'ev5', at: rel(-1, 11, 50), actorId: 'u_leena', actorRole: 'ta_admin', action: 'Template approved', entity: 'CompetencyTemplate', entityId: 'tpl_rel_b8', detail: 'Band 8 REL/DCG framework approved for reuse. Weightings unchanged from the IAS baseline.', humanDecision: true },
  { id: 'ev6', at: rel(-2, 16, 15), actorId: 'u_priya', actorRole: 'ta_admin', action: 'Requisition escalated', entity: 'Requisition', entityId: 'REQ-2088', detail: 'Escalated to hiring manager: 80 days open, single candidate at panel stage.', humanDecision: true },
  { id: 'ev7', at: rel(-3, 14, 30), actorId: 'u_priya', actorRole: 'ta_admin', action: 'Consent recorded', entity: 'Candidate', entityId: 'CAN-4107', detail: 'Candidate accepted privacy policy v3.1 with a 24-month retention period at the point of application.' },
  { id: 'ev8', at: rel(-4, 13, 20), actorId: 'u_priya', actorRole: 'ta_admin', action: 'Workflow modified', entity: 'Requisition', entityId: 'REQ-2049', detail: 'Added Interview Level 4 (Segment Head). Assessment Level 4 generated automatically for all in-process candidates.', humanDecision: true },
  { id: 'ev9', at: rel(-6, 10, 5), actorId: 'u_murugan', actorRole: 'hiring_manager', action: 'AI suggestion accepted', entity: 'Assessment', entityId: 'ASM-4101-s_l1', detail: 'PC Hardware: accepted the AI-suggested rating of 4 unchanged, editing the evidence text only.', humanDecision: true },
  { id: 'ev10', at: rel(-8, 15, 40), actorId: 'u_nadia', actorRole: 'leadership', action: 'Report exported', entity: 'Analysis', entityId: 'leadership_view', detail: 'Leadership summary exported to PDF. Candidate names masked per role policy.' },
]

export const PORTAL_MESSAGES: import('./types').PortalMessage[] = [
  { id: 'm1', at: rel(-2, 10, 15), from: 'Priya Raghavan · Senior TA Partner', subject: 'Your Level 4 interview is confirmed', body: 'Hi Ananya — your final conversation with Tom Whitfield (SVP, Global Sales) is confirmed for today at 15:00 IST. It runs 45 minutes over video.\n\nTom will focus on executive presence and how you think about the role over a two to three year horizon rather than the technical ground we have already covered. Come with a point of view on what you would change in the first six months.\n\nThe joining link is on your interview card below.', read: false },
  { id: 'm2', at: rel(-7, 16, 30), from: 'Priya Raghavan · Senior TA Partner', subject: 'Feedback from your HR Partner conversation', body: 'Ravi found the conversation genuinely enjoyable and had no concerns to raise. He particularly noted how you handled the question about cross-functional conflict.\n\nOne process note: we will need two references before an offer can be finalised. No action needed yet — I will send the request formally if we get there.', read: true },
  { id: 'm3', at: rel(-19, 9, 0), from: 'Nexora Talent Team', subject: 'Your application has moved to interview', body: 'Good news — your application for Senior Manager, Enterprise Solutions & Escalations has progressed to the interview stage.\n\nYou can see every scheduled conversation, preparation material and document request in your portal at any time.', read: true },
]

export const DOCUMENT_REQUESTS: import('./types').DocumentRequest[] = [
  { id: 'd1', name: 'Government photo ID', status: 'verified', dueAt: rel(-10) },
  { id: 'd2', name: 'Highest qualification certificate', status: 'uploaded', dueAt: rel(-3) },
  { id: 'd3', name: 'Last 3 months payslips', status: 'requested', dueAt: rel(4) },
  { id: 'd4', name: 'Two professional references', status: 'requested', dueAt: rel(7) },
]
