import React, { createContext, useContext, useMemo, useReducer, useCallback } from 'react'
import {
  ACTIVITY, ASSESSMENTS, AUDIT, CANDIDATES, DOCUMENT_REQUESTS, INTERVIEWS,
  PORTAL_MESSAGES, REQUISITIONS, TASKS, weightedAverage,
} from '@/data'
import type {
  ActivityItem, Assessment, AuditEvent, Candidate, Competency, CulturalFitment,
  DocumentRequest, GlobalFilters, IasDecision, Interview, PortalMessage,
  Requisition, Role, TaskItem, WorkflowStage,
} from '@/data/types'

export interface Toast { id: string; kind: 'success' | 'info' | 'warning'; title: string; detail?: string }

interface State {
  role: Role
  currentUserId: string
  /** The candidate whose portal is shown when viewing as a candidate. */
  portalCandidateId: string
  filters: GlobalFilters
  requisitions: Requisition[]
  candidates: Candidate[]
  interviews: Interview[]
  assessments: Assessment[]
  activity: ActivityItem[]
  tasks: TaskItem[]
  audit: AuditEvent[]
  messages: PortalMessage[]
  documents: DocumentRequest[]
  toasts: Toast[]
}

const DEFAULT_FILTERS: GlobalFilters = {
  country: 'all', businessUnit: 'all', hiringManagerId: 'all',
  recruiterId: 'all', requisitionId: 'all', band: 'all', dateRange: '90d',
}

const USER_FOR_ROLE: Record<Role, string> = {
  ta_admin: 'u_priya', hiring_manager: 'u_arjun', leadership: 'u_nadia', candidate: 'CAN-4101',
}

const initialState: State = {
  role: 'ta_admin',
  currentUserId: 'u_priya',
  portalCandidateId: 'CAN-4101',
  filters: DEFAULT_FILTERS,
  requisitions: structuredClone(REQUISITIONS),
  candidates: structuredClone(CANDIDATES),
  interviews: structuredClone(INTERVIEWS),
  assessments: structuredClone(ASSESSMENTS),
  activity: structuredClone(ACTIVITY),
  tasks: structuredClone(TASKS),
  audit: structuredClone(AUDIT),
  messages: structuredClone(PORTAL_MESSAGES),
  documents: structuredClone(DOCUMENT_REQUESTS),
  toasts: [],
}

type Action =
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_FILTERS'; filters: Partial<GlobalFilters> }
  | { type: 'RESET_FILTERS' }
  | { type: 'SCREEN_DECISION'; candidateId: string; decision: 'Progress' | 'Hold' | 'Reject' | 'Request Info'; reason?: string }
  | { type: 'ADD_NOTE'; candidateId: string; text: string }
  | { type: 'ASSIGN_HM'; candidateId: string; personId: string }
  | { type: 'SCORE_ROW'; assessmentId: string; competencyId: string; patch: { rating?: number | null; positives?: string; negatives?: string } }
  | { type: 'ACCEPT_AI'; assessmentId: string; competencyId?: string }
  | { type: 'ASSESSMENT_FIELD'; assessmentId: string; patch: Partial<Pick<Assessment, 'culturalFitment' | 'culturalRationale' | 'inputsForNextInterviewer' | 'overallComments' | 'reasonForJobChange' | 'finalDecision'>> }
  | { type: 'SIGN_OFF'; assessmentId: string }
  | { type: 'UPDATE_COMPETENCY'; reqId: string; competencyId: string; patch: Partial<Competency> }
  | { type: 'ADD_COMPETENCY'; reqId: string; competency: Competency }
  | { type: 'REMOVE_COMPETENCY'; reqId: string; competencyId: string }
  | { type: 'NORMALISE_WEIGHTS'; reqId: string }
  | { type: 'APPROVE_FRAMEWORK'; reqId: string }
  | { type: 'ADD_STAGE'; reqId: string; after: string }
  | { type: 'REMOVE_STAGE'; reqId: string; stageKey: string }
  | { type: 'UPDATE_STAGE'; reqId: string; stageKey: string; patch: Partial<WorkflowStage> }
  | { type: 'TOGGLE_TASK'; taskId: string }
  | { type: 'RESCHEDULE'; interviewId: string; iso: string }
  | { type: 'COMPLETE_INTERVIEW'; interviewId: string }
  | { type: 'SUBMIT_APPLICATION'; candidate: Candidate }
  | { type: 'READ_MESSAGE'; id: string }
  | { type: 'UPLOAD_DOC'; id: string }
  | { type: 'TOAST'; toast: Omit<Toast, 'id'> }
  | { type: 'DISMISS_TOAST'; id: string }

let seq = 0
const uid = (p: string) => `${p}_${Date.now().toString(36)}_${++seq}`

const audit = (
  s: State, action: string, entity: string, entityId: string, detail: string, humanDecision = true,
): AuditEvent => ({
  id: uid('ev'), at: new Date().toISOString(), actorId: s.currentUserId,
  actorRole: s.role, action, entity, entityId, detail, humanDecision,
})

const activityOf = (s: State, kind: ActivityItem['kind'], text: string, extra: Partial<ActivityItem> = {}): ActivityItem => ({
  id: uid('a'), at: new Date().toISOString(), actorId: s.currentUserId, kind, text, ...extra,
})

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_ROLE':
      return { ...s, role: a.role, currentUserId: USER_FOR_ROLE[a.role] }

    case 'SET_FILTERS':
      return { ...s, filters: { ...s.filters, ...a.filters } }

    case 'RESET_FILTERS':
      return { ...s, filters: DEFAULT_FILTERS }

    case 'SCREEN_DECISION': {
      const cand = s.candidates.find(c => c.id === a.candidateId)
      if (!cand) return s
      const req = s.requisitions.find(r => r.id === cand.requisitionId)!
      const firstInterview = req.workflow.find(w => w.type === 'interview')!

      const next: Partial<Candidate> =
        a.decision === 'Progress'
          ? { status: 'Shortlisted', currentStageKey: firstInterview.key }
          : a.decision === 'Hold'
            ? { status: 'On Hold', onHoldReason: a.reason }
            : a.decision === 'Reject'
              ? { status: 'Rejected', rejectionReason: a.reason }
              : { status: 'Recruiter Review' }

      const label = a.decision === 'Request Info' ? 'more information requested from' : `${a.decision.toLowerCase()}ed`
      const suggested = cand.screening?.suggestedDecision
      const overrode = suggested && suggested !== 'Recruiter Review Required'
        && ((a.decision === 'Progress' && suggested !== 'Progress') || (a.decision === 'Reject' && suggested !== 'Reject'))

      return {
        ...s,
        candidates: s.candidates.map(c => (c.id === a.candidateId ? { ...c, ...next } : c)),
        activity: [activityOf(s, 'decision', `${label} ${cand.name} on ${cand.requisitionId}${a.reason ? ` — ${a.reason}` : ''}`, { candidateId: cand.id, requisitionId: cand.requisitionId }), ...s.activity],
        audit: [audit(s, 'Screening decision', 'Candidate', cand.id,
          `Recruiter decision: ${a.decision}${a.reason ? ` (${a.reason})` : ''}. AI suggested "${suggested ?? 'none'}".${overrode ? ' Human decision differs from the AI suggestion.' : ''}`), ...s.audit],
        tasks: s.tasks.map(t => (t.candidateId === a.candidateId && t.kind === 'screening' ? { ...t, done: true } : t)),
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: `${cand.name} — ${a.decision}`, detail: 'Decision recorded against your name in the audit trail.' }],
      }
    }

    case 'ADD_NOTE': {
      const cand = s.candidates.find(c => c.id === a.candidateId)
      if (!cand) return s
      return {
        ...s,
        candidates: s.candidates.map(c => c.id === a.candidateId
          ? { ...c, recruiterNotes: [{ id: uid('n'), authorId: s.currentUserId, at: new Date().toISOString(), text: a.text }, ...c.recruiterNotes] }
          : c),
        audit: [audit(s, 'Note added', 'Candidate', a.candidateId, a.text.slice(0, 160), false), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'info', title: 'Note saved' }],
      }
    }

    case 'ASSIGN_HM': {
      const cand = s.candidates.find(c => c.id === a.candidateId)
      if (!cand) return s
      return {
        ...s,
        audit: [audit(s, 'Assigned to hiring manager', 'Candidate', a.candidateId, `Assigned to ${a.personId}`), ...s.audit],
        activity: [activityOf(s, 'decision', `assigned ${cand.name} to a hiring manager for review`, { candidateId: cand.id }), ...s.activity],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Assigned', detail: `${cand.name} sent for hiring-manager review.` }],
      }
    }

    case 'SCORE_ROW': {
      return {
        ...s,
        assessments: s.assessments.map(asm => {
          if (asm.id !== a.assessmentId) return asm
          const scores = asm.scores.map(row =>
            row.competencyId === a.competencyId
              ? { ...row, ...a.patch, interviewerConfirmed: true }
              : row)
          return { ...asm, scores, weightedAverage: weightedAverage(scores), status: asm.status === 'ai_draft' ? 'in_review' : asm.status }
        }),
      }
    }

    case 'ACCEPT_AI': {
      const asm = s.assessments.find(x => x.id === a.assessmentId)
      if (!asm) return s
      const scores = asm.scores.map(row => {
        if (a.competencyId && row.competencyId !== a.competencyId) return row
        if (!row.aiSuggested) return row
        return {
          ...row,
          rating: row.aiSuggested.rating,
          positives: row.aiSuggested.positives,
          negatives: row.aiSuggested.negatives,
          interviewerConfirmed: true,
        }
      })
      return {
        ...s,
        assessments: s.assessments.map(x => x.id === a.assessmentId
          ? { ...x, scores, weightedAverage: weightedAverage(scores), status: x.status === 'ai_draft' ? 'in_review' : x.status }
          : x),
        audit: [audit(s, 'AI suggestion accepted', 'Assessment', a.assessmentId,
          a.competencyId ? `Accepted the AI draft for one competency row.` : `Accepted the AI draft for all ${scores.length} competency rows. Interviewer review still required before sign-off.`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'info', title: a.competencyId ? 'AI row accepted' : 'AI draft accepted', detail: 'Now marked as interviewer-confirmed. Sign-off is still required.' }],
      }
    }

    case 'ASSESSMENT_FIELD':
      return {
        ...s,
        assessments: s.assessments.map(x => x.id === a.assessmentId
          ? { ...x, ...a.patch, status: x.status === 'ai_draft' ? 'in_review' : x.status } : x),
      }

    case 'SIGN_OFF': {
      const asm = s.assessments.find(x => x.id === a.assessmentId)
      if (!asm) return s
      const cand = s.candidates.find(c => c.id === asm.candidateId)
      const unrated = asm.scores.filter(r => r.rating == null).length
      if (unrated > 0 || !asm.finalDecision || asm.culturalFitment == null) {
        return {
          ...s,
          toasts: [...s.toasts, { id: uid('t'), kind: 'warning', title: 'Cannot sign off yet', detail: `${unrated ? `${unrated} competency row${unrated === 1 ? '' : 's'} unrated. ` : ''}${!asm.finalDecision ? 'Final decision required. ' : ''}${asm.culturalFitment == null ? 'Cultural fitment required.' : ''}` }],
        }
      }
      const edited = asm.scores.filter(r => r.aiSuggested && r.rating !== r.aiSuggested.rating).length
      return {
        ...s,
        assessments: s.assessments.map(x => x.id === a.assessmentId
          ? { ...x, status: 'submitted', submittedAt: new Date().toISOString(), signOff: { signed: true, byId: s.currentUserId, at: new Date().toISOString() } }
          : x),
        candidates: s.candidates.map(c => c.id === asm.candidateId
          ? {
            ...c,
            stageProgress: c.stageProgress.map(p => p.stageKey === asm.stageKey
              ? { ...p, status: 'completed', completedAt: new Date().toISOString(), score: asm.weightedAverage, decision: asm.finalDecision as IasDecision }
              : p),
          }
          : c),
        tasks: s.tasks.map(t => (t.candidateId === asm.candidateId && t.kind === 'feedback' ? { ...t, done: true } : t)),
        activity: [activityOf(s, 'assessment', `signed off ${asm.label} for ${cand?.name} — ${asm.weightedAverage.toFixed(2)} weighted, ${asm.finalDecision}`, { candidateId: asm.candidateId, requisitionId: asm.requisitionId }), ...s.activity],
        audit: [audit(s, 'Assessment signed off', 'Assessment', asm.id,
          `Weighted average ${asm.weightedAverage.toFixed(2)} of 6. Decision: ${asm.finalDecision}. Interviewer edited ${edited} of ${asm.scores.length} AI-suggested ratings before signing.`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Assessment submitted', detail: `${asm.label} signed off at ${asm.weightedAverage.toFixed(2)} of 6.` }],
      }
    }

    case 'UPDATE_COMPETENCY':
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id !== a.reqId ? r : {
          ...r,
          competencies: r.competencies.map(c => c.id === a.competencyId
            ? { ...c, ...a.patch, source: 'human' as const, editedBy: s.currentUserId, editedAt: new Date().toISOString() }
            : c),
        }),
        audit: [audit(s, 'Competency edited', 'Requisition', a.reqId,
          `${a.competencyId}: ${Object.entries(a.patch).map(([k, v]) => `${k} → ${String(v).slice(0, 40)}`).join(', ')}`), ...s.audit],
      }

    case 'ADD_COMPETENCY':
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id === a.reqId ? { ...r, competencies: [...r.competencies, a.competency] } : r),
        audit: [audit(s, 'Competency added', 'Requisition', a.reqId, `Added "${a.competency.name}" at ${Math.round(a.competency.weight * 100)}% weight`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Competency added', detail: 'Remember to re-normalise weights to 100%.' }],
      }

    case 'REMOVE_COMPETENCY':
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id === a.reqId
          ? { ...r, competencies: r.competencies.filter(c => c.id !== a.competencyId) } : r),
        audit: [audit(s, 'Competency removed', 'Requisition', a.reqId, `Removed ${a.competencyId}`), ...s.audit],
      }

    case 'NORMALISE_WEIGHTS': {
      const req = s.requisitions.find(r => r.id === a.reqId)
      if (!req) return s
      const total = req.competencies.reduce((x, c) => x + c.weight, 0) || 1
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id !== a.reqId ? r : {
          ...r, competencies: r.competencies.map(c => ({ ...c, weight: Math.round((c.weight / total) * 1000) / 1000 })),
        }),
        toasts: [...s.toasts, { id: uid('t'), kind: 'info', title: 'Weights normalised to 100%' }],
      }
    }

    case 'APPROVE_FRAMEWORK': {
      const req = s.requisitions.find(r => r.id === a.reqId)
      if (!req) return s
      const total = req.competencies.reduce((x, c) => x + c.weight, 0)
      if (Math.abs(total - 1) > 0.005) {
        return { ...s, toasts: [...s.toasts, { id: uid('t'), kind: 'warning', title: 'Weights must total 100%', detail: `Currently ${(total * 100).toFixed(1)}%. Normalise before approving.` }] }
      }
      return {
        ...s,
        activity: [activityOf(s, 'system', `approved the competency framework for ${a.reqId} and saved it to the repository`, { requisitionId: a.reqId }), ...s.activity],
        audit: [audit(s, 'Framework approved', 'Requisition', a.reqId, `${req.competencies.length} competencies approved and saved as a reusable template. Weights total 100%.`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Framework approved', detail: 'Saved to the competency repository and reusable across requisitions.' }],
      }
    }

    case 'ADD_STAGE': {
      const req = s.requisitions.find(r => r.id === a.reqId)
      if (!req) return s
      const after = req.workflow.find(w => w.key === a.after)!
      const levelCount = req.workflow.filter(w => w.type === 'interview').length + 1
      const key = `${req.id.toLowerCase().replace('-', '_')}_lvl${levelCount}_${Date.now().toString(36).slice(-4)}`
      const stage: WorkflowStage = {
        key, order: after.order + 0.5,
        name: `Interview Level ${levelCount} · New Stage`, shortName: `L${levelCount} New`,
        type: 'interview',
        objective: 'Describe what this stage is for and what it must establish.',
        interviewerIds: [req.hiringManagerId],
        competencyIds: req.competencies.slice(0, 2).map(c => c.id),
        durationMins: 45, format: 'Structured competency interview', slaDays: 3,
      }
      const workflow = [...req.workflow, stage]
        .sort((x, y) => x.order - y.order)
        .map((w, i) => ({ ...w, order: i + 1 }))
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id === a.reqId ? { ...r, workflow } : r),
        audit: [audit(s, 'Workflow modified', 'Requisition', a.reqId, `Added ${stage.name}. A matching assessment level is generated for every in-process candidate.`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Interview level added', detail: 'A matching assessment level was generated automatically.' }],
      }
    }

    case 'REMOVE_STAGE': {
      const req = s.requisitions.find(r => r.id === a.reqId)
      if (!req) return s
      const stage = req.workflow.find(w => w.key === a.stageKey)
      const inUse = s.candidates.some(c => c.requisitionId === a.reqId
        && c.stageProgress.some(p => p.stageKey === a.stageKey && p.status !== 'not_started'))
      if (inUse) {
        return { ...s, toasts: [...s.toasts, { id: uid('t'), kind: 'warning', title: 'Stage is in use', detail: 'Candidates have already been assessed at this level. Removing it would orphan their scorecards.' }] }
      }
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id !== a.reqId ? r : {
          ...r, workflow: r.workflow.filter(w => w.key !== a.stageKey).map((w, i) => ({ ...w, order: i + 1 })),
        }),
        audit: [audit(s, 'Workflow modified', 'Requisition', a.reqId, `Removed ${stage?.name ?? a.stageKey}`), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'info', title: 'Interview level removed' }],
      }
    }

    case 'UPDATE_STAGE':
      return {
        ...s,
        requisitions: s.requisitions.map(r => r.id !== a.reqId ? r : {
          ...r, workflow: r.workflow.map(w => w.key === a.stageKey ? { ...w, ...a.patch } : w),
        }),
        audit: [audit(s, 'Stage configuration changed', 'Requisition', a.reqId,
          `${a.stageKey}: ${Object.keys(a.patch).join(', ')} updated`), ...s.audit],
      }

    case 'TOGGLE_TASK':
      return { ...s, tasks: s.tasks.map(t => t.id === a.taskId ? { ...t, done: !t.done } : t) }

    case 'RESCHEDULE': {
      const iv = s.interviews.find(i => i.id === a.interviewId)
      if (!iv) return s
      const cand = s.candidates.find(c => c.id === iv.candidateId)
      return {
        ...s,
        interviews: s.interviews.map(i => i.id === a.interviewId ? { ...i, scheduledAt: a.iso } : i),
        audit: [audit(s, 'Interview rescheduled', 'Interview', a.interviewId, `Moved to ${new Date(a.iso).toISOString()} (${iv.timezone})`), ...s.audit],
        activity: [activityOf(s, 'interview', `rescheduled the ${iv.stageKey} interview with ${cand?.name}`, { candidateId: iv.candidateId }), ...s.activity],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Interview rescheduled', detail: 'Invite and reminder emails have been re-issued to all participants.' }],
      }
    }

    case 'COMPLETE_INTERVIEW': {
      const iv = s.interviews.find(i => i.id === a.interviewId)
      if (!iv) return s
      return {
        ...s,
        interviews: s.interviews.map(i => i.id === a.interviewId ? { ...i, status: 'Completed', recordingAvailable: true } : i),
        assessments: s.assessments.map(x => x.interviewId === a.interviewId && x.status === 'ai_draft' ? { ...x, status: 'in_review' } : x),
        audit: [audit(s, 'Interview completed', 'Interview', a.interviewId, 'Recording and transcript retained. AI scorecard draft generated for interviewer review.', false), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Interview ended', detail: 'AI has drafted the scorecard. It needs your review and signature.' }],
      }
    }

    case 'SUBMIT_APPLICATION':
      return {
        ...s,
        candidates: [a.candidate, ...s.candidates],
        activity: [activityOf(s, 'application', `received an application from ${a.candidate.name} for ${a.candidate.requisitionId}`, { candidateId: a.candidate.id, requisitionId: a.candidate.requisitionId }), ...s.activity],
        audit: [audit(s, 'Application submitted', 'Candidate', a.candidate.id, `Consent recorded against privacy policy ${a.candidate.consent.policyVersion} with a ${a.candidate.consent.dataRetentionMonths}-month retention period.`, false), ...s.audit],
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Application submitted', detail: 'You will hear from the talent team within three working days.' }],
      }

    case 'READ_MESSAGE':
      return { ...s, messages: s.messages.map(m => m.id === a.id ? { ...m, read: true } : m) }

    case 'UPLOAD_DOC':
      return {
        ...s,
        documents: s.documents.map(d => d.id === a.id ? { ...d, status: 'uploaded' } : d),
        toasts: [...s.toasts, { id: uid('t'), kind: 'success', title: 'Document uploaded', detail: 'The talent team will verify it shortly.' }],
      }

    case 'TOAST':
      return { ...s, toasts: [...s.toasts, { ...a.toast, id: uid('t') }] }

    case 'DISMISS_TOAST':
      return { ...s, toasts: s.toasts.filter(t => t.id !== a.id) }

    default:
      return s
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null)

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useApp = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}

/** Requisitions surviving the current global filter set. */
export const useFilteredReqs = () => {
  const { state } = useApp()
  const { filters, requisitions } = state
  return useMemo(() => requisitions.filter(r =>
    (filters.country === 'all' || r.country === filters.country)
    && (filters.businessUnit === 'all' || r.businessUnit === filters.businessUnit)
    && (filters.hiringManagerId === 'all' || r.hiringManagerId === filters.hiringManagerId)
    && (filters.recruiterId === 'all' || r.recruiterId === filters.recruiterId)
    && (filters.requisitionId === 'all' || r.id === filters.requisitionId)
    && (filters.band === 'all' || r.band === filters.band)), [requisitions, filters])
}

export const useToast = () => {
  const { dispatch } = useApp()
  return useCallback((toast: Omit<Toast, 'id'>) => dispatch({ type: 'TOAST', toast }), [dispatch])
}
