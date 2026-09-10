import { rel } from '@/lib/dates'
import type { Assessment, CompetencyScore, CulturalFitment, IasDecision } from './types'
import { CANDIDATES } from './candidates'
import { INTERVIEWS } from './interviews'
import { REQUISITIONS, interviewStages } from './requisitions'

/**
 * IAS weighted average: Σ(rating × weight) ÷ Σ(weight), taken over rated rows
 * only, so a partially completed scorecard is not silently understated.
 */
export const weightedAverage = (scores: CompetencyScore[]): number => {
  const rated = scores.filter(s => s.rating != null)
  const wsum = rated.reduce((a, s) => a + s.weight, 0)
  if (!wsum) return 0
  return rated.reduce((a, s) => a + (s.rating as number) * s.weight, 0) / wsum
}

/** Hand-written interviewer prose, keyed by `${candidateId}:${stageKey}:${competencyId}`. */
const NOTES: Record<string, { pos?: string; neg?: string }> = {
  'CAN-4101:s_l1:c1_esc': {
    pos: 'Froze all changes within the first hour and installed a single named owner — the discipline was instinctive, not procedural. Held a 30-minute customer cadence even when there was nothing new to report. Drove a permanent fix into the intake form and the firmware compatibility matrix.',
    neg: 'Nothing material. If pushed: she carried the comms herself rather than building a second person who could.',
  },
  'CAN-4101:s_l1:c1_hw': {
    pos: 'Isolated a BIOS power-management change interacting with one dock revision under GPU load. Built a 240-row matrix to surface the pattern and borrowed a customer dock when lab stock would not reproduce it.',
    neg: 'Last hands-on diagnosis was roughly 18 months ago. She was upfront about it. Her audit-level depth is real but she is no longer the sharpest diagnostician in her own team, and she knows it.',
  },
  'CAN-4101:s_l2:c1_cx': {
    pos: 'Decomposed the CSAT movement into three separate interventions with honest attribution rather than claiming one big win. QBR redesign moved the agenda from status to forward commitments.',
    neg: 'None.',
  },
  'CAN-4101:s_l2:c1_strat': {
    pos: 'Reasons clearly about escalation cost and capacity economics.',
    neg: 'Has never held margin or P&L accountability and said so directly rather than dressing it up. This is the one genuine gap against the framework.',
  },
  'CAN-4102:s_l1:c1_hw': {
    pos: 'Diagnosed the seeded thermal scenario in 11 minutes against a 30-minute expectation, and caught an inconsistency in the scenario itself that no other candidate spotted. I would take his diagnosis over mine.',
    neg: 'None.',
  },
  'CAN-4102:s_l1:c1_esc': {
    pos: 'The weekly escalation review he introduced cut repeat escalations 31%.',
    neg: 'All of it operational and internal. He has never been the person the customer is angry at.',
  },
  'CAN-4103:s_l1:c1_hw': {
    pos: 'Reasoned confidently at infrastructure level and declined to guess when pushed below it, which I rate as a positive.',
    neg: 'Cannot go to component level. This is not a coachable gap inside 90 days and the team will notice in week one.',
  },
  'CAN-4103:s_l2:c1_strat': {
    pos: 'Carries a $22M service P&L with real margin accountability. Described trading margin at one account to protect a renewal at another, with the numbers. She is the only candidate here who has actually had to choose.',
    neg: 'None.',
  },
  'CAN-4105:s2_l2:c2_dist': {
    pos: 'Opened by interrogating what the durability guarantee meant commercially, which reframed the whole exercise. Named reconciliation as the component actually holding the guarantee — the insight we were probing for. Volunteered the nightly-batch failure at Deliveroo unprompted.',
    neg: 'None. Best design session we have run this year.',
  },
  'CAN-4106:s2_l1:c2_quality': {
    pos: 'Clear on CI/CD ownership and pipeline design.',
    neg: 'No articulated testing philosophy. When asked what he would not test, he did not have an answer ready.',
  },
  'CAN-4108:s3_l3:c3_comp': {
    pos: 'Refused an A$40M structure on revenue-recognition grounds in Q4, under direct pressure from the regional sales VP and then from his own manager. Went to a written technical memo rather than a conversation. Acknowledged the relationship cost rather than presenting it as free.',
    neg: 'None.',
  },
}

const CULTURAL: Record<string, { fitment: CulturalFitment; rationale: string }> = {
  'CAN-4101:s_l3': { fitment: 3, rationale: 'Resolves conflict laterally rather than escalating, gives credit by name, and volunteered her own failure without being asked. Scores highest on Action Oriented, Autonomous and Honest against the ideal-candidate guide.' },
  'CAN-4102:s_l1': { fitment: 3, rationale: 'Modest to a fault — undersold the runbook he authored until the panel pushed. Detail oriented and hard-working in the way the guide describes.' },
  'CAN-4103:s_l2': { fitment: 3, rationale: 'Held 8% attrition against a 19% org average, which says more about cultural fit than any interview answer. Marketable and confident in front of customers.' },
  'CAN-4105:s2_l3': { fitment: 3, rationale: 'Influences through writing rather than authority and is comfortable losing an argument. Exactly the disposition a staff role needs.' },
  'CAN-4106:s2_l1': { fitment: 2, rationale: 'Collaborative and straightforward, but the influence instinct is not yet visible. Worth re-testing at the HM round rather than concluding now.' },
  'CAN-4108:s3_l3': { fitment: 3, rationale: 'Independence under pressure, no defensiveness when corrected in the case study, and honest about what holding the line cost him.' },
}

const INPUTS_NEXT: Record<string, string> = {
  'CAN-4101:s_l1': 'Hardware recency is the open question — she is 18 months from the bench. L2 should not re-test hardware; test segment economics instead, which this session never reached.',
  'CAN-4101:s_l2': 'Strategic Acumen is the single gap. HR Partner round should test how she operates as the least commercially experienced person in a leadership room.',
  'CAN-4101:s_l3': 'Nothing outstanding on values. Segment Head should apply pressure on executive presence with a hostile question — still untested across three rounds.',
  'CAN-4102:s_l1': 'Do not spend L2 on technical depth, it is settled and it is excellent. The entire hour should go on customer ownership, which is the deciding question.',
  'CAN-4103:s_l1': 'Hardware gap is confirmed and is not closeable inside the ramp. L2 needs to establish whether her commercial strength is worth the trade.',
  'CAN-4103:s_l2': 'Commercially she is a level above the field. HR Partner should probe how she would earn credibility with nine engineers who will test her on day one.',
  'CAN-4105:s2_l1': 'No concerns. Push the design round harder than usual — she can take it.',
  'CAN-4105:s2_l2': 'Proceed. HM round should focus on what would keep her engaged at our scale, since she is operating above it today.',
  'CAN-4106:s2_l1': 'Design evidence is thin. L2 is the decision point — do not soften the design bar for this candidate because the operational evidence is good.',
  'CAN-4108:s3_l1': 'Technical accounting is settled. Case study should target hardware channel economics, which is where his exposure is genuinely different.',
  'CAN-4108:s3_l2': 'Segment gap is real but he closed it visibly inside the session. Compliance round should test independence directly.',
  'CAN-4108:s3_l3': 'Independence is answered comprehensively. Leadership panel should focus on cross-border people leadership, still the thinnest evidence.',
}

const OVERALL: Record<string, string> = {
  'CAN-4101:s_l1': 'Strongest escalation session I have run on this requisition. The dock-revision isolation was a real diagnostic narrative, not a rehearsed story. I would hire her for the escalation half of this job without hesitation. The hardware half needs a decision from Arjun about whether audit-level depth is enough.',
  'CAN-4102:s_l1': 'Technically the best candidate we will see. He is also the least ready for the customer-facing half of the role. That is a real trade and it is not mine to make.',
  'CAN-4103:s_l2': 'This is the only candidate who has actually had to choose between margin and a relationship, and she talked about it with numbers. If we can live with the hardware gap she is the strongest hire commercially.',
  'CAN-4105:s2_l2': 'Best design session the panel has run this year. Move to offer.',
  'CAN-4106:s2_l1': 'Good operator, genuinely good. Whether he is a staff engineer depends entirely on the design round.',
  'CAN-4108:s3_l3': 'Exactly the independence this role needs. I would be comfortable with him as the person who says no to me.',
}

/**
 * A per-competency rating for a stage. Where the interview summary recorded one,
 * that wins. Otherwise it is derived from the stage average shifted by how
 * strongly this candidate actually evidenced that competency at screening —
 * which is roughly what an interviewer does, and stops every row on a scorecard
 * collapsing to the same number.
 */
const ratingFor = (candidateId: string, stageKey: string, competencyId: string, stageScore: number, isFocus: boolean): number => {
  const iv = INTERVIEWS.find(i => i.candidateId === candidateId && i.stageKey === stageKey)
  const row = iv?.aiSummary?.evidenceByCompetency.find(e => e.competencyId === competencyId)
  if (row) return row.suggestedRating

  const cand = CANDIDATES.find(c => c.id === candidateId)
  const match = cand?.screening?.skillMatches.find(m => m.competencyId === competencyId)?.match ?? 75
  // A 75% match is neutral; every 12 points either side moves the rating by one.
  const shift = (match - 75) / 12
  // Rows the stage was not designed to probe are rated more conservatively.
  const base = stageScore + shift - (isFocus ? 0 : 0.4)
  return Math.max(1, Math.min(6, Math.round(base)))
}

const evidenceFor = (candidateId: string, stageKey: string, competencyId: string): string[] => {
  const iv = INTERVIEWS.find(i => i.candidateId === candidateId && i.stageKey === stageKey)
  return iv?.aiSummary?.evidenceByCompetency.find(e => e.competencyId === competencyId)?.evidence ?? []
}

const buildAssessments = (): Assessment[] => {
  const out: Assessment[] = []

  for (const cand of CANDIDATES) {
    const req = REQUISITIONS.find(r => r.id === cand.requisitionId)!
    const levels = interviewStages(req)

    levels.forEach((stg, idx) => {
      const prog = cand.stageProgress.find(p => p.stageKey === stg.key)
      if (!prog || prog.status === 'not_started') return

      const iv = INTERVIEWS.find(i => i.candidateId === cand.id && i.stageKey === stg.key)
      const isDone = prog.status === 'completed'
      const stageScore = prog.score ?? 4

      const scores: CompetencyScore[] = req.competencies.map(comp => {
        const isFocus = stg.competencyIds.includes(comp.id)
        const noteKey = `${cand.id}:${stg.key}:${comp.id}`
        const note = NOTES[noteKey]
        const rating = ratingFor(cand.id, stg.key, comp.id, stageScore, isFocus)
        const ev = evidenceFor(cand.id, stg.key, comp.id)
        const confidence = ev.length ? 0.92 : isFocus ? 0.78 : 0.54

        const aiPositives = note?.pos
          ?? (ev.length ? ev.join(' ') : `Consistent with the ${comp.name.toLowerCase()} evidence gathered at earlier stages.`)
        const aiNegatives = note?.neg
          ?? (isFocus ? 'No material concern recorded against this competency in the session.' : 'Not directly probed in this session — carried forward from the previous level.')

        return {
          competencyId: comp.id, name: comp.name, category: comp.category, weight: comp.weight,
          rating: isDone ? rating : null,
          positives: isDone ? aiPositives : '',
          negatives: isDone ? aiNegatives : '',
          aiSuggested: { rating, positives: aiPositives, negatives: aiNegatives, confidence, evidence: ev },
          interviewerConfirmed: isDone,
        }
      })

      const cultural = CULTURAL[`${cand.id}:${stg.key}`]
      const status: Assessment['status'] = isDone ? 'submitted'
        : prog.status === 'scheduled' ? 'ai_draft' : 'in_review'

      const dueAt = iv ? rel(Math.round((new Date(iv.scheduledAt).getTime() - Date.now()) / 86_400_000) + stg.slaDays, 18) : undefined

      out.push({
        id: `ASM-${cand.id.slice(4)}-${stg.key}`,
        requisitionId: req.id, candidateId: cand.id, stageKey: stg.key,
        label: `Assessment Level ${idx + 1} · ${stg.shortName}`,
        interviewId: iv?.id, interviewerIds: stg.interviewerIds,
        interviewDate: iv?.scheduledAt ?? prog.enteredAt ?? rel(0),
        mode: iv?.mode ?? 'Video Conference', format: stg.format,
        scores, weightedAverage: isDone ? weightedAverage(scores) : 0, status,
        culturalFitment: isDone ? (cultural?.fitment ?? 3) : null,
        culturalRationale: isDone ? (cultural?.rationale ?? '') : '',
        inputsForNextInterviewer: isDone ? (INPUTS_NEXT[`${cand.id}:${stg.key}`] ?? '') : '',
        overallComments: isDone ? (OVERALL[`${cand.id}:${stg.key}`] ?? '') : '',
        reasonForJobChange: cand.reasonForChange,
        finalDecision: isDone ? (prog.decision ?? 'Good to Go - Found to be suitable') as IasDecision : null,
        signOff: isDone
          ? { signed: true, byId: stg.interviewerIds[0], at: prog.completedAt }
          : { signed: false },
        aiDraftCoverage: 0.8,
        submittedAt: isDone ? prog.completedAt : undefined,
        dueAt,
      })
    })
  }

  return out
}

export const ASSESSMENTS: Assessment[] = buildAssessments()

/* ── Two scorecards deliberately left in a state that needs a human ──── */

// James Okonkwo's L1 feedback is late — this drives the "overdue feedback" signals.
const jamesL1 = ASSESSMENTS.find(a => a.id === 'ASM-4106-s2_l1')
if (jamesL1) {
  jamesL1.status = 'overdue'
  jamesL1.signOff = { signed: false }
  jamesL1.submittedAt = undefined
  jamesL1.dueAt = rel(-4, 18)
  jamesL1.scores = jamesL1.scores.map(s => ({ ...s, interviewerConfirmed: false }))
}

// Kavya's L2 is drafted by AI and waiting on Arjun's review and sign-off.
const kavyaL2 = ASSESSMENTS.find(a => a.id === 'ASM-4103-s_l2')
if (kavyaL2) {
  kavyaL2.status = 'in_review'
  kavyaL2.signOff = { signed: false }
  kavyaL2.submittedAt = undefined
  kavyaL2.dueAt = rel(1, 18)
}

/**
 * A stage carries a score only once its scorecard is signed. Nothing counts
 * until a person signs it, so an unsigned level shows as still in progress —
 * which is exactly Kavya Nair's L2, sitting on Arjun Mehta's desk.
 */
for (const cand of CANDIDATES) {
  for (const prog of cand.stageProgress) {
    const a = ASSESSMENTS.find(x => x.candidateId === cand.id && x.stageKey === prog.stageKey)
    if (!a) continue
    if (a.status === 'submitted') {
      prog.score = Number(a.weightedAverage.toFixed(2))
      prog.decision = a.finalDecision ?? prog.decision
    } else if (prog.status === 'completed') {
      prog.status = 'in_progress'
      prog.score = undefined
      prog.decision = undefined
      prog.completedAt = undefined
    }
  }
}

export const assessmentById = (id: string) => ASSESSMENTS.find(a => a.id === id)
export const assessmentsForCandidate = (candidateId: string) =>
  ASSESSMENTS.filter(a => a.candidateId === candidateId)
export const assessmentFor = (candidateId: string, stageKey: string) =>
  ASSESSMENTS.find(a => a.candidateId === candidateId && a.stageKey === stageKey)

/* ── Reusable assessment templates ───────────────────────────────────── */

export const ASSESSMENT_TEMPLATES: import('./types').AssessmentTemplate[] = [
  {
    id: 'tpl_ias_core', name: 'IAS Core Competency Scorecard', format: 'Structured competency interview',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Candidate & interview context', fields: ["Candidate's Name", 'Interview Date', 'Current Organization', 'TA Partner Name', 'Role / Position & Band Applied for', 'Interviewer Name', 'Mode of Interview', 'Ex-employee check', 'Current Location', 'Highest Education College / Institute', 'Work Experience post Highest qualification', 'Business Segment / Function'] },
      { title: 'Competency assessment', fields: ['Competency Evaluated', 'Interview Rating (scale of 6, no decimals)', 'Competency Weightage (%)', 'Positives Observed', 'Negatives Observed', 'Weighted Average'] },
      { title: 'Handover & decision', fields: ['Inputs for Next Interviewer / Areas to be probed in next round', 'Overall Cultural Fitment', 'Rationale for Cultural Fitment', 'Overall Comments on Interview', "Candidate's reason for Job Change", 'Final Decision — Suitable / Not Suitable'] },
    ],
    mandatorySignOff: true, usageCount: 214,
  },
  {
    id: 'tpl_case', name: 'Case Study & Presentation', format: 'Case study',
    jobFamily: 'Any', band: ['B7', 'B8', 'B9', 'B10'], country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Case setup', fields: ['Case brief issued', 'Preparation time allowed', 'Panel members'] },
      { title: 'Assessment', fields: ['Problem framing', 'Analytical rigour', 'Commercial judgement', 'Structure of the recommendation', 'Response to challenge', 'Weighted Average'] },
      { title: 'Handover & decision', fields: ['Inputs for Next Interviewer', 'Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 61,
  },
  {
    id: 'tpl_culture', name: 'Culture & Values (Ideal Candidate Guide)', format: 'Culture and values assessment',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Traits', fields: ['Action Oriented', 'Autonomous', 'Displays Leadership', 'Honest', 'Detail oriented', 'Hard-Working', 'Passionate'] },
      { title: 'Fitment', fields: ['Overall Cultural Fitment (1–3)', 'Rationale for Cultural Fitment', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 138,
  },
  {
    id: 'tpl_leadership', name: 'Leadership Assessment', format: 'Leadership assessment',
    jobFamily: 'Any', band: ['B8', 'B9', 'B10'], country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Leadership competencies', fields: ['Strategic acumen', 'Planning abilities / Structured thinking', 'People management & Leadership Skills', 'Proactivity / initiative taking ability', 'Execution excellence / End-to-end ownership'] },
      { title: 'Decision', fields: ['Executive presence', 'Long-term potential', 'Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 47,
  },
  {
    id: 'tpl_panel', name: 'Panel Interview Consolidated Scorecard', format: 'Panel interview',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Panel', fields: ['Panel members', 'Chair', 'Competencies allocated per member'] },
      { title: 'Assessment', fields: ['Individual ratings', 'Consolidated rating', 'Divergence flag', 'Weighted Average'] },
      { title: 'Decision', fields: ['Panel discussion notes', 'Final Decision', 'Dissenting view (if any)'] },
    ],
    mandatorySignOff: true, usageCount: 29,
  },
  {
    id: 'tpl_written', name: 'Written / Technical Assessment', format: 'Written assessment',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Assessment', fields: ['Task issued', 'Time allowed', 'Submission link'] },
      { title: 'Marking', fields: ['Correctness', 'Approach', 'Communication', 'Weighted Average'] },
      { title: 'Decision', fields: ['Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 83,
  },
  {
    id: 'tpl_roleplay', name: 'Role Play — Customer Scenario', format: 'Role play',
    jobFamily: 'Sales', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Scenario', fields: ['Scenario issued', 'Role of assessor', 'Duration'] },
      { title: 'Assessment', fields: ['Discovery quality', 'Handling objection', 'Executive presence', 'Recovery under pressure', 'Weighted Average'] },
      { title: 'Decision', fields: ['Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 22,
  },
  {
    id: 'tpl_behav', name: 'Behavioural Interview (STAR)', format: 'Behavioural interview',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Competencies', fields: ['Situation / Task captured', 'Action described', 'Result quantified', 'Reflection'] },
      { title: 'Decision', fields: ['Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 156,
  },
  {
    id: 'tpl_func', name: 'Functional / Technical Deep Dive', format: 'Functional / technical interview',
    jobFamily: 'Any', band: 'Any', country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Technical scope', fields: ['Areas probed', 'Depth reached', 'Live exercise used'] },
      { title: 'Assessment', fields: ['Depth of knowledge', 'Diagnostic reasoning', 'Recency of hands-on work', 'Weighted Average'] },
      { title: 'Decision', fields: ['Inputs for Next Interviewer', 'Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 174,
  },
  {
    id: 'tpl_present', name: 'Presentation Assessment', format: 'Presentation',
    jobFamily: 'Any', band: ['B7', 'B8', 'B9', 'B10'], country: 'Any', ratingScaleId: 'ias_6',
    sections: [
      { title: 'Brief', fields: ['Topic issued', 'Preparation time', 'Audience'] },
      { title: 'Assessment', fields: ['Structure', 'Executive presence', 'Handling challenge', 'Clarity of recommendation', 'Weighted Average'] },
      { title: 'Decision', fields: ['Overall Comments', 'Final Decision'] },
    ],
    mandatorySignOff: true, usageCount: 38,
  },
]
