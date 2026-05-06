// StaffManagementPage — institution_admin manages their staff roster.
// Route: /dashboard/staff

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
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
  t: any;
}) {
  const [form, setForm] = useState({ display_name: '', email: '', phone: '', role: 'case_worker' });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-lg text-dark mb-1">{t('staff.modal.title')}</h3>
        <p className="text-xs text-gray-500 mb-4">{t('staff.modal.desc')}</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('staff.modal.fullName')}</label>
            <input value={form.display_name} onChange={(e) => set('display_name', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Tigist Bekele" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('staff.modal.email')}</label>
            <input value={form.email} onChange={(e) => set('email', e.target.value)} type="email"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="tigist@organization.org" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('staff.modal.phone')}</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)} type="tel"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="+251911234567" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('staff.modal.role')} *</label>
            <select value={form.role} onChange={(e) => set('role', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none">
              <option value="case_worker">{t('staff.roles.case_worker')}</option>
              <option value="institution_admin">{t('staff.roles.institution_admin')}</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {t('staff.modal.cancel')}
          </button>
          <button
            onClick={() => { if (form.display_name && (form.email || form.phone)) onSave(form); }}
            disabled={!form.display_name || (!form.email && !form.phone) || isLoading}
            className="flex-1 rounded-xl bg-teal-500 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark">{t('staff.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active} active member{active !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setError(null); setShowModal(true); }}
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          + {t('staff.addStaff')}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('staff.table.name')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('staff.table.role')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('staff.table.cases')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('staff.table.status')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('staff.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">{t('staff.empty')}</td></tr>
              ) : staff.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark">{s.display_name || <span className="italic text-gray-400">No name set</span>}</p>
                    {s.phone && <p className="text-xs text-gray-400 mt-0.5">{s.phone}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                      s.role === 'institution_admin' ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {ROLE_LABELS[s.role] ?? s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-dark">{s.cases_assigned}</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {t('staff.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-gray-400" /> {t('staff.status.suspended')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {s.id === currentUser?.id ? (
                      <span className="text-xs text-gray-400 italic">You</span>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate({ id: s.id, is_active: !s.is_active })}
                        disabled={toggleMutation.isPending}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          s.is_active
                            ? 'border border-red-200 text-red-500 hover:bg-red-50'
                            : 'border border-teal-200 text-teal-600 hover:bg-teal-50'
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
