---
version: beta
name: Vinculum — Grafite & Ciano
description: Interface escura em grafite com acento ciano, cabeçalhos em gradiente com onda e superfícies flutuantes de vidro fosco, para gestão visual de processos, etapas e tarefas por setor.
references:
  - rpcs3.net (faixa em gradiente com onda, vidro fosco, barra antes de títulos)
  - Mediator (Plus Jakarta Sans + Inter, botão com preenchimento circular, aurora com estrelas)
colors:
  surface-lowest: "#0a0a0b"
  surface-canvas: "#0e0e10"
  surface-low: "#121214"
  surface-container: "#161618"
  surface-high: "#1d1d20"
  surface-highest: "#26262a"
  surface-sidebar: "#0a0a0b"
  border-default: "rgba(255,255,255,.09)"
  border-glass: "rgba(255,255,255,.12)"
  primary: "#45c4d6"
  primary-hover: "#62d0e0"
  primary-container: "#14b8a6"
  on-primary: "#04262c"
  accent: "#f59e0b"
  text-main: "#ededef"
  text-body: "#c9cacf"
  text-muted: "#9a9ba3"
  text-subtle: "#7c7d86"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
gradients:
  hero: "linear-gradient(-135deg, rgba(10,10,11,.55) 20%, rgba(30,79,110,.72) 70%, rgba(69,196,214,.38) 100%)"
  glass: "linear-gradient(0deg, rgba(255,255,255,.015) 10%, rgba(69,196,214,.07) 100%)"
  brand: "linear-gradient(135deg, #14b8a6, #45c4d6)"
typography:
  display: { fontFamily: Plus Jakarta Sans, fontSize: 24px, fontWeight: 700, letterSpacing: -0.02em }
  section: { fontFamily: Plus Jakarta Sans, fontSize: 17px, fontWeight: 700 }
  body: { fontFamily: Inter, fontSize: 14px, fontWeight: 400, lineHeight: 1.55 }
  numeric: { fontFamily: JetBrains Mono, fontWeight: 500 }
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  xl: 18px
  full: 9999px
---

# Vinculum

## Overview
Ferramenta de trabalho diário com um toque de site de tecnologia. As áreas de trabalho (tabelas, Kanban, formulários) continuam densas e em superfícies sólidas. A personalidade fica no cabeçalho das páginas, no login e nos elementos flutuantes.

## Colors
- Superfícies em grafite neutro, do `surface-lowest` (sidebar, inputs) ao `surface-highest` (hover/ativo). A sidebar tem um brilho ciano sutil no topo.
- `primary` (ciano) marca ação principal, item ativo, foco, abas e filtros ativos. Texto sobre fundo ciano cheio usa sempre `on-primary` (escuro), nunca branco.
- Azul-marinho (`--navy`, `--navy-deep`, `--navy-glow`, `--border-navy`) aparece em detalhes: brilho no fundo do `layout`, reflexo no topo dos cards (`--gradient-surface` + borda superior `border-navy`), sidebar grafite com brilhos marinho/ciano sutis e estrelas caindo ao fundo (`Starfall` em `Sidebar.jsx`: 16 rastros ciano em diagonal + pontos que piscam, atrás do conteúdo; somem com reduced-motion), item ativo da sidebar (`--gradient-navy-cyan`), avatares, base do vidro fosco e faixa de cabeçalho (marinho → ciano).
- `accent` (âmbar) só para destaques pontuais, como "vence em breve". No máximo um CTA (`btnAccent`) por tela.
- Cor de setor aparece como ponto ou barra de progresso fina.
- Estados semânticos sempre em trio: texto (`*-text`), fundo suave (`*-soft`) e borda (`*-border`).

## Typography
Plus Jakarta Sans para títulos (700, tracking negativo), Inter para interface e corpo, JetBrains Mono para IDs e números de KPI. Títulos de página fixos terminam em ponto ("Processos.", "Tarefas."). Títulos de seção têm uma barra ciano de 4px antes do texto (`sectionTitle::before`).

## Layout
Grid de 4px. Padding de página 32/24/16px. Sidebar de 240px (64px recolhida). No mobile ela vira gaveta com cabeçalho fixo de 60px.

### Faixa de cabeçalho (`.page-hero`, global em `index.css`)
Todo cabeçalho de página recebe a classe `page-hero` junto da classe local: `className={`${styles.minimalHeader} page-hero`}`. Ela:
- estende o cabeçalho até as bordas do `main` (margens negativas) com o gradiente `hero`;
- pinta o gradiente no `::before`, recortado na base por **máscara** em forma de onda (duas ondas animadas, a de trás a 50%). Abaixo da onda fica transparente e aparece o fundo real da página. Nunca pinte a onda com uma cor fixa, porque ela destoa do brilho do `layout`;
- desenha estrelas sutis no `::after`;
- animações decorativas (onda, estrelas do cabeçalho e da sidebar) usam `animation-delay: var(--vc-clock)`. `--vc-clock` é atualizado em `App.jsx` (`useAnimationClock`) a cada troca de rota, então elas continuam de onde estavam em vez de reiniciar quando a página remonta;
- reescreve os tokens de texto/borda/hover localmente para leitura sobre o gradiente.
No Dashboard, os KPIs sobem por cima da onda (`margin-top` negativo) como cards de vidro.

## Elevation & Glass
Modais (`Modal.jsx`, `ui.modalCard`), dropdown de setores, chatbot e card do login usam vidro fosco: gradiente `glass` + blur de 16px, borda `border-glass` e `shadow-glass`. Glow ciano (`shadow-glow`) só em botão flutuante do chat, botão de login, card arrastado do Kanban e item ativo da sidebar.

## Components
- **Botão primário** (`ui.btnPrimary`): vazado com borda ciano de 2px. No hover um círculo `::before` se expande do canto e preenche o botão (0,9s, `--ease-fill`). Não sobrescreva `background` nas páginas, porque isso quebra o efeito.
- Primitivas em `frontend/src/styles/ui.module.css`. As telas **compõem** essas classes via `composes`.
- Feedback global em `frontend/src/components/feedback/` (`toast.*`, `confirmDialog`).
- Modais via `frontend/src/components/Modal.jsx` (diálogo no desktop, gaveta abaixo de 640px).
- Login usa `AuroraBackground` em ciano/teal/azul petróleo, com estrelas. A caixa do formulário é escura (grafite), e a marca e o subtítulo são grandes (`brandTitle`/`brandSubtitle`).
- **Logo** (`Logo.jsx`) é SVG inline, com a geometria medida do PNG original (509×361). No cruzamento de cima o anel esquerdo passa por cima; no de baixo, o direito. Cada anel gira devagar (24s), o esquerdo no sentido horário e o direito no anti-horário. O gradiente no traço torna a rotação visível e o recorte do entrelaçamento é máscara fixa. `spin={false}` desliga a animação.
- **Brilho inferior**: `ui.layout::after` (fixo, sem z-index, `mix-blend-mode: screen`) cria um glow ciano/marinho bem suave que "respira" na base da tela. Fica sobre o conteúdo para aparecer também onde cards chegam ao rodapé (Dashboard, Tabela), mas só clareia; sidebar, chat e modais ficam acima.
- **Chat da IA**: escuro (grafite), com ciano só em detalhes (avatar, botão de enviar, mensagem do usuário, foco).
- **Filtros** (`FilterPanel.jsx`, inspirado no AdvancedFilterPanel do Mediator): botão `FilterToggle` com contador, painel recolhível (`FilterPanel` com `FilterField`, `FilterSelect`, `FilterSegment` e `FilterDateRange`) e chips removíveis (`ActiveFilters`). Filtram na hora, sem botão "Aplicar". Usados em Processos (setor, tipo, volume, etapas, ordenação), no Kanban do Fluxo (busca, responsável, prazo, urgência, situação, período e campos do tipo lista) e em Equipe (perfil, setor, período, ordenação). A Tabela Geral mantém os filtros próprios.
- Kanban em `KanbanBoard.jsx`. Colunas com barra ciano no título e contador em pílula. Card arrastado com borda ciano e glow, área de soltura tracejada em ciano.

## Do's and Don'ts
- Faça: use tokens (`var(--...)`) para cor, espaço, raio e movimento; respeite `prefers-reduced-motion` (já desliga onda, estrelas e aurora).
- Faça: mantenha `transform` fora de containers que envolvem modais `position: fixed`.
- Não faça: gradiente, onda ou vidro em tabelas, linhas de lista ou cards do Kanban; cores hex soltas em CSS de tela; mais de um CTA laranja por tela.
