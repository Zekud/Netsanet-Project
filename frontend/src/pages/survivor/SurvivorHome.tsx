// SurvivorHome — the first page a survivor sees after login.
// Route: /safe-space/home
// Calm, reassuring, action-oriented. No medical/legal jargon.

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { StatusBadge } from '../../components/ui';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  urgency_level: string;
  created_at: string;
}

// ─── Sub-components ───────────────────────────────────────────

function ActionCard({
  to,
  icon,
  title,
  description,
  primary,
}: {
  to: string;
  icon: string;
  title: string;
  description: string;
  primary?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`group flex flex-col rounded-2xl p-6 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        primary
          ? 'bg-teal-500 text-white shadow-md'
          : 'border border-gray-100 bg-white text-dark shadow-sm hover:border-teal-200'
      }`}
    >
      <span className="mb-4 text-4xl">{icon}</span>
      <h3 className={`font-serif text-lg mb-1 ${primary ? 'text-white' : 'text-teal-900'}`}>{title}</h3>
      <p className={`text-sm leading-relaxed ${primary ? 'text-teal-100' : 'text-gray-500'}`}>{description}</p>
      <span className={`mt-4 text-sm font-medium ${primary ? 'text-teal-100' : 'text-teal-600'} group-hover:underline`}>
        {primary ? 'Get started →' : 'Open →'}
      </span>
    </Link>
  );
}

function ResourceCard({
  icon,
  title,
  body,
  href,
  to,
}: {
  icon: string;
  title: string;
  body: string;
  href?: string;
  to?: string;
}) {
  const inner = (
    <div className="flex gap-4 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-teal-200 hover:shadow-md">
      <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
      <div>
        <p className="text-sm font-medium text-dark mb-0.5">{title}</p>
        <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
      </div>
    </div>
  );

  if (href) return <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>;
  if (to) return <Link to={to}>{inner}</Link>;
  return inner;
}

// ─── Main Component ───────────────────────────────────────────

export default function SurvivorHome() {
  const { user } = useAuth();

  const { data: casesData, isLoading: casesLoading } = useQuery<{ data: Case[] }>({
    queryKey: ['my-cases-home'],
    queryFn: async () => {
      const res = await api.get('/cases?limit=3&sort_by=created_at&sort_dir=desc');
      return res.data;
    },
  });

  const recentCases = casesData?.data ?? [];
  const firstName = user?.display_name?.split(' ')[0] || null;

  return (
    <div className="space-y-10">
      {/* ─── Greeting ─────────────────────────────────────────── */}
      <section>
        <h1 className="font-serif text-3xl text-teal-900 mb-1">
          {firstName
            ? `You are in a safe space, ${firstName}.`
            : 'You are in a safe space.'}
        </h1>
        <p className="text-gray-500 text-sm">
          Everything here is private and confidential. Take your time.
        </p>
      </section>

      {/* ─── Primary Actions ──────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <ActionCard
            to="/safe-space/report"
            icon="📝"
            title="Report an Incident"
            description="Tell us what happened securely and confidentially. Our team is here to help."
            primary
          />
          <ActionCard
            to="/safe-space/chat"
            icon="⚖️"
            title="Talk to Legal AI Guide"
            description="Ask questions about your rights, protection orders, and legal steps available to you."
          />
        </div>
      </section>

      {/* ─── Active Cases ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-xl text-teal-900">Your Cases</h2>
          <Link to="/safe-space/cases" className="text-sm text-teal-600 hover:text-teal-800 hover:underline transition-colors">
            See all →
          </Link>
        </div>

        {casesLoading ? (
          <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-4 shadow-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <span className="text-sm text-gray-500">Loading your cases…</span>
          </div>
        ) : recentCases.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-gray-500">You haven't submitted any cases yet.</p>
            <Link
              to="/safe-space/report"
              className="mt-3 inline-block text-sm font-medium text-teal-600 hover:underline"
            >
              Report your first case →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((c) => (
              <Link
                key={c.id}
                to={`/safe-space/cases/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-150 group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{c.case_number}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <StatusBadge status={c.status} />
                  <span className="text-gray-300 group-hover:text-teal-400 transition-colors">›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─── Resources ────────────────────────────────────────── */}
      <section>
        <h2 className="font-serif text-xl text-teal-900 mb-3">Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ResourceCard
            to="/safe-space/chat"
            icon="📖"
            title="Your Legal Rights"
            body="Learn about your rights under Ethiopian law — protection orders, divorce, custody, and more."
          />
          <ResourceCard
            icon="📞"
            title="Emergency Contacts"
            body="Police: 911 · MoWSA Hotline: 8335 · GBV Emergency Line: 0800 720 060 (toll-free)"
            href="tel:8335"
          />
          <ResourceCard
            icon="🏛️"
            title="Local Support Centers"
            body="Ministry of Women & Social Affairs — Addis Ababa: +251 11 155 0077. Open Mon–Fri 8am–5pm."
            href="tel:+251111550077"
          />
          <ResourceCard
            icon="🤝"
            title="EWLA Legal Aid"
            body="Ethiopian Women Lawyers Association offers free legal representation. Contact: +251 11 551 7790."
            href="tel:+251115517790"
          />
        </div>
      </section>
    </div>
  );
}
