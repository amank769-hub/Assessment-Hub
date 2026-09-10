import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpDown, Briefcase, Download, LayoutGrid, List, Plus, Search, Users,
} from 'lucide-react'
import { useApp, useFilteredReqs } from '@/store/AppStore'
import { countryOf, personById, requisitionHealth } from '@/data'
import { fmtDate, daysBetween } from '@/lib/dates'
import {
  Avatar, AvatarStack, Badge, Button, Card, cx, EmptyState, Input,
  Progress, RagPill, Segmented, Table, Td, Th,
} from '@/components/ui'
import { Page, PageHeader } from '@/components/layout/PageHeader'
import { RAG } from '@/theme/tokens'

type SortKey = 'id' | 'title' | 'openDate' | 'targetCloseDate' | 'candidates' | 'risk'

const STATUS_TONE = {
  'Open': 'blue', 'In Interview': 'violet', 'Offer Stage': 'green',
  'On Hold': 'amber', 'Closed': 'neutral',
} as const

export default function RequisitionList() {
  const { state } = useApp()
  const reqs = useFilteredReqs()
  const [view, setView] = useState<'table' | 'cards'>('table')
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<SortKey>('risk')
  const [asc, setAsc] = useState(false)

  const rows = useMemo(() => {
    const RISK_ORDER = { critical: 0, serious: 1, warning: 2, good: 3 }
    const filtered = reqs
      .filter(r => !q || `${r.id} ${r.title} ${r.location} ${r.businessUnit}`.toLowerCase().includes(q.toLowerCase()))
      .map(requisitionHealth)

    return filtered.sort((a, b) => {
      const dir = asc ? 1 : -1
      switch (sort) {
        case 'id': return a.req.id.localeCompare(b.req.id) * dir
        case 'title': return a.req.title.localeCompare(b.req.title) * dir
        case 'openDate': return (+new Date(a.req.openDate) - +new Date(b.req.openDate)) * dir
        case 'targetCloseDate': return (+new Date(a.req.targetCloseDate) - +new Date(b.req.targetCloseDate)) * dir
        case 'candidates': return (a.inProcess - b.inProcess) * dir
        default: return (RISK_ORDER[a.rag] - RISK_ORDER[b.rag]) * (asc ? -1 : 1)
      }
    })
  }, [reqs, q, sort, asc])

  const toggleSort = (k: SortKey) => { if (sort === k) setAsc(v => !v); else { setSort(k); setAsc(false) } }

  const SortTh = ({ k, children, align }: { k: SortKey; children: React.ReactNode; align?: 'left' | 'right' | 'center' }) => (
    <Th align={align}>
      <button onClick={() => toggleSort(k)} className={cx('inline-flex items-center gap-1 hover:text-ink transition-colors', sort === k && 'text-electric-600')}>
        {children}<ArrowUpDown className="h-3 w-3 opacity-50" />
      </button>
    </Th>
  )

  return (
    <>
      <PageHeader
        title="Requisitions"
        subtitle="Every open role, its workflow, its competency framework and where its pipeline actually is. Risk is computed, not entered by hand."
        actions={
          <>
            <Segmented value={view} onChange={setView} options={[
              { value: 'table', label: <span className="inline-flex items-center gap-1.5"><List className="h-3.5 w-3.5" />Table</span> },
              { value: 'cards', label: <span className="inline-flex items-center gap-1.5"><LayoutGrid className="h-3.5 w-3.5" />Cards</span> },
            ]} />
            <Button variant="secondary" onClick={() => window.print()}><Download className="h-3.5 w-3.5" />Export</Button>
            <Button variant="primary" size="md"><Plus className="h-4 w-4" />New requisition</Button>
          </>
        }
      />

      <Page>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[15rem] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by ID, title, location or unit" className="pl-9" />
          </div>
          <span className="text-[13px] text-ink-muted">
            {rows.length} requisition{rows.length === 1 ? '' : 's'} · {rows.filter(r => r.rag === 'critical' || r.rag === 'serious').length} at risk
          </span>
        </div>

        {rows.length === 0 ? (
          <Card><EmptyState icon={<Briefcase className="h-5 w-5" />} title="No requisitions match" detail="Try clearing a filter or broadening your search." /></Card>
        ) : view === 'table' ? (
          <Card className="overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <SortTh k="id">Req ID</SortTh>
                  <SortTh k="title">Job title</SortTh>
                  <Th>Country / location</Th>
                  <Th>Business unit</Th>
                  <Th>Hiring manager</Th>
                  <Th>Recruiter</Th>
                  <Th align="center">Band</Th>
                  <SortTh k="openDate">Open date</SortTh>
                  <SortTh k="targetCloseDate">Target close</SortTh>
                  <SortTh k="candidates" align="center">In process</SortTh>
                  <Th>Status</Th>
                  <SortTh k="risk">Risk</SortTh>
                </tr>
              </thead>
              <tbody>
                {rows.map(h => {
                  const hm = personById(h.req.hiringManagerId)!
                  const rec = personById(h.req.recruiterId)!
                  const c = countryOf(h.req.country)
                  return (
                    <tr key={h.req.id} className="group hover:bg-electric-50/30 transition-colors">
                      <Td>
                        <Link to={`/requisitions/${h.req.id}`} className="font-semibold text-electric-700 hover:underline whitespace-nowrap">{h.req.id}</Link>
                      </Td>
                      <Td className="max-w-[19rem]">
                        <Link to={`/requisitions/${h.req.id}`} className="block">
                          <span className="block font-medium text-ink group-hover:text-electric-700 transition-colors line-clamp-1">{h.req.title}</span>
                          <span className="block text-2xs text-ink-muted">{h.req.openings} opening{h.req.openings === 1 ? '' : 's'} · {h.req.priority} priority</span>
                        </Link>
                      </Td>
                      <Td className="whitespace-nowrap text-ink-soft">{c.flag} {h.req.location}</Td>
                      <Td className="whitespace-nowrap text-ink-soft">{h.req.businessUnit}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={hm.name} tint={hm.tint} size={22} /><span className="text-ink-soft">{hm.name}</span>
                        </span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={rec.name} tint={rec.tint} size={22} /><span className="text-ink-soft">{rec.name}</span>
                        </span>
                      </Td>
                      <Td align="center"><Badge tone="neutral">{h.req.band}</Badge></Td>
                      <Td className="whitespace-nowrap text-ink-soft tnum">{fmtDate(h.req.openDate)}</Td>
                      <Td className="whitespace-nowrap tnum">
                        <span className={h.daysToTarget < 7 ? 'font-semibold text-rag-critical' : 'text-ink-soft'}>
                          {fmtDate(h.req.targetCloseDate)}
                        </span>
                        <span className="block text-2xs text-ink-faint">
                          {h.daysToTarget < 0 ? `${Math.abs(h.daysToTarget)}d over` : `${h.daysToTarget}d left`}
                        </span>
                      </Td>
                      <Td align="center">
                        <span className="tnum font-semibold text-ink">{h.inProcess}</span>
                      </Td>
                      <Td><Badge tone={STATUS_TONE[h.req.status]}>{h.req.status}</Badge></Td>
                      <Td><RagPill status={h.rag} /></Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {rows.map(h => {
              const hm = personById(h.req.hiringManagerId)!
              const rec = personById(h.req.recruiterId)!
              const panel = h.req.panelIds.map(id => personById(id)!).filter(Boolean)
              const cands = state.candidates.filter(c => c.requisitionId === h.req.id)
              return (
                <Link key={h.req.id} to={`/requisitions/${h.req.id}`}
                  className="card card-pad group hover:shadow-lift hover:-translate-y-px transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-2xs font-semibold text-ink-faint">{h.req.id}</span>
                      <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-ink group-hover:text-electric-700 transition-colors line-clamp-2">{h.req.title}</h3>
                    </div>
                    <RagPill status={h.rag} />
                  </div>

                  <p className="mt-2 text-[13px] text-ink-muted">
                    {countryOf(h.req.country).flag} {h.req.location} · {h.req.band} · {h.req.businessUnit}
                  </p>

                  <div className="mt-4 flex items-center justify-between text-2xs text-ink-muted">
                    <span>Workflow progress · at {h.atStage}</span>
                    <span className="tnum">{h.progressPct}%</span>
                  </div>
                  <Progress className="mt-1.5" value={h.progressPct} tone={RAG[h.rag]} />

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    {[
                      { l: 'In process', v: h.inProcess },
                      { l: 'Days open', v: h.daysOpen },
                      { l: 'To target', v: h.daysToTarget < 0 ? `−${Math.abs(h.daysToTarget)}` : h.daysToTarget },
                    ].map(s => (
                      <div key={s.l} className="rounded-lg bg-surface-page py-2">
                        <p className="tnum text-[15px] font-bold text-ink">{s.v}</p>
                        <p className="text-2xs text-ink-muted">{s.l}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-surface-line pt-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={hm.name} tint={hm.tint} size={24} />
                      <span className="text-2xs text-ink-muted truncate">
                        <span className="font-medium text-ink-soft">{hm.name.split(' ')[0]}</span> · {rec.name.split(' ')[0]}
                      </span>
                    </div>
                    <AvatarStack people={panel.map(p => ({ name: p.name, tint: p.tint }))} size={22} max={3} />
                  </div>

                  {cands.length > 0 && (
                    <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-ink-muted">
                      <Users className="h-3 w-3" />
                      {cands.slice(0, 3).map(c => c.name.split(' ')[0]).join(', ')}
                      {cands.length > 3 && ` +${cands.length - 3}`}
                    </p>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </Page>
    </>
  )
}
