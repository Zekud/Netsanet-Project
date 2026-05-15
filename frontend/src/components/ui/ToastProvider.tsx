// Toast — lightweight toast notification system.
// Usage: import { useToast } from './ToastProvider'
//        const { showToast } = useToast();
//        showToast('Title', 'Body text', '/dashboard/cases/123');
// Uses semantic tokens + Lucide icons for dark/light support.

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X } from 'lucide-react';

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
            className="pointer-events-auto w-72 overflow-hidden rounded-2xl bg-surface shadow-xl border border-border animate-slide-in-right"
          >
            <div
              className={`flex gap-3 p-4 ${toast.href ? 'cursor-pointer hover:bg-inset transition-colors' : ''}`}
              onClick={() => {
                if (toast.href) {
                  window.location.href = toast.href;
                }
                dismiss(toast.id);
              }}
            >
              {/* Primary accent bar */}
              <div className="w-1 shrink-0 rounded-full bg-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-heading truncate">{toast.title}</p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{toast.body}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(toast.id);
                }}
                className="shrink-0 text-muted hover:text-heading transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
