// InstitutionsPage — system_admin manages all institutions.
// Route: /dashboard/institutions

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/api';

interface Institution {
  id: string;
  name: string;
  type: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  mowsa: 'MoWSA', ewla: 'EWLA', medical: 'Medical', shelter: 'Shelter', ngo: 'NGO',
};

// ─── Add Institution Modal ─────────────────────────────────────

function InstitutionModal({
  onClose, onSave, t
}: {
  onClose: () => void;
  onSave: (data: { name: string; type: string; description: string }) => void;
  t: any;
}) {
  const [form, setForm] = useState({ name: '', type: 'mowsa', description: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-serif text-lg text-dark mb-4">{t('institutions.addInstitution')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('institutions.modal.name')}</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder={t('institutions.modal.namePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('institutions.modal.services')} *</label>
            <select
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            >
              {Object.entries(TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t('institutions.modal.cancel')}</button>
          <button
            onClick={() => { if (form.name) onSave(form); }}
            disabled={!form.name}
            className="flex-1 rounded-xl bg-teal-500 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {t('institutions.modal.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Admin Modal ───────────────────────────────────────────

function AddAdminModal({
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
  t: any;
}) {
  const [form, setForm] = useState({ email: '', display_name: '' });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <h3 className="font-serif text-lg text-dark">Add Institution Admin</h3>
          <p className="text-xs text-gray-500 mt-0.5">for <span className="font-medium text-teal-700">{institution.name}</span></p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
            <input
              value={form.display_name}
              onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="Almaz Tadesse"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t('institutions.modal.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              placeholder="admin@institution.gov.et"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
          )}
          <p className="text-xs text-gray-400">
            The admin will receive an email OTP to log in for the first time.
          </p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">{t('institutions.modal.cancel')}</button>
          <button
            onClick={() => { if (form.email && form.display_name) onSave(form); }}
            disabled={!form.email || !form.display_name || isLoading}
            className="flex-1 rounded-xl bg-teal-500 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Admin'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────

export default function InstitutionsPage() {
  const queryClient = useQueryClient();
  const { t } = useTranslation('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [adminTarget, setAdminTarget] = useState<Institution | null>(null);
  const [adminError, setAdminError] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ data: Institution[] }>({
    queryKey: ['institutions-admin'],
    queryFn: async () => {
      const res = await api.get('/institutions');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; type: string; description: string }) => {
      await api.post('/institutions', payload);
    },
    onSuccess: () => {
      setShowModal(false);
      queryClient.invalidateQueries({ queryKey: ['institutions-admin'] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/institutions/${id}`, { is_active });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['institutions-admin'] }),
  });

  const addAdminMutation = useMutation({
    mutationFn: async ({
      email,
      display_name,
      institution_id,
    }: {
      email: string;
      display_name: string;
      institution_id: string;
    }) => {
      await api.post('/staff', {
        email,
        display_name,
        role: 'institution_admin',
        institution_id,
      });
    },
    onSuccess: () => {
      setAdminTarget(null);
      setAdminError(null);
    },
    onError: (err: { response?: { data?: { error?: { message?: string } } } }) => {
      setAdminError(
        err.response?.data?.error?.message || 'Failed to create admin. They may already exist.'
      );
    },
  });

  const institutions = data?.data ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-dark">{t('institutions.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('institutions.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-xl bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
        >
          + {t('institutions.addInstitution')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('institutions.table.institution')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('institutions.table.services')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('institutions.table.status')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('institutions.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {institutions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">{t('institutions.empty')}</td></tr>
              ) : institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-dark">{inst.name}</p>
                    {inst.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{inst.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {TYPE_LABELS[inst.type] ?? inst.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inst.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> {t('shared.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setAdminError(null); setAdminTarget(inst); }}
                        className="rounded-lg border border-teal-200 px-3 py-1.5 text-xs font-medium text-teal-600 hover:bg-teal-50 transition-colors"
                      >
                        + Add Admin
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: inst.id, is_active: !inst.is_active })}
                        disabled={toggleMutation.isPending}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          inst.is_active
                            ? 'border border-red-200 text-red-500 hover:bg-red-50'
                            : 'bg-teal-500 text-white hover:bg-teal-700'
                        }`}
                      >
                        {inst.is_active ? 'Deactivate' : 'Approve'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Institution Modal */}
      {showModal && (
        <InstitutionModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          t={t}
        />
      )}

      {/* Add Admin Modal */}
      {adminTarget && (
        <AddAdminModal
          institution={adminTarget}
          onClose={() => { setAdminTarget(null); setAdminError(null); }}
          onSave={({ email, display_name }) =>
            addAdminMutation.mutate({ email, display_name, institution_id: adminTarget.id })
          }
          isLoading={addAdminMutation.isPending}
          error={adminError}
          t={t}
        />
      )}
    </div>
  );
}
