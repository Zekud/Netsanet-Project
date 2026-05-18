import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface Institution {
  id: string;
  name: string;
  type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function AddAdminModal({
  institution,
  onClose,
  onSave,
  isLoading,
  error,
  t
}: {
  institution: Institution;
  onClose: () => void;
  onSave: (data: { email: string; display_name: string }) => void;
  isLoading: boolean;
  error: string | null;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [form, setForm] = useState({ email: '', display_name: '' });
  const inputClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-heading/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-heading text-lg text-heading">Add Institution Admin</h3>
            <p className="text-xs text-muted mt-0.5">for <span className="font-medium text-primary">{institution.name}</span></p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-inset transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Full Name *</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              className={inputClasses}
              placeholder="Almaz Tadesse"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('institutions.modal.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className={inputClasses}
              placeholder="admin@institution.gov.et"
            />
          </div>
          {error && (
            <p className="rounded-xl bg-danger-soft border border-danger/20 px-3 py-2 text-xs text-danger">{error}</p>
          )}
          <p className="text-xs text-muted">
            The admin will receive an email OTP to log in for the first time.
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-body hover:bg-inset transition-colors">{t('institutions.modal.cancel')}</button>
          <button
            onClick={() => { if (form.email && form.display_name) onSave(form); }}
            disabled={!form.email || !form.display_name || isLoading}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}
