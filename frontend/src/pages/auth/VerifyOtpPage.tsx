// VerifyOtpPage — user enters the 6-digit code sent to their email.
// On success, redirects based on role: survivors → /safe-space, staff → /dashboard.
// Premium design with the new design system.

import { useState, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

interface VerifyFormData {
  token: string;
}

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

  const email = (location.state as { email?: string })?.email;

  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<VerifyFormData>();

  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleOtpChange = (index: number, value: string) => {
    const newValue = value.replace(/\D/g, '');
    if (!newValue && value !== '') return;

    const newOtpValues = [...otpValues];
    newOtpValues[index] = newValue.slice(-1);
    setOtpValues(newOtpValues);
    
    const tokenStr = newOtpValues.join('');
    setValue('token', tokenStr, { shouldValidate: tokenStr.length === 6 || isSubmitted });
    if (tokenStr.length === 6) clearErrors('token');

    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtpValues = [...otpValues];
      for (let i = 0; i < pastedData.length; i++) {
        newOtpValues[i] = pastedData[i];
      }
      setOtpValues(newOtpValues);
      const tokenStr = newOtpValues.join('');
      setValue('token', tokenStr, { shouldValidate: tokenStr.length === 6 || isSubmitted });
      if (tokenStr.length === 6) clearErrors('token');
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

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
      setTimeout(() => setResendCooldown(false), 30000);
    } catch {
      setResendCooldown(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg relative overflow-hidden">
      {/* Background effects */}
      <div className="mesh-blob-1 top-10 -right-20" />
      <div className="mesh-blob-2 bottom-10 -left-20" />
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-1.5 text-sm text-muted hover:text-heading transition-colors rounded-xl px-3 py-1.5 hover:bg-inset"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('verify.back', { defaultValue: 'Back' })}
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          {/* Icon badge */}
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="h-7 w-7" />
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="font-heading text-3xl text-heading mb-2">{t('verify.title')}</h1>
            <p className="text-base text-muted leading-relaxed">
              {t('verify.subtitle')}{' '}
              <span className="font-medium text-heading">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-heading text-center">
                {t('verify.codeLabel')}
              </label>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                {otpValues.map((val, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className={`h-12 w-12 sm:h-14 sm:w-14 rounded-xl border-2 border-solid bg-surface text-center font-mono text-xl sm:text-2xl text-heading transition-all duration-200 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                      errors.token ? 'border-danger' : 'border-border-muted hover:border-border'
                    }`}
                  />
                ))}
              </div>
              <input type="hidden" {...register('token', {
                required: t('verify.codeRequired'),
                pattern: {
                  value: /^\d{6}$/,
                  message: t('verify.codeInvalid'),
                },
              })} />
              {errors.token && (
                <p className="mt-2 text-center text-xs text-danger">{errors.token.message}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger border border-danger/20">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-fg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 shadow-sm hover:shadow-md"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-fg border-t-transparent" />
                  {t('verify.buttonLoading')}
                </>
              ) : (
                <>
                  {t('verify.button')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Resend */}
          <div className="mt-6 text-center">
            <button
              onClick={handleResend}
              disabled={resendCooldown}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover disabled:cursor-not-allowed disabled:text-muted"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resendCooldown ? 'animate-spin' : ''}`} />
              {resendCooldown ? t('verify.resendCooldown') : t('verify.resend')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
