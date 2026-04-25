const DEFAULT_TIMEOUT_MS = 4000;

const createTimeoutError = (timeoutMs: number) => {
  const error = new Error(`Request timed out after ${timeoutMs}ms.`);
  error.name = 'AbortError';
  return error;
};

export const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const upstreamSignal = init.signal;

  const onAbort = () => controller.abort(upstreamSignal?.reason);

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort(upstreamSignal.reason);
    } else {
      upstreamSignal.addEventListener('abort', onAbort, { once: true });
    }
  }

  const timeoutId = window.setTimeout(() => {
    controller.abort(createTimeoutError(timeoutMs));
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeoutId);
    upstreamSignal?.removeEventListener('abort', onAbort);
  }
};
