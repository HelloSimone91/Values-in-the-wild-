const configuredBase = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');
const apiBase = configuredBase || (import.meta.env.DEV ? 'http://localhost:8787' : '');

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return apiBase ? `${apiBase}${normalizedPath}` : normalizedPath;
};
