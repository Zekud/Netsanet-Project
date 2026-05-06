// VerifyOtpPage — user enters the 6-digit code sent to their email.
// On success, redirects based on role: survivors → /safe-space, staff → /dashboard.

import { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';

interface VerifyFormData {
  token: string;
}

// Maps each role to its post-login landing page
function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'survivor':
      return '/safe-space/home';
    case 'system_admin':
      return '/dashboard/institutions';
    case 'case_worker':
    case 'institution_admin':
      return '/dashboard/home';
    default:
      return '/login';
  }
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOtp, requestOtp } = useAuth();
  const { t } = useTranslation('auth');
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(false);

  // Email is passed from LoginPage via router state
  const email = (location.state as { email?: string })?.email;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyFormData>();

  // If no email in state, redirect back to login
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (data: VerifyFormData) => {
    try {
      setServerError(null);
      const user = await verifyOtp(email, data.token);
      navigate(getRedirectPath(user.role), { replace: true });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t('verify.defaultError')
      );
    }
  };

  const handleResend = async () => {
    if (resendCooldown) return;
    try {
      setResendCooldown(true);
      await requestOtp(email);
      // 30 second cooldown before allowing another resend
      setTimeout(() => setResendCooldown(false), 30000);
    } catch {
      setResendCooldown(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <div className="flex justify-end p-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8 text-left">
            <h1 className="font-serif text-3xl text-teal-900 mb-2">{t('verify.title')}</h1>
            <p className="text-base text-gray-500 leading-relaxed">
              {t('verify.subtitle')}{' '}
              <span className="font-medium text-dark">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label
                htmlFor="otp-token"
                className="mb-1.5 block text-sm font-medium text-dark"
              >
                {t('verify.codeLabel')}
              </label>
              <input
                id="otp-token"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t('verify.codePlaceholder')}
                maxLength={6}
                {...register('token', {
                  required: t('verify.codeRequired'),
                  pattern: {
                    value: /^\d{6}$/,
                    message: t('verify.codeInvalid'),
                  },
                })}
                className={`w-full rounded-lg border bg-white px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.3em] text-dark placeholder:text-gray-200 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                  errors.token ? 'border-critical' : 'border-gray-200'
                }`}
              />
              {errors.token && (
                <p className="mt-1 text-xs text-critical">{errors.token.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-critical">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t('verify.buttonLoading')}
                </>
              ) : (
                t('verify.button')
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resendCooldown}
              className="text-sm text-teal-500 transition-colors duration-150 hover:text-teal-700 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              {resendCooldown ? t('verify.resendCooldown') : t('verify.resend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
