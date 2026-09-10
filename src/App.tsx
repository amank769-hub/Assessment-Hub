import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { useApp } from '@/store/AppStore'
import { ROLE_PERMISSIONS } from '@/data'
import { Toasts } from '@/components/ui'

import Dashboard from '@/screens/dashboard/Dashboard'
import RequisitionList from '@/screens/requisitions/RequisitionList'
import RequisitionDetail from '@/screens/requisitions/RequisitionDetail'
import CandidateList from '@/screens/candidates/CandidateList'
import CandidateScreening from '@/screens/candidates/CandidateScreening'
import CandidatePortal from '@/screens/portal/CandidatePortal'
import InterviewList from '@/screens/interviews/InterviewList'
import InterviewRoom from '@/screens/interviews/InterviewRoom'
import AssessmentHub from '@/screens/assessments/AssessmentHub'
import AssessmentForm from '@/screens/assessments/AssessmentForm'
import Analysis from '@/screens/analysis/Analysis'
import Governance from '@/screens/admin/Governance'

/** Screens are gated by the current role, not merely hidden from the nav. */
const Guarded = ({ screen, children }: { screen: string; children: JSX.Element }) => {
  const { state } = useApp()
  const allowed = ROLE_PERMISSIONS[state.role].screens.includes(screen)
  if (!allowed) return <Navigate to={state.role === 'candidate' ? '/portal' : '/analysis'} replace />
  return children
}

export default function App() {
  const { state, dispatch } = useApp()
  const loc = useLocation()
  const home = state.role === 'candidate' ? '/portal'
    : ROLE_PERMISSIONS[state.role].screens.includes('dashboard') ? '/dashboard' : '/analysis'

  // The candidate experience is external-facing — it deliberately renders
  // outside the recruiter shell, with its own branded chrome.
  if (loc.pathname.startsWith('/portal')) {
    return (
      <>
        <Routes>
          <Route path="/portal" element={<CandidatePortal />} />
          <Route path="/portal/:section" element={<CandidatePortal />} />
        </Routes>
        <Toasts toasts={state.toasts} onDismiss={id => dispatch({ type: 'DISMISS_TOAST', id })} />
      </>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
        <Route path="/dashboard" element={<Guarded screen="dashboard"><Dashboard /></Guarded>} />
        <Route path="/requisitions" element={<Guarded screen="requisitions"><RequisitionList /></Guarded>} />
        <Route path="/requisitions/:reqId" element={<Guarded screen="requisitions"><RequisitionDetail /></Guarded>} />
        <Route path="/candidates" element={<Guarded screen="candidates"><CandidateList /></Guarded>} />
        <Route path="/candidates/:candidateId" element={<Guarded screen="candidates"><CandidateScreening /></Guarded>} />
        <Route path="/interviews" element={<Guarded screen="interviews"><InterviewList /></Guarded>} />
        <Route path="/interviews/:interviewId" element={<Guarded screen="interviews"><InterviewRoom /></Guarded>} />
        <Route path="/assessments" element={<Guarded screen="assessments"><AssessmentHub /></Guarded>} />
        <Route path="/assessments/:assessmentId" element={<Guarded screen="assessments"><AssessmentForm /></Guarded>} />
        <Route path="/analysis" element={<Guarded screen="analysis"><Analysis /></Guarded>} />
        <Route path="/governance" element={<Guarded screen="governance"><Governance /></Guarded>} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </AppShell>
  )
}
