import { buildApiUrl } from './apiBase';

export interface AdminAccessPayload {
  admin: boolean;
  authConfigured: boolean;
  email?: string | null;
  userId?: string | null;
}

export const loadAdminAccess = async (accessToken: string | null): Promise<AdminAccessPayload> => {
  const response = await fetch(buildApiUrl('/api/v1/me/access'), {
    headers: accessToken
      ? {
          Authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error || 'Failed to load admin access.');
  }

  return (await response.json()) as AdminAccessPayload;
};
