import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../../lib/api';
import { Card, Button } from '../../ui';

interface Worker {
  id: string;
  display_name: string | null;
  role: string;
}

interface CaseActionPanelProps {
  caseId: string;
  caseData: any; // Using any for brevity
  isAdmin: boolean;
  setReferModalOpen: (open: boolean) => void;
}

const statusOptions = [
  'new', 'under_review', 'referred', 'active', 'resolved', 'closed',
];

export default function CaseActionPanel({ caseId, caseData, isAdmin, setReferModalOpen }: CaseActionPanelProps) {
  const { t } = useTranslation('dashboard');
  const queryClient = useQueryClient();

  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [noteText, setNoteText] = useState('');

  const statusLabels: Record<string, string> = {
    new: t('shared.status.new'), under_review: t('shared.status.under_review'),
    referred: t('shared.status.referred'), active: t('shared.status.active'),
    resolved: t('shared.status.resolved'), closed: t('shared.status.closed'),
  };

  const { data: workers } = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => (await api.get('/users/workers')).data.data || [],
    enabled: isAdmin,
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/cases/${caseId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] });
      setSelectedStatus('');
    },
  });

  const assignMutation = useMutation({
    mutationFn: (workerId: string) => api.patch(`/cases/${caseId}/assign`, { assigned_worker_id: workerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] });
      setSelectedWorkerId('');
    },
  });

  const noteMutation = useMutation({
    mutationFn: (description: string) => api.post(`/cases/${caseId}/activities`, { description }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case-activities', caseId] });
      setNoteText('');
    },
  });

  const selectClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';
  const textareaClasses = 'w-full resize-y rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-placeholder focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
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
  );
}
