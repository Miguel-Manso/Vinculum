import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useDragControls, useReducedMotion } from 'framer-motion';
import useMediaQuery from '../hooks/useMediaQuery';
import styles from './Modal.module.css';

/* ==========================================================================
   Modal responsivo
   Desktop: diálogo centralizado. Celular (< 640px): gaveta que sobe de
   baixo, com alça, e fecha arrastando para baixo — o mesmo comportamento do
   par Dialog/Drawer do shadcn, mas sem Tailwind/Radix, nos tokens do projeto.

   - Renderiza em portal, trava a rolagem da página e devolve o foco ao
     elemento que abriu o modal.
   - Tab fica preso dentro do modal; Esc fecha só o modal do topo.
   - Animação de entrada e saída (respeita prefers-reduced-motion).

   Uso:
     <Modal open={aberto} onClose={() => setAberto(false)} maxWidth={520}>
       <div className={ui.modalHeader}><h2>Título</h2></div>
       ...
     </Modal>
   O primeiro <h2>/<h3> dentro vira o nome acessível do diálogo.
   ========================================================================== */

const MOBILE_QUERY = '(max-width: 639px)';
const CLOSE_OFFSET = 120;   // px arrastados para baixo que fecham a gaveta
const CLOSE_VELOCITY = 500; // ou uma "jogada" rápida

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Pilha de modais abertos: Esc e Tab só agem no do topo
const stack = [];
let scrollLocks = 0;
let savedOverflow = '';

function lockScroll() {
  if (scrollLocks++ === 0) {
    savedOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
}
function unlockScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = savedOverflow;
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}

export default function Modal({
  open,
  onClose,
  children,
  maxWidth = 480,
  role = 'dialog',
  initialFocusRef,
  className = '',
  closeOnOverlay = true,
}) {
  const isMobile = useIsMobile();
  const reduceMotion = useReducedMotion();

  return createPortal(
    <AnimatePresence>
      {open && (
        <ModalShell
          key="modal"
          onClose={onClose}
          isMobile={isMobile}
          reduceMotion={reduceMotion}
          maxWidth={maxWidth}
          role={role}
          initialFocusRef={initialFocusRef}
          className={className}
          closeOnOverlay={closeOnOverlay}
        >
          {children}
        </ModalShell>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ModalShell({ onClose, isMobile, reduceMotion, maxWidth, role, initialFocusRef, className, closeOnOverlay, children }) {
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dragControls = useDragControls();
  const fallbackId = useId();
  const token = useRef({});

  // Pilha, trava de rolagem, foco inicial e devolução do foco
  useLayoutEffect(() => {
    const me = token.current;
    const anterior = document.activeElement;
    stack.push(me);
    lockScroll();

    const panel = panelRef.current;
    const titulo = panel?.querySelector('h1, h2, h3');
    if (titulo) {
      if (!titulo.id) titulo.id = `modal-title-${fallbackId.replace(/:/g, '')}`;
      panel.setAttribute('aria-labelledby', titulo.id);
    }

    const alvo = initialFocusRef?.current
      || panel?.querySelector('[data-autofocus]')
      || (!isMobile && panel?.querySelector('input:not([type="hidden"]):not([disabled]), textarea, select'))
      || panel;
    alvo?.focus({ preventScroll: true });

    return () => {
      const i = stack.indexOf(me);
      if (i > -1) stack.splice(i, 1);
      unlockScroll();
      if (anterior && typeof anterior.focus === 'function' && document.contains(anterior)) {
        anterior.focus({ preventScroll: true });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc fecha / Tab fica preso no modal do topo
  useEffect(() => {
    function onKey(e) {
      if (stack[stack.length - 1] !== token.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (e.key !== 'Tab') return;
      const panel = panelRef.current;
      if (!panel) return;
      const itens = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null || el === document.activeElement);
      if (itens.length === 0) { e.preventDefault(); panel.focus(); return; }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === panel)) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primeiro.focus();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.12 } }
    : isMobile
      ? {
          initial: { y: '100%' },
          animate: { y: 0 },
          exit: { y: '100%' },
          transition: { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 },
        }
      : {
          initial: { opacity: 0, y: 8, scale: 0.98 },
          animate: { opacity: 1, y: 0, scale: 1 },
          exit: { opacity: 0, y: 8, scale: 0.98 },
          transition: { duration: 0.18, ease: [0.2, 0.8, 0.2, 1] },
        };

  return (
    <div className={`${styles.root} ${isMobile ? styles.rootMobile : ''}`}>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onMouseDown={() => { if (closeOnOverlay) onClose?.(); }}
        aria-hidden="true"
      />

      <motion.div
        ref={panelRef}
        role={role}
        aria-modal="true"
        tabIndex={-1}
        className={`${styles.panel} ${isMobile ? styles.drawer : styles.dialog} ${className}`}
        style={isMobile ? undefined : { maxWidth }}
        {...panelMotion}
        // Gaveta: arrasta para baixo pela alça/cabeçalho para fechar
        drag={isMobile && !reduceMotion ? 'y' : false}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.7 }}
        onDragEnd={(_, info) => {
          if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) onClose?.();
        }}
        onPointerDownCapture={e => {
          if (!isMobile || reduceMotion) return;
          // Só começa o arraste pela alça ou pelo cabeçalho (o corpo continua rolando)
          if (e.target.closest('[data-drawer-handle], [class*="modalHeader"], [class*="header"]') && !e.target.closest('button, a, input, select, textarea')) {
            dragControls.start(e);
          }
        }}
      >
        {isMobile && (
          <div className={styles.handleArea} data-drawer-handle aria-hidden="true">
            <span className={styles.handle} />
          </div>
        )}
        {children}
      </motion.div>
    </div>
  );
}
