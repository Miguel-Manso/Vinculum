import logoImg from '../assets/logo.png';
import styles from './Logo.module.css';

/**
 * Componente flexível de Logo do Vinculum
 * @param {'horizontal' | 'vertical' | 'icon'} variant - Disposição visual
 * @param {number} size - Altura do ícone em pixels
 * @param {boolean} showSubtitle - Se exibe subtítulo institucional
 * @param {string} subtitleText - Texto customizado do subtítulo
 * @param {string} className - Classes CSS adicionais
 */
export default function Logo({
  variant = 'horizontal',
  size,
  showImage = true,
  showSubtitle = false,
  subtitleText = '',
  className = ''
}) {
  // Altura padrão de acordo com a variante
  const defaultSize = variant === 'vertical' ? 68 : variant === 'icon' ? 30 : 34;
  const iconHeight = size || defaultSize;
  // Proporção original da imagem (509 x 361 ≈ 1.41)
  const iconWidth = Math.round(iconHeight * 1.41);

  const titleSizeClass =
    variant === 'vertical' ? styles.titleLg : iconHeight >= 40 ? styles.titleMd : styles.titleSm;

  const wrapClass = `${styles.logoWrap} ${
    variant === 'vertical'
      ? styles.vertical
      : variant === 'icon'
      ? styles.iconOnly
      : styles.horizontal
  } ${className}`.trim();

  const logoMark = showImage ? (
    <img
      src={logoImg}
      alt="Vinculum Logo"
      className={styles.image}
      style={{ height: `${iconHeight}px`, width: `${iconWidth}px` }}
    />
  ) : null;

  if (variant === 'icon' && showImage) {
    return <div className={wrapClass}>{logoMark}</div>;
  }

  return (
    <div className={wrapClass}>
      {logoMark}
      <div className={styles.brandText}>
        <div className={styles.titleRow}>
          <span className={`${styles.title} ${titleSizeClass}`}>VINCULUM</span>
          <span className={styles.glowingDot} title="Online"></span>
        </div>
        {showSubtitle && subtitleText && <span className={styles.subtitle}>{subtitleText}</span>}
      </div>
    </div>
  );
}
