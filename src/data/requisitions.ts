import { rel } from '@/lib/dates'
import type {
  AssessmentMethod, Competency, CompetencyCategory, Requisition, WorkflowStage,
} from './types'

/** Terse constructor — keeps the framework tables readable. */
const c = (
  id: string, name: string, category: CompetencyCategory, requiredProficiency: number,
  weight: number, mustHave: boolean, criticality: 'Critical' | 'Trainable',
  evidenceToLookFor: string, suggestedQuestions: string[],
  assessmentMethod: AssessmentMethod, assessAtStage: string,
  aiConfidence: number, aiRationale: string,
  source: 'ai' | 'human' | 'repository' = 'ai',
): Competency => ({
  id, name, category, requiredProficiency, weight, mustHave, criticality,
  evidenceToLookFor, suggestedQuestions, assessmentMethod, assessAtStage,
  source, aiConfidence, aiRationale,
})

const stage = (
  key: string, order: number, name: string, shortName: string,
  type: WorkflowStage['type'], objective: string, interviewerIds: string[],
  competencyIds: string[], durationMins: number, format: AssessmentMethod, slaDays: number,
): WorkflowStage => ({ key, order, name, shortName, type, objective, interviewerIds, competencyIds, durationMins, format, slaDays })

/* ══════════════════════════════════════════════════════════════════════
   REQ-2049 · Senior Manager, Enterprise Solutions & Escalations
   The competency set and weightings are taken verbatim from the supplied
   Interview Assessment Sheet, including its four interviewer levels.
   ══════════════════════════════════════════════════════════════════════ */

const REQ1_COMPS: Competency[] = [
  c('c1_esc', 'Technical Escalation Management', 'Technical', 5, 0.10, true, 'Critical',
    'Owned a Sev-1 escalation end to end: triage, comms cadence to the customer executive, root-cause closure and the preventative action that followed.',
    ['Walk me through the most damaging escalation you personally owned. What was the customer impact in revenue terms?',
     'How do you decide when to escalate internally versus absorb the problem in your team?',
     'Describe a time an escalation was mishandled on your watch. What changed afterwards?'],
    'Structured competency interview', 's_l1', 0.93,
    'JD names "own critical customer escalations across the APAC install base" as the first accountability, and repeats "escalation" four times.'),

  c('c1_hw', 'PC Hardware knowledge and troubleshooting experience', 'Technical', 5, 0.15, true, 'Critical',
    'Component-level diagnosis on commercial notebooks and workstations; can reason about thermal, firmware and driver interactions rather than swapping parts.',
    ['A fleet of 400 workstations shows intermittent thermal throttling after a firmware update. How do you isolate it?',
     'Which diagnostic tooling do you reach for first, and why that order?',
     'How do you tell a genuine hardware fault from a driver-stack symptom?'],
    'Functional / technical interview', 's_l1', 0.96,
    'The highest-weighted must-have in the JD: "deep hands-on PC hardware troubleshooting" appears in both the summary and the requirements list.'),

  c('c1_cx', 'Customer Management, CX', 'Functional', 5, 0.15, true, 'Critical',
    'Named accounts held over multiple years, measurable CSAT/NPS movement, and evidence of handling an executive relationship through a bad quarter.',
    ['Tell me about a customer relationship you inherited in poor health. What did the first 90 days look like?',
     'How do you structure a QBR so it is not just a status report?',
     'Give me an example where you told a customer something they did not want to hear.'],
    'Structured competency interview', 's_l2', 0.91,
    'Derived from "own the post-sale customer experience for strategic accounts" plus the CSAT target in the success measures.'),

  c('c1_strat', 'Strategic Acumen', 'Behavioural', 4, 0.15, true, 'Trainable',
    'Can connect a service decision to segment economics; talks in terms of install base, attach rate and margin, not just tickets closed.',
    ['How would you decide which service offerings to sunset next year?',
     'What signals would tell you the support model is structurally wrong rather than under-resourced?'],
    'Structured competency interview', 's_l2', 0.88,
    'Band 8 behavioural set from the competency repository — mandatory for RSM and above.'),

  c('c1_exec', 'Execution Rigor', 'Behavioural', 5, 0.15, true, 'Critical',
    'Operating cadence they personally built: the metric, the review rhythm, and what happened when it slipped.',
    ['What operating cadence did you run with your team, and what did you cut from it?',
     'Tell me about a commitment you missed. How did you find out, and how late?'],
    'Structured competency interview', 's_l2', 0.90,
    'Band 8 behavioural set. JD success measures are all quarterly and numeric, which raises the bar here.'),

  c('c1_team', 'Team Working', 'Behavioural', 4, 0.10, false, 'Trainable',
    'Credit given to named colleagues; concrete examples of unblocking a peer team without escalating.',
    ['Describe a cross-team conflict you resolved without going to your manager.',
     'Which function do you find hardest to work with, and how do you handle it?'],
    'Behavioural interview', 's_l3', 0.84,
    'Matrix role — the JD lists four peer functions this manager depends on but does not control.'),

  c('c1_pres', 'Executive Presence', 'Leadership', 5, 0.10, true, 'Critical',
    'Handles a hostile question without deflecting; structures an answer top-down; comfortable saying "I do not know, here is how I will find out".',
    ['Present a 3-minute recovery plan for an account that has just threatened to churn.',
     'How do you brief a CxO differently from an engineering lead?'],
    'Presentation', 's_l4', 0.86,
    'The role presents to customer CxOs and to the segment head monthly; flagged from "executive stakeholder management" in the JD.'),

  c('c1_plan', 'Planning abilities / Structured thinking', 'Behavioural', 4, 0.10, false, 'Trainable',
    'Breaks an ambiguous problem into ordered, testable parts; states assumptions out loud before answering.',
    ['You have 90 days and half the headcount you asked for. How do you sequence the work?',
     'How do you plan for a quarter when the demand signal is unreliable?'],
    'Structured competency interview', 's_l3', 0.87,
    'Band 8 behavioural set from the competency repository.'),
]

const REQ1_WORKFLOW: WorkflowStage[] = [
  stage('s_apply', 1, 'Application', 'Applied', 'application',
    'Candidate applies through the careers site or is sourced.', [], [], 0, 'Structured competency interview', 3),
  stage('s_ai', 2, 'AI Screening', 'AI Screen', 'ai_screening',
    'Match the CV and application against the competency framework. Produces a recommendation only — never a decision.',
    [], REQ1_COMPS.map(x => x.id), 0, 'Structured competency interview', 1),
  stage('s_ta', 3, 'TA Partner Assessment', 'TA Screen', 'recruiter_screen',
    'Recruiter validates motivation, compensation, notice period and baseline technical depth before consuming business time.',
    ['u_priya'], ['c1_hw', 'c1_cx', 'c1_esc'], 30, 'Structured competency interview', 2),
  stage('s_l1', 4, 'Interview Level 1 · Business', 'L1 Business', 'interview',
    'Hands-on technical depth. Can this person actually diagnose hardware and run an escalation?',
    ['u_murugan', 'u_soundar'], ['c1_esc', 'c1_hw'], 60, 'Functional / technical interview', 3),
  stage('s_l2', 5, 'Interview Level 2 · Business', 'L2 Business', 'interview',
    'Customer ownership and operating rigour at segment scale.',
    ['u_arjun'], ['c1_cx', 'c1_strat', 'c1_exec'], 60, 'Structured competency interview', 3),
  stage('s_l3', 6, 'Interview Level 3 · HR Partner', 'L3 HR Partner', 'interview',
    'Culture, values, collaboration and structured thinking. Confirms the ideal-candidate traits.',
    ['u_ravi'], ['c1_team', 'c1_plan'], 45, 'Culture and values assessment', 2),
  stage('s_l4', 7, 'Interview Level 4 · Segment Head', 'L4 Segment Head', 'interview',
    'Final calibration against the bar. Executive presence and long-term potential.',
    ['u_tom'], ['c1_pres', 'c1_strat'], 45, 'Leadership assessment', 2),
  stage('s_offer', 8, 'Offer Recommendation', 'Offer', 'offer',
    'Consolidated recommendation, compensation build and approval.', ['u_priya', 'u_arjun'], [], 0, 'Structured competency interview', 4),
  stage('s_hired', 9, 'Hired', 'Hired', 'hired', 'Offer accepted and start date confirmed.', [], [], 0, 'Structured competency interview', 0),
]

/* ══════════════════════════════════════════════════════════════════════
   REQ-2076 · Staff Platform Engineer — a three-level technical workflow
   ══════════════════════════════════════════════════════════════════════ */

const REQ2_COMPS: Competency[] = [
  c('c2_dist', 'Distributed Systems Design', 'Technical', 5, 0.18, true, 'Critical',
    'Has made a real consistency/availability trade-off and can name what it cost. Talks about failure modes before happy paths.',
    ['Design a multi-region write path for a service that cannot lose an event. Where do you accept staleness?',
     'Tell me about a system you designed that failed in production in a way you had not predicted.'],
    'Case study', 's2_l2', 0.95,
    'JD opens with "design and own distributed services at multi-region scale" and lists event-driven architecture twice.'),

  c('c2_cloud', 'Cloud & Kubernetes Operations', 'Technical', 5, 0.15, true, 'Critical',
    'Operated clusters they did not build; can discuss resource limits, noisy neighbours and upgrade strategy from scars, not docs.',
    ['How do you approach a Kubernetes version upgrade across 40 production clusters?',
     'Where does the standard autoscaler let you down?'],
    'Functional / technical interview', 's2_l1', 0.94,
    'Required-skills list names Kubernetes, Terraform and AWS explicitly as must-haves.'),

  c('c2_quality', 'Code Quality & Testing Discipline', 'Technical', 4, 0.12, true, 'Trainable',
    'Opinions about test boundaries backed by an example of a suite they deleted or rewrote, and why.',
    ['What do you not write tests for?',
     'How do you make a flaky suite trustworthy again?'],
    'Written assessment', 's2_l1', 0.89,
    'JD: "raise the engineering bar through review and testing standards".'),

  c('c2_incident', 'Incident Response & Reliability', 'Functional', 5, 0.15, true, 'Critical',
    'Has been incident commander, not just a responder. Can describe a blameless post-mortem that changed a system rather than a process doc.',
    ['Walk me through the last Sev-1 you commanded, minute by minute for the first 20 minutes.',
     'What is the most useful thing you have ever removed from a runbook?'],
    'Structured competency interview', 's2_l1', 0.92,
    'On-call leadership named in the accountabilities; SLO ownership in the success measures.'),

  c('c2_think', 'Structured Thinking & Problem Decomposition', 'Behavioural', 4, 0.12, false, 'Trainable',
    'States assumptions before solving; asks clarifying questions that change the answer.',
    ['You have three plausible causes and one hour. How do you spend it?'],
    'Case study', 's2_l2', 0.86,
    'Standard engineering behavioural set for Band 7 from the competency repository.'),

  c('c2_mentor', 'Mentoring & Technical Influence', 'Leadership', 4, 0.13, true, 'Trainable',
    'Named engineers whose trajectory they changed; influence achieved through a written design or a prototype rather than authority.',
    ['Tell me about an engineer you grew. What specifically did you do?',
     'Describe a technical direction you changed without owning the team.'],
    'Behavioural interview', 's2_l3', 0.90,
    '"Staff" scope — the JD is explicit that this is an influence role with no direct reports.'),

  c('c2_collab', 'Cross-functional Collaboration', 'Behavioural', 4, 0.15, false, 'Trainable',
    'Concrete examples of working with product and security; can describe a trade-off they conceded and why.',
    ['Tell me about a time product priorities and platform health were in direct conflict.'],
    'Behavioural interview', 's2_l3', 0.85,
    'Platform team serving six product squads — collaboration weight raised by the hiring manager.'),
]

const REQ2_WORKFLOW: WorkflowStage[] = [
  stage('s2_apply', 1, 'Application', 'Applied', 'application', 'Candidate applies or is sourced.', [], [], 0, 'Structured competency interview', 3),
  stage('s2_ai', 2, 'AI Screening', 'AI Screen', 'ai_screening',
    'Competency match and gap analysis against the framework.', [], REQ2_COMPS.map(x => x.id), 0, 'Structured competency interview', 1),
  stage('s2_ta', 3, 'TA Partner Assessment', 'TA Screen', 'recruiter_screen',
    'Motivation, visa position, compensation and a light technical sanity check.', ['u_marcus'], ['c2_cloud', 'c2_incident'], 30, 'Structured competency interview', 2),
  stage('s2_l1', 4, 'Interview Level 1 · Technical Screen', 'L1 Technical', 'interview',
    'Hands-on depth in cloud operations, reliability and testing discipline.',
    ['u_hana'], ['c2_cloud', 'c2_quality', 'c2_incident'], 60, 'Functional / technical interview', 3),
  stage('s2_l2', 5, 'Interview Level 2 · System Design', 'L2 System Design', 'interview',
    'Open-ended design exercise. Assesses trade-off reasoning under ambiguity.',
    ['u_sophie', 'u_soundar'], ['c2_dist', 'c2_think'], 90, 'Case study', 3),
  stage('s2_l3', 6, 'Interview Level 3 · Hiring Manager & Values', 'L3 HM & Values', 'interview',
    'Influence, mentoring and how they behave when they disagree.',
    ['u_sophie'], ['c2_mentor', 'c2_collab'], 45, 'Behavioural interview', 2),
  stage('s2_offer', 7, 'Offer Recommendation', 'Offer', 'offer', 'Consolidated recommendation and approval.', ['u_marcus', 'u_sophie'], [], 0, 'Structured competency interview', 4),
  stage('s2_hired', 8, 'Hired', 'Hired', 'hired', 'Offer accepted.', [], [], 0, 'Structured competency interview', 0),
]

/* ══════════════════════════════════════════════════════════════════════
   REQ-2088 · Regional Finance Controller — five levels, panel and CFO final
   ══════════════════════════════════════════════════════════════════════ */

const REQ3_COMPS: Competency[] = [
  c('c3_ctrl', 'Business Finance, Pricing, Controllership', 'Functional', 5, 0.18, true, 'Critical',
    'Owned a P&L close for a multi-entity region; can explain a pricing decision they blocked and the commercial fallout.',
    ['Describe a pricing approval you refused. What happened next?',
     'Walk me through your month-end close and where it usually breaks.'],
    'Functional / technical interview', 's3_l1', 0.94,
    'First accountability in the JD and the anchor of the role title.', 'repository'),

  c('c3_know', 'Overall Finance Knowledge', 'Technical', 5, 0.14, true, 'Critical',
    'Fluent across IFRS treatment, transfer pricing and revenue recognition without reaching for a specialist.',
    ['How do you treat a multi-element arrangement with a hardware and services split?',
     'What changes in your close when an entity moves to a new functional currency?'],
    'Written assessment', 's3_l1', 0.92, 'Statutory reporting across four entities named in the JD.', 'repository'),

  c('c3_seg', 'Business Segment Acumen (Commercial / Consumer)', 'Domain', 4, 0.13, true, 'Trainable',
    'Understands channel economics — sell-in versus sell-out, rebate accrual, and where the margin actually sits.',
    ['How do you sanity-check a distributor rebate accrual you inherited?',
     'What does a healthy channel inventory position look like on the balance sheet?'],
    'Case study', 's3_l2', 0.88, 'JD scope covers both commercial and consumer segments across APAC.', 'repository'),

  c('c3_comp', 'Adherence to Compliance policies', 'Functional', 5, 0.12, true, 'Critical',
    'Has said no to the business and made it stick; can describe an audit finding they owned rather than deflected.',
    ['Tell me about a control failure you found before the auditors did.',
     'Where do you draw the line between commercial pragmatism and a control breach?'],
    'Structured competency interview', 's3_l3', 0.95, 'SOX and statutory audit ownership are explicit in the JD.', 'repository'),

  c('c3_strat', 'Strategic acumen', 'Behavioural', 5, 0.15, true, 'Trainable',
    'Frames finance as a decision input, not a scorecard. Has changed a commercial plan with an analysis.',
    ['Tell me about an analysis of yours that changed a business decision.'],
    'Structured competency interview', 's3_l4', 0.87, 'Band 9 behavioural set — mandatory above RSM.', 'repository'),

  c('c3_people', 'People management & Leadership Skills', 'Leadership', 5, 0.15, true, 'Critical',
    'Built a team across borders; can name someone they performance-managed out and what they learned.',
    ['How do you run a team split across three time zones?',
     'Tell me about the hardest people decision you have made.'],
    'Leadership assessment', 's3_l4', 0.91, 'Team of 11 across three countries per the org chart attached to the req.', 'repository'),

  c('c3_exec', 'Execution excellence / End-to-end ownership', 'Behavioural', 5, 0.13, true, 'Critical',
    'Takes the whole problem, including the parts owned by other functions.',
    ['Describe something that was not your job that you fixed anyway.'],
    'Structured competency interview', 's3_l5', 0.89, 'Band 9 behavioural set.', 'repository'),
]

const REQ3_WORKFLOW: WorkflowStage[] = [
  stage('s3_apply', 1, 'Application', 'Applied', 'application', 'Candidate applies or is sourced.', [], [], 0, 'Structured competency interview', 3),
  stage('s3_ai', 2, 'AI Screening', 'AI Screen', 'ai_screening', 'Competency match against the framework.', [], REQ3_COMPS.map(x => x.id), 0, 'Structured competency interview', 1),
  stage('s3_ta', 3, 'TA Partner Assessment', 'TA Screen', 'recruiter_screen',
    'Motivation, mobility, compensation and controllership depth.', ['u_priya'], ['c3_ctrl', 'c3_know'], 30, 'Structured competency interview', 2),
  stage('s3_l1', 4, 'Interview Level 1 · Functional', 'L1 Functional', 'interview',
    'Technical accounting and controllership depth.', ['u_daniel'], ['c3_ctrl', 'c3_know'], 60, 'Functional / technical interview', 3),
  stage('s3_l2', 5, 'Interview Level 2 · Case Study', 'L2 Case Study', 'interview',
    'Channel economics case, presented back to the panel.', ['u_daniel', 'u_elena'], ['c3_seg'], 90, 'Case study', 4),
  stage('s3_l3', 6, 'Interview Level 3 · Compliance & Controls', 'L3 Compliance', 'interview',
    'Controls posture and independence under commercial pressure.', ['u_elena'], ['c3_comp'], 45, 'Structured competency interview', 3),
  stage('s3_l4', 7, 'Interview Level 4 · Leadership Panel', 'L4 Leadership Panel', 'interview',
    'Panel assessment of strategic and people leadership.', ['u_nadia', 'u_elena', 'u_ravi'], ['c3_strat', 'c3_people'], 60, 'Panel interview', 3),
  stage('s3_l5', 8, 'Interview Level 5 · Final', 'L5 Final', 'interview',
    'Final calibration with the segment leader.', ['u_tom'], ['c3_exec'], 45, 'Leadership assessment', 2),
  stage('s3_offer', 9, 'Offer Recommendation', 'Offer', 'offer', 'Consolidated recommendation and approval.', ['u_priya', 'u_daniel'], [], 0, 'Structured competency interview', 4),
  stage('s3_hired', 10, 'Hired', 'Hired', 'hired', 'Offer accepted.', [], [], 0, 'Structured competency interview', 0),
]

export const REQUISITIONS: Requisition[] = [
  {
    id: 'REQ-2049',
    title: 'Senior Manager, Enterprise Solutions & Escalations',
    country: 'IN', location: 'Bangalore, India',
    businessUnit: 'REL/DCG', jobFamily: 'Sales', band: 'B8',
    hiringManagerId: 'u_arjun', recruiterId: 'u_priya',
    panelIds: ['u_murugan', 'u_soundar', 'u_ravi', 'u_tom'],
    openDate: rel(-58), targetCloseDate: rel(20), status: 'In Interview',
    priority: 'Critical', openings: 1,
    roleOverview:
      'Own the post-sale experience and critical escalations for the strategic enterprise install base across India and South Asia. This is a hands-on leadership role: you will run a team of nine solution engineers, hold the executive relationship at eight named accounts, and be the person the segment head calls when a Sev-1 goes sideways.',
    jobDescription:
      'Lenovo-scale enterprise customers expect their hardware estate to be invisible. When it is not, they expect one accountable person. That is this role.\n\nYou will own critical customer escalations across the APAC install base, lead a team of nine solution engineers, and hold the post-sale customer experience for eight strategic accounts representing roughly $140M in annual contract value. You will be measured quarterly on CSAT movement, escalation closure time and install-base retention.\n\nThe role reports to the Director of Enterprise Sales and works in a matrix with Service Delivery, Product Engineering, Supply Chain and Finance. You will present to customer CxOs monthly and to the segment head at the quarterly business review.\n\nWe are looking for someone with deep hands-on PC hardware troubleshooting credibility — this team does not respect a manager who cannot read a diagnostic log — combined with the executive stakeholder management to hold a room when the news is bad.',
    responsibilities: [
      'Own and close critical customer escalations end to end, including executive communication cadence',
      'Lead, coach and grow a team of nine solution engineers across two locations',
      'Hold the post-sale relationship at eight strategic accounts and run the quarterly business review',
      'Drive CSAT and install-base retention targets on a quarterly cadence',
      'Partner with Product Engineering on recurring defect themes and preventative action',
    ],
    minimumQualifications: [
      "Bachelor's degree in Engineering or equivalent practical experience",
      '10+ years in enterprise technical services, of which 4+ in people leadership',
      'Demonstrable hands-on PC hardware and firmware troubleshooting experience',
      'Experience owning executive-level customer relationships',
    ],
    preferredQualifications: [
      'Experience in a global OEM or large systems integrator',
      'Exposure to APAC multi-country service delivery',
      'ITIL or equivalent service management certification',
    ],
    highlights: [
      'Own the executive relationship at eight strategic accounts',
      'Lead a team of nine across Bangalore and Chennai',
      'Direct line to the segment head — this role is visible',
      'Hybrid, 3 days on site at Bangalore ITPL',
    ],
    salaryRange: '₹52,00,000 – ₹68,00,000 + 25% variable',
    workflow: REQ1_WORKFLOW, competencies: REQ1_COMPS, templateId: 'tpl_rel_b8',
  },
  {
    id: 'REQ-2076',
    title: 'Staff Platform Engineer',
    country: 'GB', location: 'London, United Kingdom (hybrid)',
    businessUnit: 'Technology', jobFamily: 'Engineering', band: 'B7',
    hiringManagerId: 'u_sophie', recruiterId: 'u_marcus',
    panelIds: ['u_hana', 'u_soundar'],
    openDate: rel(-37), targetCloseDate: rel(35), status: 'Offer Stage',
    priority: 'High', openings: 2,
    roleOverview:
      'Design and own distributed services at multi-region scale for the platform six product squads build on. A staff-level influence role with no direct reports — your leverage is design, review and the standards you set.',
    jobDescription:
      'Our platform group runs the event backbone, identity and deployment surface that six product squads depend on. We are hiring two Staff Platform Engineers to own the next generation of it.\n\nYou will design and own distributed services at multi-region scale, with a bias toward event-driven architecture. You will hold an SLO, carry a pager, and lead incidents as commander rather than responder. You will raise the engineering bar through review and testing standards, and you will do it without authority — this is an influence role.\n\nOur stack is Go and TypeScript on Kubernetes across AWS in three regions, with Terraform for everything below the application line.\n\nWe care much more about how you reason under ambiguity than about which frameworks you have used.',
    responsibilities: [
      'Design and own multi-region distributed services with explicit availability and consistency trade-offs',
      'Hold an SLO and act as incident commander on the platform on-call rotation',
      'Raise engineering standards through design review, testing discipline and written architecture decisions',
      'Mentor senior engineers across six product squads',
      'Own Kubernetes and Terraform estate health, including upgrade strategy',
    ],
    minimumQualifications: [
      '8+ years building and operating production distributed systems',
      'Deep hands-on Kubernetes, Terraform and AWS',
      'Demonstrated incident command experience',
      'Right to work in the UK',
    ],
    preferredQualifications: [
      'Go and TypeScript in production at scale',
      'Experience with event-driven architectures (Kafka, NATS or equivalent)',
      'Public technical writing or conference speaking',
    ],
    highlights: [
      'Two openings — the platform group is doubling',
      'Staff-level scope with no direct reports',
      'Multi-region, event-driven, genuinely hard problems',
      'Hybrid, 2 days on site in Shoreditch',
    ],
    salaryRange: '£115,000 – £142,000 + equity',
    workflow: REQ2_WORKFLOW, competencies: REQ2_COMPS, templateId: 'tpl_eng_b7',
  },
  {
    id: 'REQ-2088',
    title: 'Regional Finance Controller, APAC',
    country: 'SG', location: 'Singapore',
    businessUnit: 'Finance', jobFamily: 'Finance', band: 'B9',
    hiringManagerId: 'u_daniel', recruiterId: 'u_priya',
    panelIds: ['u_elena', 'u_nadia', 'u_ravi', 'u_tom'],
    openDate: rel(-80), targetCloseDate: rel(2), status: 'In Interview',
    priority: 'Critical', openings: 1,
    roleOverview:
      'Own controllership for four APAC entities, lead a team of eleven across three countries, and be the independent voice in the room when commercial pressure meets the control environment.',
    jobDescription:
      'This role owns the integrity of the numbers for four legal entities across APAC, covering both the commercial and consumer segments.\n\nYou will own the month-end and statutory close, transfer pricing, revenue recognition and the SOX control environment. You will lead a team of eleven split across Singapore, Bangalore and Sydney. You will approve — and sometimes refuse — pricing decisions, and you will own the relationship with external audit.\n\nThe person who succeeds here is technically unimpeachable and commercially fluent. We are not looking for a scorekeeper. We are looking for someone whose analysis changes what the business decides to do.',
    responsibilities: [
      'Own month-end, quarter-end and statutory close for four APAC entities',
      'Own the SOX control environment and the external audit relationship',
      'Approve pricing and deal structures, including the authority to refuse',
      'Lead and develop a finance team of eleven across three countries',
      'Partner with segment leadership on channel economics and margin strategy',
    ],
    minimumQualifications: [
      'Qualified accountant (CA, CPA or ACCA)',
      '12+ years post-qualification, with 5+ in a regional controllership role',
      'Multi-entity statutory reporting under IFRS',
      'Demonstrated people leadership across borders',
    ],
    preferredQualifications: [
      'Big 4 training',
      'Hardware or channel-led business experience',
      'Transfer pricing exposure across APAC jurisdictions',
    ],
    highlights: [
      'Four entities, three countries, a team of eleven',
      'Direct line to the CFO and the segment head',
      'Genuine independence — the role is expected to say no',
      'Singapore based, EP sponsorship available',
    ],
    salaryRange: 'SGD 280,000 – 340,000 + LTI',
    workflow: REQ3_WORKFLOW, competencies: REQ3_COMPS, templateId: 'tpl_fin_b9',
  },
]

export const reqById = (id: string) => REQUISITIONS.find(r => r.id === id)
export const stageOf = (req: { workflow: WorkflowStage[] }, key: string) =>
  req.workflow.find(s => s.key === key)

/** Interview stages only — what "unlimited levels" actually resolves to at runtime. */
export const interviewStages = (req: { workflow: WorkflowStage[] }) =>
  req.workflow.filter(s => s.type === 'interview').sort((a, b) => a.order - b.order)
