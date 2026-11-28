import { setTimeout as wait } from 'node:timers/promises';

export const waitForBrowserCondition = async (fn) => {
  for (let i = 0; i < 60; i++) {
    try {
      const value = await fn();
      if (value) return value;
    } catch {
      // Chromium may still be starting or navigating.
    }
    await wait(100);
  }
  throw new Error('BROWSER_CONDITION_TIMEOUT');
};

export async function openFixtureBrowser(port) {
  const tab = await waitForBrowserCondition(async () =>
    (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(({ type }) => type === 'page'));
  const socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((open, reject) => {
    socket.addEventListener('open', open, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', ({ data }) => {
    const { id, result, error } = JSON.parse(data);
    const match = pending.get(id);
    if (!match) return;
    pending.delete(id);
    if (error) match.reject(new Error(error.message));
    else match.accept(result);
  });
  const send = (method, params) => new Promise((accept, reject) => {
    const id = ++sequence;
    pending.set(id, { accept, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const inspect = async (expression) =>
    (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
  return { send, inspect, close: () => socket.close() };
}
