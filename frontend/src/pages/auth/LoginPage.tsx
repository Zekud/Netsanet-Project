// LoginPage — cinematic dark redesign.
// Full-screen image background, centered liquid glass form card.
// Route: /login

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Mail } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import QuickExitButton from '../../components/ui/QuickExitButton';
import Logo from '../../components/ui/Logo';


interface LoginFormData { email: string }

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const { t } = useTranslation('auth');
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await requestOtp(data.email);
      navigate('/login/verify', { state: { email: data.email } });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('login.defaultError'));
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-body flex flex-col items-center justify-center pt-28 pb-12 px-4 overflow-y-auto overflow-x-hidden transition-colors duration-300">
      <QuickExitButton />

      {/* ── Full-screen background image ── */}
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
          {/* Logo */}
          <button onClick={() => navigate('/')} className="focus:outline-none">
            <Logo size="md" />
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
        <div className="liquid-glass rounded-3xl p-8 md:p-10 border border-border">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="font-serif italic text-4xl text-heading mb-3 leading-tight">
              {t('login.cinematicHeader')}
            </h1>
            <p className="text-muted text-sm leading-relaxed">
              {t('login.description')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-widest text-muted mb-2">
                {t('login.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('login.emailPlaceholder')}
                  {...register('email', {
                    required: t('login.emailRequired'),
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t('login.emailInvalid') },
                  })}
                  className={`w-full rounded-xl border bg-surface text-heading placeholder:text-placeholder pl-11 pr-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/60 ${
                    errors.email ? 'border-danger/60' : 'border-border'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger font-medium">{errors.email.message}</p>
              )}
            </div>

            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-danger-soft border border-danger/20 px-4 py-3 text-xs text-danger font-medium"
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
                  <div className="h-4 w-4 rounded-full border-2 border-primary-fg border-t-transparent animate-spin" />
                  {t('login.buttonLoading')}
                </>
              ) : (
                <>{t('login.button')} <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 border-t border-border" />

          {/* Trust notes */}
          <div className="space-y-2">
            {[
              t('login.footerLine1'),
              t('login.footerLine2'),
            ].map((line, i) => (
              <p key={i} className="text-center text-[11px] text-muted leading-relaxed">{line}</p>
            ))}
          </div>
        </div>

        {/* Below-card back link */}
        <p className="text-center mt-5 text-xs">
          <button onClick={() => navigate('/')} className="text-muted hover:text-heading transition-colors underline underline-offset-2">
            ← {t('login.backToHome')}
          </button>
        </p>
      </motion.div>

      {/* Subtle brand ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        aria-hidden="true"
        style={{ background: 'radial-gradient(ellipse at center, var(--c-primary-soft) 0%, transparent 70%)' }}
      />
    </div>
  );
}
