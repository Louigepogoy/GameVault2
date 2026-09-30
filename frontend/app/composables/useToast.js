let nextId = 1;
// Timers live outside reactive state; toasts only exist in the browser.
const timers = new Map(); // id -> { timeout, remaining, startedAt }
const closeHandlers = new Map(); // id -> onClose()

export function useToast() {
  // useState keeps toasts per request on the server (no cross-user leakage).
  const toasts = useState('toasts', () => []);

  /** Remove a toast. Its onClose runs unless the toast's action button was used. */
  function dismiss(id, { viaAction = false } = {}) {
    clearTimeout(timers.get(id)?.timeout);
    timers.delete(id);
    const onClose = closeHandlers.get(id);
    closeHandlers.delete(id);
    toasts.value = toasts.value.filter((t) => t.id !== id);
    if (!viaAction) onClose?.();
  }

  function startTimer(id, ms) {
    timers.set(id, { remaining: ms, startedAt: Date.now(), timeout: setTimeout(() => dismiss(id), ms) });
  }

  // Hovering a toast pauses it, so it doesn't vanish while you're reading or reaching for Undo.
  function pause(id) {
    const t = timers.get(id);
    if (!t?.timeout) return;
    clearTimeout(t.timeout);
    timers.set(id, { remaining: Math.max(t.remaining - (Date.now() - t.startedAt), 800), timeout: null });
    toasts.value = toasts.value.map((x) => (x.id === id ? { ...x, paused: true } : x));
  }

  function resume(id) {
    const t = timers.get(id);
    if (!t || t.timeout) return;
    startTimer(id, t.remaining);
    toasts.value = toasts.value.map((x) => (x.id === id ? { ...x, paused: false } : x));
  }

  /**
   * Show a toast. `action` adds a button, e.g. { label: 'Undo', onClick() {} }.
   * `onClose` runs when the toast goes away without its action being used.
   * Returns the toast id.
   */
  function show(message, type = 'success', { duration = 3500, action = null, onClose = null } = {}) {
    if (import.meta.server) return null;
    // Keep at most 4 on screen; older ones close normally (so their onClose still runs).
    while (toasts.value.length >= 4) dismiss(toasts.value[0].id);
    const id = nextId++;
    if (onClose) closeHandlers.set(id, onClose);
    toasts.value = [...toasts.value, { id, message, type, duration, action, paused: false }];
    startTimer(id, duration);
    return id;
  }

  function runAction(t) {
    dismiss(t.id, { viaAction: true });
    t.action?.onClick();
  }

  return {
    toasts,
    dismiss,
    pause,
    resume,
    runAction,
    show,
    success: (msg, opts) => show(msg, 'success', opts),
    error: (msg, opts) => show(msg, 'error', { duration: 5000, ...opts }),
    info: (msg, opts) => show(msg, 'info', opts),
  };
}
