// UnauthorizedPage — shown when a user tries to access a route their role doesn't allow.

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('auth');

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
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <h1 className="font-serif text-4xl text-teal-900 mb-3">{t('unauthorized.title')}</h1>
          <p className="text-base text-gray-500 mb-6 max-w-sm">
            {t('unauthorized.description')}
          </p>
          <button
            onClick={handleGoBack}
            className="rounded-lg bg-teal-500 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700"
          >
            {t('unauthorized.button')}
          </button>
        </div>
      </div>
    </div>
  );
}
