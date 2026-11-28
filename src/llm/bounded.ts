export async function sha256Text(text: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type CallResult<T> =
  | { ok: true; value: T }
  | { ok: false; code: 'aborted' | 'timeout' | 'provider_error' };

export async function boundedCall<T>(
  operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number, signal?: AbortSignal,
): Promise<CallResult<T>> {
  if (signal?.aborted) return { ok: false, code: 'aborted' };
  const controller = new AbortController();
  let cancel = () => {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  const failure = new Promise<CallResult<T>>((resolve) => {
    cancel = () => {
      resolve({ ok: false, code: 'aborted' });
      controller.abort();
    };
    timer = setTimeout(() => {
      resolve({ ok: false, code: 'timeout' });
      controller.abort();
    }, timeoutMs);
    signal?.addEventListener('abort', cancel, { once: true });
  });
  const invocation = Promise.resolve().then(() =>
    controller.signal.aborted ? Promise.reject() : operation(controller.signal)).then(
    (value): CallResult<T> => ({ ok: true, value }),
    (): CallResult<T> => ({ ok: false, code: 'provider_error' }),
  );
  try {
    return await Promise.race([invocation, failure]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
