// UsersPage — system_admin views all users in the platform.
// Route: /dashboard/users

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

interface UserItem {
  id: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
  anonymous_mode: boolean;
  preferred_language: string;
  created_at: string;
  institutions: { name: string } | null;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation('dashboard');

  const { data, isLoading } = useQuery<{ data: UserItem[] }>({
    queryKey: ['users-admin'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      await api.patch(`/users/${id}`, { is_active });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users-admin'] }),
  });

  const users = data?.data ?? [];

  return (
    <div className="relative space-y-6">
      {/* Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl z-0 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="mesh-blob-1 -top-10 -right-20" />
        <div className="mesh-blob-2 top-40 -left-20" />
      </div>
      
      {/* Header */}
      <div className="flex items-center justify-between z-10 relative">
        <div>
          <h1 className="font-heading text-2xl text-heading">System Users</h1>
          <p className="text-sm text-muted mt-0.5">Total registered users: {users.length}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <UsersIcon className="h-5 w-5" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm z-10 relative">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-inset text-left">
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Institution</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-muted">
              {users.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-placeholder">No users found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-inset transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-heading">{u.display_name || <span className="italic text-placeholder">No name</span>}</p>
                    <p className="text-xs text-muted mt-0.5">{u.email || u.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-lg px-2 py-0.5 text-xs font-medium bg-inset text-muted capitalize">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted text-sm">
                    {u.institutions?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-inset px-2 py-0.5 text-xs font-medium text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-placeholder" /> Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {u.id === currentUser?.id ? (
                      <span className="text-xs text-placeholder italic">You</span>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate({ id: u.id, is_active: !u.is_active })}
                        disabled={toggleMutation.isPending}
                        className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                          u.is_active
                            ? 'border border-danger/30 text-danger hover:bg-danger-soft'
                            : 'border border-primary-muted text-primary hover:bg-primary-soft'
                        }`}
                      >
                        {u.is_active ? 'Suspend' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
