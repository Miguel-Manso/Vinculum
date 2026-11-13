---
version: alpha
name: Vinculum — Obsidian & Electric Cyan
description: Interface escura, densa e calma para gestão visual de processos, etapas e tarefas por setor.
colors:
  surface-lowest: "#0b0c0f"
  surface-canvas: "#111215"
  surface-low: "#16171b"
  surface-container: "#1b1c21"
  surface-high: "#23242a"
  surface-highest: "#2d2e35"
  primary: "#2fd9f4"
  primary-hover: "#62e4f8"
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
    fontFamily: Outfit
    fontSize: 26px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: -0.025em
  section:
    fontFamily: Outfit
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
  md: 10px
  lg: 14px
  xl: 18px
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
Ferramenta de trabalho diário: densidade alta, leitura rápida e zero ruído. A identidade original (obsidiana + ciano elétrico) foi mantida; o rework padroniza tudo sobre tokens e componentes compartilhados.

## Colors
- Superfícies escalonadas do mais profundo (`surface-lowest`) ao mais elevado (`surface-highest`); elevação é comunicada por superfície + borda, não por sombra pesada.
- `primary` (ciano) é reservado a ações principais, estado ativo e foco. Mint/teal aparecem só em gradientes da marca.
- Estados semânticos sempre em trio: texto (`*-text`), fundo suave (`*-soft`) e borda (`*-border`).
- Todo texto sobre `surface-canvas` atende contraste AA; `text-faint` só para placeholders e metadados não essenciais.

## Typography
Outfit para títulos (display/section), Geist para interface e corpo, Geist Mono para IDs, contagens e datas. Títulos de página usam `display`; títulos de bloco usam `section`; rótulos de grupo usam `eyebrow` em caixa alta.

## Layout
Grid de 4px. Padding de página 32/24/16px (desktop/tablet/mobile). Sidebar de 264px (76px recolhida); no mobile vira gaveta com cabeçalho fixo de 60px e o conteúdo começa abaixo dele. Alvos de toque com no mínimo 40–44px no mobile.

## Elevation & Depth
Sombras `shadow-sm` → `shadow-xl` só para elementos flutuantes (popovers, modais, toasts). Overlays usam `surface-overlay` com blur leve.

## Shapes
Raios: controles `md` (10px), cards `lg` (14px), modais `xl` (18px), pills e badges `full`.

## Components
- Primitivas em `frontend/src/styles/ui.module.css` (botões, campos, cards, modais, filtros, badges, estados, tabelas). As telas **compõem** essas classes via `composes` em vez de redefinir estilos.
- Feedback global em `frontend/src/components/feedback/`: `toast.success|error|warning|info()` e `await confirmDialog({...})` substituem `alert`/`confirm` nativos. Ações destrutivas usam `tone: 'danger'`, título explícito e rótulo do verbo ("Excluir tarefa").
- Modais viram bottom sheet abaixo de 600px; ESC fecha diálogos, seletor de setor e gaveta mobile.

## Do's and Don'ts
- Faça: use tokens (`var(--...)`) para cor, espaço, raio e movimento; animações de 120–280ms com `ease-out`; respeite `prefers-reduced-motion`.
- Faça: mantenha `transform` fora de containers que envolvem modais `position: fixed`.
- Não faça: cores hex soltas em CSS de tela, roxo, fontes fora do trio definido, ou animações chamativas.
