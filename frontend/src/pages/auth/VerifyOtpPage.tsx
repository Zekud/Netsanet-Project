// VerifyOtpPage — user enters the 6-digit code sent to their email.
// On success, redirects based on role: survivors → /safe-space, staff → /dashboard.
// Premium design with the new design system.

import { useState, useRef } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RotateCcw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import type { UserRole } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';

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
    <div className="relative min-h-screen bg-bg text-body flex flex-col items-center justify-center pt-28 pb-12 px-4 overflow-y-auto overflow-x-hidden transition-colors duration-300">
      <QuickExitButton />

      {/* ── Full-screen background image (Same as LoginPage for seamless transitions!) ── */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
          alt=""
          aria-hidden="true"
          draggable={false}
          className="w-full h-full object-cover object-center select-none"
        />
        {/* Cinematic gradient overlay linked to theme background */}
        <div className="absolute inset-0 bg-gradient-to-br from-bg/45 via-bg/25 to-bg/55 dark:from-bg/95 dark:via-bg/80 dark:to-bg/90 transition-colors duration-300" />
      </div>

      {/* ── Unified liquid glass navbar ── */}
      <nav className="absolute top-0 left-0 right-0 z-20 px-4 pt-5 md:px-8 !overflow-visible w-full">
        <div className="liquid-glass rounded-2xl px-5 py-3 flex items-center justify-between max-w-7xl mx-auto !overflow-visible">
          {/* Back Button styled to match */}
          <button 
            onClick={() => navigate('/login')} 
            className="flex items-center gap-2 text-sm font-bold text-heading hover:opacity-85 transition-opacity focus:outline-none"
          >
            <ArrowLeft className="h-4 w-4 text-primary" />
            <span>{t('verify.back', { defaultValue: 'Back' })}</span>
          </button>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* ── Centered glass card ── */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] as const }}
      >
        <div className="liquid-glass rounded-3xl px-5 py-8 sm:p-10 border border-border">
          {/* Header */}
          <div className="mb-8 text-center flex flex-col items-center">
            {/* Icon badge */}
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary shadow-sm">
              <ShieldCheck className="h-7 w-7 animate-pulse" />
            </div>
            
            <h1 className="font-serif italic text-4xl text-heading mb-3 leading-tight">
              {t('verify.title')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              {t('verify.subtitle')}{' '}
              <span className="font-semibold text-heading break-all block mt-1">{email}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="mb-3 block text-[11px] font-bold uppercase tracking-widest text-muted text-center">
                {t('verify.codeLabel')}
              </label>
              
              <div className="grid grid-cols-6 gap-1.5 sm:gap-2.5 justify-items-center" onPaste={handleOtpPaste}>
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
                    className={`w-full max-w-[48px] sm:max-w-[56px] aspect-square rounded-xl border bg-surface text-center font-mono text-xl sm:text-2xl text-heading transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 ${
                      errors.token ? 'border-danger/60' : 'border-border hover:border-primary/45'
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
                <p className="mt-2 text-center text-xs text-danger font-medium">{errors.token.message}</p>
              )}
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-xs text-danger font-medium border border-danger/20"
              >
                {serverError}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-fg px-6 py-3.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-sm"
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
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover disabled:cursor-not-allowed disabled:text-muted transition-colors duration-200"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${resendCooldown ? 'animate-spin' : ''}`} />
              {resendCooldown ? t('verify.resendCooldown') : t('verify.resend')}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
