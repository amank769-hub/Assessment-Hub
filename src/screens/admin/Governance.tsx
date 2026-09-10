import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, CalendarClock, Check, Download, FileText, Globe2, Lock, Plug,
  ScrollText, Search, Shield, ShieldCheck, Sparkles, UserCheck, X,
} from 'lucide-react'
import { useApp } from '@/store/AppStore'
import { COUNTRIES, ROLE_LABELS, ROLE_PERMISSIONS, personById } from '@/data'
import { fmtDate, fmtRelative } from '@/lib/dates'
import {
  Avatar, Badge, Button, Card, CardHeader, cx, EmptyState, Input, Segmented,
  Table, Tabs, Td, Th,
} from '@/components/ui'
import { Page, PageHeader, StatTile } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'
import type { Role } from '@/data/types'

type Tab = 'audit' | 'access' | 'consent' | 'regions' | 'integrations'

export default function Governance() {
  const { state } = useApp()
  const [tab, setTab] = useState<Tab>('audit')
  const [q, setQ] = useState('')
  const [scope, setScope] = useState('all')

  const audit = useMemo(() => state.audit
    .filter(e => scope === 'all' || (scope === 'human' ? e.humanDecision : !e.humanDecision))
    .filter(e => !q || `${e.action} ${e.detail} ${e.entity} ${e.entityId} ${personById(e.actorId)?.name ?? ''}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => +new Date(b.at) - +new Date(a.at)), [state.audit, q, scope])

  const humanDecisions = state.audit.filter(e => e.humanDecision).length
  const consented = state.candidates.filter(c => c.consent.given).length

  return (
    <>
      <PageHeader
        title="Governance & audit"
        subtitle="Who can see what, who decided what, and what the platform is allowed to do with a candidate's data. If a hiring decision is ever challenged, this is the record."
        actions={<Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export audit log</Button>}
        tabs={
          <Tabs value={tab} onChange={setTab} tabs={[
            { value: 'audit', label: 'Audit trail', count: state.audit.length },
            { value: 'access', label: 'Role-based access' },
            { value: 'consent', label: 'Consent & privacy' },
            { value: 'regions', label: 'Countries & timezones' },
            { value: 'integrations', label: 'Integrations' },
          ]} />
        }
      />

      <Page>
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatTile label="Audit entries" value={state.audit.length} icon={<ScrollText className="h-3.5 w-3.5" />} accent={seriesAt(0)}
            hint="Every decision and configuration change, immutable" />
          <StatTile label="Human decision points" value={humanDecisions} icon={<UserCheck className="h-3.5 w-3.5" />} accent={RAG.good}
            hint="Actions attributed to a named person, not the model" />
          <StatTile label="Consent on file" value={`${consented}/${state.candidates.length}`} icon={<ShieldCheck className="h-3.5 w-3.5" />} accent={seriesAt(1)}
            hint="Explicit, versioned, and revocable from the candidate portal" />
          <StatTile label="Countries in scope" value={new Set(state.requisitions.map(r => r.country)).size} icon={<Globe2 className="h-3.5 w-3.5" />} accent={seriesAt(2)}
            hint="Each with its own timezone and data rules" />
        </div>

        {tab === 'audit' && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[15rem] max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search actions, entities or people" className="pl-9" />
              </div>
              <Segmented value={scope} onChange={setScope} options={[
                { value: 'all', label: `All (${state.audit.length})` },
                { value: 'human', label: `Human decisions (${humanDecisions})` },
                { value: 'system', label: `System & AI (${state.audit.length - humanDecisions})` },
              ]} />
            </div>

            {audit.length === 0 ? (
              <Card><EmptyState icon={<ScrollText className="h-5 w-5" />} title="No entries match" /></Card>
            ) : (
              <Card className="overflow-hidden">
                <Table>
                  <thead>
                    <tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Detail</Th><Th align="center">Type</Th></tr>
                  </thead>
                  <tbody>
                    {audit.map(e => {
                      const p = personById(e.actorId)
                      return (
                        <tr key={e.id} className="hover:bg-surface-page/60 align-top">
                          <Td className="whitespace-nowrap">
                            <span className="text-ink-soft">{fmtDate(e.at)}</span>
                            <span className="block text-2xs text-ink-faint">{fmtRelative(e.at)}</span>
                          </Td>
                          <Td>
                            <span className="inline-flex items-center gap-2 whitespace-nowrap">
                              {p ? <Avatar name={p.name} tint={p.tint} size={22} /> : <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-violet-100"><Sparkles className="h-3 w-3 text-violet-600" /></span>}
                              <span className="text-ink-soft">{p?.name ?? 'System'}</span>
                            </span>
                            <span className="block text-2xs text-ink-faint">{ROLE_LABELS[e.actorRole]}</span>
                          </Td>
                          <Td className="font-medium text-ink whitespace-nowrap">{e.action}</Td>
                          <Td className="whitespace-nowrap">
                            <span className="text-2xs text-ink-muted">{e.entity}</span>
                            <span className="block font-mono text-2xs text-electric-700">{e.entityId}</span>
                          </Td>
                          <Td className="max-w-[28rem]"><span className="text-2xs leading-relaxed text-ink-soft">{e.detail}</span></Td>
                          <Td align="center">
                            {e.humanDecision
                              ? <Badge tone="green">Human</Badge>
                              : <Badge tone="violet">System / AI</Badge>}
                          </Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </Card>
            )}

            <Card className="card-pad">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                Audit entries are append-only. Where an interviewer overrides an AI suggestion, both the suggested and the recorded value are kept —
                which is the only reliable way to find out whether a model is drifting, and in which direction.
              </p>
            </Card>
          </>
        )}

        {tab === 'access' && (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Role-based access control"
                subtitle="Enforced on every route, not merely hidden from the navigation. Switch role from the top-right menu to see it applied."
                icon={<Shield className="h-4 w-4" />} />
              <div className="mt-4 border-t border-surface-line">
                <Table>
                  <thead>
                    <tr>
                      <Th>Role</Th><Th>Screens</Th>
                      <Th align="center">Can decide</Th><Th align="center">Sees candidate PII</Th>
                      <Th align="center">Edits framework</Th><Th align="center">Sees compensation</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(ROLE_PERMISSIONS) as Role[]).map(r => {
                      const p = ROLE_PERMISSIONS[r]
                      const current = state.role === r
                      return (
                        <tr key={r} className={cx(current && 'bg-electric-50/40')}>
                          <Td>
                            <p className="font-medium text-ink whitespace-nowrap">{ROLE_LABELS[r]}{current && <Badge tone="blue" className="ml-2">Current</Badge>}</p>
                            <p className="mt-0.5 max-w-[22rem] text-2xs leading-snug text-ink-muted">{p.description}</p>
                          </Td>
                          <Td>
                            <div className="flex flex-wrap gap-1">
                              {p.screens.map(s => <span key={s} className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-2xs capitalize text-ink-soft">{s}</span>)}
                            </div>
                          </Td>
                          {[p.canDecide, p.canSeeCandidatePii, p.canEditFramework, p.canSeeCompensation].map((v, i) => (
                            <Td key={i} align="center">
                              {v ? <Check className="mx-auto h-4 w-4 text-rag-good" strokeWidth={2.6} /> : <X className="mx-auto h-4 w-4 text-ink-faint" strokeWidth={2.6} />}
                            </Td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Human decision points" subtitle="The places where the platform deliberately stops and waits for a person"
                icon={<UserCheck className="h-4 w-4" />} />
              <div className="card-pad pt-4 grid gap-3 md:grid-cols-2">
                {[
                  { t: 'Screening decision', d: 'AI produces a match score and a suggested decision. Progress, hold, reject and request-info are all recruiter actions. The model has no path to a rejection.' },
                  { t: 'Scorecard sign-off', d: 'AI drafts roughly 80% of every scorecard. It is not counted until an interviewer confirms each row, and sign-off is blocked until every row is rated and a decision recorded.' },
                  { t: 'Competency framework approval', d: 'Extraction is automatic. Approving a framework for reuse across requisitions requires a named person and weights totalling 100%.' },
                  { t: 'Offer recommendation', d: 'Analysis ranks evidence and cites it. It does not select a hire — that decision belongs to the hiring manager.' },
                  { t: 'Workflow changes', d: 'Adding or removing an interview level changes what every candidate is assessed against, so it is attributed and audited.' },
                  { t: 'Rejection reason', d: 'A rejection always carries a reason, chosen by a person, stored for reporting and shared with the candidate where policy requires it.' },
                ].map(x => (
                  <div key={x.t} className="rounded-xl border border-surface-line p-4">
                    <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
                      <ShieldCheck className="h-4 w-4 shrink-0 text-electric-600" />{x.t}
                    </p>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{x.d}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === 'consent' && (
          <div className="space-y-5">
            <Card className="overflow-hidden">
              <CardHeader title="Candidate consent register"
                subtitle="Explicit consent, captured at application, versioned against the policy in force at the time"
                icon={<ShieldCheck className="h-4 w-4" />} />
              <div className="mt-4 border-t border-surface-line">
                <Table>
                  <thead>
                    <tr><Th>Candidate</Th><Th>Country</Th><Th align="center">Consent</Th><Th>Policy</Th><Th>Recorded</Th><Th align="center">Retention</Th><Th align="center">Deletion due</Th></tr>
                  </thead>
                  <tbody>
                    {state.candidates.map(c => {
                      const due = new Date(c.consent.at)
                      due.setMonth(due.getMonth() + c.consent.dataRetentionMonths)
                      return (
                        <tr key={c.id} className="hover:bg-surface-page/60">
                          <Td>
                            <Link to={`/candidates/${c.id}`} className="inline-flex items-center gap-2">
                              <Avatar name={c.name} tint={c.tint} size={24} />
                              <span className="font-medium text-ink">{c.name}</span>
                            </Link>
                          </Td>
                          <Td className="whitespace-nowrap text-ink-soft">
                            {COUNTRIES.find(x => x.code === c.country)?.flag} {COUNTRIES.find(x => x.code === c.country)?.name}
                          </Td>
                          <Td align="center">
                            <Badge tone={c.consent.given ? 'green' : 'red'}>{c.consent.given ? 'Given' : 'Not given'}</Badge>
                          </Td>
                          <Td className="whitespace-nowrap text-ink-soft">{c.consent.policyVersion}</Td>
                          <Td className="whitespace-nowrap text-ink-soft tnum">{fmtDate(c.consent.at)}</Td>
                          <Td align="center" className="text-ink-soft">{c.consent.dataRetentionMonths} months</Td>
                          <Td align="center" className="text-ink-soft tnum">{fmtDate(due.toISOString())}</Td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader title="What the platform does with candidate data" icon={<FileText className="h-4 w-4" />} />
                <ul className="card-pad pt-3 space-y-2.5">
                  {[
                    'Assesses the CV and application against the published competency framework for the role applied to, and nothing else.',
                    'Produces a match score and a written summary, both visible to the candidate on request.',
                    'Retains data for the period stated at the point of consent, then deletes it automatically.',
                    'Never uses candidate data to train models outside the hiring process it was submitted to.',
                    'Honours withdrawal of consent within 24 hours, which removes the profile from screening and analysis.',
                  ].map(t => (
                    <li key={t} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rag-good" strokeWidth={2.6} />{t}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card>
                <CardHeader title="Demographic data by jurisdiction" subtitle="Collected only where reporting is lawful" icon={<Globe2 className="h-4 w-4" />} />
                <div className="card-pad pt-3 space-y-2">
                  {COUNTRIES.map(c => (
                    <div key={c.code} className="flex items-center justify-between gap-3 rounded-xl border border-surface-line p-3">
                      <span className="text-[13px] text-ink-soft">{c.flag} {c.name}</span>
                      <Badge tone={c.diversityReportingPermitted ? 'green' : 'neutral'}>
                        {c.diversityReportingPermitted ? 'Collected & reported' : 'Not collected'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'regions' && (
          <Card className="overflow-hidden">
            <CardHeader title="Countries, timezones and scheduling"
              subtitle="Interview times are stored as absolute instants and rendered in each interview's own timezone — 15:00 in Bangalore is a different moment from 15:00 in London."
              icon={<CalendarClock className="h-4 w-4" />} />
            <div className="mt-4 border-t border-surface-line">
              <Table>
                <thead>
                  <tr><Th>Country</Th><Th>Timezone</Th><Th align="center">Offset</Th><Th align="center">Local time now</Th><Th align="center">Requisitions</Th><Th align="center">Diversity reporting</Th></tr>
                </thead>
                <tbody>
                  {COUNTRIES.map(c => {
                    const reqCount = state.requisitions.filter(r => r.country === c.code).length
                    return (
                      <tr key={c.code} className="hover:bg-surface-page/60">
                        <Td className="whitespace-nowrap font-medium text-ink">{c.flag} {c.name}</Td>
                        <Td className="whitespace-nowrap text-ink-soft">{c.timezone}</Td>
                        <Td align="center" className="text-ink-soft">{c.utcOffset}</Td>
                        <Td align="center" className="text-ink-soft tnum">
                          {new Date().toLocaleTimeString('en-GB', { timeZone: c.timezone, hour: '2-digit', minute: '2-digit', hour12: false })}
                        </Td>
                        <Td align="center"><span className="tnum font-semibold text-ink">{reqCount}</span></Td>
                        <Td align="center">
                          <Badge tone={c.diversityReportingPermitted ? 'green' : 'neutral'}>{c.diversityReportingPermitted ? 'Permitted' : 'Not permitted'}</Badge>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          </Card>
        )}

        {tab === 'integrations' && (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Integrations" subtitle="What connects today and what is designed for but not yet wired up"
                icon={<Plug className="h-4 w-4" />} />
              <div className="card-pad pt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  { name: 'Email invites & reminders', status: 'live', detail: 'Interview invites, reschedules and overdue-feedback nudges go out automatically on every scheduling action.' },
                  { name: 'Branded PDF export', status: 'live', detail: 'Candidate comparisons and assessment summaries export to a print-ready branded layout from any screen.' },
                  { name: 'Calendar (Google / Outlook)', status: 'planned', detail: 'Two-way sync of panel availability and interview slots, so rescheduling stops needing a human broker.' },
                  { name: 'Video platform (Zoom / Teams)', status: 'planned', detail: 'Native meeting creation and recording ingestion, replacing the built-in room where a company has standardised elsewhere.' },
                  { name: 'ATS (Workday / SuccessFactors)', status: 'planned', detail: 'Requisition and candidate sync, so Nexora runs the interview layer without becoming a second system of record.' },
                  { name: 'HRIS offer handoff', status: 'planned', detail: 'Push the approved offer recommendation and evidence pack straight into the offer workflow.' },
                ].map(i => (
                  <div key={i.name} className="rounded-xl border border-surface-line p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-semibold leading-snug text-ink">{i.name}</p>
                      <Badge tone={i.status === 'live' ? 'green' : 'neutral'}>{i.status === 'live' ? 'Live' : 'Planned'}</Badge>
                    </div>
                    <p className="mt-1.5 text-2xs leading-relaxed text-ink-muted">{i.detail}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="card-pad">
              <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-muted">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-faint" />
                Nexora is deliberately the interview and decision layer rather than a system of record. Where an ATS already exists, the intent is to
                sit alongside it and hand decisions back, not to replace it.
              </p>
            </Card>
          </div>
        )}
      </Page>
    </>
  )
}
