import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Lock, Paperclip, Image, Music, FileText, Pin, RefreshCw, UserCheck, ArrowRightLeft, MessageSquare, Eye } from 'lucide-react';
import api from '../../../lib/api';
import { Card, Spinner, LightboxModal } from '../../ui';
import ChatPanel from '../ChatPanel';
import { useAuth } from '../../../hooks/useAuth';

interface EvidenceFile {
  id: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

interface Activity {
  id: string;
  activity_type: string;
  description: string;
  actor_name: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const activityIcons: Record<string, React.ElementType> = {
  case_created: Pin,
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

type TabKey = 'details' | 'evidence' | 'messages' | 'activity';

interface CaseTabsProps {
  caseId: string;
  caseData: any; // Using any for brevity, ideally share CaseDetail type
}

export default function CaseTabs({ caseId, caseData }: CaseTabsProps) {
  const { t } = useTranslation('dashboard');
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('details');
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ['case-activities', caseId],
    queryFn: async () => (await api.get(`/cases/${caseId}/activities`)).data.data,
    enabled: !!caseId,
  });

  const { data: evidenceFiles } = useQuery<EvidenceFile[]>({
    queryKey: ['evidence', caseId],
    queryFn: async () => (await api.get(`/cases/${caseId}/evidence`)).data.data ?? [],
    enabled: !!caseId,
  });

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'details', label: t('assessment.tabs.details', { defaultValue: 'Details' }) },
    { key: 'evidence', label: t('assessment.tabs.evidence', { defaultValue: 'Evidence' }) },
    { key: 'messages', label: t('assessment.tabs.messages', { defaultValue: 'Messages' }) },
    { key: 'activity', label: t('assessment.tabs.activity', { defaultValue: 'Activity' }) },
  ];

  return (
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
                <span className="font-mono text-xs text-heading">{caseData.survivor_id?.slice(0, 8)}...</span>
              </p>
            )}
          </Card>

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
                          const res = await api.get(`/cases/${caseId}/evidence/${f.id}/url`);
                          setPreviewUrl(res.data.data.url);
                          setPreviewType(f.mime_type);
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

      {/* Tab: Messages */}
      {activeTab === 'messages' && user && (
        <div className="animate-fade-in-up h-[500px] border border-border rounded-2xl overflow-hidden bg-surface shadow-sm">
          <ChatPanel
            caseId={caseId}
            currentUserId={user.id}
            currentUserRole={user.role}
          />
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
              <div className="relative border-l-2 border-border-muted ml-4 py-2 space-y-6">
                {activities.map((activity, idx) => {
                  const Icon = activityIcons[activity.activity_type] ?? RefreshCw;
                  return (
                    <div
                      key={activity.id}
                      className={`relative pl-6 animate-stagger-${Math.min(idx + 1, 8)}`}
                    >
                      {/* Timeline Node */}
                      <div className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-surface border-[3px] border-border-muted text-primary transition-colors hover:border-primary-muted hover:bg-primary-soft">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      
                      {/* Content Bubble */}
                      <div className="min-w-0 flex-1 rounded-xl border border-border-muted bg-inset px-4 py-3 hover-lift">
                        <p className="text-sm text-heading font-medium leading-snug">{activity.description}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                          <span className="flex items-center gap-1 font-medium text-body">
                            <UserCheck className="h-3 w-3" />
                            {activity.actor_name}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(activity.created_at).toLocaleString('en-US', { 
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Lightbox Overlay */}
      <LightboxModal
        url={previewUrl}
        type={previewType}
        onClose={() => {
          setPreviewUrl(null);
          setPreviewType(null);
        }}
      />
    </div>
  );
}
