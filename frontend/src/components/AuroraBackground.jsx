import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import styles from './AuroraBackground.module.css';

/* ==========================================================================
   AuroraBackground
   Fundo animado com manchas de luz desfocadas e pontos que cintilam.
   Adaptado do componente "aurora-background" (Tailwind/TS) para JSX +
   CSS Modules, com as cores do Vinculum: ciano da marca, teal e um azul
   petróleo bem escuro, em opacidade baixa para não competir com o conteúdo.

   Fica atrás do conteúdo (position: absolute; inset: 0) — o pai precisa ter
   position: relative. Com prefers-reduced-motion as manchas ficam paradas.
   ========================================================================== */

const DEFAULT_COLORS = [
  'var(--aurora-color1, rgba(69, 196, 214, 0.14))',
  'var(--aurora-color2, rgba(95, 211, 195, 0.10))',
];

function seeded(i) {
  // pseudo-aleatório estável: as estrelas não "pulam" a cada render
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

/**
 * @param {object} props
 * @param {number} [props.starCount=40]
 * @param {[string, string]} [props.gradientColors]   Cores das camadas radiais (aceitam var()).
 * @param {number} [props.pulseDuration=10]           Duração do "respirar" em segundos.
 * @param {string} [props.className]
 */
export default function AuroraBackground({
  starCount = 40,
  gradientColors = DEFAULT_COLORS,
  pulseDuration = 10,
  className = '',
}) {
  const reduce = useReducedMotion();
  const [colorA, colorB] = gradientColors;

  const stars = useMemo(
    () => Array.from({ length: starCount }, (_, i) => ({
      left: seeded(i + 1) * 100,
      top: seeded(i + 101) * 100,
      peak: 0.25 + seeded(i + 201) * 0.5,
      duration: 2 + seeded(i + 301) * 3,
      delay: seeded(i + 401) * 5,
    })),
    [starCount]
  );

  const loop = (duration) => (reduce ? { duration: 0 } : { duration, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' });

  return (
    <div className={`${styles.root} ${className}`} aria-hidden="true">
      {/* Camadas radiais que "respiram" */}
      <div
        className={styles.pulse}
        style={{
          backgroundImage: `radial-gradient(ellipse 60% 50% at 30% 20%, ${colorA} 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 75% 85%, ${colorB} 0%, transparent 70%)`,
          animationDuration: `${pulseDuration}s`,
        }}
      />

      {/* Manchas desfocadas */}
      <motion.div
        className={styles.blobs}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <motion.div
          className={`${styles.blob} ${styles.blobA}`}
          animate={reduce ? undefined : { x: [-50, 50, -50], y: [-20, 20, -20], scale: [1, 1.15, 1] }}
          transition={loop(30)}
        />
        <motion.div
          className={`${styles.blob} ${styles.blobB}`}
          animate={reduce ? undefined : { x: [50, -50, 50], y: [20, -20, 20], scale: [1, 1.2, 1] }}
          transition={loop(40)}
        />
        <motion.div
          className={`${styles.blob} ${styles.blobC}`}
          animate={reduce ? undefined : { x: [20, -20, 20], y: [-30, 30, -30], rotate: [0, 360, 0] }}
          transition={loop(50)}
        />
      </motion.div>

      {/* Pontos que cintilam */}
      {stars.map((s, i) => (
        <motion.span
          key={i}
          className={styles.star}
          style={{ left: `${s.left}%`, top: `${s.top}%` }}
          initial={{ opacity: reduce ? s.peak * 0.6 : 0 }}
          animate={reduce ? undefined : { opacity: [0, s.peak, 0] }}
          transition={reduce ? undefined : { duration: s.duration, repeat: Infinity, delay: s.delay }}
        />
      ))}

      {/* Vinheta: escurece as bordas e mantém o centro legível */}
      <div className={styles.vignette} />
    </div>
  );
}
