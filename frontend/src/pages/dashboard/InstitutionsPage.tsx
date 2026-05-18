// InstitutionsPage — system_admin manages all institutions.
// Route: /dashboard/institutions
// Uses semantic tokens + Lucide icons.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Building2, UserPlus } from 'lucide-react';
import api from '../../lib/api';
import InstitutionModal from '../../components/institutions/InstitutionModal';
import AddAdminModal from '../../components/institutions/AddAdminModal';

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
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-40 -left-20" />
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl text-heading">{t('institutions.title')}</h1>
          <p className="text-sm text-muted mt-0.5">{t('institutions.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover transition-colors"
        >
          <Building2 className="h-4 w-4" /> {t('institutions.addInstitution')}
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-inset text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('institutions.table.institution')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('institutions.table.services')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('institutions.table.status')}</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">{t('institutions.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {institutions.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-placeholder">{t('institutions.empty')}</td></tr>
              ) : institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-inset transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-heading">{inst.name}</p>
                    {inst.description && <p className="text-xs text-muted mt-0.5 truncate max-w-xs">{inst.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg bg-inset px-2 py-0.5 text-xs font-medium text-muted">
                      {TYPE_LABELS[inst.type] ?? inst.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inst.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t('shared.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-warning-soft px-2 py-0.5 text-xs font-medium text-warning">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setAdminError(null); setAdminTarget(inst); }}
                        className="inline-flex items-center gap-1 rounded-xl border border-primary-muted px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary-soft transition-colors"
                      >
                        <UserPlus className="h-3 w-3" /> Add Admin
                      </button>
                      <button
                        onClick={() => toggleMutation.mutate({ id: inst.id, is_active: !inst.is_active })}
                        disabled={toggleMutation.isPending}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                          inst.is_active
                            ? 'border border-danger/30 text-danger hover:bg-danger-soft'
                            : 'bg-primary text-primary-fg hover:bg-primary-hover'
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
