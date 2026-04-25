import { buildApiUrl } from './apiBase';
import { fetchWithTimeout } from './fetchWithTimeout';

interface SubmitFeedbackOptions {
  accessToken?: string | null;
  anonymousId?: string | null;
  currentView?: string;
  message: string;
  paletteId?: string;
  pathname?: string;
  userEmail?: string | null;
}

export const submitFeedback = async ({
  accessToken,
  anonymousId,
  currentView,
  message,
  paletteId,
  pathname,
  userEmail,
}: SubmitFeedbackOptions): Promise<void> => {
  const response = await fetchWithTimeout(
    buildApiUrl('/api/v1/feedback'),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken
          ? {
              Authorization: `Bearer ${accessToken}`,
            }
          : {}),
      },
      body: JSON.stringify({
        anonymousId: anonymousId || undefined,
        currentView,
        message,
        paletteId,
        pathname,
        userEmail: userEmail || undefined,
      }),
    },
    8000
  );

  let errorMessage = 'Unable to send feedback right now.';
  const payload = (await response.json().catch(() => null)) as { error?: string; ok?: boolean } | null;

  if (response.ok && payload?.ok === true) return;

  if (payload?.error && typeof payload.error === 'string') {
    errorMessage = payload.error;
  }

  throw new Error(errorMessage);
};
