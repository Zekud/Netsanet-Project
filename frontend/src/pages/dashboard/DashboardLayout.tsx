// DashboardLayout — shell layout for staff-facing pages (case workers, admins).
// Features a fixed left sidebar and a top bar with notification bell.

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../../components/ui/NotificationBell';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build nav items based on role
  const navItems = [
    { to: '/dashboard/home', label: t('layout.nav.overview'), icon: '📊' },
    { to: '/dashboard/cases', label: t('layout.nav.cases'), icon: '📋' },
    { to: '/dashboard/referrals', label: t('layout.nav.referrals'), icon: '🔄' },
    { to: '/dashboard/notifications', label: t('layout.nav.notifications'), icon: '🔔' },
  ];

  // Role-specific items
  if (user?.role === 'institution_admin' || user?.role === 'system_admin') {
    navItems.push({ to: '/dashboard/staff', label: t('layout.nav.staff'), icon: '👥' });
    navItems.push({ to: '/dashboard/analytics', label: t('layout.nav.analytics'), icon: '📈' });
  }

  if (user?.role === 'system_admin') {
    navItems.push({ to: '/dashboard/institutions', label: t('layout.nav.institutions'), icon: '🏛️' });
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-56 flex-col border-r border-gray-200 bg-white lg:flex">
        {/* Logo */}
        <div className="flex h-14 items-center border-b border-gray-200 px-5">
          <h1 className="font-serif text-lg text-teal-900">Netsanet</h1>
          <span className="ml-2 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700">
            {t('layout.badge')}
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-dark'
                }`
              }
            >
              <span className="text-base">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-200 p-3">
          <div className="mb-2 rounded-lg bg-gray-100 px-3 py-2">
            <p className="text-sm font-medium text-dark truncate">
              {user?.display_name || t('layout.fallbackName')}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-1.5 text-left text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-dark"
          >
            {t('layout.signOut')}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:ml-56">
        {/* Mobile Top Bar */}
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 lg:hidden">
          <h1 className="font-serif text-lg text-teal-900">Netsanet</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user && <NotificationBell userId={user.id} />}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hidden sm:block"
            >
              {t('layout.signOut')}
            </button>
          </div>
        </header>

        {/* Mobile Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-gray-200 bg-white lg:hidden">
          {navItems.slice(0, 5).map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  isActive ? 'text-teal-700' : 'text-gray-400'
                }`
              }
            >
              <span className="text-lg">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop top bar — notification bell */}
        <header className="hidden h-14 items-center justify-end gap-4 border-b border-gray-200 bg-white px-5 lg:flex">
          <LanguageSwitcher />
          {user && <NotificationBell userId={user.id} />}
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 pb-20 sm:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
