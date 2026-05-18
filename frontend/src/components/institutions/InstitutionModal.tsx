import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  mowsa: 'MoWSA', ewla: 'EWLA', medical: 'Medical', shelter: 'Shelter', ngo: 'NGO',
};

export default function InstitutionModal({
  onClose,
  onSave,
  t
}: {
  onClose: () => void;
  onSave: (data: { name: string; type: string; description: string }) => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [form, setForm] = useState({ name: '', type: 'mowsa', description: '' });
  const inputClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-heading/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-heading">{t('institutions.addInstitution')}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-inset transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('institutions.modal.name')}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className={inputClasses}
              placeholder={t('institutions.modal.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('institutions.modal.services')} *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className={inputClasses}
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className={`${inputClasses} resize-none`}
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-body hover:bg-inset transition-colors">{t('institutions.modal.cancel')}</button>
          <button
            onClick={() => { if (form.name) onSave(form); }}
            disabled={!form.name}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {t('institutions.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
