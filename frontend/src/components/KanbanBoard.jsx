import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, motion, useMotionValue, useReducedMotion } from 'framer-motion';
import styles from './KanbanBoard.module.css';

/* ==========================================================================
   KanbanBoard
   Quadro horizontal com arrastar e soltar por pointer events (mouse, toque
   e caneta) e por teclado. Adaptado de um componente Tailwind/TypeScript
   para o padrão do Vinculum (JSX + CSS Modules + tokens do design system).

   - O card "levanta" para uma camada flutuante que segue o cursor.
   - O espaço que ele deixou fecha e um espaço tracejado abre onde ele vai
     cair; os outros cards deslizam em vez de pular.
   - A posição dentro da coluna não é escolhida pelo usuário (o backend
     ordena por data de criação), então o espaço tracejado aparece onde o
     card realmente vai ficar: veja `getInsertIndex`.
   - Clique abre o card; o arraste só começa depois de alguns pixels (mouse)
     ou de um toque longo (touch), para não brigar com a rolagem.
   - Teclado: foco no card, Espaço pega, ← → trocam de etapa, Espaço solta,
     Esc cancela, Enter abre. Cada passo é anunciado para leitores de tela.
   ========================================================================== */

const DRAG_THRESHOLD = 5;      // px que o mouse precisa andar antes do arraste começar
const LONG_PRESS_MS = 280;     // toque longo para arrastar no celular
const TOUCH_SLOP = 8;          // px de tolerância durante o toque longo
const EDGE = 72;               // px da borda que disparam a rolagem automática
const SCROLL_STEP = 14;

const LIFT_SPRING = { type: 'spring', stiffness: 520, damping: 34, mass: 0.7 };
const FLOW_SPRING = { type: 'spring', stiffness: 420, damping: 36, mass: 0.9 };

function cx(...c) {
  return c.filter(Boolean).join(' ');
}

/**
 * @param {object} props
 * @param {Array<{id: string|number, name: string, tasks: Array<{id: string|number}>}>} props.columns
 * @param {(task, column) => React.ReactNode} props.renderCard         Conteúdo do card. Recebe `{ floating }` como 3º arg.
 * @param {(column, count) => React.ReactNode} [props.renderColumnHeader]
 * @param {(task, fromColumnId, toColumnId) => void} props.onMove      Chamado ao soltar em outra coluna.
 * @param {(task) => void} [props.onOpen]                              Clique / Enter no card.
 * @param {(task, tasksDaColuna) => number} [props.getInsertIndex]     Onde o card entra na coluna de destino. Padrão: no fim.
 * @param {(column) => object} [props.getColumnProps]                  Props extras para o elemento da coluna.
 * @param {(task) => string} [props.getTaskLabel]                      Nome acessível do card.
 * @param {string} [props.emptyLabel]
 * @param {string} [props.label]                                       Nome acessível do quadro.
 */
export default function KanbanBoard({
  columns,
  renderCard,
  renderColumnHeader,
  onMove,
  onOpen,
  getInsertIndex,
  getColumnProps,
  getTaskLabel = t => String(t.titulo ?? t.title ?? t.id),
  emptyLabel = 'Nenhuma tarefa',
  label = 'Quadro de etapas',
  className,
}) {
  const reduceMotion = useReducedMotion();
  const [drag, setDrag] = useState(null);         // { task, fromCol, width, height }
  const [overCol, setOverCol] = useState(null);   // coluna sob o ponteiro durante o arraste
  const [kb, setKb] = useState(null);             // { task, fromCol, col } arraste por teclado
  const [announcement, setAnnouncement] = useState('');
  const [edges, setEdges] = useState({ start: true, end: true });

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const trackRef = useRef(null);
  const colRefs = useRef(new Map());
  const cardRefs = useRef(new Map());
  const pending = useRef(null);      // gesto iniciado que ainda não virou arraste
  const dragRef = useRef(null);
  const overRef = useRef(null);
  const autoScroll = useRef(0);
  const rafRef = useRef(null);
  const suppressClick = useRef(false);

  const colById = useMemo(() => new Map(columns.map(c => [String(c.id), c])), [columns]);

  /* --------------------------------------------------------- bordas */
  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const start = el.scrollLeft < 8;
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
    setEdges(prev => (prev.start === start && prev.end === end ? prev : { start, end }));
  }, []);

  useEffect(() => {
    syncEdges();
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(syncEdges);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncEdges, columns.length]);

  const fade = '24px';
  const mask = edges.start && edges.end
    ? undefined
    : `linear-gradient(to right, transparent 0%, #000 ${edges.start ? '0%' : fade}, #000 ${edges.end ? '100%' : `calc(100% - ${fade})`}, transparent 100%)`;

  /* --------------------------------------------------------- posição de entrada */
  const insertIndexFor = useCallback((task, col) => {
    const others = col.tasks.filter(t => t.id !== task.id);
    if (!getInsertIndex) return others.length;
    const i = getInsertIndex(task, others);
    return Math.max(0, Math.min(others.length, i));
  }, [getInsertIndex]);

  /* --------------------------------------------------------- arraste por ponteiro */
  const columnAt = useCallback(clientX => {
    let inside = null;
    let nearestId = null;
    let nearest = Infinity;
    colRefs.current.forEach((el, id) => {
      const r = el.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right) inside = id;
      const dx = Math.abs(clientX - (r.left + r.width / 2));
      if (dx < nearest) { nearest = dx; nearestId = id; }
    });
    return inside ?? nearestId;
  }, []);

  const beginDrag = useCallback((p, clientX, clientY) => {
    const state = {
      task: p.task,
      fromCol: p.colId,
      width: p.rect.width,
      height: p.rect.height,
      offsetX: p.startX - p.rect.left,
      offsetY: p.startY - p.rect.top,
    };
    x.set(clientX - state.offsetX);
    y.set(clientY - state.offsetY);
    dragRef.current = state;
    overRef.current = p.colId;
    setDrag(state);
    setOverCol(p.colId);
    setKb(null);
    if (navigator.vibrate && p.pointerType === 'touch') navigator.vibrate(8);
  }, [x, y]);

  const finishDrag = useCallback(() => {
    const d = dragRef.current;
    const to = overRef.current;
    dragRef.current = null;
    overRef.current = null;
    autoScroll.current = 0;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setDrag(null);
    setOverCol(null);
    if (d) {
      suppressClick.current = true;
      setTimeout(() => { suppressClick.current = false; }, 0);
      if (to && to !== d.fromCol) {
        const destino = colById.get(to);
        setAnnouncement(`${getTaskLabel(d.task)} movida para ${destino?.name ?? to}.`);
        onMove?.(d.task, d.fromCol, to);
      }
    }
  }, [colById, getTaskLabel, onMove]);

  // Ouvintes globais enquanto há um gesto pendente ou um arraste ativo
  useEffect(() => {
    function onPointerMove(e) {
      const p = pending.current;
      if (p && !dragRef.current) {
        const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
        if (p.pointerType === 'touch') {
          if (dist > TOUCH_SLOP) cancelPending(); // virou rolagem
        } else if (dist > DRAG_THRESHOLD) {
          beginDrag(p, e.clientX, e.clientY);
          pending.current = null;
        }
        return;
      }
      const d = dragRef.current;
      if (!d) return;
      x.set(e.clientX - d.offsetX);
      y.set(e.clientY - d.offsetY);
      const col = columnAt(e.clientX);
      if (col && col !== overRef.current) {
        overRef.current = col;
        setOverCol(col);
      }
      const track = trackRef.current;
      if (track) {
        const r = track.getBoundingClientRect();
        autoScroll.current = e.clientX < r.left + EDGE ? -SCROLL_STEP : e.clientX > r.right - EDGE ? SCROLL_STEP : 0;
      }
    }

    function onPointerUp() {
      cancelPending();
      if (dragRef.current) finishDrag();
    }

    // Enquanto arrasta no toque, impede que o navegador role a página
    function onTouchMove(e) {
      if (dragRef.current) e.preventDefault();
    }

    function cancelPending() {
      if (pending.current?.timer) clearTimeout(pending.current.timer);
      pending.current = null;
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [beginDrag, columnAt, finishDrag, x, y]);

  // Rolagem automática perto das bordas
  useEffect(() => {
    if (!drag) return;
    const tick = () => {
      if (autoScroll.current && trackRef.current) {
        trackRef.current.scrollLeft += autoScroll.current;
        syncEdges();
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [drag, syncEdges]);

  function handlePointerDown(e, task, colId) {
    if (e.button !== 0 || kb) return;
    // Botões e links dentro do card continuam funcionando normalmente
    if (e.target.closest('button, a, input, select, textarea, [data-no-drag]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = { task, colId, rect, startX: e.clientX, startY: e.clientY, pointerType: e.pointerType };
    if (e.pointerType === 'touch') {
      p.timer = setTimeout(() => {
        if (pending.current === p) {
          beginDrag(p, p.startX, p.startY);
          pending.current = null;
        }
      }, LONG_PRESS_MS);
    }
    pending.current = p;
  }

  function handleClick(task) {
    if (suppressClick.current || dragRef.current || kb) return;
    onOpen?.(task);
  }

  /* --------------------------------------------------------- teclado */
  useEffect(() => {
    if (!kb) return;
    const el = cardRefs.current.get(String(kb.task.id));
    if (el && document.activeElement !== el) el.focus({ preventScroll: false });
  }, [kb]);

  function handleKeyDown(e, task, colId) {
    const carrying = kb && kb.task.id === task.id;

    if (e.key === 'Enter' && !carrying) {
      e.preventDefault();
      onOpen?.(task);
      return;
    }

    if (e.key === ' ' || (e.key === 'Enter' && carrying)) {
      e.preventDefault();
      if (carrying) {
        const destino = colById.get(kb.col);
        setKb(null);
        if (kb.col !== kb.fromCol) {
          setAnnouncement(`${getTaskLabel(task)} solta em ${destino?.name ?? kb.col}.`);
          onMove?.(task, kb.fromCol, kb.col);
        } else {
          setAnnouncement(`${getTaskLabel(task)} continua em ${destino?.name ?? kb.col}.`);
        }
      } else {
        setKb({ task, fromCol: colId, col: colId });
        setAnnouncement(`${getTaskLabel(task)} selecionada. Use as setas esquerda e direita para trocar de etapa, Espaço para soltar e Esc para cancelar.`);
      }
      return;
    }

    if (!carrying) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      setKb(null);
      setAnnouncement(`Cancelado. ${getTaskLabel(task)} voltou para onde estava.`);
      return;
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const ids = columns.map(c => String(c.id));
      const i = ids.indexOf(kb.col);
      const j = e.key === 'ArrowLeft' ? i - 1 : i + 1;
      if (j < 0 || j >= ids.length) return;
      setKb({ ...kb, col: ids[j] });
      setAnnouncement(`Sobre a etapa ${columns[j].name}.`);
      colRefs.current.get(ids[j])?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  /* --------------------------------------------------------- render */
  return (
    <div className={cx(styles.board, (drag || kb) && styles.boardActive, className)}>
      <div
        ref={trackRef}
        role="group"
        aria-label={label}
        onScroll={syncEdges}
        className={styles.track}
        style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}
      >
        <LayoutGroup>
          {columns.map(col => {
            const colId = String(col.id);
            const isTarget = drag && overCol === colId && overCol !== drag.fromCol;
            const isOrigin = drag && drag.fromCol === colId;

            // Lista que de fato aparece nesta coluna
            let tasks = col.tasks;
            let placeholderAt = -1;
            if (drag) {
              const idx = tasks.findIndex(t => t.id === drag.task.id);
              tasks = tasks.filter(t => t.id !== drag.task.id);
              if (isTarget) placeholderAt = insertIndexFor(drag.task, col);
              else if (isOrigin && overCol === colId) placeholderAt = idx; // voltando para o lugar
            }
            if (kb) {
              tasks = tasks.filter(t => t.id !== kb.task.id);
              if (kb.col === colId) {
                const at = kb.col === kb.fromCol
                  ? col.tasks.findIndex(t => t.id === kb.task.id)
                  : insertIndexFor(kb.task, col);
                tasks = [...tasks.slice(0, at), kb.task, ...tasks.slice(at)];
              }
            }

            const count = tasks.length + (placeholderAt > -1 && isTarget ? 1 : 0);
            const extra = getColumnProps ? getColumnProps(col) : {};
            const { className: extraClass, ...extraProps } = extra;

            return (
              <section
                key={colId}
                data-kanban-column={colId}
                aria-label={col.name}
                ref={el => { if (el) colRefs.current.set(colId, el); else colRefs.current.delete(colId); }}
                {...extraProps}
                className={cx(styles.column, (isTarget || (kb && kb.col === colId && kb.col !== kb.fromCol)) && styles.columnTarget, extraClass)}
              >
                {renderColumnHeader ? renderColumnHeader(col, count) : (
                  <header className={styles.columnHeader}>
                    <span className={styles.columnTitle}>{col.name}</span>
                    <span className={styles.columnCount}>{count}</span>
                  </header>
                )}

                <div className={styles.list}>
                  {tasks.map((task, i) => {
                    const carrying = kb && kb.task.id === task.id;
                    return (
                      <FragmentWithPlaceholder
                        key={task.id}
                        showPlaceholder={placeholderAt === i}
                        height={drag?.height}
                      >
                        <motion.div
                          layout={!reduceMotion}
                          layoutId={`kanban-${task.id}`}
                          transition={FLOW_SPRING}
                          ref={el => { if (el) cardRefs.current.set(String(task.id), el); else cardRefs.current.delete(String(task.id)); }}
                          data-kanban-card={task.id}
                          tabIndex={0}
                          role="button"
                          aria-roledescription="card arrastável"
                          aria-pressed={carrying || undefined}
                          aria-label={`${getTaskLabel(task)}. Enter para abrir, Espaço para mover.`}
                          className={cx(styles.card, carrying && styles.cardCarrying)}
                          onPointerDown={e => handlePointerDown(e, task, colId)}
                          onClick={() => handleClick(task)}
                          onKeyDown={e => handleKeyDown(e, task, colId)}
                        >
                          {renderCard(task, col, { floating: false })}
                        </motion.div>
                      </FragmentWithPlaceholder>
                    );
                  })}

                  {placeholderAt >= tasks.length && <Placeholder height={drag?.height} />}

                  {tasks.length === 0 && placeholderAt === -1 && (
                    <div className={styles.empty}>{emptyLabel}</div>
                  )}
                </div>
              </section>
            );
          })}
        </LayoutGroup>
      </div>

      <ScrollRail trackRef={trackRef} deps={columns} />

      {/* Card que acompanha o cursor */}
      <AnimatePresence>
        {drag && (
          <motion.div
            key="floating"
            style={{ x, y, width: drag.width }}
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: reduceMotion ? 1 : 1.02, rotate: reduceMotion ? 0 : 1.2 }}
            exit={{ scale: 1, rotate: 0, opacity: 0 }}
            transition={LIFT_SPRING}
            className={styles.floating}
          >
            <div className={cx(styles.card, styles.cardFloating)}>
              {renderCard(drag.task, colById.get(drag.fromCol), { floating: true })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className={styles.srOnly} role="status" aria-live="polite">{announcement}</p>
    </div>
  );
}

function FragmentWithPlaceholder({ showPlaceholder, height, children }) {
  return (
    <>
      {showPlaceholder && <Placeholder height={height} />}
      {children}
    </>
  );
}

function Placeholder({ height }) {
  return (
    <motion.div
      layout
      aria-hidden="true"
      initial={{ opacity: 0, scaleY: 0.7 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0.7 }}
      transition={FLOW_SPRING}
      style={{ height }}
      className={styles.placeholder}
    />
  );
}

/**
 * Barra de rolagem horizontal própria: no macOS a nativa só aparece quando
 * você já está rolando, que é justamente quando não precisa mais dela.
 */
function ScrollRail({ trackRef, deps }) {
  const railRef = useRef(null);
  const [geom, setGeom] = useState({ ratio: 1, offset: 0 });
  const [held, setHeld] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const ratio = el.scrollWidth ? el.clientWidth / el.scrollWidth : 1;
    const max = el.scrollWidth - el.clientWidth;
    setGeom({ ratio, offset: max > 0 ? el.scrollLeft / max : 0 });
  }, [trackRef]);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    sync();
    el.addEventListener('scroll', sync, { passive: true });
    let ro;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(sync);
      ro.observe(el);
      Array.from(el.children).forEach(c => ro.observe(c));
    }
    return () => {
      el.removeEventListener('scroll', sync);
      ro?.disconnect();
    };
  }, [sync, trackRef, deps]);

  const scrollTo = useCallback(clientX => {
    const rail = railRef.current;
    const el = trackRef.current;
    if (!rail || !el) return;
    const r = rail.getBoundingClientRect();
    const thumbW = r.width * geom.ratio;
    const p = (clientX - r.left - thumbW / 2) / (r.width - thumbW);
    el.scrollLeft = Math.max(0, Math.min(1, p)) * (el.scrollWidth - el.clientWidth);
  }, [geom.ratio, trackRef]);

  useEffect(() => {
    if (!held) return;
    const onMove = e => scrollTo(e.clientX);
    const onUp = () => setHeld(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [held, scrollTo]);

  if (geom.ratio >= 0.999) return null;

  return (
    <div
      ref={railRef}
      className={styles.rail}
      onPointerDown={e => { setHeld(true); scrollTo(e.clientX); }}
      aria-hidden="true"
    >
      <div
        className={cx(styles.thumb, held && styles.thumbHeld)}
        style={{ width: `${geom.ratio * 100}%`, marginLeft: `${geom.offset * (100 - geom.ratio * 100)}%` }}
      />
    </div>
  );
}
