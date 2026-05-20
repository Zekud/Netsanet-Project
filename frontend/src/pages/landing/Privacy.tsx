// Privacy.tsx — Privacy Policy page for Netsanet platform
// Route: /privacy

import { useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Eye, Database, UserX, FileText, ArrowLeft,
  CheckCircle, AlertTriangle, Globe, Users, Sparkles, TrendingUp, Scale, Building2,
} from 'lucide-react';
import LanguageSwitcher from '../../components/ui/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';

export default function Privacy() {
  const navigate = useNavigate();

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
            Privacy Policy
          </div>

          <h1 className="font-heading text-4xl leading-tight text-heading sm:text-5xl animate-stagger-1 text-center">
            Your Privacy & Safety Come First
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted leading-relaxed animate-stagger-2 text-center">
            At Netsanet, protecting survivor privacy and data security is our highest priority. This policy explains how we collect, use, and safeguard your information.
          </p>
        </div>
      </section>

      {/* ─── Key Principles ──────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-b border-border">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl text-heading mb-3">Our Privacy Principles</h2>
            <p className="text-muted max-w-2xl mx-auto">
              These core principles guide every decision we make about your data.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Shield,
                title: 'Safety First',
                description: 'Your safety is paramount. We never share survivor data with unauthorized parties.',
              },
              {
                icon: Lock,
                title: 'End-to-End Encryption',
                description: 'All communications and evidence are encrypted. Even we cannot access your private messages.',
              },
              {
                icon: UserX,
                title: 'Anonymous Option',
                description: 'You can report cases anonymously. Your identity remains hidden unless you choose to reveal it.',
              },
              {
                icon: Eye,
                title: 'Transparency',
                description: 'We clearly explain what data we collect, why we collect it, and how it\'s used.',
              },
              {
                icon: Database,
                title: 'Minimal Data',
                description: 'We only collect information necessary to provide support services.',
              },
              {
                icon: FileText,
                title: 'Your Control',
                description: 'You control your data. Request access, corrections, or deletion at any time.',
              },
            ].map((principle, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-6 hover-lift">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <principle.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg text-heading mb-2">{principle.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{principle.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Information We Collect ──────────────────────── */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-3 text-center">Information We Collect</h2>
          <p className="text-center text-muted mb-12 max-w-2xl mx-auto">
            We collect only what's necessary to provide you with safe, effective support services.
          </p>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="group relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:border-primary/40 transition-all duration-300">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/20">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl text-heading mb-3">Account Information</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-muted leading-relaxed">Email address for authentication via one-time password (OTP)</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-muted leading-relaxed">User role and institution assignment (for case workers and admins)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="group relative rounded-3xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 hover:border-primary/40 transition-all duration-300">
              <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl group-hover:bg-primary/20 transition-colors" />
              <div className="relative">
                <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/20">
                  <FileText className="h-7 w-7" />
                </div>
                <h3 className="font-heading text-xl text-heading mb-3">Case Information</h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-muted leading-relaxed">Incident details including date, location, and description</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <p className="text-sm text-muted leading-relaxed">Evidence files and encrypted communication with case workers</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How We Use Your Information ─────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-y border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">How We Use Your Information</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Provide Support Services',
                description: 'Connect you with case workers, legal aid, and support institutions.',
              },
              {
                title: 'Case Management',
                description: 'Track case progress, coordinate referrals, and facilitate communication.',
              },
              {
                title: 'AI-Powered Assistance',
                description: 'Provide risk assessment, case prioritization, and legal guidance through our AI systems.',
              },
              {
                title: 'Security & Safety',
                description: 'Detect and prevent unauthorized access, fraud, and abuse of the platform.',
              },
              {
                title: 'Service Improvement',
                description: 'Analyze anonymized usage patterns to improve platform features and user experience.',
              },
              {
                title: 'Legal Compliance',
                description: 'Comply with Ethiopian laws and respond to valid legal requests (with survivor notification when possible).',
              },
            ].map((item, i) => (
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
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">Who We Share Data With</h2>

          <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-heading font-semibold mb-1">Important: Limited Sharing</p>
                <p className="text-sm text-muted leading-relaxed">
                  We NEVER sell your data. We only share information with authorized parties necessary for your support and safety.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: Users,
                title: 'Assigned Case Workers',
                description: 'Your assigned case worker can access case details to provide support. Anonymous cases hide your identity.',
              },
              {
                icon: Building2,
                title: 'Partner Institutions',
                description: 'When you consent to a referral, relevant case information is shared with the receiving institution (e.g., legal aid, medical facility).',
              },
              {
                icon: Shield,
                title: 'System Administrators',
                description: 'Technical staff have limited access for system maintenance and security. They are bound by strict confidentiality agreements.',
              },
              {
                icon: Scale,
                title: 'Law Enforcement (Only When Required)',
                description: 'We may be legally required to share information in response to valid court orders. We will notify you unless prohibited by law.',
              },
              {
                icon: Sparkles,
                title: 'AI Service Providers',
                description: 'Google Gemini processes case data for risk assessment. Data is anonymized and encrypted. Google does not store or use this data for other purposes.',
              },
            ].map((item, i) => {
              const Icon = item.icon;
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
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">Your Privacy Rights</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'Access Your Information',
                description: 'View your account information and case details through your dashboard.',
              },
              {
                title: 'Update Case Information',
                description: 'Correct or update information in your reported cases as needed.',
              },
              {
                title: 'Anonymous Reporting',
                description: 'Report cases anonymously to protect your identity while receiving support.',
              },
              {
                title: 'Request Data Deletion',
                description: 'Contact us to request account deletion (subject to legal retention requirements for active cases).',
              },
            ].map((right, i) => (
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
          <h2 className="font-heading text-3xl text-heading mb-8 text-center">How We Protect Your Data</h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {[
              {
                icon: Lock,
                title: 'Encryption',
                description: 'All data is encrypted in transit (TLS/SSL) and at rest (AES-256). Evidence files are stored in encrypted containers.',
              },
              {
                icon: Shield,
                title: 'Access Controls',
                description: 'Role-based access ensures only authorized personnel can view specific data. All access is logged and audited.',
              },
              {
                icon: Database,
                title: 'Secure Infrastructure',
                description: 'Data is stored on secure servers with regular backups, firewalls, and intrusion detection systems.',
              },
              {
                icon: Eye,
                title: 'Regular Audits',
                description: 'We conduct regular security audits and penetration testing to identify and fix vulnerabilities.',
              },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-surface p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-base text-heading mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Data Retention ──────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-inset border-y border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="font-heading text-3xl text-heading mb-6 text-center">Data Retention</h2>
          <div className="rounded-2xl border border-border bg-surface p-6 max-w-2xl mx-auto">
            <p className="text-sm text-muted leading-relaxed mb-4">
              We retain your data only as long as necessary to provide services and comply with legal obligations:
            </p>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span><strong>Active cases:</strong> Retained until case closure + 7 years (Ethiopian legal requirement)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span><strong>Account data:</strong> Retained while account is active + 1 year after deletion request</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span><strong>Security logs:</strong> Retained for 90 days (anonymized)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span><strong>Analytics data:</strong> Anonymized and aggregated, retained indefinitely</span>
              </li>
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
              <span className="text-sm text-muted">AI-powered support for women across Ethiopia.</span>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted">
              <a href="/about" className="hover:text-heading transition-colors">About</a>
              <a href="/privacy" className="hover:text-heading transition-colors">Privacy</a>
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
