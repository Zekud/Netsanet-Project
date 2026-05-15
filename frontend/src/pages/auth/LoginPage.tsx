// LoginPage — the entry point for all users, both survivors and staff.
// Sends an OTP to the user's email address via the backend.
// Features a premium split-layout design with the new design system.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Mail, ArrowRight, Shield, Heart, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

interface LoginFormData {
  email: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const { t } = useTranslation('auth');
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    try {
      setServerError(null);
      await requestOtp(data.email);
      navigate('/login/verify', { state: { email: data.email } });
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t('login.defaultError')
      );
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ─── Left Panel: Branding (hidden on mobile) ─── */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary via-primary-hover to-secondary p-10 lg:flex relative overflow-hidden animate-gradient-shift">
        {/* Floating decorative blobs */}
        <div className="absolute top-20 right-10 h-48 w-48 rounded-full bg-primary-fg/5 blur-2xl animate-float" />
        <div className="absolute bottom-20 left-10 h-36 w-36 rounded-full bg-accent/10 blur-2xl" style={{ animation: 'float 5s ease-in-out infinite reverse' }} />
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-fg/20 font-heading text-lg font-bold text-primary-fg">
              N
            </div>
            <span className="font-heading text-2xl text-primary-fg">Netsanet</span>
          </div>
        </div>

        <div className="space-y-8">
          <h2 className="font-heading text-4xl leading-tight text-primary-fg">
            {t('login.brandTitle', { defaultValue: 'A safe space for every woman who needs support.' })}
          </h2>

          <div className="space-y-4">
            {[
              { icon: Shield, text: t('login.brandFeature1', { defaultValue: 'Confidential & secure reporting' }) },
              { icon: Heart,  text: t('login.brandFeature2', { defaultValue: 'Survivor-centered experience' }) },
              { icon: Lock,   text: t('login.brandFeature3', { defaultValue: 'No password needed — OTP only' }) },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-3 text-primary-fg/80">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary-fg/10">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-primary-fg/50">
          © {new Date().getFullYear()} Netsanet Platform — AASTU FYP
        </p>
      </div>

      {/* ─── Right Panel: Login Form ─── */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-end gap-2 p-4">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center px-4">
          <div className="w-full max-w-sm animate-fade-in-up">
            {/* Mobile logo */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg font-heading font-bold text-sm">
                N
              </div>
              <span className="font-heading text-xl text-heading">Netsanet</span>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-heading text-3xl text-heading mb-2">{t('login.title')}</h1>
              <p className="text-base text-muted leading-relaxed">
                {t('login.description')}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-heading"
                >
                  {t('login.emailLabel')}
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-placeholder">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t('login.emailPlaceholder')}
                    {...register('email', {
                      required: t('login.emailRequired'),
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: t('login.emailInvalid'),
                      },
                    })}
                    className={`w-full rounded-xl border bg-surface pl-10 pr-3.5 py-3 text-sm text-heading placeholder:text-placeholder transition-all duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20 ${
                      errors.email ? 'border-danger' : 'border-border'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-danger">{errors.email.message}</p>
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
                    {t('login.buttonLoading')}
                  </>
                ) : (
                  <>
                    {t('login.button')}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-8 text-center text-xs text-muted leading-relaxed">
              {t('login.footerLine1')}
              <br />
              {t('login.footerLine2')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
