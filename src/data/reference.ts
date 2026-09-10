import type {
  AssessmentMethod, Band, BusinessUnit, CompetencyCategory, Country,
  CountryCode, IasDecision, InterviewMode, JobFamily, Person, Role,
} from './types'

/* ── IAS rating legend (verbatim from the workbook) ───────────────────── */

export const RATING_LEGEND: { value: number; label: string; short: string }[] = [
  { value: 1, label: "Doesn't meet Expectations", short: 'Below' },
  { value: 2, label: 'Partially meets Expectations', short: 'Partial' },
  { value: 3, label: 'Meets Expectations at Times', short: 'At times' },
  { value: 4, label: 'Meets Expectations with guidance', short: 'With guidance' },
  { value: 5, label: 'Exceeds Expectations', short: 'Exceeds' },
  { value: 6, label: 'Outstanding Talent', short: 'Outstanding' },
]

export const RATING_MAX = 6

export const CULTURAL_FITMENT: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "Doesn't fit Culturally" },
  { value: 2, label: 'Demonstrated few Cultural traits, can be looked at' },
  { value: 3, label: 'Good Cultural fitment' },
]

export const IAS_DECISIONS: IasDecision[] = [
  'Good to Go - Found to be suitable',
  'Can be considered - on Hold',
  'Not Suitable for the Role',
]

export const INTERVIEW_MODES: InterviewMode[] = [
  'Video Conference',
  'Telephonic',
  'In person at office',
]

export const ASSESSMENT_METHODS: AssessmentMethod[] = [
  'Structured competency interview',
  'Functional / technical interview',
  'Case study',
  'Presentation',
  'Role play',
  'Written assessment',
  'Leadership assessment',
  'Behavioural interview',
  'Panel interview',
  'Culture and values assessment',
]

/**
 * The IAS "Ideal Candidate guide" tab — 15 traits used as the backbone of the
 * culture-and-values assessment format.
 */
export const IDEAL_CANDIDATE_TRAITS: { trait: string; detail: string }[] = [
  { trait: 'Action Oriented', detail: 'Takes action and takes chances' },
  { trait: 'Intelligent', detail: 'Less need to proof-read work and micromanage' },
  { trait: 'Ambitious', detail: 'Wants a better career, and that lifts the company' },
  { trait: 'Autonomous', detail: 'Gets the job done without hand-holding' },
  { trait: 'Displays Leadership', detail: 'Self-confidence built by repeated success' },
  { trait: 'Cultural Fit', detail: 'Personality separates a passable hire from an all-star' },
  { trait: 'Upbeat', detail: 'Out-produces people who think negatively' },
  { trait: 'Confident', detail: 'Produces results and takes on challenges' },
  { trait: 'Successful', detail: 'Past success elsewhere predicts future success' },
  { trait: 'Honest', detail: 'Authentic, true to self' },
  { trait: 'Detail oriented', detail: 'Takes pride in the work' },
  { trait: 'Modest', detail: 'Shouts their value through their work' },
  { trait: 'Hard-Working', detail: 'Executes — the foundation of an effective org' },
  { trait: 'Marketable', detail: 'Represents the org as professional to clients' },
  { trait: 'Passionate', detail: 'Never works a day in their life' },
]

/* ── Geography ────────────────────────────────────────────────────────── */

export const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', flag: '🇮🇳', timezone: 'Asia/Kolkata', utcOffset: 'UTC+5:30', diversityReportingPermitted: true },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', timezone: 'Asia/Singapore', utcOffset: 'UTC+8:00', diversityReportingPermitted: false },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', timezone: 'Asia/Dubai', utcOffset: 'UTC+4:00', diversityReportingPermitted: false },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', timezone: 'Europe/London', utcOffset: 'UTC+1:00', diversityReportingPermitted: true },
  { code: 'US', name: 'United States', flag: '🇺🇸', timezone: 'America/New_York', utcOffset: 'UTC-4:00', diversityReportingPermitted: true },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', timezone: 'Europe/Berlin', utcOffset: 'UTC+2:00', diversityReportingPermitted: false },
]

export const countryOf = (code: CountryCode) => COUNTRIES.find(c => c.code === code)!

/** From the IAS "Competency Mapping - India" tab. */
export const BUSINESS_UNITS: BusinessUnit[] = [
  'REL/DCG', 'SMB', 'Consumer', 'Marketing', 'Finance',
  'Integrated Operations', 'HR', 'Technology',
]

export const BANDS: Band[] = ['B5', 'B6', 'B7', 'B8', 'B9', 'B10']

export const JOB_FAMILIES: JobFamily[] = [
  'Sales', 'Engineering', 'Marketing', 'Finance', 'Operations', 'Human Resources', 'Product',
]

export const COMPETENCY_CATEGORIES: CompetencyCategory[] = [
  'Technical', 'Functional', 'Behavioural', 'Leadership', 'Domain', 'Culture & Values',
]

/**
 * Business-unit competency map, transcribed from the IAS. Functional
 * competencies vary by unit; behavioural competencies are shared, with a
 * distinct set for Band 8 and above.
 */
export const BU_COMPETENCY_MAP: Record<string, { functional: string[]; behavioural: string[] }> = {
  'REL/DCG': {
    functional: [
      "Driving Relationship with CxOs & Partners",
      'Consultative Selling Skills',
      'Market / Competition awareness',
      'Hunter Mentality / Perseverance',
      'Culture fitment — ability to handle pressure',
    ],
    behavioural: [],
  },
  SMB: {
    functional: [
      'Driving Channel, Alliance, Partner Relationships',
      'Business Acumen — driving business through partners',
      'Market / Competition awareness',
      'People Networking Skills',
      'Culture fitment — ability to handle pressure',
    ],
    behavioural: [],
  },
  Consumer: {
    functional: [
      'Channel Management',
      'Sell-Out / Customer Orientation Mindset',
      'Business Operation Excellence',
      'Brand and Product Management',
      'Presentation and Articulation Skills',
    ],
    behavioural: [],
  },
  Marketing: {
    functional: [
      'Branding, Digital Marketing and Event Management',
      'Product Marketing Knowledge',
      'Planning & Execution',
      'Decision Making Capabilities',
      'Vendor Management, Training & Selection',
    ],
    behavioural: [],
  },
  Finance: {
    functional: [
      'Business Finance, Pricing, Controllership',
      'Business Segment Acumen (Commercial / Consumer)',
      'Overall Finance Knowledge',
      'Strategic Thinking Ability',
      'Adherence to Compliance policies',
    ],
    behavioural: [],
  },
}

/** IAS behavioural set for Band 8 (RSM) and above. */
export const BEHAVIOURAL_B8_PLUS = [
  'Strategic acumen',
  'Planning abilities / Structured thinking',
  'People management & Leadership Skills',
  'Proactivity / initiative taking ability',
  'Execution excellence / End-to-end ownership',
]

/** IAS behavioural set for Bands 6–8. */
export const BEHAVIOURAL_B6_B8 = [
  'Strategic acumen',
  'Planning abilities / Structured thinking',
  "Contribution towards team's goal",
  'Proactivity / initiative taking ability',
  'Execution excellence / End-to-end ownership',
]

/* ── People ───────────────────────────────────────────────────────────── */

const P = (
  id: string, name: string, title: string, role: Role,
  businessUnit: BusinessUnit, country: CountryCode, tint: string,
): Person => ({
  id, name, title, role, businessUnit, country, tint,
  initials: name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
  email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@nexora.com`,
})

export const PEOPLE: Person[] = [
  P('u_priya', 'Priya Raghavan', 'Senior TA Partner', 'ta_admin', 'REL/DCG', 'IN', '#2A78D6'),
  P('u_marcus', 'Marcus Bell', 'TA Partner, EMEA', 'ta_admin', 'Technology', 'GB', '#4A3AA7'),
  P('u_leena', 'Leena Fernandes', 'TA Operations Lead', 'ta_admin', 'HR', 'IN', '#12275A'),

  P('u_arjun', 'Arjun Mehta', 'Director, Enterprise Sales', 'hiring_manager', 'REL/DCG', 'IN', '#0763C4'),
  P('u_sophie', 'Sophie Lindqvist', 'Head of Platform Engineering', 'hiring_manager', 'Technology', 'GB', '#5C49B6'),
  P('u_daniel', 'Daniel Okafor', 'Regional Finance Controller', 'hiring_manager', 'Finance', 'SG', '#004EA9'),

  P('u_murugan', 'Murugan Iyer', 'Senior Manager, Solutions', 'hiring_manager', 'REL/DCG', 'IN', '#2C4680'),
  P('u_soundar', 'Soundar Rajan', 'Principal Architect', 'hiring_manager', 'Technology', 'IN', '#3B2E86'),
  P('u_hana', 'Hana Suzuki', 'Staff Engineer', 'hiring_manager', 'Technology', 'SG', '#1B3163'),
  P('u_ravi', 'Ravi Kulkarni', 'HR Business Partner', 'hiring_manager', 'HR', 'IN', '#4C67A5'),
  P('u_elena', 'Elena Costa', 'VP, Integrated Operations', 'hiring_manager', 'Integrated Operations', 'DE', '#7E6ECC'),

  P('u_nadia', 'Nadia Haddad', 'Chief People Officer', 'leadership', 'HR', 'AE', '#0A1330'),
  P('u_tom', 'Tom Whitfield', 'SVP, Global Sales', 'leadership', 'REL/DCG', 'GB', '#003C88'),
]

export const personById = (id: string) => PEOPLE.find(p => p.id === id)
export const personName = (id: string) => personById(id)?.name ?? 'Unassigned'

export const RECRUITERS = PEOPLE.filter(p => p.role === 'ta_admin')
export const HIRING_MANAGERS = PEOPLE.filter(p => p.role === 'hiring_manager')

export const ROLE_LABELS: Record<Role, string> = {
  ta_admin: 'TA Admin / Recruiter',
  hiring_manager: 'Hiring Manager / Interviewer',
  candidate: 'Candidate',
  leadership: 'Leadership Viewer',
}

/**
 * Role-based access control. Every screen checks this — a Leadership viewer
 * never sees an individual CV, and a candidate only ever sees their own portal.
 */
export const ROLE_PERMISSIONS: Record<Role, {
  screens: string[]
  canDecide: boolean
  canSeeCandidatePii: boolean
  canEditFramework: boolean
  canSeeCompensation: boolean
  description: string
}> = {
  ta_admin: {
    screens: ['dashboard', 'requisitions', 'candidates', 'interviews', 'assessments', 'analysis', 'governance'],
    canDecide: true, canSeeCandidatePii: true, canEditFramework: true, canSeeCompensation: true,
    description: 'Full pipeline control. Owns screening decisions, scheduling and offer recommendations.',
  },
  hiring_manager: {
    screens: ['dashboard', 'requisitions', 'candidates', 'interviews', 'assessments', 'analysis'],
    canDecide: true, canSeeCandidatePii: true, canEditFramework: true, canSeeCompensation: false,
    description: 'Owns the hiring bar. Runs interviews, signs off scorecards, makes the final call.',
  },
  candidate: {
    screens: ['portal'],
    canDecide: false, canSeeCandidatePii: false, canEditFramework: false, canSeeCompensation: false,
    description: 'Sees only their own application, interviews, tasks and messages.',
  },
  leadership: {
    screens: ['dashboard', 'analysis'],
    canDecide: false, canSeeCandidatePii: false, canEditFramework: false, canSeeCompensation: true,
    description: 'Aggregate view only. Candidate names and CVs are masked by policy.',
  },
}
