/**
 * Sistema de feedback global (toasts + diálogo de confirmação).
 * Substitui window.alert / window.confirm por componentes do design system,
 * mantendo a mesma semântica: `await confirmDialog(...)` resolve true/false.
 * Se o <FeedbackHost /> não estiver montado, cai para o comportamento nativo.
 */
const listeners = new Set();
let seq = 0;

export function subscribeFeedback(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(evt) {
  listeners.forEach(fn => fn(evt));
}

function push(type, message, opts = {}) {
  if (!message) return null;
  if (listeners.size === 0) {
    window.alert(message);
    return null;
  }
  const id = ++seq;
  emit({
    kind: 'toast',
    toast: {
      id,
      type,
      message: String(message),
      title: opts.title,
      duration: opts.duration ?? (type === 'error' ? 6000 : 3800),
    },
  });
  return id;
}

export const toast = {
  success: (message, opts) => push('success', message, opts),
  error: (message, opts) => push('error', message, opts),
  warning: (message, opts) => push('warning', message, opts),
  info: (message, opts) => push('info', message, opts),
};

/**
 * @param {string | {title?: string, message: string, confirmLabel?: string, cancelLabel?: string, tone?: 'danger' | 'default'}} opts
 * @returns {Promise<boolean>}
 */
export function confirmDialog(opts) {
  const o = typeof opts === 'string' ? { message: opts } : (opts || {});
  if (listeners.size === 0) {
    return Promise.resolve(window.confirm([o.title, o.message].filter(Boolean).join('\n\n')));
  }
  return new Promise(resolve => {
    emit({ kind: 'confirm', confirm: { ...o, id: ++seq, resolve } });
  });
}
