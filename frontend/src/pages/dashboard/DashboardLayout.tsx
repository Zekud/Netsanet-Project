// DashboardLayout — shell layout for staff-facing pages (case workers, admins).
// Features a fixed left sidebar, mobile bottom nav, and top bar.
// Mobile-first responsive design with Lucide icons and semantic tokens.

import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, FolderKanban, ArrowLeftRight, Bell,
  Users, BarChart3, Building2, LogOut, Menu, X, ChevronLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../../components/ui/NotificationBell';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

// Map icon components to nav items
const ICONS: Record<string, React.ElementType> = {
  overview: LayoutDashboard,
  cases: FolderKanban,
  referrals: ArrowLeftRight,
  notifications: Bell,
  staff: Users,
  analytics: BarChart3,
  institutions: Building2,
};

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build nav items based on role
  type NavItem = { to: string; label: string; key: string };
  const navItems: NavItem[] = [
    { to: '/dashboard/home',          label: t('layout.nav.overview'),       key: 'overview' },
    { to: '/dashboard/cases',         label: t('layout.nav.cases'),          key: 'cases' },
    { to: '/dashboard/referrals',     label: t('layout.nav.referrals'),      key: 'referrals' },
    { to: '/dashboard/notifications', label: t('layout.nav.notifications'),  key: 'notifications' },
  ];

  if (user?.role === 'institution_admin' || user?.role === 'system_admin') {
    navItems.push({ to: '/dashboard/staff',     label: t('layout.nav.staff'),     key: 'staff' });
    navItems.push({ to: '/dashboard/analytics', label: t('layout.nav.analytics'), key: 'analytics' });
  }

  if (user?.role === 'system_admin') {
    navItems.push({ to: '/dashboard/institutions', label: t('layout.nav.institutions'), key: 'institutions' });
  }

  const sidebarWidth = sidebarCollapsed ? 'w-[72px]' : 'w-60';
  const mainOffset = sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-60';

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ─── Mobile Overlay ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-heading/40 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside className={`fixed left-0 top-0 z-50 h-full flex-col border-r border-border bg-sidebar transition-all duration-300 ${sidebarWidth}
        ${mobileMenuOpen ? 'flex translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:flex`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg font-heading font-bold text-sm">
              N
            </div>
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 animate-fade-in">
                <span className="font-heading text-lg text-heading">Netsanet</span>
                <span className="rounded-lg bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {t('layout.badge')}
                </span>
              </div>
            )}
          </div>
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-inset hover:text-heading transition-colors lg:flex"
            aria-label="Toggle sidebar"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
          {/* Close — mobile only */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-inset lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map(({ to, label, key }) => {
            const Icon = ICONS[key] || LayoutDashboard;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                title={sidebarCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-active-text shadow-xs'
                      : 'text-sidebar-text hover:bg-inset hover:text-heading'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!sidebarCollapsed && <span>{label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-3">
          {!sidebarCollapsed && (
            <div className="mb-2 rounded-xl bg-inset px-3 py-2.5 animate-fade-in">
              <p className="text-sm font-medium text-heading truncate">
                {user?.display_name || t('layout.fallbackName')}
              </p>
              <p className="text-[11px] text-muted capitalize">{user?.role?.replace('_', ' ')}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? t('layout.signOut') : undefined}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-danger-soft hover:text-danger ${sidebarCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && <span>{t('layout.signOut')}</span>}
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ─── */}
      <div className={`flex flex-1 flex-col transition-all duration-300 ${mainOffset}`}>

        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-surface/95 backdrop-blur-md px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted hover:bg-inset hover:text-heading transition-colors lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg font-heading font-bold text-xs">
              N
            </div>
            <span className="font-heading text-lg text-heading">Netsanet</span>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden lg:block" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user && <NotificationBell />}
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur-md lg:hidden">
          {navItems.slice(0, 5).map(({ to, label, key }) => {
            const Icon = ICONS[key] || LayoutDashboard;
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                    isActive ? 'text-primary' : 'text-placeholder'
                  }`
                }
              >
                <Icon className="h-4.5 w-4.5" />
                <span className="truncate max-w-[60px]">{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Page Content */}
        <main className="flex-1 p-4 pb-20 sm:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
