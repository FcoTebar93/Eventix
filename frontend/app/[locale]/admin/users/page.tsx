'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { getAllUsers, updateUserRoleAdmin, type AdminUser } from '@/lib/api';

const PAGE_SIZE = 20;
const ROLES = ['BUYER', 'SELLER', 'ORGANIZER', 'ADMIN'] as const;

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page],
    queryFn: () => getAllUsers({ page, limit: PAGE_SIZE }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      updateUserRoleAdmin(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const users = data?.users ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">{t('usersTitle')}</h2>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            <div className="h-32 animate-pulse rounded-lg bg-[var(--bg-secondary)]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-secondary)]">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">{t('createdAt') ?? 'Fecha alta'}</th>
                    <th className="px-4 py-3 font-medium">{t('role') ?? 'Rol'}</th>
                    <th className="px-4 py-3 font-medium">{t('actions') ?? 'Acciones'}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user: AdminUser) => (
                    <tr key={user.id} className="border-b border-[var(--border)]">
                      <td className="px-4 py-3 text-white">
                        <div className="flex flex-col">
                          <span>{user.email}</span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {user.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)] text-xs">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full border px-2 py-0.5 text-xs bg-[var(--bg-secondary)] text-[var(--text-secondary)]">
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateRoleMutation.mutate({
                              userId: user.id,
                              role: e.target.value,
                            })
                          }
                          className="rounded border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1 text-xs text-white"
                          disabled={updateRoleMutation.isPending}
                        >
                          {ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data && totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-2">
                <span className="text-sm text-[var(--text-secondary)]">
                  {t('pageOf', { current: page, total: totalPages })}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('previous')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages}
                    className="rounded bg-[var(--bg-secondary)] px-3 py-1 text-sm text-white disabled:opacity-50"
                  >
                    {t('next')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

