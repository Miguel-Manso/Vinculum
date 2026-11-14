import { useId } from 'react';
import styles from './Logo.module.css';

/* Geometria medida do PNG original (509 × 361) */
const VB_W = 509;
const VB_H = 361;
const CY = 180;
const CX_LEFT = 178;
const CX_RIGHT = 331;
const R = 138;        // raio no meio do traço
const STROKE = 56;    // espessura do anel
const GAP = 7;        // folga em volta do anel que passa por cima

/**
 * Marca do Vinculum: dois anéis entrelaçados, em SVG inline.
 *
 * Entrelaçamento (igual ao PNG): no cruzamento de CIMA o anel esquerdo passa
 * por cima do direito; no de BAIXO o direito passa por cima do esquerdo.
 * Cada anel tem uma máscara com a faixa do outro anel (alargada pela folga),
 * aplicada só na metade onde ele passa por baixo. Como essa faixa é um
 * círculo completo, o recorte continua certo enquanto os anéis giram.
 *
 * Cada anel gira devagar em torno do próprio centro (esquerdo no sentido
 * horário, direito no anti-horário); o gradiente no traço torna a rotação visível.
 */
function LogoMark({ height, spin = true }) {
  // useId gera ids com ":"; removidos para usar com segurança em url(#...)
  const uid = useId().replace(/:/g, '');
  const ids = {
    maskLeft: `vc-ml-${uid}`,
    maskRight: `vc-mr-${uid}`,
    gradLeft: `vc-gl-${uid}`,
    gradRight: `vc-gr-${uid}`,
  };
  const width = Math.round(height * (VB_W / VB_H));

  return (
    <svg
      className={`${styles.mark} ${spin ? styles.markSpin : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      fill="none"
      role="img"
      aria-label="Vinculum"
    >
      <defs>
        {/* Anel ESQUERDO passa por baixo do direito no cruzamento de baixo */}
        <mask id={ids.maskLeft} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
          <rect width={VB_W} height={VB_H} fill="white" />
          <circle cx={CX_RIGHT} cy={CY} r={R} stroke="black" strokeWidth={STROKE + GAP * 2} fill="none" />
          {/* restaura a metade de cima: lá o esquerdo fica por cima */}
          <rect width={VB_W} height={CY} fill="white" />
        </mask>
        {/* Anel DIREITO passa por baixo do esquerdo no cruzamento de cima */}
        <mask id={ids.maskRight} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
          <rect width={VB_W} height={VB_H} fill="white" />
          <circle cx={CX_LEFT} cy={CY} r={R} stroke="black" strokeWidth={STROKE + GAP * 2} fill="none" />
          {/* restaura a metade de baixo: lá o direito fica por cima */}
          <rect y={CY} width={VB_W} height={VB_H - CY} fill="white" />
        </mask>

        <linearGradient id={ids.gradLeft} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8ff0e6" />
          <stop offset="45%" stopColor="#50c5bd" />
          <stop offset="100%" stopColor="#1f8f9e" />
        </linearGradient>
        <linearGradient id={ids.gradRight} x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7fe3f0" />
          <stop offset="45%" stopColor="#45c4d6" />
          <stop offset="100%" stopColor="#1b6f99" />
        </linearGradient>
      </defs>

      {/* máscara no grupo externo (fixo), rotação no grupo interno */}
      <g mask={`url(#${ids.maskLeft})`}>
        <g className={styles.ringLeft}>
          <circle cx={CX_LEFT} cy={CY} r={R} stroke={`url(#${ids.gradLeft})`} strokeWidth={STROKE} />
        </g>
      </g>
      <g mask={`url(#${ids.maskRight})`}>
        <g className={styles.ringRight}>
          <circle cx={CX_RIGHT} cy={CY} r={R} stroke={`url(#${ids.gradRight})`} strokeWidth={STROKE} />
        </g>
      </g>
    </svg>
  );
}

/**
 * @param {'horizontal' | 'vertical' | 'icon'} variant - Disposição visual
 * @param {number} size - Altura do ícone em pixels
 * @param {boolean} showImage - Exibe a marca (anéis)
 * @param {boolean} showSubtitle - Se exibe subtítulo institucional
 * @param {string} subtitleText - Texto customizado do subtítulo
 * @param {boolean} spin - Anima os anéis (padrão: sim)
 * @param {string} className - Classes CSS adicionais
 */
export default function Logo({
  variant = 'horizontal',
  size,
  showImage = true,
  showSubtitle = false,
  subtitleText = '',
  spin = true,
  className = '',
  titleClassName = '',
  subtitleClassName = '',
}) {
  const defaultSize = variant === 'vertical' ? 68 : variant === 'icon' ? 28 : 32;
  const iconHeight = size || defaultSize;

  const titleSizeClass =
    variant === 'vertical' ? styles.titleLg : iconHeight >= 40 ? styles.titleMd : styles.titleSm;

  const wrapClass = `${styles.logoWrap} ${
    variant === 'vertical'
      ? styles.vertical
      : variant === 'icon'
      ? styles.iconOnly
      : styles.horizontal
  } ${className}`.trim();

  const logoMark = showImage ? <LogoMark height={iconHeight} spin={spin} /> : null;

  if (variant === 'icon' && showImage) {
    return <div className={wrapClass}>{logoMark}</div>;
  }

  return (
    <div className={wrapClass}>
      {logoMark}
      <div className={styles.brandText}>
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${titleSizeClass} ${titleClassName}`.trim()}>Vinculum</span>
        </div>
        {showSubtitle && subtitleText && (
          <span className={`${styles.subtitle} ${subtitleClassName}`.trim()}>{subtitleText}</span>
        )}
      </div>
    </div>
  );
}
