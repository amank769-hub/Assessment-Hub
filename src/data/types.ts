/**
 * Nexora AI — domain model.
 *
 * The assessment vocabulary here is lifted from the Interview Assessment Sheet
 * (IAS v3.1) supplied with the brief: a 1–6 interview rating legend, weighted
 * competency scoring, a 1–3 cultural-fitment scale, per-level interviewer
 * sheets and an "Overall Summary" rollup that averages every level and tracks
 * the ageing between interviews. Nothing about the number of levels is fixed —
 * a requisition declares its own workflow and the interviews, assessments and
 * summaries are generated from it.
 */

export type Role = 'ta_admin' | 'hiring_manager' | 'candidate' | 'leadership'

export type CountryCode = 'IN' | 'SG' | 'AE' | 'GB' | 'US' | 'DE'

export interface Country {
  code: CountryCode
  name: string
  flag: string
  timezone: string
  utcOffset: string
  /** Diversity reporting is jurisdiction-gated; several countries forbid it. */
  diversityReportingPermitted: boolean
}

export type BusinessUnit =
  | 'REL/DCG' | 'SMB' | 'Consumer' | 'Marketing' | 'Finance'
  | 'Integrated Operations' | 'HR' | 'Technology'

export type Band = 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10'

export type JobFamily =
  | 'Sales' | 'Engineering' | 'Marketing' | 'Finance'
  | 'Operations' | 'Human Resources' | 'Product'

export interface Person {
  id: string
  name: string
  initials: string
  title: string
  role: Role
  email: string
  businessUnit: BusinessUnit
  country: CountryCode
  /** Deterministic avatar tint drawn from the brand chrome, not the series palette. */
  tint: string
}

/* ── Competency framework ─────────────────────────────────────────────── */

export type CompetencyCategory =
  | 'Technical'
  | 'Functional'
  | 'Behavioural'
  | 'Leadership'
  | 'Domain'
  | 'Culture & Values'

export type AssessmentMethod =
  | 'Structured competency interview'
  | 'Functional / technical interview'
  | 'Case study'
  | 'Presentation'
  | 'Role play'
  | 'Written assessment'
  | 'Leadership assessment'
  | 'Behavioural interview'
  | 'Panel interview'
  | 'Culture and values assessment'

export interface Competency {
  id: string
  name: string
  category: CompetencyCategory
  /** Target proficiency on the IAS 1–6 scale. */
  requiredProficiency: number
  /** 0–1. Weights across a requisition's framework sum to 1, as in the IAS. */
  weight: number
  mustHave: boolean
  /** AI's read on whether a gap here can be closed on the job. */
  criticality: 'Critical' | 'Trainable'
  evidenceToLookFor: string
  suggestedQuestions: string[]
  assessmentMethod: AssessmentMethod
  /** Workflow stage key where this competency is assessed. */
  assessAtStage: string
  /** Provenance — AI extraction vs. a human edit. Drives the "AI suggested" chip. */
  source: 'ai' | 'human' | 'repository'
  aiConfidence?: number
  aiRationale?: string
  editedBy?: string
  editedAt?: string
}

export interface CompetencyTemplate {
  id: string
  name: string
  jobFamily: JobFamily
  band: Band[]
  country: CountryCode[]
  businessUnit: BusinessUnit
  competencies: Competency[]
  approvedBy?: string
  approvedAt?: string
  usageCount: number
}

/* ── Requisition & workflow ───────────────────────────────────────────── */

export type StageType =
  | 'application' | 'ai_screening' | 'recruiter_screen'
  | 'interview' | 'assessment' | 'offer' | 'hired'

export interface WorkflowStage {
  /** Stable key referenced by competencies, interviews and assessments. */
  key: string
  order: number
  name: string
  shortName: string
  type: StageType
  objective: string
  interviewerIds: string[]
  competencyIds: string[]
  durationMins: number
  format: AssessmentMethod
  /** SLA in days — feeds stage-ageing and at-risk detection. */
  slaDays: number
}

export type ReqStatus = 'Open' | 'In Interview' | 'Offer Stage' | 'On Hold' | 'Closed'
export type RagStatus = 'good' | 'warning' | 'serious' | 'critical'

export interface Requisition {
  id: string
  title: string
  country: CountryCode
  location: string
  businessUnit: BusinessUnit
  jobFamily: JobFamily
  band: Band
  hiringManagerId: string
  recruiterId: string
  panelIds: string[]
  openDate: string
  targetCloseDate: string
  status: ReqStatus
  priority: 'Critical' | 'High' | 'Standard'
  openings: number
  roleOverview: string
  jobDescription: string
  responsibilities: string[]
  minimumQualifications: string[]
  preferredQualifications: string[]
  workflow: WorkflowStage[]
  competencies: Competency[]
  /** Highlights shown on the external candidate-facing job page. */
  highlights: string[]
  salaryRange: string
  templateId?: string
}

/* ── Candidates ───────────────────────────────────────────────────────── */

export type CandidateStatus =
  | 'Applied' | 'AI Screened' | 'Recruiter Review' | 'Shortlisted'
  | 'In Interview' | 'In Assessment' | 'Offer Recommended'
  | 'Hired' | 'On Hold' | 'Rejected' | 'Withdrawn'

export type ScreenDecision = 'Progress' | 'Hold' | 'Reject' | 'Recruiter Review Required'

export interface WorkHistory {
  company: string
  title: string
  from: string
  to: string
  location: string
  highlights: string[]
}

export interface Education {
  institute: string
  qualification: string
  year: string
}

export interface SkillMatch {
  competencyId: string
  name: string
  category: CompetencyCategory
  mustHave: boolean
  /** 0–100 evidence-weighted match from the CV and application. */
  match: number
  /** Verbatim CV/application lines the score was built from — the "show your working". */
  evidence: string[]
}

export interface AiScreening {
  overallMatch: number
  mustHaveMatch: number
  niceToHaveMatch: number
  experienceRelevance: number
  domainMatch: number
  locationFit: number
  skillMatches: SkillMatch[]
  competencyEvidenceSummary: string
  strengths: string[]
  risks: string[]
  suggestedDecision: ScreenDecision
  /** Every suggestion carries its reasoning; nothing is a black box. */
  rationale: string
  recommendedQuestions: string[]
  duplicateCheck: { status: 'clear' | 'possible' | 'confirmed'; note: string }
  screenedAt: string
  modelVersion: string
}

export interface StageProgress {
  stageKey: string
  status: 'not_started' | 'scheduled' | 'in_progress' | 'completed' | 'skipped'
  enteredAt?: string
  completedAt?: string
  /** Weighted average on the IAS 1–6 scale. */
  score?: number
  decision?: IasDecision
}

export interface Candidate {
  id: string
  requisitionId: string
  name: string
  initials: string
  tint: string
  email: string
  phone: string
  currentTitle: string
  currentOrganization: string
  isExEmployee: boolean
  location: string
  country: CountryCode
  totalExperienceYears: number
  experiencePostQualification: number
  education: Education[]
  workHistory: WorkHistory[]
  skills: string[]
  source: 'Careers Site' | 'LinkedIn' | 'Referral' | 'Agency' | 'Internal' | 'Job Board'
  appliedAt: string
  noticePeriodDays: number
  currentSalary: string
  expectedSalary: string
  workAuthorisation: string
  reasonForChange: string
  status: CandidateStatus
  currentStageKey: string
  stageProgress: StageProgress[]
  screening?: AiScreening
  /** Consent is explicit, versioned and revocable — surfaced in the portal. */
  consent: { given: boolean; at: string; policyVersion: string; dataRetentionMonths: number }
  cvFileName: string
  cvSummary: string
  /** Demographic fields are only ever populated where the country permits it. */
  diversity?: { gender?: string; selfIdentified: boolean }
  recruiterNotes: { id: string; authorId: string; at: string; text: string }[]
  onHoldReason?: string
  rejectionReason?: string
}

/* ── Interviews ───────────────────────────────────────────────────────── */

export type InterviewMode = 'Video Conference' | 'Telephonic' | 'In person at office'
export type InterviewStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'No Show'

export interface TranscriptLine {
  id: string
  at: number
  speaker: 'interviewer' | 'candidate'
  speakerName: string
  text: string
  /** Competency this line was tagged against by the live coverage model. */
  competencyId?: string
  /** Marked as usable evidence for a scorecard. */
  isEvidence?: boolean
}

export interface AiInterviewSummary {
  headline: string
  summary: string
  evidenceByCompetency: {
    competencyId: string
    name: string
    suggestedRating: number
    evidence: string[]
    confidence: number
  }[]
  strengths: string[]
  concerns: string[]
  followUpForNextRound: string[]
  coveragePct: number
  uncoveredCompetencyIds: string[]
  talkRatio: { interviewer: number; candidate: number }
  generatedAt: string
}

export interface Interview {
  id: string
  requisitionId: string
  candidateId: string
  stageKey: string
  scheduledAt: string
  timezone: string
  durationMins: number
  mode: InterviewMode
  interviewerIds: string[]
  status: InterviewStatus
  meetingLink: string
  recordingAvailable: boolean
  transcript: TranscriptLine[]
  aiSummary?: AiInterviewSummary
  feedbackStatus: 'not_started' | 'draft' | 'submitted' | 'overdue'
  feedbackDueAt?: string
  chat: { id: string; authorId: string; at: number; text: string }[]
}

/* ── Assessments — the IAS made dynamic ───────────────────────────────── */

export type IasDecision =
  | 'Good to Go - Found to be suitable'
  | 'Can be considered - on Hold'
  | 'Not Suitable for the Role'

/** IAS "Overall Cultural Fitment" dropdown, 1–3. */
export type CulturalFitment = 1 | 2 | 3

export interface CompetencyScore {
  competencyId: string
  name: string
  category: CompetencyCategory
  weight: number
  /** IAS: "Interview Rating (on a scale of 6, No Decimals Allowed)". */
  rating: number | null
  positives: string
  negatives: string
  /** What the AI drafted, kept side-by-side with the interviewer's final entry. */
  aiSuggested: { rating: number; positives: string; negatives: string; confidence: number; evidence: string[] } | null
  /** True once a human has touched the row. */
  interviewerConfirmed: boolean
}

export interface Assessment {
  id: string
  requisitionId: string
  candidateId: string
  stageKey: string
  /** Display label, e.g. "Assessment Level 2". Generated from the workflow. */
  label: string
  interviewId?: string
  interviewerIds: string[]
  interviewDate: string
  mode: InterviewMode
  format: AssessmentMethod
  scores: CompetencyScore[]
  /** IAS weighted average across the competency rows. */
  weightedAverage: number
  culturalFitment: CulturalFitment | null
  culturalRationale: string
  inputsForNextInterviewer: string
  overallComments: string
  reasonForJobChange: string
  finalDecision: IasDecision | null
  signOff: { signed: boolean; byId?: string; at?: string }
  status: 'ai_draft' | 'in_review' | 'submitted' | 'overdue'
  /** Share of fields the AI pre-filled — the brief's ~80% first draft. */
  aiDraftCoverage: number
  submittedAt?: string
  dueAt?: string
}

export interface AssessmentTemplate {
  id: string
  name: string
  format: AssessmentMethod
  jobFamily: JobFamily | 'Any'
  band: Band[] | 'Any'
  country: CountryCode[] | 'Any'
  ratingScaleId: string
  sections: { title: string; fields: string[] }[]
  mandatorySignOff: boolean
  usageCount: number
}

/* ── Governance ───────────────────────────────────────────────────────── */

export interface AuditEvent {
  id: string
  at: string
  actorId: string
  actorRole: Role
  action: string
  entity: string
  entityId: string
  detail: string
  /** Marks a point where a human overrode or confirmed an AI suggestion. */
  humanDecision?: boolean
}

export interface ActivityItem {
  id: string
  at: string
  actorId: string
  kind: 'application' | 'screening' | 'interview' | 'assessment' | 'decision' | 'system'
  text: string
  requisitionId?: string
  candidateId?: string
}

export interface TaskItem {
  id: string
  title: string
  detail: string
  ownerId: string
  dueAt: string
  priority: 'high' | 'medium' | 'low'
  kind: 'screening' | 'feedback' | 'scheduling' | 'decision' | 'approval'
  requisitionId?: string
  candidateId?: string
  done: boolean
}

export interface AiInsight {
  id: string
  severity: RagStatus
  title: string
  detail: string
  /** The facts behind the claim — AI here never asserts without showing why. */
  evidence: string[]
  actionLabel: string
  actionTarget: string
}

export interface PortalMessage {
  id: string
  at: string
  from: string
  subject: string
  body: string
  read: boolean
}

export interface DocumentRequest {
  id: string
  name: string
  status: 'requested' | 'uploaded' | 'verified'
  dueAt: string
}

export interface GlobalFilters {
  country: CountryCode | 'all'
  businessUnit: BusinessUnit | 'all'
  hiringManagerId: string | 'all'
  recruiterId: string | 'all'
  requisitionId: string | 'all'
  band: Band | 'all'
  dateRange: '7d' | '30d' | '90d' | 'ytd' | 'all'
}
