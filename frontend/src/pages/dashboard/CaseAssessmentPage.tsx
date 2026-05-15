// CaseAssessmentPage — staff case detail with floating chat widget.
// Tabbed layout: Details | Evidence | Activity. Right column: actions.
// Uses semantic tokens + Lucide icons + stagger animations.

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Lock, Calendar, MapPin, FileText, Image, Music, Paperclip,
  PenLine, RefreshCw, UserCheck, Pin, ArrowRightLeft, MessageSquare, Eye,
  X,
} from 'lucide-react';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import {
  PageHeader, UrgencyBadge, StatusBadge, Spinner, Button, Card,
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

const activityIcons: Record<string, React.ElementType> = {
  case_created: PenLine,
  status_changed: RefreshCw,
  worker_assigned: UserCheck,
  note_added: Pin,
  referral_created: ArrowRightLeft,
  message_sent: MessageSquare,
};

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return Image;
  if (mime.startsWith('audio/')) return Music;
  if (mime === 'application/pdf') return FileText;
  return Paperclip;
}

type TabKey = 'details' | 'evidence' | 'activity';

// ─── Component ────────────────────────────────────────────────

export default function CaseAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [noteText, setNoteText] = useState('');
  const [referModalOpen, setReferModalOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('details');

  const statusLabels: Record<string, string> = {
    new: t('shared.status.new'), under_review: t('shared.status.under_review'),
    referred: t('shared.status.referred'), active: t('shared.status.active'),
    resolved: t('shared.status.resolved'), closed: t('shared.status.closed'),
  };
  const categoryLabels: Record<string, string> = {
    legal: t('shared.category.legal'), medical: t('shared.category.medical'),
    shelter: t('shared.category.shelter'), counseling: t('shared.category.counseling'),
    other: t('shared.category.other'),
  };

  // ─── Queries ──────────────────────────────────────────────

  const { data: caseData, isLoading: caseLoading, isError: caseError } = useQuery<CaseDetail>({
    queryKey: ['case', id],
    queryFn: async () => (await api.get(`/cases/${id}`)).data.data,
    enabled: !!id,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['case-activities', id],
    queryFn: async () => (await api.get(`/cases/${id}/activities`)).data.data,
    enabled: !!id,
  });

  const { data: workers } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => (await api.get('/users/workers')).data.data || [],
    enabled: user?.role === 'institution_admin' || user?.role === 'system_admin',
  });

  const { data: evidenceFiles } = useQuery<EvidenceFile[]>({
    queryKey: ['evidence', id],
    queryFn: async () => (await api.get(`/cases/${id}/evidence`)).data.data ?? [],
    enabled: !!id,
  });

  // ─── Mutations ────────────────────────────────────────────

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/cases/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setSelectedStatus('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (workerId: string) => api.patch(`/cases/${id}/assign`, { assigned_worker_id: workerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', id] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setSelectedWorkerId('');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (description: string) => api.post(`/cases/${id}/activities`, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-activities', id] });
      setNoteText('');
    },
  });

  // ─── Loading / Error ─────────────────────────────────────

  if (caseLoading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" label="Loading case..." /></div>;
  }
  if (caseError || !caseData) {
    return (
      <div className="py-20 text-center">
        <h2 className="font-heading text-2xl text-heading mb-2">{t('assessment.notFound.title')}</h2>
        <p className="text-muted mb-4">{t('assessment.notFound.desc')}</p>
        <Button onClick={() => navigate('/dashboard/cases')}>{t('assessment.notFound.back')}</Button>
      </div>
    );
  }

  const isAdmin = user?.role === 'institution_admin' || user?.role === 'system_admin';
  const selectClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';
  const textareaClasses = 'w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-placeholder focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: t('assessment.tabs.details', { defaultValue: 'Details' }) },
    { key: 'evidence', label: t('assessment.tabs.evidence', { defaultValue: 'Evidence' }) },
    { key: 'activity', label: t('assessment.tabs.activity', { defaultValue: 'Activity' }) },
  ];

  return (
    <div className="relative">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-20 -right-40" />
        <div className="mesh-blob-2 top-60 -left-32" />
      </div>

      <div className="relative z-10">
        <PageHeader
          title={caseData.case_number}
          breadcrumb={[t('assessment.breadcrumb'), caseData.case_number]}
          action={
            <Button variant="secondary" onClick={() => navigate('/dashboard/cases')}>
              {t('assessment.back')}
            </Button>
          }
        />

        {/* ─── HEADER CARD (merged quick info) ─── */}
        <div className="animate-stagger-1 mb-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm hover-lift">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <StatusBadge status={caseData.status} />
              <UrgencyBadge level={caseData.urgency_level} />
              <span className="rounded-lg bg-inset px-2 py-0.5 text-xs text-muted">
                {categoryLabels[caseData.category] || caseData.category}
              </span>
              {caseData.is_anonymous && (
                <span className="flex items-center gap-1 rounded-lg bg-primary-soft px-2 py-0.5 text-xs text-primary">
                  <Lock className="h-3 w-3" /> {t('assessment.anonymous.title')}
                </span>
              )}
            </div>
            <h2 className="font-heading text-xl text-heading mb-2">{caseData.title}</h2>

            {/* Quick info row */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted">
              <span>ID: <span className="font-mono text-heading">{caseData.id.slice(0, 8)}…</span></span>
              <span>{t('assessment.quickInfo.created')}: <span className="text-heading">{new Date(caseData.created_at).toLocaleDateString()}</span></span>
              <span>{t('assessment.quickInfo.updated')}: <span className="text-heading">{new Date(caseData.updated_at).toLocaleDateString()}</span></span>
              {caseData.incident_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(caseData.incident_date).toLocaleDateString()}
                </span>
              )}
              {caseData.location_text && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {caseData.location_text}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI Triage Summary (gradient border highlight) ─── */}
        {caseData.ai_summary && (
          <div className="animate-stagger-2 mb-6">
            <div className="gradient-border p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary animate-glow">
                  <Sparkles className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-heading">{t('assessment.aiSummary.title')}</h3>
              </div>
              <p className="text-sm text-body leading-relaxed mb-3">{caseData.ai_summary}</p>
              {caseData.ai_raw_output?.reasoning && (
                <div className="rounded-xl bg-primary-soft border border-primary-muted px-3 py-2">
                  <p className="text-xs font-medium text-primary mb-0.5">{t('assessment.aiSummary.reasoning')}</p>
                  <p className="text-xs text-heading leading-relaxed">{caseData.ai_raw_output.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TWO-COLUMN: Tabs + Actions ─── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT: Tabbed content */}
          <div className="animate-stagger-3">
            {/* Tab bar */}
            <div className="flex gap-1 rounded-xl bg-inset p-1 mb-5">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? 'bg-surface text-heading shadow-sm'
                      : 'text-muted hover:text-heading'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab: Details */}
            {activeTab === 'details' && (
              <div className="space-y-5 animate-fade-in-up">
                {/* Survivor Info */}
                <Card header={<h3 className="text-sm font-medium text-heading">Survivor Information</h3>}>
                  {caseData.is_anonymous ? (
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <Lock className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-heading">{t('assessment.anonymous.title')}</p>
                        <p className="text-xs text-muted">{t('assessment.anonymous.desc')}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted">
                      {t('assessment.survivorId')}{' '}
                      <span className="font-mono text-xs text-heading">{caseData.survivor_id.slice(0, 8)}...</span>
                    </p>
                  )}
                </Card>

                {/* Incident Description */}
                <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.incident.title')}</h3>}>
                  <p className="text-sm text-body leading-relaxed whitespace-pre-wrap">
                    {caseData.description}
                  </p>
                </Card>
              </div>
            )}

            {/* Tab: Evidence */}
            {activeTab === 'evidence' && (
              <div className="space-y-5 animate-fade-in-up">
                <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.evidence.title')}</h3>}>
                  {!evidenceFiles || evidenceFiles.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-inset text-muted">
                        <Paperclip className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-muted">{t('assessment.evidence.empty')}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {evidenceFiles.map((f, i) => {
                        const FileIcon = getFileIcon(f.mime_type);
                        const displayFileName = f.file_name.length > 25 ? `${f.file_name.substring(0, 22)}...` : f.file_name;
                        return (
                          <div key={f.id} className={`flex items-center justify-between min-w-0 rounded-xl border border-border-muted bg-inset px-3 py-2.5 hover-lift animate-stagger-${Math.min(i + 1, 8)}`}>
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                                <FileIcon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-heading truncate" title={f.file_name}>{displayFileName}</p>
                                <p className="text-[10px] text-placeholder">{(f.size_bytes / 1024).toFixed(0)} KB · {new Date(f.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={async () => {
                                const res = await api.get(`/cases/${id}/evidence/${f.id}/url`);
                                window.open(res.data.data.url, '_blank');
                              }}
                              className="shrink-0 ml-2 inline-flex items-center gap-1 rounded-xl border border-primary-muted px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft transition-colors"
                            >
                              <Eye className="h-3 w-3" /> {t('assessment.evidence.view')}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Tab: Activity */}
            {activeTab === 'activity' && (
              <div className="animate-fade-in-up">
                <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.activity.title')}</h3>}>
                  {activitiesLoading ? (
                    <Spinner size="sm" label={t('assessment.activity.loading')} />
                  ) : !activities || activities.length === 0 ? (
                    <p className="text-sm text-muted py-4 text-center">{t('assessment.activity.empty')}</p>
                  ) : (
                    <div className="space-y-0">
                      {activities.map((activity, idx) => {
                        const Icon = activityIcons[activity.activity_type] ?? RefreshCw;
                        return (
                          <div
                            key={activity.id}
                            className={`flex gap-3 py-3 ${idx < activities.length - 1 ? 'border-b border-border-muted' : ''}`}
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-inset text-muted">
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-body">{activity.description}</p>
                              <p className="mt-0.5 text-xs text-muted">
                                {activity.actor_name} · {new Date(activity.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>

          {/* RIGHT: Action panel */}
          <div className="space-y-4 min-w-0">
            {/* Status Update */}
            <div className="animate-stagger-4">
              <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.updateStatus.title')}</h3>}>
                <div className="space-y-3">
                  <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className={selectClasses}>
                    <option value="">{t('assessment.updateStatus.placeholder')}</option>
                    {statusOptions.filter((s) => s !== caseData.status).map((s) => (
                      <option key={s} value={s}>{statusLabels[s]}</option>
                    ))}
                  </select>
                  <Button size="sm" onClick={() => selectedStatus && statusMutation.mutate(selectedStatus)} disabled={!selectedStatus || statusMutation.isPending} isLoading={statusMutation.isPending} className="w-full">
                    {t('assessment.updateStatus.button')}
                  </Button>
                </div>
              </Card>
            </div>

            {/* Assign Worker */}
            {isAdmin && (
              <div className="animate-stagger-5">
                <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.assignWorker.title')}</h3>}>
                  <div className="space-y-3">
                    {caseData.assigned_worker_id && (
                      <p className="text-xs text-muted">{t('assessment.assignWorker.currentlyAssigned')} <span className="font-mono text-heading">{caseData.assigned_worker_id.slice(0, 8)}...</span></p>
                    )}
                    <select value={selectedWorkerId} onChange={(e) => setSelectedWorkerId(e.target.value)} className={selectClasses}>
                      <option value="">{t('assessment.assignWorker.placeholder')}</option>
                      {(workers || []).map((w) => (<option key={w.id} value={w.id}>{w.display_name || w.id.slice(0, 8)}</option>))}
                    </select>
                    <Button size="sm" onClick={() => selectedWorkerId && assignMutation.mutate(selectedWorkerId)} disabled={!selectedWorkerId || assignMutation.isPending} isLoading={assignMutation.isPending} className="w-full">
                      {t('assessment.assignWorker.button')}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {/* Refer Case */}
            {isAdmin && (
              <div className="animate-stagger-6">
                <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.referCase.title')}</h3>}>
                  <p className="text-xs text-muted mb-3">{t('assessment.referCase.desc')}</p>
                  <Button size="sm" variant="secondary" onClick={() => setReferModalOpen(true)} className="w-full">
                    {t('assessment.referCase.button')}
                  </Button>
                </Card>
              </div>
            )}

            {/* Add Note */}
            <div className="animate-stagger-7">
              <Card header={<h3 className="text-sm font-medium text-heading">{t('assessment.addNote.title')}</h3>}>
                <div className="space-y-3">
                  <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder={t('assessment.addNote.placeholder')} rows={3} className={textareaClasses} />
                  <Button size="sm" onClick={() => noteText.trim() && noteMutation.mutate(noteText.trim())} disabled={!noteText.trim() || noteMutation.isPending} isLoading={noteMutation.isPending} className="w-full">
                    {t('assessment.addNote.button')}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FLOATING CHAT FAB ─── */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          chatOpen
            ? 'bg-danger text-danger-fg rotate-90 hover:bg-danger/90'
            : 'bg-primary text-primary-fg hover:bg-primary-hover animate-glow'
        }`}
        aria-label={chatOpen ? 'Close chat' : 'Open chat'}
      >
        {chatOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {/* ─── FLOATING CHAT DRAWER ─── */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-[360px] max-h-[520px] rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden animate-chat-in">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border-muted bg-inset px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <MessageSquare className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-heading">{t('assessment.messages')}</p>
                <p className="text-[10px] text-muted">{caseData.case_number}</p>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-heading transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {/* Chat body */}
          <div className="h-[440px]">
            <ChatPanel
              caseId={caseData.id}
              currentUserId={user!.id}
              currentUserRole={user!.role}
            />
          </div>
        </div>
      )}

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
