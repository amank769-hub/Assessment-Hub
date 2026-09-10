import { rel } from '@/lib/dates'
import type { Candidate, SkillMatch } from './types'
import { REQUISITIONS } from './requisitions'

/** Builds a skill-match row and inherits category/must-have from the framework. */
const sm = (reqId: string, competencyId: string, match: number, evidence: string[]): SkillMatch => {
  const comp = REQUISITIONS.find(r => r.id === reqId)!.competencies.find(c => c.id === competencyId)!
  return { competencyId, name: comp.name, category: comp.category, mustHave: comp.mustHave, match, evidence }
}

export const CANDIDATES: Candidate[] = [
  /* ── REQ-2049 · Senior Manager, Enterprise Solutions ─────────────── */
  {
    id: 'CAN-4101', requisitionId: 'REQ-2049',
    name: 'Ananya Sharma', initials: 'AS', tint: '#2A78D6',
    email: 'ananya.sharma@mailbox.com', phone: '+91 98450 21188',
    currentTitle: 'Senior Manager, Customer Success Engineering',
    currentOrganization: 'Dell Technologies', isExEmployee: false,
    location: 'Bangalore, India', country: 'IN',
    totalExperienceYears: 13, experiencePostQualification: 13,
    education: [
      { institute: 'NIT Trichy', qualification: 'B.Tech, Electronics & Communication', year: '2012' },
      { institute: 'IIM Bangalore', qualification: 'Executive PG in Management', year: '2019' },
    ],
    workHistory: [
      {
        company: 'Dell Technologies', title: 'Senior Manager, Customer Success Engineering',
        from: '2020', to: 'Present', location: 'Bangalore',
        highlights: [
          'Owns escalation management for 12 strategic accounts across India and SAARC, ~$180M ACV',
          'Reduced Sev-1 mean closure time from 71 to 26 hours over six quarters',
          'Leads a team of 11 solution engineers across Bangalore and Hyderabad',
          'Runs monthly executive QBRs with customer CIOs; CSAT moved 7.2 → 8.9',
        ],
      },
      {
        company: 'HP Inc.', title: 'Technical Account Manager',
        from: '2016', to: '2020', location: 'Bangalore',
        highlights: [
          'Component-level diagnosis on commercial notebook and workstation fleets',
          'Built the firmware regression triage process still used by the APAC team',
        ],
      },
      {
        company: 'Wipro', title: 'Systems Engineer', from: '2012', to: '2016', location: 'Chennai',
        highlights: ['Hardware break-fix and imaging for enterprise desktop estates'],
      },
    ],
    skills: ['Escalation Management', 'PC Hardware Diagnostics', 'Firmware Troubleshooting', 'Customer Success', 'Team Leadership', 'QBR & Executive Comms', 'ITIL', 'Service Delivery'],
    source: 'Referral', appliedAt: rel(-41),
    noticePeriodDays: 60, currentSalary: '₹48,00,000', expectedSalary: '₹62,00,000',
    workAuthorisation: 'Indian citizen — no sponsorship required',
    reasonForChange: 'Wants a role where the escalation function reports into the business rather than sitting alongside it, and a larger install base.',
    status: 'In Interview', currentStageKey: 's_l4',
    stageProgress: [
      { stageKey: 's_apply', status: 'completed', enteredAt: rel(-41), completedAt: rel(-41) },
      { stageKey: 's_ai', status: 'completed', enteredAt: rel(-41), completedAt: rel(-40) },
      { stageKey: 's_ta', status: 'completed', enteredAt: rel(-40), completedAt: rel(-36), score: 4.7, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l1', status: 'completed', enteredAt: rel(-36), completedAt: rel(-29), score: 5.05, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l2', status: 'completed', enteredAt: rel(-29), completedAt: rel(-18), score: 4.9, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l3', status: 'completed', enteredAt: rel(-18), completedAt: rel(-6), score: 4.6, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l4', status: 'scheduled', enteredAt: rel(-6) },
    ],
    screening: {
      overallMatch: 91, mustHaveMatch: 94, niceToHaveMatch: 82,
      experienceRelevance: 93, domainMatch: 96, locationFit: 100,
      skillMatches: [
        sm('REQ-2049', 'c1_esc', 96, ['"Owns escalation management for 12 strategic accounts across India and SAARC"', '"Reduced Sev-1 mean closure time from 71 to 26 hours over six quarters"']),
        sm('REQ-2049', 'c1_hw', 88, ['"Component-level diagnosis on commercial notebook and workstation fleets" (HP Inc.)', '"Built the firmware regression triage process still used by the APAC team"']),
        sm('REQ-2049', 'c1_cx', 94, ['"Runs monthly executive QBRs with customer CIOs; CSAT moved 7.2 → 8.9"']),
        sm('REQ-2049', 'c1_strat', 78, ['Executive PG, IIM Bangalore (2019)', 'No explicit P&L or segment-economics ownership on the CV']),
        sm('REQ-2049', 'c1_exec', 90, ['"Reduced Sev-1 mean closure time from 71 to 26 hours over six quarters" — sustained, not a one-off']),
        sm('REQ-2049', 'c1_team', 85, ['"Leads a team of 11 solution engineers across Bangalore and Hyderabad"']),
        sm('REQ-2049', 'c1_pres', 89, ['Monthly executive QBRs with customer CIOs']),
        sm('REQ-2049', 'c1_plan', 82, ['"Built the firmware regression triage process" — evidence of process design, not just execution']),
      ],
      competencyEvidenceSummary:
        'Strongest evidence sits exactly where the framework is heaviest: escalation ownership and customer management together carry 25% of the weighting and both are backed by named, quantified outcomes. Hardware depth is present but four years stale — it sits in the HP tenure, not the current role.',
      strengths: [
        'Escalation ownership at comparable scale and segment, with a hard metric attached (71h → 26h)',
        'Executive customer relationships already held at CIO level',
        'Team of 11 across two locations — larger than the nine this role leads',
      ],
      risks: [
        'Hands-on hardware depth is four years stale; the L1 panel should probe rather than assume it',
        'No explicit segment-economics or P&L exposure — Strategic Acumen is the weakest must-have',
        '60-day notice against a target close 20 days out',
      ],
      suggestedDecision: 'Progress',
      rationale:
        'Clears every must-have except Strategic Acumen, which is marked Trainable in the framework. The two highest-weighted competencies (PC hardware 15%, Customer Management 15%) score 88 and 94 against a required proficiency of 5. Recommendation is Progress with a specific instruction to the L1 panel to test hardware recency.',
      recommendedQuestions: [
        'Your hardware diagnosis experience sits in the HP tenure. What have you personally diagnosed in the last 18 months?',
        'You reduced Sev-1 closure from 71 to 26 hours. What was the single change that moved it most?',
        'This role owns segment economics as well as service quality. Where have you had to make that trade-off?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching email, phone or name across the last 24 months of applications.' },
      screenedAt: rel(-40), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-41), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Ananya_Sharma_CV_2026.pdf',
    cvSummary: '13 years in enterprise technical services. Escalation and customer success leadership at Dell and HP, with hands-on hardware roots at Wipro.',
    diversity: { gender: 'Female', selfIdentified: true },
    recruiterNotes: [
      { id: 'n1', authorId: 'u_priya', at: rel(-36), text: 'Very strong TA screen. Articulate, brings numbers unprompted. Flagged hardware recency to Murugan ahead of L1.' },
      { id: 'n2', authorId: 'u_priya', at: rel(-18), text: 'Arjun rates her the strongest in the pool. Notice period is the live risk — started a soft conversation about buyout.' },
    ],
  },

  {
    id: 'CAN-4102', requisitionId: 'REQ-2049',
    name: 'Rohit Desai', initials: 'RD', tint: '#4A3AA7',
    email: 'rohit.desai@mailbox.com', phone: '+91 99870 44210',
    currentTitle: 'Manager, Technical Support Operations',
    currentOrganization: 'Lenovo', isExEmployee: true,
    location: 'Pune, India', country: 'IN',
    totalExperienceYears: 11, experiencePostQualification: 11,
    education: [{ institute: 'COEP Pune', qualification: 'B.E., Computer Engineering', year: '2014' }],
    workHistory: [
      {
        company: 'Lenovo', title: 'Manager, Technical Support Operations',
        from: '2021', to: 'Present', location: 'Pune',
        highlights: [
          'Runs L2/L3 support operations for the commercial notebook line across India',
          'Owns the defect-theme feedback loop into Product Engineering',
          'Team of 7; introduced a weekly escalation review that cut repeat escalations 31%',
        ],
      },
      {
        company: 'Lenovo', title: 'Senior Technical Specialist', from: '2017', to: '2021', location: 'Pune',
        highlights: ['Firmware and thermal fault diagnosis on ThinkPad and ThinkStation platforms', 'Authored the internal thermal-throttling diagnostic runbook'],
      },
      {
        company: 'Tech Mahindra', title: 'Support Engineer', from: '2014', to: '2017', location: 'Pune',
        highlights: ['Enterprise desktop support and imaging'],
      },
    ],
    skills: ['PC Hardware Diagnostics', 'Firmware', 'Thermal Analysis', 'Support Operations', 'Defect Management', 'Team Leadership'],
    source: 'Internal', appliedAt: rel(-33),
    noticePeriodDays: 30, currentSalary: '₹41,00,000', expectedSalary: '₹53,00,000',
    workAuthorisation: 'Indian citizen — no sponsorship required',
    reasonForChange: 'Internal move. Wants customer-facing ownership rather than back-line operations.',
    status: 'In Interview', currentStageKey: 's_l2',
    stageProgress: [
      { stageKey: 's_apply', status: 'completed', enteredAt: rel(-33), completedAt: rel(-33) },
      { stageKey: 's_ai', status: 'completed', enteredAt: rel(-33), completedAt: rel(-33) },
      { stageKey: 's_ta', status: 'completed', enteredAt: rel(-32), completedAt: rel(-27), score: 4.2, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l1', status: 'completed', enteredAt: rel(-27), completedAt: rel(-14), score: 5.2, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l2', status: 'scheduled', enteredAt: rel(-14) },
    ],
    screening: {
      overallMatch: 79, mustHaveMatch: 81, niceToHaveMatch: 74,
      experienceRelevance: 76, domainMatch: 98, locationFit: 88,
      skillMatches: [
        sm('REQ-2049', 'c1_esc', 82, ['"Introduced a weekly escalation review that cut repeat escalations 31%"', 'Escalation ownership is operational rather than customer-facing']),
        sm('REQ-2049', 'c1_hw', 97, ['"Firmware and thermal fault diagnosis on ThinkPad and ThinkStation platforms"', '"Authored the internal thermal-throttling diagnostic runbook"']),
        sm('REQ-2049', 'c1_cx', 58, ['No named customer accounts on the CV', 'Support operations role sits behind the account team']),
        sm('REQ-2049', 'c1_strat', 62, ['No segment or P&L exposure evident']),
        sm('REQ-2049', 'c1_exec', 88, ['31% reduction in repeat escalations, sustained across the tenure']),
        sm('REQ-2049', 'c1_team', 84, ['Team of 7 across a single location']),
        sm('REQ-2049', 'c1_pres', 61, ['No evidence of executive-level presentation on the CV']),
        sm('REQ-2049', 'c1_plan', 86, ['Authored a diagnostic runbook adopted as standard']),
      ],
      competencyEvidenceSummary:
        'The inverse profile to CAN-4101. Hardware depth is the best in the pool and completely current, but customer-facing and executive-presence evidence is thin — this candidate has always sat behind the account team.',
      strengths: [
        'Deepest and most current hardware and firmware capability in the pool',
        'Already knows the product line, the tooling and the defect-feedback path — near-zero ramp',
        '30-day notice, internal transfer, no sponsorship',
      ],
      risks: [
        'Customer Management scores 58 against a must-have at required proficiency 5 — the largest single gap',
        'Executive Presence at 61 with no supporting evidence; this role presents to CxOs monthly',
        'Never held a named account relationship',
      ],
      suggestedDecision: 'Recruiter Review Required',
      rationale:
        'Two must-have competencies (Customer Management 15%, Executive Presence 10%) fall below the threshold, which is why this is not an automatic Progress. Against that, hardware credibility at 97 is the highest recorded on this requisition and internal candidates carry a materially lower failure rate. This is a judgement call about whether customer-facing capability is trainable here — a recruiter decision, not a model one.',
      recommendedQuestions: [
        'You have run support operations, not accounts. What makes you think you can hold a CIO relationship?',
        'Describe the closest you have come to owning a customer conversation when the news was bad.',
        'What would you need from Arjun in the first 90 days to close the customer-facing gap?',
      ],
      duplicateCheck: { status: 'possible', note: 'Internal employee record matched on email. Confirmed as the same person, applying through the internal mobility path — not a duplicate application.' },
      screenedAt: rel(-33), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-33), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Rohit_Desai_Internal_Profile.pdf',
    cvSummary: '11 years in technical support, nine of them on this product line. Deepest hardware credibility in the pool; least customer exposure.',
    diversity: { gender: 'Male', selfIdentified: true },
    recruiterNotes: [
      { id: 'n1', authorId: 'u_priya', at: rel(-27), text: 'Internal. Murugan rates the technical depth extremely highly. Progressing despite the CX gap because the L2 panel is the right place to test it.' },
    ],
  },

  {
    id: 'CAN-4103', requisitionId: 'REQ-2049',
    name: 'Kavya Nair', initials: 'KN', tint: '#EB6834',
    email: 'kavya.nair@mailbox.com', phone: '+91 90030 71265',
    currentTitle: 'Regional Service Delivery Lead',
    currentOrganization: 'HCLTech', isExEmployee: false,
    location: 'Chennai, India', country: 'IN',
    totalExperienceYears: 12, experiencePostQualification: 10,
    education: [
      { institute: 'Anna University', qualification: 'B.E., Electrical & Electronics', year: '2013' },
      { institute: 'ISB Hyderabad', qualification: 'PGP in Management', year: '2016' },
    ],
    workHistory: [
      {
        company: 'HCLTech', title: 'Regional Service Delivery Lead', from: '2019', to: 'Present', location: 'Chennai',
        highlights: [
          'Owns service delivery for six enterprise accounts across India and Sri Lanka, ~$95M ACV',
          'Carries a service P&L of $22M with margin accountability',
          'Team of 14 across Chennai and Colombo; attrition held at 8% against a 19% org average',
          'Presents to customer CxOs quarterly and to the delivery board monthly',
        ],
      },
      {
        company: 'IBM', title: 'Service Delivery Manager', from: '2016', to: '2019', location: 'Bangalore',
        highlights: ['Ran hardware and infrastructure delivery for two banking clients', 'Led the recovery of a red account back to green within two quarters'],
      },
      { company: 'Infosys', title: 'Systems Engineer', from: '2013', to: '2016', location: 'Chennai', highlights: ['Enterprise infrastructure support'] },
    ],
    skills: ['Service Delivery', 'P&L Ownership', 'Customer Management', 'Escalation Management', 'Team Leadership', 'Margin & Cost Management', 'Executive Communication'],
    source: 'LinkedIn', appliedAt: rel(-30),
    noticePeriodDays: 90, currentSalary: '₹46,00,000', expectedSalary: '₹60,00,000',
    workAuthorisation: 'Indian citizen — no sponsorship required',
    reasonForChange: 'Services business has moved away from hardware. Wants to return to a product-led organisation with a real install base.',
    status: 'In Interview', currentStageKey: 's_l3',
    stageProgress: [
      { stageKey: 's_apply', status: 'completed', enteredAt: rel(-30), completedAt: rel(-30) },
      { stageKey: 's_ai', status: 'completed', enteredAt: rel(-30), completedAt: rel(-29) },
      { stageKey: 's_ta', status: 'completed', enteredAt: rel(-29), completedAt: rel(-25), score: 4.5, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l1', status: 'completed', enteredAt: rel(-25), completedAt: rel(-16), score: 4.1, decision: 'Can be considered - on Hold' },
      { stageKey: 's_l2', status: 'completed', enteredAt: rel(-16), completedAt: rel(-4), score: 5.15, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's_l3', status: 'scheduled', enteredAt: rel(-4) },
    ],
    screening: {
      overallMatch: 84, mustHaveMatch: 80, niceToHaveMatch: 91,
      experienceRelevance: 88, domainMatch: 74, locationFit: 92,
      skillMatches: [
        sm('REQ-2049', 'c1_esc', 86, ['"Led the recovery of a red account back to green within two quarters" (IBM)']),
        sm('REQ-2049', 'c1_hw', 64, ['Infrastructure and delivery background rather than component-level hardware', 'No firmware or diagnostic tooling named on the CV']),
        sm('REQ-2049', 'c1_cx', 95, ['"Owns service delivery for six enterprise accounts across India and Sri Lanka, ~$95M ACV"', '"Presents to customer CxOs quarterly"']),
        sm('REQ-2049', 'c1_strat', 93, ['"Carries a service P&L of $22M with margin accountability" — the only candidate with real P&L ownership']),
        sm('REQ-2049', 'c1_exec', 87, ['"Attrition held at 8% against a 19% org average" — sustained operating discipline']),
        sm('REQ-2049', 'c1_team', 91, ['Team of 14 across two countries']),
        sm('REQ-2049', 'c1_pres', 92, ['Quarterly CxO and monthly delivery-board exposure']),
        sm('REQ-2049', 'c1_plan', 85, ['Structured account-recovery narrative at IBM']),
      ],
      competencyEvidenceSummary:
        'The strongest commercial and leadership profile in the pool, and the only candidate with genuine P&L accountability. The gap is squarely on hardware: this is a services-delivery career, not a product-engineering one.',
      strengths: [
        'Only candidate with direct P&L and margin ownership — closes the framework\'s weakest area',
        'Customer Management at 95, with named accounts and quantified ACV',
        'Retention record suggests she can hold a team through a hard year',
      ],
      risks: [
        'PC Hardware scores 64 against a 15%-weighted must-have at required proficiency 5 — the single biggest framework risk',
        '90-day notice period against a target close 20 days out',
        'Domain match 74 — services organisation, not an OEM',
      ],
      suggestedDecision: 'Progress',
      rationale:
        'Progress with an explicit caveat. Seven of eight competencies clear the bar comfortably; the hardware gap is real and was confirmed at L1, which returned "Can be considered - on Hold" at 4.1. L2 then scored 5.15, the highest single-stage score on this requisition. The hiring decision therefore turns on how much hands-on credibility the team genuinely needs from its manager — a human judgement.',
      recommendedQuestions: [
        'Your hardware exposure is at the infrastructure layer. How would you earn credibility with nine solution engineers in month one?',
        'You carry a $22M service P&L. What decision did that accountability change?',
        'Your notice is 90 days. What flexibility genuinely exists?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-29), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-30), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Kavya_Nair_Resume.pdf',
    cvSummary: '12 years in enterprise service delivery with P&L ownership. Strongest commercial profile in the pool; lightest on hands-on hardware.',
    diversity: { gender: 'Female', selfIdentified: true },
    recruiterNotes: [
      { id: 'n1', authorId: 'u_priya', at: rel(-16), text: 'L1 came back amber on hardware exactly as the screen predicted. Arjun still wants to see her — L2 was outstanding.' },
    ],
  },

  {
    id: 'CAN-4104', requisitionId: 'REQ-2049',
    name: 'Vikram Shetty', initials: 'VS', tint: '#1BAF7A',
    email: 'vikram.shetty@mailbox.com', phone: '+91 96320 55471',
    currentTitle: 'Escalation Manager, Enterprise Infrastructure',
    currentOrganization: 'Cisco', isExEmployee: false,
    location: 'Mumbai, India', country: 'IN',
    totalExperienceYears: 9, experiencePostQualification: 9,
    education: [{ institute: 'VJTI Mumbai', qualification: 'B.Tech, Information Technology', year: '2016' }],
    workHistory: [
      {
        company: 'Cisco', title: 'Escalation Manager, Enterprise Infrastructure', from: '2021', to: 'Present', location: 'Mumbai',
        highlights: [
          'Sev-1 escalation ownership across the West India enterprise install base',
          'Runs the customer executive communication cadence during active incidents',
          'Individual contributor with matrixed authority over 20+ engineers during incidents',
        ],
      },
      { company: 'Juniper Networks', title: 'Senior Technical Support Engineer', from: '2018', to: '2021', location: 'Bangalore', highlights: ['Hardware and platform fault isolation on routing and switching estates'] },
      { company: 'Tata Communications', title: 'Network Engineer', from: '2016', to: '2018', location: 'Mumbai', highlights: ['Enterprise network operations'] },
    ],
    skills: ['Escalation Management', 'Incident Command', 'Networking Hardware', 'Customer Communication', 'Root Cause Analysis'],
    source: 'Careers Site', appliedAt: rel(-4),
    noticePeriodDays: 45, currentSalary: '₹34,00,000', expectedSalary: '₹50,00,000',
    workAuthorisation: 'Indian citizen — no sponsorship required',
    reasonForChange: 'Wants to move from an individual-contributor escalation role into people leadership.',
    status: 'AI Screened', currentStageKey: 's_ta',
    stageProgress: [
      { stageKey: 's_apply', status: 'completed', enteredAt: rel(-4), completedAt: rel(-4) },
      { stageKey: 's_ai', status: 'completed', enteredAt: rel(-4), completedAt: rel(-3) },
      { stageKey: 's_ta', status: 'not_started' },
    ],
    screening: {
      overallMatch: 68, mustHaveMatch: 64, niceToHaveMatch: 77,
      experienceRelevance: 66, domainMatch: 71, locationFit: 74,
      skillMatches: [
        sm('REQ-2049', 'c1_esc', 91, ['"Sev-1 escalation ownership across the West India enterprise install base"', '"Runs the customer executive communication cadence during active incidents"']),
        sm('REQ-2049', 'c1_hw', 55, ['Networking hardware, not PC or workstation platforms', 'No commercial notebook or firmware experience on the CV']),
        sm('REQ-2049', 'c1_cx', 70, ['Customer communication during incidents; no ongoing account ownership']),
        sm('REQ-2049', 'c1_strat', 48, ['No segment, P&L or strategy exposure']),
        sm('REQ-2049', 'c1_exec', 74, ['Incident cadence ownership; no team operating rhythm evidenced']),
        sm('REQ-2049', 'c1_team', 66, ['Matrixed authority during incidents only — never a line manager']),
        sm('REQ-2049', 'c1_pres', 72, ['Executive comms during incidents']),
        sm('REQ-2049', 'c1_plan', 69, ['Root-cause analysis discipline evident']),
      ],
      competencyEvidenceSummary:
        'Genuinely strong on escalation — arguably the purest escalation background in the pool — but the hardware domain is adjacent rather than matching, and this would be a first people-leadership role at Band 8.',
      strengths: [
        'Escalation Management at 91 with incident-command discipline',
        'Comfortable owning customer executive comms under pressure',
        'Motivated and available at 45 days',
      ],
      risks: [
        'Networking hardware, not PC hardware — the 15% must-have does not transfer cleanly',
        'Never managed a team; this role leads nine people at Band 8',
        'Strategic Acumen at 48 is the lowest recorded on this requisition',
      ],
      suggestedDecision: 'Recruiter Review Required',
      rationale:
        'Three must-haves fall short and the candidate has no line-management history, which is normally disqualifying at Band 8. The model is not recommending rejection: escalation capability is exceptional and the hiring manager has previously hired first-time managers into this team successfully. A recruiter should make this call after a screening conversation.',
      recommendedQuestions: [
        'This would be your first line-management role. What have you done to prepare for it?',
        'Your hardware background is networking. How quickly could you get credible on notebook and workstation platforms?',
        'Tell me about an escalation where you had to direct engineers who did not report to you.',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-3), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-4), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Vikram_Shetty_CV.pdf',
    cvSummary: '9 years in escalation and incident management, networking-led. First-time people-leadership candidate.',
    diversity: { gender: 'Male', selfIdentified: true },
    recruiterNotes: [],
  },

  /* ── REQ-2076 · Staff Platform Engineer ──────────────────────────── */
  {
    id: 'CAN-4105', requisitionId: 'REQ-2076',
    name: 'Elif Demir', initials: 'ED', tint: '#008300',
    email: 'elif.demir@mailbox.com', phone: '+44 7700 903221',
    currentTitle: 'Principal Engineer, Platform',
    currentOrganization: 'Monzo', isExEmployee: false,
    location: 'London, United Kingdom', country: 'GB',
    totalExperienceYears: 12, experiencePostQualification: 12,
    education: [{ institute: 'Boğaziçi University', qualification: 'BSc, Computer Engineering', year: '2013' }],
    workHistory: [
      {
        company: 'Monzo', title: 'Principal Engineer, Platform', from: '2021', to: 'Present', location: 'London',
        highlights: [
          'Designed the multi-region event backbone handling 2.4B events/day across three AWS regions',
          'Incident commander on 40+ Sev-1s; rewrote the incident command model now used company-wide',
          'Owns the Kubernetes upgrade strategy across 60 production clusters',
          'Mentors nine senior engineers across four squads; no direct reports',
        ],
      },
      {
        company: 'Deliveroo', title: 'Staff Engineer', from: '2017', to: '2021', location: 'London',
        highlights: ['Led the migration from a monolith to event-driven services', 'Introduced the RFC process still used by the platform group'],
      },
      { company: 'Spotify', title: 'Backend Engineer', from: '2013', to: '2017', location: 'Stockholm', highlights: ['Go and Java services on the personalisation platform'] },
    ],
    skills: ['Distributed Systems', 'Kubernetes', 'Terraform', 'AWS', 'Go', 'Kafka', 'Incident Command', 'Technical Writing', 'Mentoring'],
    source: 'Referral', appliedAt: rel(-31),
    noticePeriodDays: 30, currentSalary: '£128,000', expectedSalary: '£140,000',
    workAuthorisation: 'UK Skilled Worker visa — transfer required',
    reasonForChange: 'Wants a platform serving internal engineers rather than a regulated consumer product, and a broader architectural remit.',
    status: 'Offer Recommended', currentStageKey: 's2_offer',
    stageProgress: [
      { stageKey: 's2_apply', status: 'completed', enteredAt: rel(-31), completedAt: rel(-31) },
      { stageKey: 's2_ai', status: 'completed', enteredAt: rel(-31), completedAt: rel(-31) },
      { stageKey: 's2_ta', status: 'completed', enteredAt: rel(-30), completedAt: rel(-27), score: 5.1, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_l1', status: 'completed', enteredAt: rel(-27), completedAt: rel(-21), score: 5.4, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_l2', status: 'completed', enteredAt: rel(-21), completedAt: rel(-12), score: 5.6, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_l3', status: 'completed', enteredAt: rel(-12), completedAt: rel(-5), score: 5.3, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_offer', status: 'in_progress', enteredAt: rel(-5) },
    ],
    screening: {
      overallMatch: 94, mustHaveMatch: 96, niceToHaveMatch: 90,
      experienceRelevance: 95, domainMatch: 92, locationFit: 84,
      skillMatches: [
        sm('REQ-2076', 'c2_dist', 97, ['"Designed the multi-region event backbone handling 2.4B events/day across three AWS regions"', '"Led the migration from a monolith to event-driven services" (Deliveroo)']),
        sm('REQ-2076', 'c2_cloud', 95, ['"Owns the Kubernetes upgrade strategy across 60 production clusters"']),
        sm('REQ-2076', 'c2_quality', 88, ['"Introduced the RFC process still used by the platform group"']),
        sm('REQ-2076', 'c2_incident', 96, ['"Incident commander on 40+ Sev-1s; rewrote the incident command model now used company-wide"']),
        sm('REQ-2076', 'c2_think', 91, ['RFC authorship and architectural migration leadership']),
        sm('REQ-2076', 'c2_mentor', 93, ['"Mentors nine senior engineers across four squads; no direct reports" — exactly the staff shape this role needs']),
        sm('REQ-2076', 'c2_collab', 87, ['Platform work across four squads at Monzo']),
      ],
      competencyEvidenceSummary:
        'Every must-have clears comfortably and three exceed 95. The staff-shaped influence model — nine mentees, no reports — matches the role definition almost exactly.',
      strengths: [
        'Multi-region event architecture at a scale above this role\'s current requirement',
        'Incident command track record that changed an organisation, not just an incident',
        'Influence without authority already proven at the exact scope this role defines',
      ],
      risks: [
        'Visa transfer required — adds 3–5 weeks to start date',
        'Compensation expectation sits at the top of the band',
      ],
      suggestedDecision: 'Progress',
      rationale:
        'Highest overall match recorded across all three open requisitions. No must-have below 87. The only material risks are commercial and administrative rather than capability-related.',
      recommendedQuestions: [
        'Your visa needs transferring. What is your realistic earliest start?',
        'You have operated at a larger event scale than we run today. What would you find frustrating here?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-31), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-31), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Elif_Demir_CV.pdf',
    cvSummary: '12 years in platform engineering across Monzo, Deliveroo and Spotify. Multi-region event architecture and incident command at scale.',
    diversity: { gender: 'Female', selfIdentified: true },
    recruiterNotes: [
      { id: 'n1', authorId: 'u_marcus', at: rel(-5), text: 'Sophie wants to move fast — competing process at a fintech. Offer build with Comp today, visa transfer flagged to Mobility.' },
    ],
  },

  {
    id: 'CAN-4106', requisitionId: 'REQ-2076',
    name: 'James Okonkwo', initials: 'JO', tint: '#E87BA4',
    email: 'james.okonkwo@mailbox.com', phone: '+44 7700 917864',
    currentTitle: 'Senior Site Reliability Engineer',
    currentOrganization: 'Sky', isExEmployee: false,
    location: 'Leeds, United Kingdom', country: 'GB',
    totalExperienceYears: 9, experiencePostQualification: 9,
    education: [{ institute: 'University of Manchester', qualification: 'MEng, Computer Science', year: '2016' }],
    workHistory: [
      {
        company: 'Sky', title: 'Senior Site Reliability Engineer', from: '2020', to: 'Present', location: 'Leeds',
        highlights: [
          'Owns SLOs for the streaming delivery path serving 14M concurrent peak',
          'Rebuilt the on-call rotation and cut pages per engineer by 62%',
          'Terraform and Kubernetes across two AWS regions',
        ],
      },
      { company: 'Sainsbury\'s Tech', title: 'DevOps Engineer', from: '2016', to: '2020', location: 'London', highlights: ['CI/CD and container platform build-out'] },
    ],
    skills: ['SRE', 'Kubernetes', 'Terraform', 'AWS', 'Python', 'Observability', 'On-call Design'],
    source: 'Job Board', appliedAt: rel(-24),
    noticePeriodDays: 60, currentSalary: '£96,000', expectedSalary: '£120,000',
    workAuthorisation: 'British citizen — no sponsorship required',
    reasonForChange: 'Wants to move from operating other people\'s systems to designing them.',
    status: 'In Interview', currentStageKey: 's2_l2',
    stageProgress: [
      { stageKey: 's2_apply', status: 'completed', enteredAt: rel(-24), completedAt: rel(-24) },
      { stageKey: 's2_ai', status: 'completed', enteredAt: rel(-24), completedAt: rel(-24) },
      { stageKey: 's2_ta', status: 'completed', enteredAt: rel(-23), completedAt: rel(-19), score: 4.3, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_l1', status: 'completed', enteredAt: rel(-19), completedAt: rel(-9), score: 4.8, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's2_l2', status: 'scheduled', enteredAt: rel(-9) },
    ],
    screening: {
      overallMatch: 76, mustHaveMatch: 72, niceToHaveMatch: 84,
      experienceRelevance: 78, domainMatch: 81, locationFit: 79,
      skillMatches: [
        sm('REQ-2076', 'c2_dist', 63, ['Operates distributed systems; no evidence of designing one from scratch', 'No multi-region write-path or consistency work on the CV']),
        sm('REQ-2076', 'c2_cloud', 92, ['"Terraform and Kubernetes across two AWS regions"']),
        sm('REQ-2076', 'c2_quality', 74, ['CI/CD ownership; testing philosophy not evidenced']),
        sm('REQ-2076', 'c2_incident', 94, ['"Rebuilt the on-call rotation and cut pages per engineer by 62%"', '"Owns SLOs for the streaming delivery path serving 14M concurrent peak"']),
        sm('REQ-2076', 'c2_think', 80, ['On-call redesign shows systematic decomposition']),
        sm('REQ-2076', 'c2_mentor', 66, ['No mentoring or technical-influence evidence on the CV']),
        sm('REQ-2076', 'c2_collab', 78, ['Works across delivery and product teams']),
      ],
      competencyEvidenceSummary:
        'Excellent operator with a genuine reliability record. The gap is design: this is an SRE profile applying to a design-led staff role, and the two heaviest competencies in the framework are design competencies.',
      strengths: [
        'Reliability and incident work at real consumer scale (14M concurrent)',
        'The on-call redesign is the kind of systemic fix this team values',
        'No sponsorship needed, and locally available',
      ],
      risks: [
        'Distributed Systems Design at 63 against an 18%-weighted must-have — the heaviest single competency in the framework',
        'Mentoring at 66; staff scope is explicitly an influence role',
        'Career step from senior to staff is a real jump, not a title change',
      ],
      suggestedDecision: 'Recruiter Review Required',
      rationale:
        'The framework weights design at 18% and this candidate\'s evidence is operational. That is a legitimate reason for caution, not for rejection — the L2 system-design interview is precisely the instrument that answers this question, and L1 already returned 4.8. Recommend the recruiter progress to L2 and treat that session as the decision point.',
      recommendedQuestions: [
        'You have operated distributed systems. Tell me about one you designed.',
        'What would you do differently if you owned the architecture rather than the SLO?',
        'Staff is an influence role. Where have you changed a technical direction you did not own?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-24), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-24), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'James_Okonkwo_CV.pdf',
    cvSummary: '9 years in SRE and DevOps at consumer scale. Strong operator; design evidence is the open question.',
    diversity: { gender: 'Male', selfIdentified: true },
    recruiterNotes: [
      { id: 'n1', authorId: 'u_marcus', at: rel(-19), text: 'Hana liked him a lot at L1. Framing L2 explicitly as the design bar — Sophie and Soundar both on the panel.' },
    ],
  },

  {
    id: 'CAN-4107', requisitionId: 'REQ-2076',
    name: 'Mei Lin Tan', initials: 'MT', tint: '#EDA100',
    email: 'meilin.tan@mailbox.com', phone: '+65 8123 4477',
    currentTitle: 'Lead Engineer, Infrastructure',
    currentOrganization: 'Grab', isExEmployee: false,
    location: 'Singapore', country: 'SG',
    totalExperienceYears: 10, experiencePostQualification: 10,
    education: [{ institute: 'NUS', qualification: 'BComp, Computer Science', year: '2015' }],
    workHistory: [
      {
        company: 'Grab', title: 'Lead Engineer, Infrastructure', from: '2020', to: 'Present', location: 'Singapore',
        highlights: [
          'Designed the regional service mesh across six Southeast Asian markets',
          'Owns the multi-tenant Kubernetes platform serving 200+ services',
          'Led the migration to a cell-based architecture after a region-wide outage',
        ],
      },
      { company: 'Shopee', title: 'Senior Software Engineer', from: '2015', to: '2020', location: 'Singapore', highlights: ['Go services on the order platform', 'Built the internal deployment tooling'] },
    ],
    skills: ['Distributed Systems', 'Service Mesh', 'Kubernetes', 'Go', 'Multi-tenancy', 'Cell-based Architecture'],
    source: 'LinkedIn', appliedAt: rel(-2),
    noticePeriodDays: 90, currentSalary: 'SGD 210,000', expectedSalary: '£125,000',
    workAuthorisation: 'Singapore citizen — UK sponsorship required',
    reasonForChange: 'Relocating to the UK for family reasons; wants to keep working on platform problems at scale.',
    status: 'AI Screened', currentStageKey: 's2_ta',
    stageProgress: [
      { stageKey: 's2_apply', status: 'completed', enteredAt: rel(-2), completedAt: rel(-2) },
      { stageKey: 's2_ai', status: 'completed', enteredAt: rel(-2), completedAt: rel(-1) },
      { stageKey: 's2_ta', status: 'not_started' },
    ],
    screening: {
      overallMatch: 88, mustHaveMatch: 90, niceToHaveMatch: 83,
      experienceRelevance: 89, domainMatch: 90, locationFit: 46,
      skillMatches: [
        sm('REQ-2076', 'c2_dist', 94, ['"Designed the regional service mesh across six Southeast Asian markets"', '"Led the migration to a cell-based architecture after a region-wide outage"']),
        sm('REQ-2076', 'c2_cloud', 93, ['"Owns the multi-tenant Kubernetes platform serving 200+ services"']),
        sm('REQ-2076', 'c2_quality', 82, ['"Built the internal deployment tooling" (Shopee)']),
        sm('REQ-2076', 'c2_incident', 86, ['Cell-based migration driven by a region-wide outage — post-incident systemic change']),
        sm('REQ-2076', 'c2_think', 89, ['Architectural response to an outage rather than a tactical patch']),
        sm('REQ-2076', 'c2_mentor', 79, ['"Lead Engineer" title implies influence; no named mentees on the CV']),
        sm('REQ-2076', 'c2_collab', 84, ['Platform serving 200+ services across product teams']),
      ],
      competencyEvidenceSummary:
        'Design evidence is the strongest of any candidate on this requisition after CAN-4105 — the cell-based migration in particular is exactly the reasoning this role needs. The obstacle is logistical, not technical.',
      strengths: [
        'Genuine multi-region architecture design, including a post-outage rebuild',
        'Multi-tenant platform ownership at 200+ services',
        'Motivated by a relocation already in progress, not by a counter-offer',
      ],
      risks: [
        'Location fit 46 — UK sponsorship required and a 90-day notice period',
        'Earliest realistic start is roughly 4.5 months out',
        'Compensation conversion from SGD needs a market check before screening',
      ],
      suggestedDecision: 'Recruiter Review Required',
      rationale:
        'Capability clearly clears the bar. The reason this is not an automatic Progress is timing: sponsorship plus a 90-day notice puts the start date well past the target close, and there is already an offer-stage candidate on this requisition. Whether to run a second strong candidate in parallel is a recruiting decision.',
      recommendedQuestions: [
        'What is your relocation timeline, and is it fixed?',
        'Walk me through the cell-based migration — what did you get wrong first time?',
        'How do you think about compensation moving from SGD to GBP?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-1), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-2), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'MeiLin_Tan_CV.pdf',
    cvSummary: '10 years in infrastructure and platform engineering at Grab and Shopee. Strong architecture evidence; relocation dependency.',
    diversity: { selfIdentified: false },
    recruiterNotes: [],
  },

  /* ── REQ-2088 · Regional Finance Controller ──────────────────────── */
  {
    id: 'CAN-4108', requisitionId: 'REQ-2088',
    name: 'Carlos Mendes', initials: 'CM', tint: '#E34948',
    email: 'carlos.mendes@mailbox.com', phone: '+65 9012 7734',
    currentTitle: 'Finance Director, APAC',
    currentOrganization: 'Schneider Electric', isExEmployee: false,
    location: 'Singapore', country: 'SG',
    totalExperienceYears: 17, experiencePostQualification: 14,
    education: [
      { institute: 'Universidade de São Paulo', qualification: 'BSc, Accounting', year: '2008' },
      { institute: 'ACCA', qualification: 'Chartered Certified Accountant', year: '2012' },
    ],
    workHistory: [
      {
        company: 'Schneider Electric', title: 'Finance Director, APAC', from: '2019', to: 'Present', location: 'Singapore',
        highlights: [
          'Owns statutory and management close for five APAC entities under IFRS',
          'Team of 14 across Singapore, Kuala Lumpur and Sydney',
          'Owns the SOX control environment; cleared two consecutive audits with no findings',
          'Refused a A$40M channel deal structure on revenue-recognition grounds; restructured and closed at better margin',
        ],
      },
      {
        company: 'Deloitte', title: 'Senior Manager, Audit & Assurance', from: '2012', to: '2019', location: 'São Paulo / Singapore',
        highlights: ['Led statutory audits for technology and industrial clients across LATAM and APAC', 'Transfer pricing advisory across four jurisdictions'],
      },
    ],
    skills: ['IFRS', 'Statutory Reporting', 'Transfer Pricing', 'Revenue Recognition', 'SOX', 'Channel Economics', 'Team Leadership', 'Audit'],
    source: 'Agency', appliedAt: rel(-52),
    noticePeriodDays: 90, currentSalary: 'SGD 295,000', expectedSalary: 'SGD 330,000',
    workAuthorisation: 'Singapore PR — no sponsorship required',
    reasonForChange: 'Current scope is shrinking after a regional restructure. Wants a role with genuine commercial influence.',
    status: 'In Interview', currentStageKey: 's3_l4',
    stageProgress: [
      { stageKey: 's3_apply', status: 'completed', enteredAt: rel(-52), completedAt: rel(-52) },
      { stageKey: 's3_ai', status: 'completed', enteredAt: rel(-52), completedAt: rel(-51) },
      { stageKey: 's3_ta', status: 'completed', enteredAt: rel(-51), completedAt: rel(-46), score: 4.9, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's3_l1', status: 'completed', enteredAt: rel(-46), completedAt: rel(-38), score: 5.3, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's3_l2', status: 'completed', enteredAt: rel(-38), completedAt: rel(-24), score: 4.8, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's3_l3', status: 'completed', enteredAt: rel(-24), completedAt: rel(-11), score: 5.5, decision: 'Good to Go - Found to be suitable' },
      { stageKey: 's3_l4', status: 'scheduled', enteredAt: rel(-11) },
      { stageKey: 's3_l5', status: 'not_started' },
    ],
    screening: {
      overallMatch: 89, mustHaveMatch: 91, niceToHaveMatch: 85,
      experienceRelevance: 92, domainMatch: 78, locationFit: 100,
      skillMatches: [
        sm('REQ-2088', 'c3_ctrl', 95, ['"Owns statutory and management close for five APAC entities under IFRS"', '"Refused a A$40M channel deal structure on revenue-recognition grounds"']),
        sm('REQ-2088', 'c3_know', 93, ['ACCA qualified; seven years Deloitte audit', '"Transfer pricing advisory across four jurisdictions"']),
        sm('REQ-2088', 'c3_seg', 72, ['Industrial and energy channel, not technology hardware', 'Channel economics evidenced, but in a different route to market']),
        sm('REQ-2088', 'c3_comp', 96, ['"Cleared two consecutive audits with no findings"', 'The refused deal is direct evidence of independence under commercial pressure']),
        sm('REQ-2088', 'c3_strat', 87, ['"Restructured and closed at better margin" — the refusal improved the commercial outcome']),
        sm('REQ-2088', 'c3_people', 88, ['"Team of 14 across Singapore, Kuala Lumpur and Sydney"']),
        sm('REQ-2088', 'c3_exec', 85, ['End-to-end ownership from audit through to deal structuring']),
      ],
      competencyEvidenceSummary:
        'The refused A$40M deal is the single most useful line on this CV — it evidences controllership, compliance independence and strategic acumen simultaneously, which is exactly the combination the framework weights most heavily.',
      strengths: [
        'Controllership and compliance both above 93, with a concrete independence example',
        'Multi-entity IFRS close at greater scale than this role requires',
        'Singapore PR, no sponsorship, already leads a cross-border team',
      ],
      risks: [
        'Segment acumen at 72 — industrial channel rather than technology hardware',
        '90-day notice against a target close date two days away',
        'Requisition has been open 80 days; this is the only candidate at panel stage',
      ],
      suggestedDecision: 'Progress',
      rationale:
        'Every must-have except Business Segment Acumen clears comfortably, and that one is marked Trainable in the framework. Four completed stages average 5.1 on the IAS six-point scale.',
      recommendedQuestions: [
        'Talk me through the A$40M refusal — who pushed back, and how did you hold the line?',
        'Hardware channel economics differ from industrial. What would you need to learn?',
        'Your notice is 90 days. What is genuinely negotiable?',
      ],
      duplicateCheck: { status: 'clear', note: 'No matching records.' },
      screenedAt: rel(-51), modelVersion: 'nexora-screen-v4.2',
    },
    consent: { given: true, at: rel(-52), policyVersion: 'v3.1', dataRetentionMonths: 24 },
    cvFileName: 'Carlos_Mendes_CV.pdf',
    cvSummary: '17 years across Big 4 audit and regional controllership. ACCA qualified, multi-entity IFRS, strong independence record.',
    recruiterNotes: [
      { id: 'n1', authorId: 'u_priya', at: rel(-11), text: 'Requisition is 80 days old and this is our only panel-stage candidate. Escalated to Daniel — need either a decision or a sourcing reset this week.' },
    ],
  },
]

export const candidateById = (id: string) => CANDIDATES.find(c => c.id === id)
export const candidatesForReq = (reqId: string) => CANDIDATES.filter(c => c.requisitionId === reqId)
