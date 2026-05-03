// CaseDirectoryPage — staff data table with filters, search, and pagination.
// Shows all cases scoped by the user's role with urgency/status badges.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import { PageHeader, UrgencyBadge, StatusBadge, EmptyState, Spinner } from '../../components/ui';

// ─── Types ────────────────────────────────────────────────────

interface CaseRow {
  id: string;
  case_number: string;
  title: string;
  status: 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';
  category: 'legal' | 'medical' | 'shelter' | 'counseling' | 'other';
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  ai_summary: string | null;
  is_anonymous: boolean;
  assigned_worker_id: string | null;
  created_at: string;
}

interface CasesResponse {
  success: boolean;
  data: CaseRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Filter Options ──────────────────────────────────────────

const statusOptions = [
  { value: '', label: 'All' },
  { value: 'new', label: 'New' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'referred', label: 'Referred' },
  { value: 'active', label: 'Active' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const urgencyOptions = [
  { value: '', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const categoryLabels: Record<string, string> = {
  legal: 'Legal',
  medical: 'Medical',
  shelter: 'Shelter',
  counseling: 'Counseling',
  other: 'Other',
};

// ─── Component ────────────────────────────────────────────────

export default function CaseDirectoryPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 15;

  const queryParams = new URLSearchParams();
  queryParams.set('page', String(page));
  queryParams.set('limit', String(limit));
  queryParams.set('sort_by', 'created_at');
  queryParams.set('sort_dir', 'desc');
  if (statusFilter) queryParams.set('status', statusFilter);
  if (urgencyFilter) queryParams.set('urgency_level', urgencyFilter);
  if (search.trim()) queryParams.set('search', search.trim());

  const { data, isLoading, isError } = useQuery<CasesResponse>({
    queryKey: ['cases', statusFilter, urgencyFilter, search, page],
    queryFn: async () => {
      const res = await api.get(`/cases?${queryParams.toString()}`);
      return res.data;
    },
  });

  const cases = data?.data || [];
  const pagination = data?.pagination;

  // ─── Render ───────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Cases"
        subtitle={pagination ? `${pagination.total} total cases` : undefined}
      />

      {/* Filters Bar */}
      <div className="mb-5 space-y-3">
        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-dark placeholder:text-gray-500 transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:max-w-sm"
          />
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 mr-1">Status:</span>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                statusFilter === opt.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Urgency chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 mr-1">Urgency:</span>
          {urgencyOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setUrgencyFilter(opt.value);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                urgencyFilter === opt.value
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table / Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" label="Loading cases..." />
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-critical">
          Failed to load cases. Please try again.
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<span>📋</span>}
          title="No cases found"
          description={
            search || statusFilter || urgencyFilter
              ? 'Try adjusting your filters or search query.'
              : 'New cases will appear here when survivors submit reports.'
          }
        />
      ) : (
        <>
          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="px-4 py-3 font-medium text-gray-500">Case #</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Urgency</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden lg:table-cell">Title</th>
                  <th className="px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/dashboard/cases/${c.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition-colors duration-150 hover:bg-gray-100 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-medium text-teal-700">
                        {c.case_number}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <UrgencyBadge level={c.urgency_level} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">
                        {categoryLabels[c.category] || c.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="max-w-xs truncate text-dark">{c.title}</p>
                      {c.is_anonymous && (
                        <span className="text-[10px] text-gray-500">Anonymous</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page >= pagination.totalPages}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
