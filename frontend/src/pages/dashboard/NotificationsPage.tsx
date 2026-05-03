// NotificationsPage — full notification history for staff dashboard.
// Route: /dashboard/notifications

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

const TYPE_COLORS: Record<string, string> = {
  new_message: 'bg-teal-500',
  referral_received: 'bg-amber-500',
  referral_accepted: 'bg-green-500',
  referral_rejected: 'bg-red-400',
  case_update: 'bg-blue-400',
  new_case: 'bg-purple-500',
  default: 'bg-gray-300',
};

export default function NotificationsPage() {
  const queryClient = useQueryClient();

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark">Notifications</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🔔</p>
          <p className="font-medium text-dark mb-1">No notifications yet</p>
          <p className="text-sm text-gray-500">Updates on your cases and referrals will appear here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden divide-y divide-gray-50">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 px-4 py-4 ${!n.is_read ? 'bg-teal-50/60' : ''}`}
            >
              {/* Color strip */}
              <div className={`mt-1 h-8 w-1 shrink-0 rounded-full ${TYPE_COLORS[n.type] ?? TYPE_COLORS.default}`} />

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-dark' : 'font-medium text-dark'}`}>
                  {n.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
              </div>

              {/* Mark read */}
              {!n.is_read && (
                <button
                  onClick={() => markOneMutation.mutate(n.id)}
                  className="shrink-0 mt-1 h-2 w-2 rounded-full bg-teal-500 hover:bg-teal-700 transition-colors"
                  title="Mark as read"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
