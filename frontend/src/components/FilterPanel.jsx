import styles from './FilterPanel.module.css';

/* ==========================================================================
   Painel de filtros avançados (inspirado no AdvancedFilterPanel do Mediator)

   Peças:
   - <FilterToggle>   botão "Filtros" com contador de filtros ativos
   - <FilterPanel>    painel recolhível: cabeçalho, grade de campos e rodapé
   - <FilterField>    rótulo + controle
   - <FilterSelect>, <FilterSegment>, <FilterDateRange>, <FilterInput>
   - <ActiveFilters>  chips removíveis dos filtros aplicados

   Os filtros aplicam na hora (os dados já estão no cliente), então não há
   botão "Aplicar" — o rodapé mostra quantos resultados sobraram.
   ========================================================================== */

const IconFilter = (p) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconX = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" {...p}>
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconReset = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

export function FilterToggle({ open, onClick, count = 0, label = 'Filtros' }) {
  return (
    <button
      type="button"
      className={`${styles.toggle} ${open ? styles.toggleOpen : ''} ${count > 0 ? styles.toggleActive : ''}`}
      onClick={onClick}
      aria-expanded={open}
    >
      <IconFilter />
      <span>{label}</span>
      {count > 0 && <span className={styles.toggleCount}>{count}</span>}
    </button>
  );
}

export function FilterPanel({
  open,
  onClose,
  title = 'Filtros avançados',
  subtitle = 'Combine parâmetros para refinar a lista.',
  activeCount = 0,
  resultCount,
  totalCount,
  resultNoun = ['resultado', 'resultados'],
  onClear,
  children,
}) {
  const [singular, plural] = resultNoun;

  // Entrada por animação CSS (.panel) — não depende de JS para terminar
  if (!open) return null;

  return (
        <section className={styles.panel} aria-label={title}>
          <header className={styles.panelHeader}>
            <div className={styles.panelHeading}>
              <span className={styles.panelIcon}><IconFilter /></span>
              <div>
                <h3 className={styles.panelTitle}>{title}</h3>
                <p className={styles.panelSubtitle}>{subtitle}</p>
              </div>
            </div>
            <div className={styles.panelHeaderRight}>
              {activeCount > 0 && (
                <span className={styles.activeBadge}>
                  {activeCount} {activeCount === 1 ? 'filtro ativo' : 'filtros ativos'}
                </span>
              )}
              <button type="button" className={styles.iconBtn} onClick={onClose} title="Fechar filtros" aria-label="Fechar filtros">
                <IconX />
              </button>
            </div>
          </header>

          <div className={styles.grid}>{children}</div>

          <footer className={styles.panelFooter}>
            <button type="button" className={styles.clearBtn} onClick={onClear} disabled={activeCount === 0}>
              <IconReset />
              Limpar filtros
            </button>
            {typeof resultCount === 'number' && (
              <span className={styles.resultText}>
                Mostrando <strong>{resultCount}</strong>
                {typeof totalCount === 'number' && <> de <strong>{totalCount}</strong></>}{' '}
                {resultCount === 1 ? singular : plural}
              </span>
            )}
            <button type="button" className={styles.doneBtn} onClick={onClose}>
              Concluir
            </button>
          </footer>
        </section>
  );
}

export function FilterField({ label, icon, wide = false, children }) {
  return (
    <div className={`${styles.field} ${wide ? styles.fieldWide : ''}`}>
      <span className={styles.fieldLabel}>
        {icon && <span className={styles.fieldIcon}>{icon}</span>}
        {label}
      </span>
      {children}
    </div>
  );
}

/** options: [{ value, label }] — value '' representa "todos".
 *  placeholder={null} remove a opção vazia (ex.: ordenação, sempre tem valor). */
export function FilterSelect({ value, onChange, options, placeholder = 'Todos', ariaLabel }) {
  const destacar = placeholder !== null && Boolean(value);
  return (
    <select
      className={`${styles.select} ${destacar ? styles.controlActive : ''}`}
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      {placeholder !== null && <option value="">{placeholder}</option>}
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

/** Botões segmentados para poucas opções. options: [{ value, label, tone? }] */
export function FilterSegment({ value, onChange, options, ariaLabel }) {
  return (
    <div className={styles.segment} role="radiogroup" aria-label={ariaLabel}>
      {options.map(o => {
        const active = value === o.value;
        return (
          <button
            key={o.value || 'all'}
            type="button"
            role="radio"
            aria-checked={active}
            className={`${styles.segmentBtn} ${active ? styles.segmentBtnActive : ''} ${active && o.tone === 'danger' ? styles.segmentBtnDanger : ''}`}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function FilterDateRange({ from, to, onChange }) {
  return (
    <div className={styles.dateRange}>
      <input
        type="date"
        className={`${styles.input} ${from ? styles.controlActive : ''}`}
        value={from}
        max={to || undefined}
        onChange={e => onChange(e.target.value, to)}
        aria-label="Data inicial"
        title="De"
      />
      <span className={styles.dateSep}>até</span>
      <input
        type="date"
        className={`${styles.input} ${to ? styles.controlActive : ''}`}
        value={to}
        min={from || undefined}
        onChange={e => onChange(from, e.target.value)}
        aria-label="Data final"
        title="Até"
      />
    </div>
  );
}

export function FilterInput({ value, onChange, placeholder, type = 'text', ariaLabel }) {
  return (
    <input
      type={type}
      className={`${styles.input} ${value ? styles.controlActive : ''}`}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel}
    />
  );
}

/** chips: [{ id, label, onRemove }] */
export function ActiveFilters({ chips, onClearAll }) {
  if (!chips.length) return null;
  return (
    <div className={styles.chips} aria-label="Filtros aplicados">
      {chips.map(c => (
        <button key={c.id} type="button" className={styles.chip} onClick={c.onRemove} title="Remover filtro">
          <span>{c.label}</span>
          <IconX width="12" height="12" />
        </button>
      ))}
      {chips.length > 1 && (
        <button type="button" className={styles.chipsClear} onClick={onClearAll}>
          Limpar tudo
        </button>
      )}
    </div>
  );
}
