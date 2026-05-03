// App.tsx — Root router configuration for Netsanet.
// Defines all routes for both portals (survivor + staff dashboard).

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import VerifyOtpPage from './pages/auth/VerifyOtpPage';
import UnauthorizedPage from './pages/auth/UnauthorizedPage';

// Layouts
import SurvivorLayout from './pages/survivor/SurvivorLayout';
import DashboardLayout from './pages/dashboard/DashboardLayout';

// Survivor pages (placeholders will be replaced in later phases)
import SurvivorHome from './pages/survivor/SurvivorHome';
import ReportCasePage from './pages/survivor/ReportCasePage';
import MyCasesPage from './pages/survivor/MyCasesPage';
import CaseDetailPage from './pages/survivor/CaseDetailPage';
import AILegalGuidePage from './pages/survivor/AILegalGuidePage';
import EvidenceLockerPage from './pages/survivor/EvidenceLockerPage';

// Dashboard pages (placeholders will be replaced in later phases)
import DashboardHome from './pages/dashboard/DashboardHome';
import CaseDirectoryPage from './pages/dashboard/CaseDirectoryPage';
import CaseAssessmentPage from './pages/dashboard/CaseAssessmentPage';
import ReferralsPage from './pages/dashboard/ReferralsPage';
import StaffManagementPage from './pages/dashboard/StaffManagementPage';
import InstitutionsPage from './pages/dashboard/InstitutionsPage';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Public Routes ──────────────────────────────── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/verify" element={<VerifyOtpPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* ─── Survivor Portal ────────────────────────────── */}
        <Route element={<ProtectedRoute allowedRoles={['survivor']} />}>
          <Route path="/safe-space" element={<SurvivorLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<SurvivorHome />} />
            <Route path="report" element={<ReportCasePage />} />
            <Route path="cases" element={<MyCasesPage />} />
            <Route path="cases/:id" element={<CaseDetailPage />} />
            <Route path="chat" element={<AILegalGuidePage />} />
            <Route path="evidence/:caseId" element={<EvidenceLockerPage />} />
          </Route>
        </Route>

        {/* ─── Staff Dashboard ────────────────────────────── */}
        <Route
          element={
            <ProtectedRoute
              allowedRoles={['case_worker', 'institution_admin', 'system_admin']}
            />
          }
        >
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<DashboardHome />} />
            <Route path="cases" element={<CaseDirectoryPage />} />
            <Route path="cases/:id" element={<CaseAssessmentPage />} />
            <Route path="referrals" element={<ReferralsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="staff" element={<StaffManagementPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="institutions" element={<InstitutionsPage />} />
          </Route>
        </Route>

        {/* ─── Root Redirect ──────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* ─── 404 Catch-All ──────────────────────────────── */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-surface">
              <div className="text-center">
                <h1 className="font-serif text-4xl text-teal-900 mb-3">Page Not Found</h1>
                <p className="text-gray-500 mb-6">The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700"
                >
                  Go home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
