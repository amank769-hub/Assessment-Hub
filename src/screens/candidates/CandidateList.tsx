import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowUpDown, Download, GitCompare, LayoutGrid, List, Search, Sparkles, Users,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import { candidateRollup, countryOf } from '@/data'
import { daysBetween, fmtRelative } from '@/lib/dates'
import {
  Avatar, Badge, Button, Card, cx, EmptyState, Input, Progress, ScoreMeter,
  Segmented, Table, Td, Th,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG, seriesAt } from '@/theme/tokens'

const STATUS_TONE: Record<string, 'blue' | 'violet' | 'green' | 'amber' | 'red' | 'neutral'> = {
  'Applied': 'neutral', 'AI Screened': 'violet', 'Recruiter Review': 'violet',
  'Shortlisted': 'blue', 'In Interview': 'blue', 'In Assessment': 'blue',
  'Offer Recommended': 'green', 'Hired': 'green', 'On Hold': 'amber',
  'Rejected': 'red', 'Withdrawn': 'neutral',
}

export default function CandidateList() {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [selected, setSelected] = useState<string[]>([])
  const filter = params.get('filter') ?? 'all'
  const reqIds = reqs.map(r => r.id)

  const rows = useMemo(() => state.candidates
    .filter(c => reqIds.includes(c.requisitionId))
    .filter(c => filter === 'all'
      || (filter === 'awaiting' && c.status === 'AI Screened')
      || (filter === 'interviewing' && c.status === 'In Interview')
      || (filter === 'offer' && c.status === 'Offer Recommended'))
    .filter(c => !q || `${c.name} ${c.currentOrganization} ${c.currentTitle} ${c.location} ${c.skills.join(' ')}`.toLowerCase().includes(q.toLowerCase()))
    .map(c => ({ c, roll: candidateRollup(c.id) }))
    .sort((a, b) => (b.roll?.consolidatedScore ?? 0) - (a.roll?.consolidatedScore ?? 0)
      || (b.c.screening?.overallMatch ?? 0) - (a.c.screening?.overallMatch ?? 0)),
    [state.candidates, reqIds, q, filter])

  const awaiting = state.candidates.filter(c => reqIds.includes(c.requisitionId) && c.status === 'AI Screened').length

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length >= 6 ? s : [...s, id])

  return (
    <>
      <PageHeader
        title="Candidates"
        subtitle="Every profile in process, ranked on consolidated interview score first and AI match second. AI recommends; a recruiter decides."
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[
              { value: 'table', label: <span className="inline-flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Table</span> },
              { value: 'cards', label: <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Cards</span> },
            ]} />
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export</Button>
            {selected.length >= 2 && (
              <Link to={`/analysis?view=compare&candidates=${selected.join(',')}`}>
                <Button variant="primary" size="md"><GitCompare className="h-4 w-4" />Compare {selected.length}</Button>
              </Link>
            )}
          </>
        }
      />

      <Page>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[15rem] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, employer, title or skill" className="pl-9" />
          </div>
          <Segmented value={filter} onChange={v => setParams(v === 'all' ? {} : { filter: v })} options={[
            { value: 'all', label: `All (${state.candidates.filter(c => reqIds.includes(c.requisitionId)).length})` },
            { value: 'awaiting', label: `Awaiting screening (${awaiting})` },
            { value: 'interviewing', label: 'In interview' },
            { value: 'offer', label: 'Offer stage' },
          ]} />
          {selected.length > 0 && (
            <span className="text-[13px] text-ink-muted">
              {selected.length} selected {selected.length >= 6 && <span className="text-rag-serious">· maximum six</span>}
            </span>
          )}
        </div>

        {awaiting > 0 && filter !== 'awaiting' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 p-4">
            <p className="flex items-center gap-2 text-[13px] text-ink-soft">
              <Sparkles className="h-4 w-4 shrink-0 text-violet-600" />
              <span>
                <span className="font-semibold text-ink">{awaiting} candidate{awaiting === 1 ? '' : 's'}</span> {awaiting === 1 ? 'has' : 'have'} completed AI screening and {awaiting === 1 ? 'is' : 'are'} waiting on a human decision.
                The model has scored and recommended — it has not progressed or rejected anyone.
              </span>
            </p>
            <Button variant="primary" size="sm" onClick={() => setParams({ filter: 'awaiting' })}>Open screening queue</Button>
          </div>
        )}

        {rows.length === 0 ? (
          <Card><EmptyState icon={<Users className="h-5 w-5" />} title="No candidates match" detail="Try clearing a filter or broadening your search." /></Card>
        ) : view === 'table' ? (
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th className="w-9" />
                  <Th>Candidate</Th><Th>Requisition</Th><Th>Stage</Th><Th>Status</Th>
                  <Th align="center">AI match</Th><Th align="center">Must-haves</Th>
                  <Th align="center">Consolidated</Th><Th align="center">In stage</Th>
                  <Th>Notice</Th><Th>Source</Th><Th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ c, roll }) => {
                  const req = state.requisitions.find(r => r.id === c.requisitionId)!
                  const stg = req.workflow.find(s => s.key === c.currentStageKey)
                  const prog = c.stageProgress.find(p => p.stageKey === c.currentStageKey)
                  const days = prog?.enteredAt ? daysBetween(prog.enteredAt) : 0
                  const over = stg ? days > stg.slaDays : false
                  const sel = selected.includes(c.id)
                  return (
                    <tr key={c.id} className={cx('group transition-colors', sel ? 'bg-electric-50/50' : 'hover:bg-electric-50/25')}>
                      <Td>
                        <input type="checkbox" checked={sel} onChange={() => toggle(c.id)}
                          aria-label={`Select ${c.name} for comparison`}
                          className="h-4 w-4 rounded border-slate-300 text-electric-600 focus:ring-electric-500/30 cursor-pointer" />
                      </Td>
                      <Td>
                        <Link to={`/candidates/${c.id}`} className="flex items-center gap-2.5">
                          <Avatar name={c.name} tint={c.tint} size={32} />
                          <div className="min-w-0">
                            <p className="font-medium text-ink group-hover:text-electric-700 transition-colors whitespace-nowrap">{c.name}</p>
                            <p className="text-2xs text-ink-muted truncate max-w-[15rem]">{c.currentTitle} · {c.currentOrganization}</p>
                          </div>
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap">
                        <Link to={`/requisitions/${req.id}`} className="text-electric-700 font-medium hover:underline">{req.id}</Link>
                        <span className="block text-2xs text-ink-muted">{countryOf(req.country).flag} {req.band}</span>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft">{stg?.shortName ?? '—'}</Td>
                      <Td><Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge></Td>
                      <Td align="center">
                        <span className="tnum font-semibold text-ink">{c.screening?.overallMatch ?? '—'}%</span>
                      </Td>
                      <Td align="center" className="min-w-[6rem]">
                        {c.screening ? (
                          <>
                            <span className="tnum text-2xs font-semibold text-ink-soft">{c.screening.mustHaveMatch}%</span>
                            <Progress className="mt-1" value={c.screening.mustHaveMatch}
                              tone={c.screening.mustHaveMatch >= 80 ? RAG.good : c.screening.mustHaveMatch >= 65 ? seriesAt(0) : RAG.serious} height={4} />
                          </>
                        ) : <span className="text-2xs text-ink-faint">—</span>}
                      </Td>
                      <Td align="center" className="min-w-[9rem]">
                        {roll && roll.consolidatedScore > 0
                          ? <ScoreMeter value={roll.consolidatedScore} tone={roll.consolidatedScore >= 5 ? RAG.good : seriesAt(0)} />
                          : <span className="text-2xs text-ink-faint">Not interviewed</span>}
                      </Td>
                      <Td align="center">
                        <span className={cx('tnum font-semibold', over ? 'text-rag-serious' : 'text-ink-soft')}>{days}d</span>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft tnum">{c.noticePeriodDays}d</Td>
                      <Td className="whitespace-nowrap text-ink-muted text-2xs">{c.source}</Td>
                      <Td>
                        <Link to={`/candidates/${c.id}`}
                          className="text-[13px] font-medium text-electric-600 hover:underline whitespace-nowrap">
                          {c.status === 'AI Screened' ? 'Screen' : 'Open'}
                        </Link>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(({ c, roll }) => {
              const req = state.requisitions.find(r => r.id === c.requisitionId)!
              const sel = selected.includes(c.id)
              return (
                <div key={c.id} className={cx('card card-pad transition-all', sel && 'ring-2 ring-electric-500')}>
                  <div className="flex items-start gap-3">
                    <Avatar name={c.name} tint={c.tint} size={44} />
                    <div className="min-w-0 flex-1">
                      <Link to={`/candidates/${c.id}`} className="block">
                        <p className="text-[15px] font-semibold text-ink hover:text-electric-700 transition-colors truncate">{c.name}</p>
                        <p className="text-xs text-ink-muted truncate">{c.currentTitle}</p>
                        <p className="text-2xs text-ink-faint truncate">{c.currentOrganization} · {c.location}</p>
                      </Link>
                    </div>
                    <input type="checkbox" checked={sel} onChange={() => toggle(c.id)}
                      aria-label={`Select ${c.name}`}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-electric-600 cursor-pointer" />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Badge tone={STATUS_TONE[c.status] ?? 'neutral'}>{c.status}</Badge>
                    <Badge tone="neutral">{req.id}</Badge>
                    {c.isExEmployee && <Badge tone="violet">Ex-employee</Badge>}
                  </div>

                  {c.screening && (
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      {[
                        { l: 'Overall', v: `${c.screening.overallMatch}%` },
                        { l: 'Must-have', v: `${c.screening.mustHaveMatch}%` },
                        { l: 'Experience', v: `${c.screening.experienceRelevance}%` },
                      ].map(s => (
                        <div key={s.l} className="rounded-lg bg-surface-page py-2">
                          <p className="tnum text-[15px] font-bold text-ink">{s.v}</p>
                          <p className="text-2xs text-ink-muted">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {roll && roll.consolidatedScore > 0 && (
                    <div className="mt-3">
                      <p className="label mb-1.5">Consolidated interview score</p>
                      <ScoreMeter value={roll.consolidatedScore} tone={roll.consolidatedScore >= 5 ? RAG.good : seriesAt(0)} />
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.skills.slice(0, 4).map(s => (
                      <span key={s} className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-2xs text-ink-soft">{s}</span>
                    ))}
                    {c.skills.length > 4 && <span className="text-2xs text-ink-faint self-center">+{c.skills.length - 4}</span>}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-surface-line pt-3">
                    <span className="text-2xs text-ink-muted">Applied {fmtRelative(c.appliedAt)} · {c.source}</span>
                    <Link to={`/candidates/${c.id}`} className="text-[13px] font-medium text-electric-600 hover:underline">
                      {c.status === 'AI Screened' ? 'Screen now' : 'Open'}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Page>
    </>
  )
}
