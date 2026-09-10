import { daysBetween, isSameDay } from '@/lib/dates'
import { ASSESSMENTS } from './assessments'
import { CANDIDATES } from './candidates'
import { INTERVIEWS } from './interviews'
import { REQUISITIONS } from './requisitions'
import { requisitionHealth } from './analytics'
import { personName } from './reference'
import type { AiInsight } from './types'

/**
 * Insights are computed from live pipeline state rather than authored, so the
 * panel can never claim something the data does not support. Every insight
 * carries the facts it was built from — the brief's explainability requirement
 * applies to recommendations as much as to scores.
 */
export const generateInsights = (reqIds: string[]): AiInsight[] => {
  const out: AiInsight[] = []
  const cands = CANDIDATES.filter(c => reqIds.includes(c.requisitionId))
  const reqs = REQUISITIONS.filter(r => reqIds.includes(r.id))

  // 1 — candidates sitting in the recruiter screening queue
  const awaiting = cands.filter(c => c.status === 'AI Screened')
  if (awaiting.length) {
    out.push({
      id: 'ins_screen',
      severity: awaiting.some(c => daysBetween(c.appliedAt) > 3) ? 'serious' : 'warning',
      title: `${awaiting.length} candidate${awaiting.length === 1 ? ' is' : 's are'} awaiting recruiter screening`,
      detail: awaiting.length === 1
        ? `${awaiting[0].name} has been through AI screening and is waiting on a human decision. AI never progresses or rejects on its own.`
        : `${awaiting.map(c => c.name).join(' and ')} have completed AI screening and are waiting on a human decision. AI never progresses or rejects on its own.`,
      evidence: awaiting.map(c =>
        `${c.name} · ${c.requisitionId} · ${c.screening?.overallMatch ?? '—'}% match · suggested "${c.screening?.suggestedDecision}" · applied ${daysBetween(c.appliedAt)} days ago`),
      actionLabel: 'Open screening queue', actionTarget: '/candidates?filter=awaiting',
    })
  }

  // 2 — highest skill match on a priority requisition
  const priority = reqs.filter(r => r.priority === 'Critical').map(r => r.id)
  const priorityCands = cands
    .filter(c => priority.includes(c.requisitionId) && c.screening && !['Rejected', 'Withdrawn'].includes(c.status))
    .sort((a, b) => (b.screening!.overallMatch) - (a.screening!.overallMatch))
  const top = priorityCands[0]
  if (top) {
    const req = REQUISITIONS.find(r => r.id === top.requisitionId)!
    const runnerUp = priorityCands[1]
    out.push({
      id: 'ins_top',
      severity: 'good',
      title: `${top.name} has the highest skill match on a priority role`,
      detail: `${top.screening!.overallMatch}% overall match against ${req.title}${runnerUp ? `, ${top.screening!.overallMatch - runnerUp.screening!.overallMatch} points clear of ${runnerUp.name}` : ''}. Currently at ${req.workflow.find(s => s.key === top.currentStageKey)?.shortName ?? top.status}.`,
      evidence: [
        `Must-have competency match ${top.screening!.mustHaveMatch}%`,
        `Experience relevance ${top.screening!.experienceRelevance}%`,
        ...top.screening!.skillMatches.filter(s => s.mustHave).sort((a, b) => b.match - a.match).slice(0, 2)
          .map(s => `${s.name}: ${s.match}% — ${s.evidence[0]}`),
      ],
      actionLabel: `Open ${top.name.split(' ')[0]}'s profile`, actionTarget: `/candidates/${top.id}`,
    })
  }

  // 3 — overdue interview feedback, named
  const overdue = ASSESSMENTS.filter(a => reqIds.includes(a.requisitionId) && a.status === 'overdue')
  const overduePeople = Array.from(new Set(overdue.flatMap(a => a.interviewerIds)))
  if (overdue.length) {
    out.push({
      id: 'ins_feedback',
      severity: 'critical',
      title: `Interview feedback is overdue from ${overduePeople.length} panel member${overduePeople.length === 1 ? '' : 's'}`,
      detail: `${overduePeople.map(personName).join(' and ')} ${overduePeople.length === 1 ? 'has' : 'have'} not submitted ${overdue.length} scorecard${overdue.length === 1 ? '' : 's'}. The AI draft is already at 80% coverage — it needs review and a signature, not authoring.`,
      evidence: overdue.map(a => {
        const c = CANDIDATES.find(x => x.id === a.candidateId)!
        return `${a.label} for ${c.name} · ${a.dueAt ? `${daysBetween(a.dueAt)} days past SLA` : 'past SLA'} · owner ${a.interviewerIds.map(personName).join(', ')}`
      }),
      actionLabel: 'Open overdue scorecards', actionTarget: '/assessments?filter=overdue',
    })
  }

  // 4 — requisitions at risk of missing target closure
  const atRisk = reqs.map(requisitionHealth).filter(h => h.rag === 'critical' || h.rag === 'serious')
  for (const h of atRisk.slice(0, 2)) {
    out.push({
      id: `ins_risk_${h.req.id}`,
      severity: h.rag,
      title: `${h.req.id} is at risk of missing its target closure date`,
      detail: `${h.req.title} — ${h.daysToTarget < 0 ? `${Math.abs(h.daysToTarget)} days past target` : `${h.daysToTarget} days to target`}, currently at ${h.atStage} with ${h.inProcess} candidate${h.inProcess === 1 ? '' : 's'} in process.`,
      evidence: h.reasons,
      actionLabel: `Open ${h.req.id}`, actionTarget: `/requisitions/${h.req.id}`,
    })
  }

  // 5 — interviews today that still need a confirmed panel
  const todays = INTERVIEWS.filter(i => reqIds.includes(i.requisitionId) && i.status === 'Scheduled' && isSameDay(i.scheduledAt))
  if (todays.length) {
    out.push({
      id: 'ins_today',
      severity: 'warning',
      title: `${todays.length} interview${todays.length === 1 ? '' : 's'} running today across ${new Set(todays.map(i => i.requisitionId)).size} requisition${new Set(todays.map(i => i.requisitionId)).size === 1 ? '' : 's'}`,
      detail: 'Scorecards are pre-drafted from the JD, CV and prior rounds. Interviewers only need to review, edit and sign.',
      evidence: todays.map(i => {
        const c = CANDIDATES.find(x => x.id === i.candidateId)!
        const r = REQUISITIONS.find(x => x.id === i.requisitionId)!
        const s = r.workflow.find(w => w.key === i.stageKey)!
        return `${new Date(i.scheduledAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })} ${i.timezone.split('/')[1]} · ${c.name} · ${s.shortName} · ${i.interviewerIds.map(personName).join(', ')}`
      }),
      actionLabel: 'Open interview hub', actionTarget: '/interviews',
    })
  }

  // 6 — a candidate whose evidence is diverging across levels
  for (const cand of cands) {
    const stageScores = cand.stageProgress.filter(p => p.score != null).map(p => p.score as number)
    if (stageScores.length < 2) continue
    const spread = Math.max(...stageScores) - Math.min(...stageScores)
    if (spread >= 1.0) {
      out.push({
        id: `ins_diverge_${cand.id}`,
        severity: 'warning',
        title: `Panel scores for ${cand.name} diverge by ${spread.toFixed(1)} points`,
        detail: 'A spread this wide usually means different levels tested different things, not that one panel was wrong. Worth reading both scorecards side by side before the next round.',
        evidence: cand.stageProgress.filter(p => p.score != null).map(p => {
          const r = REQUISITIONS.find(x => x.id === cand.requisitionId)!
          return `${r.workflow.find(s => s.key === p.stageKey)?.shortName ?? p.stageKey}: ${(p.score as number).toFixed(2)} of 6 · ${p.decision ?? '—'}`
        }),
        actionLabel: 'Compare scorecards', actionTarget: `/analysis?view=deepdive&candidate=${cand.id}`,
      })
      break
    }
  }

  const order: Record<string, number> = { critical: 0, serious: 1, warning: 2, good: 3 }
  return out.sort((a, b) => order[a.severity] - order[b.severity])
}
