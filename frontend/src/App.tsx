// App.tsx — Root router configuration for Netsanet.
// Defines all routes for both portals (survivor + staff dashboard).

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';

// Landing page
import LandingPage from './pages/landing/LandingPage';
import PrivacyPage from './pages/landing/PrivacyPage';
import TermsPage from './pages/landing/TermsPage';

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
import UsersPage from './pages/dashboard/UsersPage';
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
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

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
            <Route path="users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* ─── Root Redirect ──────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />

        {/* ─── 404 Catch-All ──────────────────────────────── */}
        <Route
          path="*"
          element={
            <div className="flex min-h-screen items-center justify-center bg-bg">
              <div className="text-center animate-fade-in-up max-w-sm px-4">
                <h1 className="font-heading text-4xl text-heading mb-3">Page Not Found</h1>
                <p className="text-muted mb-6">The page you're looking for doesn't exist.</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-fg transition-all duration-200 hover:bg-primary-hover shadow-sm hover:shadow-md"
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
