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

export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

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
            About Netsanet
          </div>

          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl animate-stagger-1 text-center">
            Transforming Survivor Support in Ethiopia
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted leading-relaxed animate-stagger-2 text-center">
            Developed as a final year project at Addis Ababa Science and Technology University, Netsanet combines cutting-edge AI technology with deep understanding of Ethiopia's social context to transform how survivors of gender-based violence access support and justice.
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
              <h2 className="font-heading text-2xl text-heading mb-3">Our Mission</h2>
              <p className="text-muted leading-relaxed">
                To provide a safe, accessible, and technology-driven platform that empowers survivors of gender-based violence in Ethiopia with the tools, resources, and support they need to seek justice and rebuild their lives.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm hover-lift">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="font-heading text-2xl text-heading mb-3">Our Vision</h2>
              <p className="text-muted leading-relaxed">
                A future where every survivor in Ethiopia has immediate access to confidential support, legal guidance, and coordinated care — breaking down barriers of language, location, and stigma through innovative technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── The Problem ─────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">Why Netsanet Exists</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Gender-based violence remains a critical challenge in Ethiopia, with survivors facing numerous barriers to accessing support and justice.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'Limited Access',
                description: 'Many survivors lack access to legal aid, counseling, and support services, especially in rural areas.',
              },
              {
                title: 'Fear & Stigma',
                description: 'Cultural stigma and fear of retaliation prevent survivors from reporting incidents and seeking help.',
              },
              {
                title: 'Fragmented Care',
                description: 'Support services are scattered across multiple institutions with poor coordination and communication.',
              },
            ].map((item, i) => (
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
            <h2 className="font-heading text-3xl text-heading mb-3">What Makes Netsanet Different</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Unlike traditional support systems, Netsanet brings together technology, local expertise, and institutional collaboration to create a comprehensive ecosystem of care.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Built Through Co-Design',
                description: 'Developed alongside survivors, case workers, and legal professionals through months of interviews, workshops, and iterative testing.',
              },
              {
                icon: Sparkles,
                title: 'Research-Driven Development',
                description: 'Grounded in academic research on GBV support systems, trauma-informed design principles, and Ethiopian legal frameworks.',
              },
              {
                icon: Globe,
                title: 'Local Language Expertise',
                description: 'Worked with native speakers and cultural consultants to ensure authentic, respectful communication across all six languages.',
              },
              {
                icon: Users,
                title: 'Cross-Sector Partnership',
                description: 'Brought together government ministries, legal organizations, tech experts, and civil society in unprecedented collaboration.',
              },
              {
                icon: Building2,
                title: 'Academic Rigor Meets Real Impact',
                description: 'Combines university research standards with practical deployment in real support institutions across Ethiopia.',
              },
              {
                icon: Award,
                title: 'Open to Evolution',
                description: 'Designed as a living platform that learns from usage patterns and adapts to emerging needs of survivors and institutions.',
              },
            ].map((feature, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-6 hover-lift">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-heading mb-2">{feature.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Team & Partners ─────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">Built by Students, Backed by Experts</h2>
            <p className="text-muted max-w-2xl mx-auto">
              Netsanet is a final year project developed at Addis Ababa Science and Technology University (AASTU) in collaboration with leading institutions.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-8 mb-8">
            <h3 className="font-heading text-xl text-heading mb-4 text-center">Partner Institutions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { name: 'MoWSA', desc: 'Ministry of Women & Social Affairs' },
                { name: 'EWLA', desc: 'Ethiopian Women Lawyers Association' },
                { name: 'AASTU', desc: 'Addis Ababa Science & Technology University' },
                { name: 'UNICEF', desc: 'United Nations Children\'s Fund' },
              ].map((partner, i) => (
                <div key={i} className="text-center p-4 rounded-xl border border-border-muted hover-lift">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary font-heading text-sm font-bold">
                    {partner.name.charAt(0)}
                  </div>
                  <p className="text-sm font-semibold text-heading">{partner.name}</p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">{partner.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-muted mb-4">
              Special thanks to our advisors, case workers, legal experts, and survivors who provided invaluable feedback throughout development.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Core Values ─────────────────────────────────── */}
      <section className="border-y border-border bg-inset py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl text-heading mb-3">Our Core Values</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: Shield,
                title: 'Safety First',
                description: 'Every design decision prioritizes survivor safety, privacy, and security.',
              },
              {
                icon: Heart,
                title: 'Compassion',
                description: 'We approach every interaction with empathy, respect, and cultural sensitivity.',
              },
              {
                icon: CheckCircle,
                title: 'Transparency',
                description: 'Clear communication about how data is used, stored, and protected.',
              },
              {
                icon: Users,
                title: 'Collaboration',
                description: 'Working together with institutions, experts, and communities for better outcomes.',
              },
            ].map((value, i) => (
              <div key={i} className="flex gap-4 rounded-xl border border-border bg-surface p-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <value.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-lg text-heading mb-1">{value.title}</h3>
                  <p className="text-sm text-muted leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
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
              <span className="text-sm text-muted">AI-powered support for women across Ethiopia.</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <a href="/about" className="hover:text-heading transition-colors">About</a>
              <a href="#" className="hover:text-heading transition-colors">Privacy</a>
              <a href="#" className="hover:text-heading transition-colors">Terms</a>
              <a href="#" className="hover:text-heading transition-colors">Contact</a>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-placeholder">
            © {new Date().getFullYear()} Netsanet Platform — AASTU Final Year Project
          </p>
        </div>
      </footer>
    </div>
  );
}
