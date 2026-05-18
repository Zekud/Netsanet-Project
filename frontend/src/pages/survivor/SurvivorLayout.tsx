// SurvivorLayout — shell layout for all survivor-facing pages.
// Includes the QuickExitButton, calm navigation, ThemeToggle, and LanguageSwitcher.
// Mobile-first responsive design with semantic tokens.

import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, FileText, FolderOpen, Scale, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

import NotificationBell from '../../components/ui/NotificationBell';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';

export default function SurvivorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('survivorLayout');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/safe-space/home',   label: t('nav.home'),       icon: Home },
    { to: '/safe-space/report', label: t('nav.report'),     icon: FileText },
    { to: '/safe-space/cases',  label: t('nav.myCases'),    icon: FolderOpen },
    { to: '/safe-space/chat',   label: t('nav.legalGuide'), icon: Scale },
  ];

  return (
    <div className={`flex flex-col bg-bg ${location.pathname.includes('/chat') ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
      <QuickExitButton />
      {/* ─── Top Navigation ─── */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          {/* Logo */}
          <NavLink to="/safe-space/home" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-fg font-heading font-bold text-sm">
              N
            </div>
            <span className="font-heading text-xl text-heading">Netsanet</span>
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted hover:bg-inset hover:text-heading'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user?.id && <NotificationBell />}
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-muted transition-all duration-200 hover:bg-danger-soft hover:text-danger md:flex"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-inset md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Menu Drawer ─── */}
      {mobileMenuOpen && (
        <div className="border-b border-border bg-surface animate-fade-in-down md:hidden">
          <nav className="mx-auto max-w-5xl space-y-1 px-4 py-3">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-soft text-primary'
                      : 'text-muted hover:bg-inset hover:text-heading'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
            <button
              onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger-soft transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              {t('signOut')}
            </button>
          </nav>
        </div>
      )}

      {/* ─── Mobile Bottom Nav ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface/95 backdrop-blur-md md:hidden">
        {navItems.map(({ to, label, icon: Icon }) => (
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
            {label}
          </NavLink>
        ))}
      </nav>

      {/* ─── Page Content ─── */}
      <main className={`flex flex-1 flex-col ${location.pathname.includes('/chat') ? 'min-h-0' : 'mx-auto w-full max-w-5xl px-4 py-6 pb-20 sm:px-6 sm:py-8 md:pb-8'}`}>
        <Outlet />
      </main>

      {/* ─── Footer ─── */}
      <footer className="hidden border-t border-border bg-surface px-4 py-4 text-center md:block">
        <p className="text-xs text-muted">{t('footer')}</p>
      </footer>
    </div>
  );
}
