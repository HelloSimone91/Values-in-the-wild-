import { buildApiUrl } from './apiBase';

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
  const response = await fetch(buildApiUrl('/api/v1/feedback'), {
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
  });

  if (response.ok) return;

  let errorMessage = 'Unable to send feedback right now.';

  try {
    const payload = await response.json();
    if (payload?.error && typeof payload.error === 'string') {
      errorMessage = payload.error;
    }
  } catch {
    // Ignore invalid JSON so we can fall back to the generic message.
  }

  throw new Error(errorMessage);
};
