import { ListChecks, SquareKanban, Building2 } from 'lucide-react';
import styles from './FeatureCards.module.css';

/* ==========================================================================
   FeatureCards
   Três cartões que explicam o Vinculum, no estilo do bloco "features-2":
   ícone num quadrado sobre uma grade quadriculada que some nas bordas.
   Usado no estado vazio de Processos (primeiros passos). `compact` diminui
   o enfeite para caber em áreas menores.
   ========================================================================== */

export const RECURSOS_VINCULUM = [
  {
    Icon: SquareKanban,
    titulo: 'Fluxo em etapas',
    texto: 'Cada processo vira um quadro com etapas. Arraste as tarefas conforme elas avançam.',
  },
  {
    Icon: ListChecks,
    titulo: 'Campos por etapa',
    texto: 'Defina o que precisa estar preenchido antes de uma tarefa passar para a próxima etapa.',
  },
  {
    Icon: Building2,
    titulo: 'Visão por setor',
    texto: 'Cada equipe vê os próprios processos. A gestão acompanha todos os setores juntos.',
  },
];

export default function FeatureCards({ items = RECURSOS_VINCULUM, compact = false, className = '' }) {
  return (
    <ul className={`${styles.grid} ${compact ? styles.compact : ''} ${className}`}>
      {items.map(({ Icon, titulo, texto }) => (
        <li key={titulo} className={styles.card}>
          <CardDecorator>
            <Icon className={styles.icon} aria-hidden="true" strokeWidth={1.75} />
          </CardDecorator>
          <h3 className={styles.title}>{titulo}</h3>
          <p className={styles.text}>{texto}</p>
        </li>
      ))}
    </ul>
  );
}

function CardDecorator({ children }) {
  return (
    <div className={styles.decorator} aria-hidden="true">
      <div className={styles.decoratorGrid} />
      <div className={styles.decoratorBox}>{children}</div>
    </div>
  );
}
