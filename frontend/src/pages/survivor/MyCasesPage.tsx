// MyCasesPage — full list of the survivor's submitted cases.
// Route: /safe-space/cases

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge, UrgencyBadge } from '../../components/ui';
import api from '../../lib/api';

interface Case {
  id: string;
  case_number: string;
  title: string;
  status: string;
  urgency_level: string;
  category: string;
  created_at: string;
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyCasesPage() {
  const { data, isLoading, isError } = useQuery<{ data: Case[] }>({
    queryKey: ['my-cases'],
    queryFn: async () => {
      const res = await api.get('/cases?sort_by=created_at&sort_dir=desc');
      return res.data;
    },
  });

  const cases = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-teal-900">My Cases</h1>
        <Link
          to="/safe-space/report"
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          + New Report
        </Link>
      </div>

      {isError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          Failed to load your cases. Please refresh the page.
        </div>
      )}

      {cases.length === 0 && !isError ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-medium text-dark mb-1">No cases yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Cases you report will appear here so you can track their progress.
          </p>
          <Link
            to="/safe-space/report"
            className="inline-block rounded-xl bg-teal-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            Report your first case
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Link
              key={c.id}
              to={`/safe-space/cases/${c.id}`}
              className="group flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-4 shadow-sm hover:border-teal-200 hover:shadow-md transition-all duration-150"
            >
              {/* Left: case info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-dark truncate">{c.title}</p>
                  {c.urgency_level === 'critical' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                      CRITICAL
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[10px] text-gray-400">{c.case_number}</span>
                  {c.category && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500 capitalize">{c.category}</span>
                  )}
                  <span className="text-[10px] text-gray-400">{relativeDate(c.created_at)}</span>
                </div>
              </div>

              {/* Right: status + arrow */}
              <div className="flex items-center gap-3 shrink-0 ml-4">
                <StatusBadge status={c.status} />
                <span className="text-gray-300 group-hover:text-teal-400 transition-colors text-lg">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
