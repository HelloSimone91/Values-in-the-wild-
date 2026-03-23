const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const API_BASE = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

export interface AdminAccessPayload {
  admin: boolean;
  authConfigured: boolean;
  email?: string | null;
  userId?: string | null;
}

export const loadAdminAccess = async (accessToken: string | null): Promise<AdminAccessPayload> => {
  if (!API_BASE) {
    return { admin: false, authConfigured: false };
  }

  const response = await fetch(`${API_BASE}/api/v1/me/access`, {
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
