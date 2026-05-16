// NotificationsPage — full notification history for staff dashboard.
// Route: /dashboard/notifications
// Uses semantic tokens + Lucide icons.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Bell, MessageSquare, ArrowRightLeft, CheckCircle, XCircle, RefreshCw, PlusCircle } from 'lucide-react';
import api from '../../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  case_id: string | null;
  created_at: string;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  new_message: MessageSquare,
  referral_received: ArrowRightLeft,
  referral_accepted: CheckCircle,
  referral_rejected: XCircle,
  case_update: RefreshCw,
  new_case: PlusCircle,
};

const TYPE_COLORS: Record<string, string> = {
  new_message: 'bg-primary',
  referral_received: 'bg-warning',
  referral_accepted: 'bg-success',
  referral_rejected: 'bg-danger',
  case_update: 'bg-secondary',
  new_case: 'bg-accent',
  default: 'bg-muted',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('dashboard');

  const { data, isLoading } = useQuery<{ data: Notification[]; unread_count: number }>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications?limit=50')).data,
  });

  const markAllMutation = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];
  const unread = data?.unread_count ?? 0;

  return (
    <div className="relative space-y-4">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-40 -left-20" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-heading">{t('notifications.title')}</h1>
          <p className="text-sm text-muted mt-0.5">
            {unread > 0 ? `${unread} unread` : t('notifications.emptyDesc')}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="rounded-xl border border-primary-muted px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft transition-colors disabled:opacity-50"
          >
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Bell className="h-6 w-6" />
          </div>
          <p className="font-medium text-heading mb-1">{t('notifications.emptyTitle')}</p>
          <p className="text-sm text-muted">{t('notifications.subtitle')}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden divide-y divide-border-muted">
          {notifications.map((n) => {
            const Icon = TYPE_ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={`flex gap-3 px-4 py-4 transition-colors ${!n.is_read ? 'bg-primary-soft/40' : ''}`}
              >
                {/* Icon */}
                <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${TYPE_COLORS[n.type] ?? TYPE_COLORS.default}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-heading' : 'font-medium text-heading'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-muted mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[10px] text-placeholder mt-1">{relativeTime(n.created_at)}</p>
                </div>

                {/* Mark read */}
                {!n.is_read && (
                  <button
                    onClick={() => markOneMutation.mutate(n.id)}
                    className="shrink-0 mt-1 h-2 w-2 rounded-full bg-primary hover:bg-primary-hover transition-colors"
                    title="Mark as read"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
