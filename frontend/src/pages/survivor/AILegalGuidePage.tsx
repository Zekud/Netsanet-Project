// AILegalGuidePage — full-page AI legal chat for survivors.
// Route: /safe-space/chat — Fully localized via aiGuide namespace.
// Uses semantic tokens + Lucide icons.

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Scale, Trash2, Menu, Send, Mic, ChevronRight } from 'lucide-react';
import api from '../../lib/api';
import { Spinner } from '../../components/ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastSentRef = useRef('');

  const { data: sessions, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ['ai-sessions'],
    queryFn: async () => { const r = await api.get('/ai/sessions'); return r.data.data; },
  });

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId); setSidebarOpen(false);
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
    setDraft(''); sendMutation.mutate(trimmed); inputRef.current?.focus();
  };

  const starterPrompts = [t('starters.protection'), t('starters.divorce'), t('starters.custody'), t('starters.anonymous')];

  return (
    <div className="flex flex-1 bg-bg overflow-hidden min-h-0">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex-col bg-sidebar border-r border-border transition-transform duration-200 flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-56 md:shrink-0`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium text-heading">{t('sidebar.heading')}</h2>
          <button onClick={() => { setActiveSessionId(null); setMessages([]); setSidebarOpen(false); inputRef.current?.focus(); scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-fg hover:bg-primary-hover transition-colors">
            {t('sidebar.newBtn')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {!sessions || sessions.length === 0 ? (
            <p className="px-2 py-4 text-xs text-muted">{t('sidebar.empty')}</p>
          ) : sessions.map((s) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ${activeSessionId === s.id ? 'bg-sidebar-active text-sidebar-active-text' : 'hover:bg-inset text-body'}`}>
              <p className="text-xs font-medium truncate">{s.title || t('sidebar.untitled')}</p>
              <p className="text-[10px] text-muted mt-0.5">{relativeDate(s.last_active_at)}</p>
            </button>
          ))}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-20 bg-heading/30 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Chat */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl hover:bg-inset text-muted">
              <Menu className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-medium text-heading">{t('topBar.title')}</h1>
              <p className="text-[10px] text-muted">{t('topBar.subtitle')}</p>
            </div>
          </div>
          {activeSessionId && (
            <button onClick={() => deleteMutation.mutate(activeSessionId)} disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors">
              <Trash2 className="h-3 w-3" /> {t('topBar.deleteChat')}
            </button>
          )}
        </header>

        <div className="bg-warning-soft border-b border-warning/20 px-4 py-2 shrink-0">
          <p className="text-xs text-warning" dangerouslySetInnerHTML={{ __html: t('disclaimer').replace('This AI provides legal information only, not legal advice.', '<strong>This AI provides legal information only, not legal advice.</strong>') }} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5" ref={scrollContainerRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-full text-center py-12 animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-primary-soft flex items-center justify-center mb-4">
                <Scale className="h-8 w-8 text-primary" />
              </div>
              <h2 className="font-heading text-xl text-heading mb-2">{t('welcome.title')}</h2>
              <p className="text-sm text-muted max-w-sm mb-6">{t('welcome.subtitle')}</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {starterPrompts.map((q) => (
                  <button key={q} onClick={() => { setDraft(q); inputRef.current?.focus(); }}
                    className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs text-muted hover:border-primary/30 hover:text-primary transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 shrink-0 rounded-xl bg-primary flex items-center justify-center text-primary-fg text-xs font-bold mt-1">N</div>
              )}
              <div className={`max-w-xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm bg-chat-mine text-chat-mine-fg' : msg.isOptimistic ? 'rounded-bl-sm bg-surface border border-border text-placeholder shadow-sm' : 'rounded-bl-sm bg-chat-ai border border-chat-ai-border text-chat-ai-fg shadow-sm'}`}>
                  {msg.isOptimistic ? (
                    <div className="flex items-center gap-3"><Spinner size="sm" /><span className="animate-pulse font-medium">{msg.content}</span></div>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:text-heading prose-a:text-primary">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && !msg.isOptimistic && (
                  <div className="w-full">
                    <button onClick={() => setSourcesOpen((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                      className="flex items-center gap-1.5 text-[11px] text-primary hover:text-primary-hover transition-colors">
                      <ChevronRight className={`h-3 w-3 transition-transform ${sourcesOpen[msg.id] ? 'rotate-90' : ''}`} />
                      {sourcesOpen[msg.id] ? t('sources.hide') : t('sources.view')} {t('sources.count', { count: msg.sources.length })}
                    </button>
                    {sourcesOpen[msg.id] && (
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((s, i) => (
                          <div key={i} className="rounded-xl bg-primary-soft border border-primary-muted px-3 py-2">
                            <p className="text-[10px] font-semibold text-primary mb-1">
                              {s.source}{s.article_number ? ` · ${t('sources.article')} ${s.article_number}` : ''}
                            </p>
                            <p className="text-xs text-heading leading-relaxed line-clamp-3">{s.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {msg.role === 'assistant' && msg.suggested_questions && !msg.isOptimistic && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggested_questions.map((q) => (
                      <button key={q} onClick={() => { setDraft(q); inputRef.current?.focus(); }}
                        className="rounded-xl border border-border bg-surface px-3 py-1 text-[11px] text-muted hover:border-primary/30 hover:text-primary transition-all">
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

        <div className="border-t border-border px-4 py-3 shrink-0">
          {sendMutation.isError && <p className="mb-2 text-xs text-danger">{t('error')}</p>}
          <div className="flex items-end gap-3">
            <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t('input.placeholder')} rows={1}
              className="flex-1 resize-none rounded-xl border border-border bg-inset px-4 py-3 text-sm text-heading placeholder:text-placeholder transition-all focus:border-ring focus:bg-surface focus:outline-none focus:ring-1 focus:ring-ring/20"
              style={{ maxHeight: '120px' }}
              onInput={(e) => { const el = e.currentTarget; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 120)}px`; }}
            />
            <button className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-muted hover:border-primary/30 hover:text-primary transition-all" title="Voice input (coming soon)">
              <Mic className="h-5 w-5" />
            </button>
            <button onClick={handleSend} disabled={!draft.trim() || sendMutation.isPending}
              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-fg hover:bg-primary-hover transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              {sendMutation.isPending ? <Spinner size="sm" /> : <Send className="h-5 w-5" />}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-muted text-center">{t('input.hint')}</p>
        </div>
      </div>
    </div>
  );
}
