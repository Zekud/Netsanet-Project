// Toast — lightweight toast notification system.
// Now featuring Swipe-to-Dismiss and Auto-close Progress Bars!
// Usage: import { useToast } from './ToastProvider'
//        const { showToast } = useToast();
//        showToast('Title', 'Body text', '/dashboard/cases/123');
// Uses semantic tokens + Lucide icons for dark/light support.

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────

interface ToastData {
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

// ─── Toast Item Component ─────────────────────────────────────

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [startX, setStartX] = useState(0);
  const [offsetX, setOffsetX] = useState(0);

  const duration = 4000;

  const triggerDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300); // Wait for exit animation
  }, [toast.id, onDismiss]);

  // Auto-dismiss timer
  useEffect(() => {
    const timer = setTimeout(triggerDismiss, duration);
    return () => clearTimeout(timer);
  }, [triggerDismiss]);

  // Progress bar animation
  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => {
      setProgress(0);
    });
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div
      className={`pointer-events-auto relative w-72 overflow-hidden rounded-2xl bg-surface shadow-xl border border-border transition-all duration-300 ease-out ${
        isExiting ? 'opacity-0 translate-x-10 scale-95' : 'animate-slide-in-right opacity-100 translate-x-0 scale-100'
      }`}
      style={{ transform: offsetX > 0 ? `translateX(${offsetX}px)` : undefined }}
      onPointerDown={(e) => {
        setStartX(e.clientX);
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (!startX) return;
        const diff = e.clientX - startX;
        if (diff > 0) setOffsetX(diff); // Only allow swiping right
      }}
      onPointerUp={(e) => {
        if (offsetX > 60) {
          triggerDismiss();
        } else {
          setOffsetX(0); // Snap back
        }
        setStartX(0);
        e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        setStartX(0);
        setOffsetX(0);
      }}
    >
      <div
        className={`flex gap-3 p-4 select-none ${toast.href ? 'cursor-pointer hover:bg-inset transition-colors' : ''}`}
        onClick={() => {
          if (toast.href) {
            window.location.href = toast.href;
          }
          triggerDismiss();
        }}
      >
        <div className="w-1 shrink-0 rounded-full bg-primary" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-heading truncate">{toast.title}</p>
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{toast.body}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            triggerDismiss();
          }}
          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-full text-muted hover:bg-inset hover:text-heading transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Shrinking Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[3px] w-full bg-inset">
        <div 
          className="h-full bg-primary" 
          style={{ 
            width: `${progress}%`, 
            transition: `width ${duration}ms linear` 
          }} 
        />
      </div>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((title: string, body: string, href?: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, title, body, href }]);
  }, []);

  const handleDismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
