// Toast — lightweight toast notification system.
// Usage: import { useToast } from './ToastProvider'
//        const { showToast } = useToast();
//        showToast('Title', 'Body text', '/dashboard/cases/123');

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────

interface Toast {
  id: string;
  title: string;
  body: string;
  href?: string;
}

interface ToastContextValue {
  showToast: (title: string, body: string, href?: string) => void;
}

// ─── Context ──────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

// ─── Provider ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((title: string, body: string, href?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, body, href }]);
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — bottom-right */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto w-72 overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200 animate-[slideIn_0.2s_ease-out]"
            style={{
              animation: 'slideIn 0.2s ease-out',
            }}
          >
            <div
              className={`flex gap-3 p-4 ${toast.href ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}`}
              onClick={() => {
                if (toast.href) {
                  window.location.href = toast.href;
                }
                dismiss(toast.id);
              }}
            >
              {/* Teal accent bar */}
              <div className="w-1 shrink-0 rounded-full bg-teal-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-dark truncate">{toast.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{toast.body}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(toast.id);
                }}
                className="shrink-0 text-gray-500 hover:text-dark transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
