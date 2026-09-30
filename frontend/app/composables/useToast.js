let nextId = 1;

export function useToast() {
  // useState keeps toasts per request on the server (no cross-user leakage).
  const toasts = useState('toasts', () => []);

  function dismiss(id) {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  }

  function show(message, type = 'success', duration = 3000) {
    if (import.meta.server) return;
    const id = nextId++;
    toasts.value.push({ id, message, type });
    setTimeout(() => dismiss(id), duration);
  }

  return {
    toasts,
    dismiss,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error', 4500),
    info: (msg) => show(msg, 'info'),
  };
}
