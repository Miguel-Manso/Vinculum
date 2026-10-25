import React from 'react';

/**
 * Lista de ícones disponíveis para seleção pelo usuário
 */
export const OPCOES_ICONES = [
  { id: 'kanban', rotulo: 'Kanban / Fluxo' },
  { id: 'users', rotulo: 'RH / Pessoas' },
  { id: 'code', rotulo: 'Tecnologia / TI' },
  { id: 'dollar-sign', rotulo: 'Financeiro' },
  { id: 'truck', rotulo: 'Logística & Estoque' },
  { id: 'file-text', rotulo: 'Contratos & Jurídico' },
  { id: 'trending-up', rotulo: 'Comercial & Vendas' },
  { id: 'check-circle', rotulo: 'Qualidade & Auditoria' },
  { id: 'settings', rotulo: 'Operações & Suporte' },
  { id: 'rocket', rotulo: 'Projetos & Lançamento' },
  { id: 'briefcase', rotulo: 'Administrativo' },
  { id: 'folder', rotulo: 'Geral / Pastas' },
];

/**
 * Mapeamento semântico inteligente de ícone a partir do nome ou setor
 */
export function getProcessIconKey(processo) {
  if (processo?.icone) return processo.icone;

  const nome = (processo?.nome || '').toLowerCase();
  const setorNome = (processo?.setor_nome || '').toLowerCase();
  const setorIcone = processo?.setor_icone;

  // 1. Identificação contextual por termos do processo
  if (/rh|onboarding|colaborador|admiss|contrat|recrut|pessoa|equipe|funci/i.test(nome)) return 'users';
  if (/dev|código|sprint|software|tecnolog|ti|bug|program|api|sistema/i.test(nome)) return 'code';
  if (/reembolso|despesa|financ|fatur|pagament|conta|caixa|fiscal|cobran/i.test(nome)) return 'dollar-sign';
  if (/expedi|pedido|entrega|rastre|logíst|estoqu|transp|mercador|carga/i.test(nome)) return 'truck';
  if (/contrato|juríd|complian|assinatur|legal|norma|regulament/i.test(nome)) return 'file-text';
  if (/venda|comercial|crm|cliente|lead|propost|negocia/i.test(nome)) return 'trending-up';
  if (/auditor|qualidade|inspe|valida|certific/i.test(nome)) return 'check-circle';
  if (/opera|manuten|suporte|chamado|config|infra/i.test(nome)) return 'settings';
  if (/lançamento|projeto|startup|inova|produto/i.test(nome)) return 'rocket';

  // 2. Fallback para ícone configurado no setor
  if (setorIcone) return setorIcone;

  // 3. Identificação contextual pelo setor
  if (/rh|recursos humanos/i.test(setorNome)) return 'users';
  if (/tecnologia|ti|dev/i.test(setorNome)) return 'code';
  if (/financeiro|compras|contábil/i.test(setorNome)) return 'dollar-sign';
  if (/logística|operações/i.test(setorNome)) return 'truck';
  if (/jurídico|compliance/i.test(setorNome)) return 'file-text';
  if (/comercial|vendas/i.test(setorNome)) return 'trending-up';

  return 'kanban';
}

/**
 * Componente de renderização de ícone SVG vetorial minimalista
 */
export default function ProcessIcon({
  processo = null,
  iconKey = null,
  name = '',
  size = 16,
  strokeWidth = 2,
  className = '',
  style = {},
}) {
  let resolvedKey = iconKey;

  if (!resolvedKey) {
    if (processo) {
      resolvedKey = getProcessIconKey(processo);
    } else if (name) {
      resolvedKey = getProcessIconKey({ nome: name });
    } else {
      resolvedKey = 'kanban';
    }
  }

  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    style,
  };

  switch (resolvedKey) {
    case 'users':
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );

    case 'code':
      return (
        <svg {...props}>
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );

    case 'dollar-sign':
      return (
        <svg {...props}>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      );

    case 'truck':
      return (
        <svg {...props}>
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      );

    case 'file-text':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );

    case 'trending-up':
      return (
        <svg {...props}>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      );

    case 'check-circle':
      return (
        <svg {...props}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );

    case 'settings':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );

    case 'rocket':
      return (
        <svg {...props}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      );

    case 'briefcase':
      return (
        <svg {...props}>
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );

    case 'folder':
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );

    case 'kanban':
    default:
      return (
        <svg {...props}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </svg>
      );
  }
}
