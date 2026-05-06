// ReferralsPage — two-tab view of incoming/outgoing referrals.
// Incoming tab: Accept and Reject buttons with response_note modal.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';
import { PageHeader, Spinner, EmptyState, Badge, Modal, Button } from '../../components/ui';

// ─── Types ────────────────────────────────────────────────────

interface Referral {
  id: string;
  case_id: string;
  from_institution_id: string;
  to_institution_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  note: string | null;
  response_note: string | null;
  responded_at: string | null;
  created_at: string;
  cases: {
    case_number: string;
    title: string;
    urgency_level: string;
    category: string;
  } | null;
  institutions: { name: string } | null;
}

// ─── Status badge mapping ─────────────────────────────────────

const urgencyColors: Record<string, string> = {
  critical: 'text-critical',
  high: 'text-orange-500',
  medium: 'text-amber-500',
  low: 'text-gray-500',
};

// ─── Referral Card ────────────────────────────────────────────

function ReferralCard({
  referral,
  onAccept,
  onReject,
  showActions,
  t
}: {
  referral: Referral;
  onAccept?: () => void;
  onReject?: () => void;
  showActions: boolean;
  t: any;
}) {
  const statusConfig = {
    pending: { label: t('referrals.status.pending'), variant: 'amber' as const },
    accepted: { label: t('referrals.status.accepted'), variant: 'teal' as const },
    rejected: { label: t('referrals.status.rejected'), variant: 'red' as const },
  };

  const cfg = statusConfig[referral.status];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-medium text-teal-700">
              {referral.cases?.case_number || '—'}
            </span>
            <span className={`text-xs font-medium ${urgencyColors[referral.cases?.urgency_level || 'low']}`}>
              {t(`shared.urgency.${referral.cases?.urgency_level || 'low'}`).toUpperCase()}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-dark truncate">
            {referral.cases?.title || '—'}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      {/* Institution arrow */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span>{referral.institutions?.name || '—'}</span>
        <span>→</span>
        <span className="text-dark font-medium">{t('layout.nav.institutions') /* Assuming representing own institution */}</span>
      </div>

      {/* Note */}
      {referral.note && (
        <div className="rounded-lg bg-gray-100 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Referral note</p>
          <p className="text-xs text-dark">{referral.note}</p>
        </div>
      )}

      {/* Response note */}
      {referral.response_note && (
        <div className="rounded-lg bg-teal-50 px-3 py-2">
          <p className="text-xs font-medium text-teal-700 mb-0.5">Response note</p>
          <p className="text-xs text-teal-900">{referral.response_note}</p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {new Date(referral.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      {/* Action buttons for pending incoming referrals */}
      {showActions && referral.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={onAccept}>
            {t('referrals.actions.review')}
          </Button>
          <Button size="sm" variant="danger" onClick={onReject}>
            {t('referrals.status.rejected')}
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Outgoing Referral Card ───────────────────────────────────

function OutgoingCard({ referral, t }: { referral: Referral, t: any }) {
  const statusConfig = {
    pending: { label: t('referrals.status.pending'), variant: 'amber' as const },
    accepted: { label: t('referrals.status.accepted'), variant: 'teal' as const },
    rejected: { label: t('referrals.status.rejected'), variant: 'red' as const },
  };

  const cfg = statusConfig[referral.status];
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-medium text-teal-700">
              {referral.cases?.case_number || '—'}
            </span>
            <span className={`text-xs font-medium ${urgencyColors[referral.cases?.urgency_level || 'low']}`}>
              {t(`shared.urgency.${referral.cases?.urgency_level || 'low'}`).toUpperCase()}
            </span>
          </div>
          <p className="mt-0.5 text-sm font-medium text-dark truncate">
            {referral.cases?.title || '—'}
          </p>
        </div>
        <Badge variant={cfg.variant}>{cfg.label}</Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-dark font-medium">{t('layout.nav.institutions')}</span>
        <span>→</span>
        <span>{referral.institutions?.name || '—'}</span>
      </div>

      {referral.note && (
        <div className="rounded-lg bg-gray-100 px-3 py-2">
          <p className="text-xs font-medium text-gray-500 mb-0.5">Note</p>
          <p className="text-xs text-dark">{referral.note}</p>
        </div>
      )}

      {referral.response_note && (
        <div className={`rounded-lg px-3 py-2 ${referral.status === 'rejected' ? 'bg-red-50' : 'bg-teal-50'}`}>
          <p className={`text-xs font-medium mb-0.5 ${referral.status === 'rejected' ? 'text-critical' : 'text-teal-700'}`}>
            Response
          </p>
          <p className={`text-xs ${referral.status === 'rejected' ? 'text-red-900' : 'text-teal-900'}`}>
            {referral.response_note}
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500">
        {new Date(referral.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('dashboard');
  const [tab, setTab] = useState<'incoming' | 'outgoing'>('incoming');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState('');

  // Queries
  const { data: incoming, isLoading: incomingLoading } = useQuery<Referral[]>({
    queryKey: ['referrals-incoming'],
    queryFn: async () => {
      const res = await api.get('/referrals/incoming');
      return res.data.data;
    },
    enabled: tab === 'incoming',
  });

  const { data: outgoing, isLoading: outgoingLoading } = useQuery<Referral[]>({
    queryKey: ['referrals-outgoing'],
    queryFn: async () => {
      const res = await api.get('/referrals/outgoing');
      return res.data.data;
    },
    enabled: tab === 'outgoing',
  });

  // Accept mutation
  const acceptMutation = useMutation({
    mutationFn: async (referralId: string) => {
      const res = await api.patch(`/referrals/${referralId}/accept`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-incoming'] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ referralId, note }: { referralId: string; note: string }) => {
      const res = await api.patch(`/referrals/${referralId}/reject`, {
        response_note: note || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referrals-incoming'] });
      setRejectModalOpen(false);
      setResponseNote('');
      setSelectedReferralId(null);
    },
  });

  const pendingCount = (incoming || []).filter((r) => r.status === 'pending').length;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title={t('referrals.title')}
        subtitle={t('referrals.subtitle')}
      />

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-lg border border-gray-200 bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setTab('incoming')}
          className={`relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
            tab === 'incoming'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-dark'
          }`}
        >
          {t('referrals.tabs.incoming')}
          {pendingCount > 0 && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('outgoing')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors duration-150 ${
            tab === 'outgoing'
              ? 'bg-white text-dark shadow-sm'
              : 'text-gray-500 hover:text-dark'
          }`}
        >
          {t('referrals.tabs.outgoing')}
        </button>
      </div>

      {/* Incoming tab */}
      {tab === 'incoming' && (
        <>
          {incomingLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" label={t('referrals.loading')} />
            </div>
          ) : !incoming || incoming.length === 0 ? (
            <EmptyState
              icon={<span>📥</span>}
              title={t('referrals.emptyTitle')}
              description={t('referrals.emptyIncoming')}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {incoming.map((referral) => (
                <ReferralCard
                  key={referral.id}
                  referral={referral}
                  showActions={true}
                  onAccept={() => acceptMutation.mutate(referral.id)}
                  onReject={() => {
                    setSelectedReferralId(referral.id);
                    setRejectModalOpen(true);
                  }}
                  t={t}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Outgoing tab */}
      {tab === 'outgoing' && (
        <>
          {outgoingLoading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" label={t('referrals.loading')} />
            </div>
          ) : !outgoing || outgoing.length === 0 ? (
            <EmptyState
              icon={<span>📤</span>}
              title={t('referrals.emptyTitle')}
              description={t('referrals.emptyOutgoing')}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {outgoing.map((referral) => (
                <OutgoingCard key={referral.id} referral={referral} t={t} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setResponseNote('');
          setSelectedReferralId(null);
        }}
        title="Reject Referral"
        size="sm"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setRejectModalOpen(false);
                setResponseNote('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              isLoading={rejectMutation.isPending}
              onClick={() =>
                selectedReferralId &&
                rejectMutation.mutate({ referralId: selectedReferralId, note: responseNote })
              }
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            You can optionally provide a reason for rejecting this referral. The referring institution will be notified.
          </p>
          <textarea
            value={responseNote}
            onChange={(e) => setResponseNote(e.target.value)}
            placeholder="Reason for rejection (optional)..."
            rows={3}
            className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-dark placeholder:text-gray-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </Modal>
    </div>
  );
}
