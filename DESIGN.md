---
version: alpha
name: Vinculum — Grafite & Ciano sóbrio
description: Interface escura, neutra e silenciosa para gestão visual de processos, etapas e tarefas por setor.
colors:
  surface-lowest: "#0a0a0b"
  surface-canvas: "#0e0e10"
  surface-low: "#121214"
  surface-container: "#161618"
  surface-high: "#1d1d20"
  surface-highest: "#26262a"
  primary: "#45c4d6"
  primary-hover: "#62d0e0"
  primary-mint: "#57f1db"
  primary-container: "#14b8a6"
  on-primary: "#00323a"
  text-main: "#f4f6fa"
  text-body: "#d9dce3"
  text-muted: "#9ea7b7"
  text-subtle: "#7f899b"
  text-faint: "#5b6474"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
  info: "#38bdf8"
typography:
  display:
    fontFamily: Geist
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  section:
    fontFamily: Geist
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
  eyebrow:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: 600
    letterSpacing: 0.08em
  numeric:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: 500
spacing:
  base: 4px
  sp-2: 8px
  sp-3: 12px
  sp-4: 16px
  sp-6: 24px
  sp-8: 32px
  page-desktop: 32px
  page-tablet: 24px
  page-mobile: 16px
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 14px
  full: 9999px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.md}"
    height: 38px
  button-secondary:
    backgroundColor: "{colors.surface-high}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    height: 38px
  input:
    backgroundColor: "{colors.surface-low}"
    textColor: "{colors.text-main}"
    rounded: "{rounded.md}"
    height: 40px
  card:
    backgroundColor: "{colors.surface-container}"
    rounded: "{rounded.lg}"
  modal:
    backgroundColor: "{colors.surface-container}"
    rounded: "{rounded.xl}"
---

# Vinculum

## Overview
Ferramenta de trabalho diário: densidade alta, leitura rápida e zero ruído. O tema escuro foi mantido, mas a paleta virou grafite neutro e o ciano ficou reservado à ação principal de cada tela. Sem brilhos, gradientes ou caixas dentro de caixas.

## Colors
- Superfícies escalonadas do mais profundo (`surface-lowest`) ao mais elevado (`surface-highest`); elevação é comunicada por superfície + borda, não por sombra pesada.
- `primary` (ciano) só no botão principal de cada tela e no anel de foco. Item ativo de navegação, filtros e abas usam superfície mais clara + texto branco, não ciano.
- Cor de setor aparece apenas como ponto (7px) ou barra fina de progresso — nunca como fundo, borda ou texto colorido.
- Estados semânticos sempre em trio: texto (`*-text`), fundo suave (`*-soft`) e borda (`*-border`).
- Todo texto sobre `surface-canvas` atende contraste AA; `text-faint` só para placeholders e metadados não essenciais.

## Typography
Geist para tudo (títulos, interface e corpo) e Geist Mono para IDs. Títulos de página usam `display`; títulos de bloco usam `section`. Nada em caixa alta: rótulos, cabeçalhos de tabela e grupos da sidebar ficam em caixa normal, em cinza.

## Layout
Grid de 4px. Padding de página 32/24/16px (desktop/tablet/mobile). Sidebar de 264px (76px recolhida); no mobile vira gaveta com cabeçalho fixo de 60px e o conteúdo começa abaixo dele. Alvos de toque com no mínimo 40–44px no mobile.

## Elevation & Depth
Sombras `shadow-sm` → `shadow-xl` só para elementos flutuantes (popovers, modais, toasts). Overlays usam `surface-overlay` com blur leve.

## Shapes
Raios: controles `md` (10px), cards `lg` (14px), modais `xl` (18px), pills e badges `full`.

## Components
- Primitivas em `frontend/src/styles/ui.module.css` (botões, campos, cards, modais, filtros, badges, estados, tabelas). As telas **compõem** essas classes via `composes` em vez de redefinir estilos.
- Feedback global em `frontend/src/components/feedback/`: `toast.success|error|warning|info()` e `await confirmDialog({...})` substituem `alert`/`confirm` nativos. Ações destrutivas usam `tone: 'danger'`, título explícito e rótulo do verbo ("Excluir tarefa").
- Modais usam `frontend/src/components/Modal.jsx`: diálogo centralizado no desktop e gaveta abaixo de 640px, com alça e fechamento arrastando para baixo. Portal, trava de rolagem, foco preso no modal e devolvido ao fechar; Esc fecha só o modal do topo. A confirmação (`confirmDialog`) usa o mesmo componente.
- Login usa `AuroraBackground` (manchas em ciano/teal/azul petróleo, opacidade baixa, parado com reduced-motion) e `FeatureCards`, que também aparece no estado vazio de Processos. É o único lugar com brilho/fundo animado — não levar para as telas de trabalho.
- Quadro Kanban em `frontend/src/components/KanbanBoard.jsx` (framer-motion): arrastar com mouse (após 5px), toque longo no celular ou teclado (Espaço pega, ← → troca de etapa, Espaço solta, Esc cancela, Enter abre). A página só fornece `columns`, `renderCard`, `renderColumnHeader` e `onMove`; regras de negócio (campos obrigatórios por etapa) ficam na página.

## Do's and Don'ts
- Faça: use tokens (`var(--...)`) para cor, espaço, raio e movimento; animações de 120–280ms com `ease-out`; respeite `prefers-reduced-motion`.
- Faça: mantenha `transform` fora de containers que envolvem modais `position: fixed`.
- Não faça: cores hex soltas em CSS de tela, glow/box-shadow colorido, gradientes, texto em caixa alta, badges com borda, `translateY` no hover de cards, ou animações chamativas.
