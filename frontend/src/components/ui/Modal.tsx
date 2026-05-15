// Modal — generic dialog overlay with title, content, and close behavior.
// Uses semantic tokens + Lucide icons for dark/light support.

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-heading/40 backdrop-blur-sm animate-fade-in" />

      {/* Modal Panel */}
      <div
        className={`relative w-full rounded-2xl bg-surface border border-border shadow-xl animate-scale-in ${sizeStyles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border-muted px-5 py-4">
            <h3 className="font-heading text-lg text-heading">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-muted transition-colors duration-150 hover:bg-inset hover:text-heading"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border-muted px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
