// ChatPanel — real-time case-scoped messaging between survivor and staff.
// Used inside CaseAssessmentPage (staff) and future CaseDetailPage (survivor).
// Subscribes to Supabase Realtime on mount for instant message delivery.
// Uses semantic tokens + Lucide icons.

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Bot } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import api from '../../lib/api';
import { Spinner } from '../ui';

// ─── Types ────────────────────────────────────────────────────

interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface ChatPanelProps {
  caseId: string;
  currentUserId: string;
  currentUserRole: string;
}

// ─── Component ────────────────────────────────────────────────

export default function ChatPanel({ caseId, currentUserId, currentUserRole }: ChatPanelProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState('');
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([]);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ─── Fetch initial message history ───────────────────────

  const { data: initialMessages, isLoading } = useQuery<Message[]>({
    queryKey: ['messages', caseId],
    queryFn: async () => {
      const res = await api.get(`/cases/${caseId}/messages`);
      // Mark all as read when panel opens
      api.post(`/cases/${caseId}/messages/read`).catch(() => {});
      return res.data.data;
    },
    enabled: !!caseId,
  });

  // Merge initial + realtime messages, deduplicated by id
  const allMessages: Message[] = (() => {
    const base = initialMessages || [];
    const newOnes = realtimeMessages.filter(
      (rm) => !base.some((bm) => bm.id === rm.id)
    );
    return [...base, ...newOnes];
  })();

  // ─── Supabase Realtime subscription ──────────────────────

  useEffect(() => {
    if (!caseId) return;

    const channel = supabase
      .channel(`case-messages-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `case_id=eq.${caseId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setRealtimeMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Mark as read if the message is from someone else
          if (newMsg.sender_id !== currentUserId) {
            api.post(`/cases/${caseId}/messages/read`).catch(() => {});
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeReady(true);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, currentUserId, queryClient]);

  // ─── Auto-scroll to bottom on new messages ────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  // ─── Send message mutation ────────────────────────────────

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/cases/${caseId}/messages`, { content });
      return res.data.data as Message;
    },
    onSuccess: (newMsg) => {
      // Optimistically add to realtime list so it appears instantly
      setRealtimeMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setDraft('');
      inputRef.current?.focus();
    },
  });

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Bubble classification ────────────────────────────────

  const isMine = (msg: Message) => msg.sender_id === currentUserId;
  const isAI = (msg: Message) => msg.sender_role === 'ai';

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <h3 className="text-sm font-medium text-heading">Case Messages</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              realtimeReady ? 'bg-success' : 'bg-placeholder'
            }`}
          />
          <span className="text-xs text-muted">
            {realtimeReady ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" label="Loading messages..." />
          </div>
        ) : allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted">No messages yet.</p>
            <p className="text-xs text-placeholder">Start the conversation below.</p>
          </div>
        ) : (
          allMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${isMine(msg) ? 'items-end' : 'items-start'}`}
            >
              {/* Sender label (only on others' messages) */}
              {!isMine(msg) && (
                <span className="mb-1 text-[10px] font-medium text-muted px-1 inline-flex items-center gap-1">
                  {msg.sender_name || 'Unknown'}
                  {isAI(msg) && <Bot className="h-3 w-3 text-primary" />}
                </span>
              )}

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  isMine(msg)
                    ? 'rounded-br-sm bg-chat-mine text-chat-mine-fg'
                    : isAI(msg)
                    ? 'rounded-bl-sm bg-chat-ai text-chat-ai-fg border border-chat-ai-border'
                    : 'rounded-bl-sm bg-surface text-body border border-border shadow-sm'
                }`}
              >
                {msg.content}
              </div>

              {/* Timestamp */}
              <span className="mt-0.5 text-[10px] text-placeholder px-1">
                {new Date(msg.created_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border px-4 py-3 shrink-0">
        {sendMutation.isError && (
          <p className="mb-2 text-xs text-danger">Failed to send message. Try again.</p>
        )}
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message${currentUserRole === 'survivor' ? ' your case worker' : ' the survivor'}... (Enter to send)`}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading placeholder:text-placeholder transition-all duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
            style={{ maxHeight: '100px' }}
            onInput={(e) => {
              const target = e.currentTarget;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 100)}px`;
            }}
          />
          <button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-fg transition-colors duration-150 hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sendMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[10px] text-placeholder">
          Shift+Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}
