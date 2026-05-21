// Privacy.tsx — Privacy Policy page for Netsanet platform
// Route: /privacy

import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield, Lock, Eye, Database, UserX, FileText, ArrowLeft,
  CheckCircle, AlertTriangle, Users, Sparkles, Scale, Building2,
} from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

const PRINCIPLE_ICONS = [Shield, Lock, UserX, Eye, Database, FileText];
const COLLECTION_ICONS = [CheckCircle, FileText];
const SECURITY_ICONS = [Lock, Shield, Database, Eye];
const SHARING_ICONS = [Users, Building2, Shield, Scale, Sparkles];

export default function Privacy() {
  const navigate = useNavigate();
  const { t } = useTranslation('privacy');

  const principleItems = t('principles.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const collectionItems = t('collection.items', { returnObjects: true }) as Array<{ title: string; details: string[] }>;
  const usageItems = t('usage.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const sharingItems = t('sharing.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const rightsItems = t('rights.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const securityItems = t('security.items', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const retentionItems = t('retention.items', { returnObjects: true }) as Array<{ label: string; duration: string; note: string }>;

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
            <Shield className="h-3.5 w-3.5" />
            {t('hero.badge')}
          </div>

          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl animate-stagger-1 text-center">
            {t('hero.title')}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted leading-relaxed animate-stagger-2 text-center">
            {t('hero.description')}
          </p>
        </div>
      </section>

      {/* ─── Key Principles ──────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-heading mb-3">{t('principles.title')}</h2>
            <p className="text-muted max-w-2xl mx-auto">
              {t('principles.description')}
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {principleItems.map((principle, i) => {
              const Icon = PRINCIPLE_ICONS[i];
              return (
                <div key={i} className="rounded-2xl border border-border bg-surface p-6 hover-lift">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-lg text-heading mb-2">{principle.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{principle.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Information We Collect ──────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-3 text-center">{t('collection.title')}</h2>
          <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
            {t('collection.description')}
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {collectionItems.map((item, i) => {
              const Icon = COLLECTION_ICONS[i];
              return (
                <div key={i} className="group relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:border-primary/40 transition-all duration-300">
                  <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
                  <div className="relative">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/20">
                      <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="font-heading text-xl text-heading mb-3">{item.title}</h3>
                    <div className="space-y-2.5">
                      {item.details.map((detail, j) => (
                        <div key={j} className="flex items-start gap-2.5">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <p className="text-sm text-muted leading-relaxed">{detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How We Use Your Information ─────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-y border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">{t('usage.title')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {usageItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5 hover-lift transition-all duration-200">
                <div className="flex items-start gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-fg text-sm font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-base text-heading mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Data Sharing ────────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">{t('sharing.title')}</h2>

          <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-heading font-semibold mb-1">{t('sharing.warning.title')}</p>
                <p className="text-sm text-muted leading-relaxed">
                  {t('sharing.warning.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {sharingItems.map((item, i) => {
              const Icon = SHARING_ICONS[i];
              return (
                <div key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 hover:border-primary/30 transition-colors">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading text-base text-heading mb-1.5">{item.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Your Rights ─────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-y border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">{t('rights.title')}</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {rightsItems.map((right, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-5">
                <h3 className="font-heading text-base text-heading mb-1">{right.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{right.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Data Security ───────────────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">{t('security.title')}</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {securityItems.map((item, i) => {
              const Icon = SECURITY_ICONS[i];
              return (
                <div key={i} className="rounded-xl border border-border bg-surface p-6">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading text-base text-heading mb-2">{item.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Data Retention ──────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-y border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-6 text-center">{t('retention.title')}</h2>
          <div className="rounded-2xl border border-border bg-surface p-6 max-w-2xl mx-auto">
            <p className="text-sm text-muted leading-relaxed mb-4">
              {t('retention.description')}
            </p>
            <ul className="space-y-2 text-sm text-muted">
              {retentionItems.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span><strong>{item.label}:</strong> {item.duration} ({item.note})</span>
                </li>
              ))}
            </ul>
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
