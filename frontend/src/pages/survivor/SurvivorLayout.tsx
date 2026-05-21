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
    <div className={`relative flex flex-col bg-bg ${location.pathname.includes('/chat') ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'} transition-colors duration-300 overflow-x-hidden`}>
      
      {/* ── Calming mist forest background image ── */}
      <div className="absolute inset-0 z-0 select-none pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="w-full h-full object-cover object-center"
        />
        {/* Light: subtle pale wash. Dark: near-black veil so mountain is a very subtle silhouette. */}
        <div className="absolute inset-0 bg-white/35 dark:bg-black/88 transition-colors duration-300" />
      </div>

      <QuickExitButton />

      {/* ─── Floating Liquid Glass Navbar ─── */}
      <header className="relative z-30 px-4 pt-5 md:px-6 w-full max-w-5xl mx-auto !overflow-visible">
        <div className="liquid-glass rounded-2xl px-5 py-3 border border-border flex items-center justify-between !overflow-visible">
          {/* Logo */}
          <NavLink to="/safe-space/home" className="flex items-center gap-2.5 focus:outline-none shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-fg font-serif font-bold text-base shadow-sm">
              N
            </div>
            <span className="font-serif text-lg font-bold text-heading tracking-tight hidden sm:block">Netsanet</span>
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-primary-fg shadow-sm'
                      : 'text-muted hover:text-heading hover:bg-white/10 dark:hover:bg-white/5'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            {user?.id && <NotificationBell />}
            <button
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-sm font-semibold text-muted transition-all duration-150 hover:bg-red-500/10 hover:text-danger md:flex"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span>{t('signOut')}</span>
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted transition-colors hover:bg-white/10 dark:hover:bg-white/5 md:hidden focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Mobile Menu Drawer (Floating Glass Panel) ─── */}
      {mobileMenuOpen && (
        <div className="relative z-30 mx-4 mt-2.5 max-w-5xl md:hidden">
          <div className="liquid-glass rounded-2xl border border-border p-4 animate-fade-in-down">
            <nav className="space-y-1.5">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-primary text-primary-fg shadow-sm'
                        : 'text-muted hover:text-heading hover:bg-white/10 dark:hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              ))}
              <button
                onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-red-500/10 transition-all duration-150"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>{t('signOut')}</span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Nav (Clean Glass Bar) ─── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-border bg-surface/80 backdrop-blur-lg md:hidden shadow-lg justify-around">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                isActive ? 'text-primary' : 'text-muted'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ─── Page Content ─── */}
      <main className={`relative z-10 flex flex-1 flex-col ${
        location.pathname.includes('/chat')
          ? 'mx-auto w-full max-w-5xl px-3 pt-3 pb-16 md:pb-3 min-h-0'
          : 'mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-8'
      }`}>
        {location.pathname.includes('/chat') ? (
          <Outlet />
        ) : (
          <div className="flex-1 bg-white/85 backdrop-blur-md dark:backdrop-blur-none dark:bg-bg border border-border/40 dark:border-white/8 rounded-3xl p-6 md:p-8 shadow-xl min-h-0 animate-fade-in">
            <Outlet />
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-transparent py-4 text-center text-xs text-muted md:mb-0 mb-16 shrink-0">
        <p>© {new Date().getFullYear()} Netsanet. All rights reserved.</p>
      </footer>
    </div>
  );
}
