import { X, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

interface LightboxModalProps {
  url: string | null;
  type: string | null;
  onClose: () => void;
}

export default function LightboxModal({ url, type, onClose }: LightboxModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!url) return null;

  const isImage = type?.startsWith('image/');
  const isPdf = type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-heading/90 backdrop-blur-md px-4 animate-fade-in" aria-modal="true" role="dialog">
      <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
        <a 
          href={url} 
          target="_blank" 
          rel="noreferrer" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/10 text-surface hover:bg-surface/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open in new tab"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
        <button 
          onClick={onClose} 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/10 text-surface hover:bg-surface/20 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Close preview"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative w-full max-w-5xl h-[85vh] flex items-center justify-center animate-scale-in">
        {isImage ? (
          <img src={url} alt="Evidence Preview" className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg" />
        ) : isPdf ? (
          <iframe src={url} className="w-full h-full bg-surface rounded-2xl shadow-2xl" title="PDF Preview" />
        ) : (
          <div className="bg-surface p-8 text-center rounded-2xl shadow-xl">
            <p className="text-heading mb-4 font-medium">Preview not available for this file type.</p>
            <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-fg hover:bg-primary-hover shadow-sm transition-all hover-lift">
              <ExternalLink className="h-4 w-4" /> Open File
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
