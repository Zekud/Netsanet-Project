// NotificationBell — real-time notification indicator with dropdown.
// Subscribes to Supabase Realtime for instant notification delivery.
// Uses semantic tokens + Lucide icons for dark/light mode support.

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from './ToastProvider';
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
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  new_message: 'bg-primary',
  referral_received: 'bg-warning',
  referral_accepted: 'bg-success',
  referral_rejected: 'bg-danger',
  case_update: 'bg-secondary',
  new_case: 'bg-accent',
  default: 'bg-muted',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data } = useQuery<{ data: Notification[]; unread_count: number }>({
    queryKey: ['notifications'],
    queryFn: async () => (await api.get('/notifications?limit=10')).data,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];
  const unread = data?.unread_count ?? 0;

  // Supabase Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          const n = payload.new as Notification;
          showToast(n.title, n.body, n.case_id ? `/dashboard/cases/${n.case_id}` : undefined);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, showToast]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-muted transition-all duration-200 hover:border-primary/30 hover:text-primary hover:bg-primary-soft"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-danger-fg">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-border bg-surface shadow-xl z-50 animate-scale-in">
          <div className="border-b border-border-muted px-4 py-3">
            <p className="text-sm font-semibold text-heading">Notifications</p>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border-muted">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-inset ${!n.is_read ? 'bg-primary-soft/50' : ''}`}
                  onClick={() => {
                    if (!n.is_read) markReadMutation.mutate(n.id);
                    if (n.case_id) window.location.href = `/dashboard/cases/${n.case_id}`;
                    setIsOpen(false);
                  }}
                >
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_COLORS[n.type] ?? TYPE_COLORS.default}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-heading' : 'text-body'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-placeholder mt-1">{relativeTime(n.created_at)}</p>
                  </div>
                  {n.case_id && <ExternalLink className="h-3 w-3 shrink-0 text-placeholder mt-1" />}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border-muted px-4 py-2">
              <a href="/dashboard/notifications" className="text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                View all notifications
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
