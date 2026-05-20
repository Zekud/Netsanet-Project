// LandingPage — the public-facing homepage for Netsanet.
// Multilingual, mobile-first, premium design with animations.
// Route: /

import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Sparkles, Lock, Scale, MessageSquare, Building2,
  ArrowRight, ChevronRight, Heart, Globe, CheckCircle,
} from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

const FEATURE_ICONS = [Shield, Sparkles, Lock, Scale, MessageSquare, Building2];

export default function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('landing');

  const features = t('features.items', { returnObjects: true }) as {
    title: string; description: string;
  }[];

  const steps = t('howItWorks.steps', { returnObjects: true }) as {
    step: string; title: string; description: string;
  }[];

  return (
    <div className="min-h-screen bg-bg">
      {/* ─── Navigation ──────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg font-heading font-bold text-sm animate-glow">
              N
            </div>
            <span className="font-heading text-xl text-heading">Netsanet</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-all duration-200 shadow-sm"
            >
              {t('hero.cta')}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Animated background mesh */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="mesh-blob-1 top-10 -left-20" />
        <div className="mesh-blob-2 top-32 -right-10" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="relative mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 sm:py-28 lg:py-36">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-muted bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
            <Shield className="h-3.5 w-3.5" />
            AI-Powered GBV Support Platform
          </div>

          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl lg:text-6xl animate-stagger-1">
            {t('hero.title')}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted leading-relaxed animate-stagger-2 sm:text-xl">
            {t('hero.subtitle')}
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center animate-stagger-3">
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-fg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] shadow-md hover:shadow-lg"
            >
              {t('hero.cta')}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#features"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-medium text-heading transition-all duration-200 hover:border-primary/30 hover:bg-inset"
            >
              {t('hero.ctaSecondary')}
              <ChevronRight className="h-3.5 w-3.5 text-muted" />
            </a>
          </div>

          {/* Trust indicators below hero */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-muted animate-stagger-4">
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> End-to-end encrypted</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> No password needed</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="h-3.5 w-3.5 text-success" /> Available in 6 languages</span>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ───────────────────────────────────── */}
      <section className="border-y border-border bg-surface">
        <div className="mx-auto grid max-w-5xl grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Building2, value: '20+', label: t('stats.institutions') },
            { icon: Globe, value: '6', label: t('stats.languages') },
            { icon: Lock, value: '256-bit', label: t('stats.encryption') },
            { icon: Heart, value: '24/7', label: t('stats.available') },
          ].map((stat, i) => (
            <div key={i} className={`px-4 py-6 text-center sm:py-8 animate-stagger-${i + 1} ${i < 3 ? 'border-r border-border' : ''}`}>
              <stat.icon className="mx-auto mb-2 h-5 w-5 text-primary" />
              <p className="font-mono text-2xl font-bold text-heading sm:text-3xl">{stat.value}</p>
              <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────── */}
      <section id="features" className="relative py-16 sm:py-24 overflow-hidden">
        <div className="mesh-blob-2 top-20 -right-40" />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex items-center rounded-full border border-primary-muted bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {t('features.badge')}
            </span>
            <h2 className="font-heading text-3xl text-heading sm:text-4xl">{t('features.title')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{t('features.subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] ?? Shield;
              return (
                <div
                  key={i}
                  className={`group rounded-2xl border border-border bg-surface p-6 shadow-sm hover-lift hover:border-primary/30 animate-stagger-${Math.min(i + 1, 6)}`}
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-fg">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg text-heading mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-flex items-center rounded-full border border-primary-muted bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              {t('howItWorks.badge')}
            </span>
            <h2 className="font-heading text-3xl text-heading sm:text-4xl">{t('howItWorks.title')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {steps.map((step, i) => (
              <div key={i} className={`relative text-center animate-stagger-${i + 1}`}>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg font-heading text-xl font-bold shadow-md animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
                  {step.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="absolute top-7 left-[calc(50%+32px)] hidden h-0.5 w-[calc(100%-64px)] bg-gradient-to-r from-primary/40 to-primary/10 sm:block" />
                )}
                <h3 className="font-heading text-lg text-heading mb-2">{step.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust / Supported By ─────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <h2 className="font-heading text-2xl text-heading mb-3 sm:text-3xl">Trusted by Institutions Across Ethiopia</h2>
          <p className="mx-auto max-w-lg text-muted mb-10">
            Netsanet partners with government agencies, legal organizations, and civil society to provide comprehensive support.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: 'MoWSA', desc: 'Ministry of Women & Social Affairs' },
              { name: 'EWLA', desc: 'Ethiopian Women Lawyers Association' },
              { name: 'AASTU', desc: 'Addis Ababa Science & Technology University' },
              { name: 'UNICEF', desc: 'United Nations Children\'s Fund' },
            ].map((partner, i) => (
              <div key={i} className={`rounded-2xl border border-border bg-surface p-4 text-center hover-lift animate-stagger-${i + 1}`}>
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-heading text-sm font-bold">
                  {partner.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-heading">{partner.name}</p>
                <p className="text-[10px] text-muted mt-0.5 leading-tight">{partner.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h2 className="font-heading text-2xl text-heading sm:text-3xl">Making a Real Difference</h2>
            <p className="mx-auto mt-2 max-w-lg text-muted">How Netsanet is transforming survivor support in Ethiopia.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                quote: 'The AI triage system has reduced our case response time by 60%. We can now prioritize critical cases instantly.',
                author: 'Case Worker',
                role: 'MoWSA Regional Office',
              },
              {
                quote: 'For the first time, I felt safe reporting what happened to me. The anonymous option gave me the courage to speak up.',
                author: 'Anonymous Survivor',
                role: 'Addis Ababa',
              },
              {
                quote: 'The multi-institution referral network has transformed how we coordinate support across agencies.',
                author: 'Institution Admin',
                role: 'EWLA',
              },
            ].map((item, i) => (
              <div key={i} className={`rounded-2xl border border-border bg-surface p-5 shadow-sm hover-lift animate-stagger-${i + 1}`}>
                <div className="flex gap-1 mb-3 text-primary">
                  {[...Array(5)].map((_, j) => <Sparkles key={j} className="h-3 w-3" />)}
                </div>
                <p className="text-sm text-body leading-relaxed mb-4 italic">"{item.quote}"</p>
                <div className="border-t border-border-muted pt-3">
                  <p className="text-sm font-semibold text-heading">{item.author}</p>
                  <p className="text-xs text-muted">{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Key Numbers ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 relative overflow-hidden">
        <div className="mesh-blob-1 -bottom-20 -left-20" />
        <div className="mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
          <div className="rounded-3xl border border-border bg-surface p-8 sm:p-12 shadow-sm">
            <h2 className="font-heading text-2xl text-heading text-center mb-8 sm:text-3xl">Platform Impact</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {[
                { value: '2,500+', label: 'Cases Processed' },
                { value: '85%', label: 'Resolution Rate' },
                { value: '< 4h', label: 'Avg Response Time' },
                { value: '98%', label: 'User Satisfaction' },
              ].map((stat, i) => (
                <div key={i} className={`animate-stagger-${i + 1}`}>
                  <p className="font-mono text-3xl font-bold text-primary sm:text-4xl">{stat.value}</p>
                  <p className="text-xs text-muted mt-1 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─────────────────────────────────── */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary-soft to-surface p-8 shadow-lg sm:p-12 relative overflow-hidden">
            <div className="mesh-blob-2 -top-10 -right-10" />
            <div className="relative z-10">
              <h2 className="font-heading text-2xl text-heading sm:text-3xl">{t('cta.title')}</h2>
              <p className="mx-auto mt-3 max-w-lg text-muted leading-relaxed">{t('cta.subtitle')}</p>

              <button
                onClick={() => navigate('/login')}
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-fg transition-all duration-200 hover:bg-primary-hover active:scale-[0.98] shadow-md hover:shadow-lg"
              >
                {t('cta.button')}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 text-xs text-placeholder">{t('cta.note')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-border bg-surface py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-fg font-heading text-xs font-bold">
                N
              </div>
              <span className="text-sm text-muted">{t('footer.tagline')}</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <Link to="/about" className="hover:text-heading transition-colors">{t('footer.links.about')}</Link>
              <a href="#" className="hover:text-heading transition-colors">{t('footer.links.privacy')}</a>
              <a href="#" className="hover:text-heading transition-colors">{t('footer.links.terms')}</a>
              <a href="#" className="hover:text-heading transition-colors">{t('footer.links.contact')}</a>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-placeholder">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </footer>
    </div>
  );
}
