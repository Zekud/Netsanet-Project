// UnauthorizedPage — shown when a user tries to access a route their role doesn't allow.
// Premium design with the new design system.

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('auth');

  const handleGoBack = () => {
    if (!user) {
      navigate('/login');
      return;
    }
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
    <div className="flex min-h-screen flex-col bg-bg">
      <div className="flex items-center justify-end gap-2 p-4">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="text-center animate-fade-in-up max-w-sm">
          {/* Icon badge */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <ShieldOff className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-4xl text-heading mb-3">{t('unauthorized.title')}</h1>
          <p className="text-base text-muted mb-8 leading-relaxed">
            {t('unauthorized.description')}
          </p>
          <button
            onClick={handleGoBack}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-fg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('unauthorized.button')}
          </button>
        </div>
      </div>
    </div>
  );
}
