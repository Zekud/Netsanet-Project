// AILegalGuidePage — full-page AI legal chat for survivors.
// Route: /safe-space/chat — Fully localized via aiGuide namespace.
// Uses semantic tokens + auto-resize textarea (no Mic icon).

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Scale, Trash2, Menu, Send, ChevronRight, ArrowUp } from 'lucide-react';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTextareaResize } from '../../hooks/use-textarea-resize';

interface Session { id: string; title: string; last_active_at: string; created_at: string; }
interface ChatMessage {
  id: string; role: 'user' | 'assistant'; content: string;
  sources?: Array<{ content: string; source: string; article_number?: string }>;
  created_at: string; isOptimistic?: boolean; suggested_questions?: string[];
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AILegalGuidePage() {
  const { t } = useTranslation('aiGuide');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sourcesOpen, setSourcesOpen] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastSentRef = useRef('');

  // Auto-resize textarea
  const textareaRef = useTextareaResize(draft, 1);

  const { data: sessions, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ['ai-sessions'],
    queryFn: async () => { const r = await api.get('/ai/sessions'); return r.data.data; },
  });

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId); setSidebarOpen(false);
    try { const r = await api.get(`/ai/sessions/${sessionId}`); setMessages(r.data.data.messages || []); }
    catch { setMessages([]); }
  };

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const r = await api.post('/ai/chat', { message: content, session_id: activeSessionId || undefined });
      return r.data.data;
    },
    onMutate: (content) => {
      lastSentRef.current = content;
      setMessages((prev) => [...prev,
        { id: `opt-${Date.now()}`, role: 'user', content, created_at: new Date().toISOString(), isOptimistic: true },
        { id: `think-${Date.now()}`, role: 'assistant', content: t('thinking'), created_at: new Date().toISOString(), isOptimistic: true },
      ]);
    },
    onSuccess: (data) => {
      setMessages((prev) => {
        const clean = prev.filter((m) => !m.isOptimistic);
        return [...clean,
          { id: `user-${Date.now()}`, role: 'user', content: lastSentRef.current, created_at: new Date().toISOString() },
          { id: `ai-${Date.now()}`, role: 'assistant', content: data.answer, sources: data.sources, suggested_questions: data.suggested_questions, created_at: new Date().toISOString() },
        ];
      });
      if (!activeSessionId) { setActiveSessionId(data.session_id); refetchSessions(); }
      setDraft('');
    },
    onError: () => setMessages((prev) => prev.filter((m) => !m.isOptimistic)),
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/ai/sessions/${sessionId}`),
    onSuccess: () => { setActiveSessionId(null); setMessages([]); refetchSessions(); },
  });

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    setDraft('');
    sendMutation.mutate(trimmed);
    textareaRef.current?.focus();
  };

  const starterPrompts = [t('starters.protection'), t('starters.divorce'), t('starters.custody'), t('starters.anonymous')];

  return (
    /* Outer glass card — light: frosted glass, dark: fully opaque dark surface */
    <div className="flex flex-1 min-h-0 overflow-hidden rounded-3xl border border-white/40 dark:border-border shadow-xl bg-white/85 backdrop-blur-md dark:backdrop-blur-none dark:bg-surface">

      {/* ── Sidebar ── */}
      <aside className={`
        flex flex-col shrink-0 border-r border-border/50
        bg-white/70 backdrop-blur-sm dark:backdrop-blur-none dark:bg-elevated
        transition-transform duration-200
        fixed inset-y-0 left-0 z-30 w-64
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-56
      `}>
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-heading">{t('sidebar.heading')}</h2>
          <button
            onClick={() => { setActiveSessionId(null); setMessages([]); setSidebarOpen(false); textareaRef.current?.focus(); }}
            className="flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-bold text-primary-fg hover:bg-primary-hover transition-colors"
          >
            {t('sidebar.newBtn')}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {!sessions || sessions.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted font-medium">{t('sidebar.empty')}</p>
          ) : sessions.map((s) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition-all duration-150 border ${
                activeSessionId === s.id
                  ? 'bg-primary border-primary/20 text-primary-fg shadow-sm'
                  : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5 text-body'
              }`}>
              <p className="text-xs font-bold truncate">{s.title || t('sidebar.untitled')}</p>
              <p className={`text-[10px] mt-0.5 font-medium ${activeSessionId === s.id ? 'text-primary-fg/70' : 'text-muted'}`}>
                {relativeDate(s.last_active_at)}
              </p>
            </button>
          ))}
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Main Chat Column ── */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">

        {/* Chat Header */}
        <header className="flex h-14 items-center justify-between border-b border-border/40 px-4 shrink-0 bg-white/60 backdrop-blur-sm dark:backdrop-blur-none dark:bg-elevated">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl hover:bg-black/5 dark:hover:bg-white/10 text-muted focus:outline-none">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-heading">{t('topBar.title')}</h1>
              <p className="text-[10px] text-muted font-medium">{t('topBar.subtitle')}</p>
            </div>
          </div>
          {activeSessionId && (
            <button onClick={() => deleteMutation.mutate(activeSessionId)} disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-danger transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> {t('topBar.deleteChat')}
            </button>
          )}
        </header>

        {/* Disclaimer */}
        <div className="bg-amber-400/10 dark:bg-amber-500/10 border-b border-amber-400/25 px-4 py-2.5 shrink-0">
          <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
            ⚠ <strong>{t('disclaimer').split(',')[0]}</strong>{t('disclaimer').includes(',') ? ',' + t('disclaimer').split(',').slice(1).join(',') : ''}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5" ref={scrollContainerRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-full text-center py-12 animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-primary-soft flex items-center justify-center mb-4 shadow-sm border border-primary/10">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-serif italic text-2xl text-heading mb-2">{t('welcome.title')}</h2>
              <p className="text-sm text-muted max-w-sm mb-6 font-medium leading-relaxed">{t('welcome.subtitle')}</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md">
                {starterPrompts.map((q) => (
                  <button key={q} onClick={() => { setDraft(q); textareaRef.current?.focus(); }}
                    className="rounded-xl border border-border bg-white/60 dark:bg-elevated px-3.5 py-2 text-xs font-bold text-body hover:border-primary/40 hover:text-primary transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-primary flex items-center justify-center text-primary-fg text-xs font-serif font-bold mt-1 shadow-sm">N</div>
              )}
              <div className={`max-w-xl flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-primary text-primary-fg shadow-sm'
                    : msg.isOptimistic
                      ? 'rounded-bl-sm bg-inset dark:bg-elevated border border-border text-muted shadow-sm'
                      : 'rounded-bl-sm bg-white dark:bg-elevated border border-border/60 text-heading shadow-sm'
                }`}>
                  {msg.isOptimistic ? (
                    <div className="flex items-center gap-3">
                      <Spinner size="sm" />
                      <span className="animate-pulse font-bold">{msg.content}</span>
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:font-bold font-medium">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-semibold">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && !msg.isOptimistic && (
                  <div className="w-full">
                    <button onClick={() => setSourcesOpen((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary-hover transition-colors">
                      <ChevronRight className={`h-3 w-3 transition-transform ${sourcesOpen[msg.id] ? 'rotate-90' : ''}`} />
                      {sourcesOpen[msg.id] ? t('sources.hide') : t('sources.view')} {t('sources.count', { count: msg.sources.length })}
                    </button>
                    {sourcesOpen[msg.id] && (
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((s, i) => (
                          <div key={i} className="rounded-xl bg-primary-soft dark:bg-primary-muted border border-primary/20 px-3 py-2">
                            <p className="text-[10px] font-bold text-primary mb-1">
                              {s.source}{s.article_number ? ` · ${t('sources.article')} ${s.article_number}` : ''}
                            </p>
                            <p className="text-xs text-heading leading-relaxed font-medium line-clamp-3">{s.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'assistant' && msg.suggested_questions && !msg.isOptimistic && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_questions.map((q) => (
                      <button key={q} onClick={() => { setDraft(q); textareaRef.current?.focus(); }}
                        className="rounded-xl border border-border bg-white/60 dark:bg-elevated px-3 py-1.5 text-[11px] font-bold text-muted hover:border-primary/30 hover:text-primary transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* ── Input Footer ── */}
        <div className="border-t border-border/40 px-4 py-3 shrink-0 bg-white/60 dark:bg-elevated">
          {sendMutation.isError && (
            <p className="mb-2 text-xs text-danger font-bold">{t('error')}</p>
          )}

          {/* Chat Input pill — styled like the ChatInput component */}
          <div className="flex items-end gap-2 w-full rounded-2xl border border-border bg-white/70 dark:bg-inset px-3 py-2 focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/40 transition-all">
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t('input.placeholder')}
              rows={1}
              className="flex-1 resize-none bg-transparent text-sm text-heading dark:text-heading placeholder:text-placeholder dark:placeholder:text-muted focus:outline-none max-h-[120px] overflow-x-hidden py-1"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sendMutation.isPending}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-fg hover:bg-primary-hover transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none"
            >
              {sendMutation.isPending ? <Spinner size="sm" color="white" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>

          <p className="mt-1.5 text-[10px] text-muted text-center font-medium">{t('input.hint')}</p>
        </div>
      </div>
    </div>
  );
}
