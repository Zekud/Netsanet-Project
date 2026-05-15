// StaffManagementPage — institution_admin manages their staff roster.
// Route: /dashboard/staff
// Uses semantic tokens + Lucide icons.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { UserPlus, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

interface StaffMember {
  id: string;
  display_name: string;
  role: string;
  phone: string | null;
  is_active: boolean;
  cases_assigned: number;
  created_at: string;
}

function AddStaffModal({ onClose, onSave, isLoading, t }: {
  onClose: () => void;
  onSave: (data: { display_name: string; email: string; phone: string; role: string }) => void;
  isLoading: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const [form, setForm] = useState({ display_name: '', email: '', phone: '', role: 'case_worker' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const inputClasses = 'w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-heading focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-heading/40 backdrop-blur-sm px-4 animate-fade-in">
      <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg text-heading">{t('staff.modal.title')}</h3>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-muted hover:bg-inset transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-muted mb-4">{t('staff.modal.desc')}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('staff.modal.fullName')}</label>
            <input value={form.display_name} onChange={(e) => set('display_name', e.target.value)}
              className={inputClasses} placeholder="Tigist Bekele" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('staff.modal.email')}</label>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email"
              className={inputClasses} placeholder="tigist@organization.org" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('staff.modal.phone')}</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} type="tel"
              className={inputClasses} placeholder="+251911234567" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">{t('staff.modal.role')} *</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}
              className={inputClasses}>
              <option value="case_worker">{t('staff.roles.case_worker')}</option>
              <option value="institution_admin">{t('staff.roles.institution_admin')}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-border py-2.5 text-sm text-body hover:bg-inset transition-colors">
            {t('staff.modal.cancel')}
          </button>
          <button
            onClick={() => { if (form.display_name && (form.email || form.phone)) onSave(form); }}
            disabled={!form.display_name || (!form.email && !form.phone) || isLoading}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isLoading ? '...' : t('staff.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StaffManagementPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ROLE_LABELS: Record<string, string> = {
    case_worker: t('staff.roles.case_worker'),
    institution_admin: t('staff.roles.institution_admin'),
  };

  const { data, isLoading } = useQuery<{ data: StaffMember[] }>({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.get('/staff');
      return res.data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (payload: { display_name: string; email: string; phone: string; role: string }) => {
      await api.post('/staff', payload);
    },
    onSuccess: () => {
      setShowModal(false);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || 'Failed to add staff member. Please try again.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/staff/${id}`, { is_active });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['staff'] }),
  });

  const staff = data?.data ?? [];
  const active = staff.filter((s) => s.is_active).length;

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-40 -left-20" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-heading">{t('staff.title')}</h1>
          <p className="text-sm text-muted mt-0.5">{active} active member{active !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors"
        >
          <UserPlus className="h-4 w-4" /> {t('staff.addStaff')}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-danger-soft border border-danger/20 px-4 py-3 text-sm text-danger">{error}</div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-inset text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('staff.table.name')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('staff.table.role')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('staff.table.cases')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('staff.table.status')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('staff.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {staff.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-placeholder">{t('staff.empty')}</td></tr>
              ) : staff.map((s) => (
                <tr key={s.id} className="hover:bg-inset transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-heading">{s.display_name || <span className="italic text-placeholder">No name set</span>}</p>
                    {s.phone && <p className="text-xs text-muted mt-0.5">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-lg px-2 py-0.5 text-xs font-medium ${
                      s.role === 'institution_admin' ? 'bg-primary-soft text-primary' : 'bg-inset text-muted'
                    }`}>
                      {ROLE_LABELS[s.role] ?? s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-heading">{s.cases_assigned}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t('staff.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-inset px-2 py-0.5 text-xs font-medium text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-placeholder" /> {t('staff.status.suspended')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.id === currentUser?.id ? (
                      <span className="text-xs text-placeholder italic">You</span>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })}
                        disabled={toggleMutation.isPending}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                          s.is_active
                            ? 'border border-danger/30 text-danger hover:bg-danger-soft'
                            : 'border border-primary-muted text-primary hover:bg-primary-soft'
                        }`}
                      >
                        {s.is_active ? t('staff.actions.suspend') : t('staff.actions.activate')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <AddStaffModal
          onClose={() => setShowModal(false)}
          onSave={(d) => addMutation.mutate(d)}
          isLoading={addMutation.isPending}
          t={t}
        />
      )}
    </div>
  );
}
