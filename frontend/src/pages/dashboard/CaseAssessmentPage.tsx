// CaseAssessmentPage — the most important staff page.
// Two-column layout: left (case details, AI summary, audit trail), right (actions panel).

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import {
  PageHeader,
  UrgencyBadge,
  StatusBadge,
  Spinner,
  Button,
  Card,
} from '../../components/ui';
import ReferModal from '../../components/cases/ReferModal';
import ChatPanel from '../../components/cases/ChatPanel';

// ─── Types ────────────────────────────────────────────────────

interface CaseDetail {
  id: string;
  case_number: string;
  title: string;
  description: string;
  status: 'new' | 'under_review' | 'referred' | 'active' | 'resolved' | 'closed';
  category: 'legal' | 'medical' | 'shelter' | 'counseling' | 'other';
  urgency_level: 'critical' | 'high' | 'medium' | 'low';
  ai_summary: string | null;
  ai_raw_output: { reasoning?: string } | null;
  incident_date: string | null;
  location_text: string | null;
  is_anonymous: boolean;
  survivor_id: string;
  assigned_worker_id: string | null;
  holding_institution_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  actor_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface EvidenceFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

interface Worker {
  id: string;
  display_name: string | null;
  role: string;
}

// ─── Constants ────────────────────────────────────────────────

const statusOptions: CaseDetail['status'][] = [
  'new', 'under_review', 'referred', 'active', 'resolved', 'closed',
];

const statusLabels: Record<string, string> = {
  new: 'New',
  under_review: 'Under Review',
  referred: 'Referred',
  active: 'Active',
  resolved: 'Resolved',
  closed: 'Closed',
};

const categoryLabels: Record<string, string> = {
  legal: 'Legal',
  medical: 'Medical',
  shelter: 'Shelter',
  counseling: 'Counseling',
  other: 'Other',
};

const activityIcons: Record<string, string> = {
  case_created: '📝',
  status_changed: '🔄',
  worker_assigned: '👤',
  note_added: '📌',
  referral_created: '🔀',
  message_sent: '💬',
};

// ─── Component ────────────────────────────────────────────────

export default function CaseAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [referModalOpen, setReferModalOpen] = useState(false);

  // ─── Queries ──────────────────────────────────────────────

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<CaseDetail>({
    queryKey: ['case', id],
    queryFn: async () => {
      const res = await api.get(`/cases/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['case-activities', id],
    queryFn: async () => {
      const res = await api.get(`/cases/${id}/activities`);
      return res.data.data;
    },
    enabled: !!id,
  });

  // Fetch workers in the institution for assignment dropdown
  const { data: workers } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await api.get('/users/workers');
      return res.data.data || [];
    },
    enabled: user?.role === 'institution_admin' || user?.role === 'system_admin',
  });

  const { data: evidenceFiles } = useQuery<EvidenceFile[]>({
    queryKey: ['evidence', id],
    queryFn: async () => {
      const res = await api.get(`/cases/${id}/evidence`);
      return res.data.data ?? [];
    },
    enabled: !!id,
  });

  // ─── Mutations ────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await api.patch(`/cases/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setSelectedStatus('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (workerId: string) => {
      const res = await api.patch(`/cases/${id}/assign`, { assigned_worker_id: workerId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setSelectedWorkerId('');
    },
  });

  const noteMutation = useMutation({
    mutationFn: async (description: string) => {
      const res = await api.post(`/cases/${id}/activities`, { description });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setNoteText('');
    },
  });

  // ─── Loading / Error ─────────────────────────────────────

  if (caseLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading case..." />
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-serif text-2xl text-dark mb-2">Case not found</h2>
        <p className="text-gray-500 mb-4">This case may have been removed or you don't have access.</p>
        <Button onClick={() => navigate('/dashboard/cases')}>Back to Cases</Button>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────

  const isAdmin = user?.role === 'institution_admin' || user?.role === 'system_admin';

  return (
    <div>
      <PageHeader
        title={caseData.case_number}
        breadcrumb={['Cases', caseData.case_number]}
        action={
          <Button variant="secondary" onClick={() => navigate('/dashboard/cases')}>
            ← Back
          </Button>
        }
      />

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ─── LEFT COLUMN ─────────────────────────────────── */}
        <div className="space-y-5">
          {/* Case Header Card */}
          <Card>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={caseData.status} />
              <UrgencyBadge level={caseData.urgency_level} />
              <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {categoryLabels[caseData.category] || caseData.category}
              </span>
            </div>
            <h2 className="font-serif text-xl text-dark mb-1">{caseData.title}</h2>
            <p className="text-xs text-gray-500">
              Submitted on{' '}
              {new Date(caseData.created_at).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </Card>

          {/* Survivor Info */}
          <Card header={<h3 className="text-sm font-medium text-dark">Survivor Information</h3>}>
            {caseData.is_anonymous ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-base">
                  🔒
                </span>
                <div>
                  <p className="font-medium text-dark">Anonymous Survivor</p>
                  <p className="text-xs text-gray-500">Identity hidden at survivor's request</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Survivor ID:{' '}
                <span className="font-mono text-xs text-dark">{caseData.survivor_id.slice(0, 8)}...</span>
              </p>
            )}
          </Card>

          {/* AI Triage Summary */}
          {caseData.ai_summary && (
            <Card header={
              <div className="flex items-center gap-2">
                <span className="text-base">🤖</span>
                <h3 className="text-sm font-medium text-dark">AI Triage Summary</h3>
              </div>
            }>
              <p className="text-sm text-dark leading-relaxed mb-3">{caseData.ai_summary}</p>
              {caseData.ai_raw_output?.reasoning && (
                <div className="rounded-lg bg-teal-50 px-3 py-2">
                  <p className="text-xs font-medium text-teal-700 mb-0.5">AI Reasoning</p>
                  <p className="text-xs text-teal-900 leading-relaxed">
                    {caseData.ai_raw_output.reasoning}
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Incident Details */}
          <Card header={<h3 className="text-sm font-medium text-dark">Incident Details</h3>}>
            <p className="text-sm text-dark leading-relaxed whitespace-pre-wrap mb-4">
              {caseData.description}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {caseData.incident_date && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Incident Date</p>
                  <p className="text-sm text-dark">
                    {new Date(caseData.incident_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}
              {caseData.location_text && (
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Location</p>
                  <p className="text-sm text-dark">{caseData.location_text}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Evidence Files */}
          <Card header={<h3 className="text-sm font-medium text-dark">Evidence Files</h3>}>
            {!evidenceFiles || evidenceFiles.length === 0 ? (
              <p className="text-sm text-gray-400">No evidence uploaded by the survivor yet.</p>
            ) : (
              <div className="space-y-2">
                {evidenceFiles.map((f) => {
                  const isImage = f.mime_type.startsWith('image/');
                  const isPdf = f.mime_type === 'application/pdf';
                  const isAudio = f.mime_type.startsWith('audio/');
                  const icon = isImage ? '🖼️' : isPdf ? '📄' : isAudio ? '🎵' : '📎';
                  return (
                    <div key={f.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-dark truncate">{f.file_name}</p>
                          <p className="text-[10px] text-gray-400">{(f.size_bytes / 1024).toFixed(0)} KB · {new Date(f.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const res = await api.get(`/cases/${id}/evidence/${f.id}/url`);
                          window.open(res.data.data.url, '_blank');
                        }}
                        className="shrink-0 ml-2 rounded-lg border border-teal-200 px-2.5 py-1 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Activity / Audit Trail */}
          <Card header={<h3 className="text-sm font-medium text-dark">Activity Log</h3>}>
            {activitiesLoading ? (
              <Spinner size="sm" label="Loading activities..." />
            ) : !activities || activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {activities.map((activity, idx) => (
                  <div
                    key={activity.id}
                    className={`flex gap-3 py-3 ${
                      idx < activities.length - 1 ? 'border-b border-gray-200' : ''
                    }`}
                  >
                    <span className="mt-0.5 text-base shrink-0">
                      {activityIcons[activity.activity_type] || '•'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-dark">{activity.description}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {activity.actor_name} ·{' '}
                        {new Date(activity.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Case Messaging */}
          <Card header={<h3 className="text-sm font-medium text-dark">Messages</h3>} padding="none">
            <div className="h-96">
              <ChatPanel
                caseId={caseData.id}
                currentUserId={user!.id}
                currentUserRole={user!.role}
              />
            </div>
          </Card>
        </div>

        {/* ─── RIGHT COLUMN (Action Panel) ─────────────────── */}
        <div className="space-y-5">
          {/* Status Update */}
          <Card header={<h3 className="text-sm font-medium text-dark">Update Status</h3>}>
            <div className="space-y-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              >
                <option value="">Select new status...</option>
                {statusOptions
                  .filter((s) => s !== caseData.status)
                  .map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
              </select>
              <Button
                size="sm"
                onClick={() => selectedStatus && statusMutation.mutate(selectedStatus)}
                disabled={!selectedStatus || statusMutation.isPending}
                isLoading={statusMutation.isPending}
                className="w-full"
              >
                Update Status
              </Button>
              {statusMutation.isError && (
                <p className="text-xs text-critical">Failed to update status.</p>
              )}
            </div>
          </Card>

          {/* Assign Worker (admin only) */}
          {isAdmin && (
            <Card header={<h3 className="text-sm font-medium text-dark">Assign Case Worker</h3>}>
              <div className="space-y-3">
                {caseData.assigned_worker_id && (
                  <p className="text-xs text-gray-500">
                    Currently assigned:{' '}
                    <span className="font-mono text-dark">
                      {caseData.assigned_worker_id.slice(0, 8)}...
                    </span>
                  </p>
                )}
                <select
                  value={selectedWorkerId}
                  onChange={(e) => setSelectedWorkerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Select a worker...</option>
                  {(workers || []).map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.display_name || w.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  onClick={() => selectedWorkerId && assignMutation.mutate(selectedWorkerId)}
                  disabled={!selectedWorkerId || assignMutation.isPending}
                  isLoading={assignMutation.isPending}
                  className="w-full"
                >
                  Assign Worker
                </Button>
                {assignMutation.isError && (
                  <p className="text-xs text-critical">Failed to assign worker.</p>
                )}
              </div>
            </Card>
          )}

          {/* Refer Case (admin only) */}
          {isAdmin && (
            <Card header={<h3 className="text-sm font-medium text-dark">Refer Case</h3>}>
              <p className="text-xs text-gray-500 mb-3">
                Transfer this case to another institution for specialized support.
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setReferModalOpen(true)}
                className="w-full"
              >
                🔀 Refer to Institution
              </Button>
            </Card>
          )}

          {/* Add Note */}
          <Card header={<h3 className="text-sm font-medium text-dark">Add a Note</h3>}>
            <div className="space-y-3">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write a note about this case..."
                rows={3}
                className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <Button
                size="sm"
                onClick={() => noteText.trim() && noteMutation.mutate(noteText.trim())}
                disabled={!noteText.trim() || noteMutation.isPending}
                isLoading={noteMutation.isPending}
                className="w-full"
              >
                Add Note
              </Button>
            </div>
          </Card>

          {/* Quick Info */}
          <Card>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Case ID</span>
                <span className="font-mono text-dark">{caseData.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-dark">
                  {new Date(caseData.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Updated</span>
                <span className="text-dark">
                  {new Date(caseData.updated_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Anonymous</span>
                <span className="text-dark">{caseData.is_anonymous ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Refer Modal */}
      {id && caseData && (
        <ReferModal
          caseId={id}
          caseNumber={caseData.case_number}
          isOpen={referModalOpen}
          onClose={() => setReferModalOpen(false)}
        />
      )}
    </div>
  );
}
