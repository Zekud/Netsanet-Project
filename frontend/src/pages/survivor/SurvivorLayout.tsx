// SurvivorLayout — shell layout for all survivor-facing pages.
// Includes the QuickExitButton and a calm, safe navigation.

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import QuickExitButton from '../../components/ui/QuickExitButton';
import NotificationBell from '../../components/ui/NotificationBell';

export default function SurvivorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/safe-space/home', label: 'Home' },
    { to: '/safe-space/report', label: 'Report' },
    { to: '/safe-space/cases', label: 'My Cases' },
    { to: '/safe-space/chat', label: 'Legal Guide' },
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
          <div className="flex items-center gap-2">
            {user?.id && <NotificationBell userId={user.id} userRole={user.role} />}
            <button
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-dark"
            >
              Sign Out
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
        <p className="text-xs text-gray-500">
          Your privacy is protected. All data is encrypted and confidential.
        </p>
      </footer>
    </div>
  );
}
