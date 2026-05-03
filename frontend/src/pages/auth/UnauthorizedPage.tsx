// UnauthorizedPage — shown when a user tries to access a route their role doesn't allow.

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Redirect to their appropriate landing page
    switch (user.role) {
      case 'survivor':
        navigate('/safe-space/home');
        break;
      case 'system_admin':
        navigate('/dashboard/institutions');
        break;
      default:
        navigate('/dashboard/home');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="text-center">
        <h1 className="font-serif text-4xl text-teal-900 mb-3">Access Denied</h1>
        <p className="text-base text-gray-500 mb-6 max-w-sm">
          You don't have permission to view this page.
        </p>
        <button
          onClick={handleGoBack}
          className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700"
        >
          Go to my dashboard
        </button>
      </div>
    </div>
  );
}
