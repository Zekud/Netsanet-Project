// AILegalGuidePage — full-page AI legal chat for survivors.
// Route: /safe-space/chat — Fully localized via aiGuide namespace.

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const lastSentRef = useRef('');

  const { data: sessions, refetch: refetchSessions } = useQuery<Session[]>({
    queryKey: ['ai-sessions'],
    queryFn: async () => { const r = await api.get('/ai/sessions'); return r.data.data; },
  });

  const loadSession = async (sessionId: string) => {
    setActiveSessionId(sessionId); setSidebarOpen(false);
    try {
      const r = await api.get(`/ai/sessions/${sessionId}`);
      setMessages(r.data.data.messages || []);
    } catch { setMessages([]); }
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sendMutation.isPending) return;
    setDraft(''); sendMutation.mutate(trimmed); inputRef.current?.focus();
  };

  const starterPrompts = [
    t('starters.protection'), t('starters.divorce'),
    t('starters.custody'), t('starters.anonymous'),
  ];

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-gray-100">

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-200 flex ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-medium text-dark">{t('sidebar.heading')}</h2>
          <button onClick={() => { setActiveSessionId(null); setMessages([]); setSidebarOpen(false); inputRef.current?.focus(); }}
            className="flex items-center gap-1 rounded-lg bg-teal-500 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-teal-700 transition-colors">
            {t('sidebar.newBtn')}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {!sessions || sessions.length === 0 ? (
            <p className="px-2 py-4 text-xs text-gray-500">{t('sidebar.empty')}</p>
          ) : sessions.map((s) => (
            <button key={s.id} onClick={() => loadSession(s.id)}
              className={`w-full rounded-lg px-3 py-2.5 text-left transition-colors duration-150 group ${activeSessionId === s.id ? 'bg-teal-50 text-teal-800' : 'hover:bg-gray-100 text-dark'}`}>
              <p className="text-xs font-medium truncate">{s.title || t('sidebar.untitled')}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{relativeDate(s.last_active_at)}</p>
            </button>
          ))}
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Chat */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-100">
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-sm font-medium text-dark">{t('topBar.title')}</h1>
              <p className="text-[10px] text-gray-500">{t('topBar.subtitle')}</p>
            </div>
          </div>
          {activeSessionId && (
            <button onClick={() => deleteMutation.mutate(activeSessionId)} disabled={deleteMutation.isPending}
              className="text-xs text-gray-500 hover:text-critical transition-colors">
              {t('topBar.deleteChat')}
            </button>
          )}
        </header>

        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 shrink-0">
          <p className="text-xs text-amber-800" dangerouslySetInnerHTML={{ __html: t('disclaimer').replace('This AI provides legal information only, not legal advice.', '<strong>This AI provides legal information only, not legal advice.</strong>') }} />
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center min-h-full text-center py-12">
              <div className="h-16 w-16 rounded-full bg-teal-50 flex items-center justify-center mb-4">
                <span className="text-3xl">⚖️</span>
              </div>
              <h2 className="font-serif text-xl text-dark mb-2">{t('welcome.title')}</h2>
              <p className="text-sm text-gray-500 max-w-sm mb-6">{t('welcome.subtitle')}</p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {starterPrompts.map((q) => (
                  <button key={q} onClick={() => { setDraft(q); inputRef.current?.focus(); }}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-500 hover:border-teal-400 hover:text-teal-700 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role === 'assistant' && (
                <div className="h-8 w-8 shrink-0 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold mt-1">N</div>
              )}
              <div className={`max-w-xl ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm bg-teal-500 text-white' : msg.isOptimistic ? 'rounded-bl-sm bg-white border border-gray-200 text-gray-400 shadow-sm' : 'rounded-bl-sm bg-white border border-gray-200 text-dark shadow-sm'}`}>
                  {msg.isOptimistic ? (
                    <div className="flex items-center gap-3"><Spinner size="sm" /><span className="animate-pulse font-medium">{msg.content}</span></div>
                  ) : msg.role === 'assistant' ? (
                    <div className="prose prose-sm prose-teal max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && !msg.isOptimistic && (
                  <div className="w-full">
                    <button onClick={() => setSourcesOpen((p) => ({ ...p, [msg.id]: !p[msg.id] }))}
                      className="flex items-center gap-1.5 text-[11px] text-teal-600 hover:text-teal-800 transition-colors">
                      <svg className={`h-3 w-3 transition-transform ${sourcesOpen[msg.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                      {sourcesOpen[msg.id] ? t('sources.hide') : t('sources.view')} {t('sources.count', { count: msg.sources.length })}
                    </button>
                    {sourcesOpen[msg.id] && (
                      <div className="mt-2 space-y-2">
                        {msg.sources.map((s, i) => (
                          <div key={i} className="rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
                            <p className="text-[10px] font-semibold text-teal-700 mb-1">
                              {s.source}{s.article_number ? ` · ${t('sources.article')} ${s.article_number}` : ''}
                            </p>
                            <p className="text-xs text-teal-900 leading-relaxed line-clamp-3">{s.content}</p>
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
                        className="rounded-full border border-gray-200 bg-white px-3 py-1 text-[11px] text-gray-500 hover:border-teal-400 hover:text-teal-700 transition-colors">
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

        <div className="border-t border-gray-200 bg-white px-4 py-3 shrink-0">
          {sendMutation.isError && <p className="mb-2 text-xs text-red-500">{t('error')}</p>}
          <div className="flex items-end gap-3">
            <textarea ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={t('input.placeholder')} rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-dark placeholder:text-gray-500 transition-colors focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              style={{ maxHeight: '120px' }}
              onInput={(e) => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }}
            />
            <button className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:border-teal-400 hover:text-teal-600 transition-colors" title="Voice input (coming soon)">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
            <button onClick={handleSend} disabled={!draft.trim() || sendMutation.isPending}
              className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              {sendMutation.isPending ? <Spinner size="sm" /> : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-gray-500 text-center">{t('input.hint')}</p>
        </div>
      </div>
    </div>
  );
}
