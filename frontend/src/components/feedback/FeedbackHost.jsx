import { useEffect, useRef, useState, useCallback } from 'react';
import { subscribeFeedback } from './feedback';
import styles from './Feedback.module.css';

const ICONS = {
  success: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="8 12.5 11 15.5 16 9.5" />
    </svg>
  ),
  error: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="7.5" x2="12" y2="13" /><line x1="12" y1="16.5" x2="12.01" y2="16.5" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="11" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

function Toast({ toast, onDismiss }) {
  const [saindo, setSaindo] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSaindo(true), toast.duration);
    return () => clearTimeout(t);
  }, [toast.duration]);

  useEffect(() => {
    if (!saindo) return;
    const t = setTimeout(() => onDismiss(toast.id), 200);
    return () => clearTimeout(t);
  }, [saindo, onDismiss, toast.id]);

  return (
    <div
      className={`${styles.toast} ${styles[`toast_${toast.type}`]} ${saindo ? styles.toastLeaving : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <span className={styles.toastIcon}>{ICONS[toast.type]}</span>
      <div className={styles.toastBody}>
        {toast.title && <span className={styles.toastTitle}>{toast.title}</span>}
        <span className={styles.toastMessage}>{toast.message}</span>
      </div>
      <button type="button" className={styles.toastClose} onClick={() => setSaindo(true)} aria-label="Fechar notificação">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
      <span className={styles.toastProgress} style={{ animationDuration: `${toast.duration}ms` }} />
    </div>
  );
}

export default function FeedbackHost() {
  const [toasts, setToasts] = useState([]);
  const [confirmAtual, setConfirmAtual] = useState(null);
  const btnConfirmRef = useRef(null);
  const btnCancelRef = useRef(null);

  useEffect(() => subscribeFeedback(evt => {
    if (evt.kind === 'toast') {
      setToasts(prev => [...prev.slice(-3), evt.toast]);
    } else if (evt.kind === 'confirm') {
      setConfirmAtual(evt.confirm);
    }
  }), []);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const responder = useCallback(valor => {
    setConfirmAtual(atual => {
      atual?.resolve(valor);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!confirmAtual) return;
    const foco = confirmAtual.tone === 'danger' ? btnCancelRef.current : btnConfirmRef.current;
    foco?.focus();
    function onKey(e) {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation();
        e.preventDefault();
        responder(false);
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [confirmAtual, responder]);

  const isDanger = confirmAtual?.tone === 'danger';

  return (
    <>
      <div className={styles.toastRegion} aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>

      {confirmAtual && (
        <div className={styles.confirmOverlay} onMouseDown={() => responder(false)}>
          <div
            className={styles.confirmCard}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="vn-confirm-title"
            onMouseDown={e => e.stopPropagation()}
          >
            <div className={`${styles.confirmIcon} ${isDanger ? styles.confirmIconDanger : ''}`}>
              {isDanger ? ICONS.warning : ICONS.info}
            </div>
            <h2 id="vn-confirm-title" className={styles.confirmTitle}>
              {confirmAtual.title || 'Confirmar ação'}
            </h2>
            {confirmAtual.message && <p className={styles.confirmMessage}>{confirmAtual.message}</p>}
            <div className={styles.confirmActions}>
              <button ref={btnCancelRef} type="button" className={styles.btnCancel} onClick={() => responder(false)}>
                {confirmAtual.cancelLabel || 'Cancelar'}
              </button>
              <button
                ref={btnConfirmRef}
                type="button"
                className={isDanger ? styles.btnDanger : styles.btnConfirm}
                onClick={() => responder(true)}
              >
                {confirmAtual.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
