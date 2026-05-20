// About.tsx — About page for Netsanet platform
// Route: /about

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Heart, Users, Target, Award, ArrowLeft, Building2,
  Sparkles, Globe, CheckCircle,
} from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

const SOLUTION_ICONS = [Shield, Sparkles, Globe, Users, Building2, Award];
const VALUE_ICONS = [Shield, Heart, CheckCircle, Users];

export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

  const problemItems = t('problem.items', { returnObjects: true }) as {
    title: string; description: string;
  }[];

  const solutionItems = t('solution.items', { returnObjects: true }) as {
    title: string; description: string;
  }[];

  const partners = t('team.partners', { returnObjects: true }) as {
    name: string; description: string;
  }[];

  const values = t('values.items', { returnObjects: true }) as {
    title: string; description: string;
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
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-heading transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </button>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ─── Hero Section ────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="mesh-blob-1 top-10 -left-20" />
        <div className="mesh-blob-2 top-32 -right-10" />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-muted bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary animate-fade-in">
            <Heart className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </div>

          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl animate-stagger-1 text-center">
            {t('hero.title')}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted leading-relaxed animate-stagger-2 text-center">
            {t('hero.subtitle')}
          </p>
        </div>
      </section>

      {/* ─── Mission & Vision ────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm hover-lift">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Target className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl text-heading mb-3">{t('mission.title')}</h2>
              <p className="text-muted leading-relaxed">
                {t('mission.description')}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm hover-lift">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl text-heading mb-3">{t('vision.title')}</h2>
              <p className="text-muted leading-relaxed">
                {t('vision.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Problem ─────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">{t('problem.title')}</h2>
            <p className="text-muted max-w-2xl mx-auto">
              {t('problem.subtitle')}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {problemItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6 text-center">
                <h3 className="font-heading text-lg text-heading mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Our Solution ────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-heading mb-3">{t('solution.title')}</h2>
            <p className="text-muted max-w-2xl mx-auto">
              {t('solution.subtitle')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {solutionItems.map((item, i) => {
              const Icon = SOLUTION_ICONS[i] ?? Shield;
              return (
                <div key={i} className="rounded-2xl border border-border bg-surface p-6 hover-lift">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg text-heading mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Team & Partners ─────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">{t('team.title')}</h2>
            <p className="text-muted max-w-2xl mx-auto">
              {t('team.subtitle')}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 mb-8">
            <h3 className="font-heading text-xl text-heading mb-4 text-center">{t('team.partnersTitle')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {partners.map((partner, i) => (
                <div key={i} className="text-center p-4 rounded-xl border border-border-muted hover-lift">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-heading text-sm font-bold">
                    {partner.name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-heading">{partner.name}</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">{partner.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted mb-4">
              {t('team.acknowledgment')}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Core Values ─────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">{t('values.title')}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {values.map((value, i) => {
              const Icon = VALUE_ICONS[i] ?? Shield;
              return (
                <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg text-heading mb-1">{value.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{value.description}</p>
                  </div>
                </div>
              );
            })}
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
              <a href="/about" className="hover:text-heading transition-colors">{t('footer.links.about')}</a>
              <a href="/privacy" className="hover:text-heading transition-colors">{t('footer.links.privacy')}</a>
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
