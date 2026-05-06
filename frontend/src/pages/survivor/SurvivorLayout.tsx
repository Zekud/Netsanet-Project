// SurvivorLayout — shell layout for all survivor-facing pages.
// Includes the QuickExitButton, a calm navigation, and the LanguageSwitcher.

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import QuickExitButton from '../../components/ui/QuickExitButton';
import NotificationBell from '../../components/ui/NotificationBell';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

export default function SurvivorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('survivorLayout');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/safe-space/home',   label: t('nav.home') },
    { to: '/safe-space/report', label: t('nav.report') },
    { to: '/safe-space/cases',  label: t('nav.myCases') },
    { to: '/safe-space/chat',   label: t('nav.legalGuide') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <QuickExitButton />

      {/* Top Navigation */}
      <header className="border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <h1 className="font-serif text-xl text-teal-900">Netsanet</h1>
          <nav className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'bg-teal-50 text-teal-700'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-dark'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            {user?.id && <NotificationBell userId={user.id} userRole={user.role} />}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-dark"
            >
              {t('signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="flex border-b border-gray-200 bg-white sm:hidden">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 py-2.5 text-center text-xs font-medium transition-colors duration-150 ${
                isActive
                  ? 'border-b-2 border-teal-500 text-teal-700'
                  : 'text-gray-500'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Page Content */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-4 py-4 text-center">
        <p className="text-xs text-gray-500">{t('footer')}</p>
      </footer>
    </div>
  );
}
