// NotificationBell — real-time notification dropdown + unread count badge.
// Subscribes to Supabase Realtime for instant delivery.
// Shows toast on new notifications + dropdown panel with grouped history.

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from './ToastProvider';
import api from '../../lib/api';

// ─── Types ────────────────────────────────────────────────────

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  case_id: string | null;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const typeColors: Record<string, string> = {
  new_message: 'bg-teal-500',
  referral_received: 'bg-amber-500',
  referral_accepted: 'bg-green-500',
  referral_rejected: 'bg-red-400',
  case_update: 'bg-blue-400',
  new_case: 'bg-purple-500',
  default: 'bg-gray-300',
};

// ─── Component ────────────────────────────────────────────────

interface NotificationBellProps {
  userId: string;
  userRole?: string;
}

export default function NotificationBell({ userId, userRole }: NotificationBellProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build case URL based on who is viewing
  const caseUrl = (caseId: string) =>
    userRole === 'survivor'
      ? `/safe-space/cases/${caseId}`
      : `/dashboard/cases/${caseId}`;

  // ─── Fetch notifications ─────────────────────────────────

  const { data } = useQuery<{ data: Notification[]; unread_count: number }>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications?limit=20');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const notifications = data?.data || [];
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(data?.unread_count ?? 0);
  }, [data?.unread_count]);

  // ─── Supabase Realtime subscription ──────────────────────
  // Use a unique channel name per mount to avoid React StrictMode
  // double-mount issues where .on() is called after .subscribe().

  useEffect(() => {
    if (!userId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      const channelName = `notifications-${userId}-${Date.now()}`;
      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const n = payload.new as Notification;
            setUnreadCount((prev) => prev + 1);
            showToast(
              n.title,
              n.body,
              n.case_id ? caseUrl(n.case_id) : undefined
            );
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('[NotificationBell] Realtime setup failed:', err);
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, showToast, queryClient]);

  // ─── Close dropdown on outside click ─────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ─── Mutations ────────────────────────────────────────────

  const markAllMutation = useMutation({
    mutationFn: async () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOneMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (n: Notification) => {
    if (!n.is_read) {
      markOneMutation.mutate(n.id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    setOpen(false);
    if (n.case_id) {
      navigate(caseUrl(n.case_id));
    }
  };

  // ─── Group into today / earlier ───────────────────────────

  const today = new Date().toDateString();
  const todayItems = notifications.filter(
    (n) => new Date(n.created_at).toDateString() === today
  );
  const earlierItems = notifications.filter(
    (n) => new Date(n.created_at).toDateString() !== today
  );

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors duration-150 hover:bg-gray-100 hover:text-dark"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-11 z-40 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-medium text-dark">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
                className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="mb-2 text-2xl">🔔</span>
                <p className="text-sm text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <>
                {todayItems.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100">
                      Today
                    </p>
                    {todayItems.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n)}
                      />
                    ))}
                  </div>
                )}
                {earlierItems.length > 0 && (
                  <div>
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 bg-gray-100">
                      Earlier
                    </p>
                    {earlierItems.map((n) => (
                      <NotificationItem
                        key={n.id}
                        notification={n}
                        onClick={() => handleNotificationClick(n)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Single notification row ──────────────────────────────────

function NotificationItem({
  notification: n,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const colorClass = typeColors[n.type] || typeColors.default;

  return (
    <button
      onClick={onClick}
      className={`w-full flex gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-gray-100 border-b border-gray-200 last:border-b-0 ${
        !n.is_read ? 'bg-teal-50' : 'bg-white'
      }`}
    >
      <div className={`mt-1.5 h-8 w-1 shrink-0 rounded-full ${colorClass}`} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm truncate ${!n.is_read ? 'font-semibold text-dark' : 'font-medium text-dark'}`}>
          {n.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
          {n.body}
        </p>
        <p className="mt-1 text-[10px] text-gray-500">{relativeTime(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-teal-500" />
      )}
    </button>
  );
}
