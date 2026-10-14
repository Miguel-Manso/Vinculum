const { getPool } = require('../config/db');

// ============================================================================
// BASE DE CONHECIMENTO COMPLETA DO VINCULUM (Linguagem Amigável e Palatável)
// ============================================================================
const CONHECIMENTO_SISTEMA = {
  visaoGeral: `O **Vinculum** é uma plataforma visual pensada para descomplicar a rotina de Pequenas e Médias Empresas (PMEs)! 🌟

Nosso propósito é substituir o caos de anotações soltas, planilhas avulsas e mensagens perdidas de WhatsApp por fluxos de trabalho visuais, organizados e transparentes.

Benefícios práticos no dia a dia da sua equipe:
• **Clareza total**: Todos sabem quem é o responsável por cada entrega e qual é o prazo final.
• **Fim dos gargalos**: Identifique em segundos onde o trabalho está travado antes que vire problema.
• **Histórico confiável**: Cada avanço de etapa fica registrado com data, hora e responsável.
• **Decisões com base em dados**: Indicadores em tempo real para acompanhar a evolução do negócio.`,

  dashboard: `O **Dashboard** é o seu painel de controle gerencial no Vinculum! 🚀

Ele resume a saúde operacional da sua empresa em uma única tela:
• **Indicadores Principais (KPIs)**: Acompanhe o total de processos ativos, tarefas pendentes no momento, atividades concluídas no mês e alertas de tarefas atrasadas.
• **Produtividade em Gráficos**: Acompanhe o ritmo de entregas da equipe e a taxa de conclusão de demandas.
• **Atalhos Rápidos**: Acesse diretamente as últimas tarefas movimentadas e os processos mais utilizados sem precisar procurar nos menus.

💡 *Dica:* Dedique 2 minutos no início do dia para conferir as tarefas atrasadas e priorizar as ações com a equipe!`,

  processos: `A aba **Processos** é onde você encontra e organiza todos os fluxos de trabalho da sua empresa! 📂

Aqui você tem controle total sobre o andamento dos departamentos:
• **Visualização em Cartões**: Cada processo (como *Vendas*, *Compras*, *Atendimento*, *Produção*) é apresentado em um cartão com o total de tarefas ativas e etapas configuradas.
• **Criar Novos Processos**: Basta clicar no botão **"Novo Processo"**, definir um nome e uma breve descrição. O Vinculum já inicia com as etapas principais (*A Fazer*, *Em Andamento*, *Concluído*) para você começar na hora!
• **Acessar o Quadro Kanban**: Clique em qualquer cartão para abrir o fluxo visual e acompanhar as movimentações da equipe em tempo real.
• **Gerenciar e Ajustar**: Você pode renomear, atualizar descrições ou arquivar processos conforme as rotinas da sua empresa mudam.

💡 *Dica:* Precisa de sugestões de etapas para estruturar a área de vendas, compras ou suporte? É só me perguntar que posso sugerir o fluxo ideal!`,

  fluxo: `A tela de **Fluxo** é o coração visual do Vinculum! É aqui que o trabalho da equipe ganha vida em um quadro Kanban interativo. 📋

Principais recursos visuais:
• **Arrastar e Soltar (Drag & Drop)**: Basta clicar e segurar em um cartão de tarefa para movê-lo de uma coluna para outra (por exemplo, de *A Fazer* para *Em Andamento*).
• **Reordenar Colunas**: Você pode arrastar o próprio cabeçalho das etapas horizontalmente para ajustar a sequência do fluxo de trabalho.
• **Criar Novas Tarefas**: No botão **"Nova Tarefa"**, você cadastra atividades com título, responsável, prazo e campos personalizados.
• **Personalizar Etapas**: Use o botão **"Nova Etapa"** para adicionar fases ao fluxo e **"Campos da Tarefa"** para criar campos personalizados (como valores em R$, datas ou caixas de seleção).
• **Detalhe da Tarefa**: Clicar em qualquer cartão abre a ficha detalhada da atividade com histórico de movimentações.

💡 *Dica:* Cada mudança de coluna fica salva no histórico de auditoria automaticamente, permitindo acompanhar o progresso sem reuniões longas!`,

  tarefa: `A tela de **Tarefa** é a ficha completa e detalhada de cada atividade no Vinculum! 📝

O que você pode acompanhar e gerenciar aqui:
• **Edição Instantânea**: Altere título, responsável, prazo de entrega, descrição e valores de campos personalizados a qualquer momento.
• **Mudança de Etapa**: Um seletor dedicado permite avançar ou retornar a tarefa de fase, validando os dados necessários e atualizando na hora sem recarregar a tela.
• **Linha do Tempo (Auditoria)**: Histórico completo que mostra quem movimentou a tarefa, a data, a hora e de qual etapa ela veio.
• **Segurança**: Opção de excluir a tarefa com confirmação caso tenha sido criada por engano.

💡 *Dica:* Ter um responsável claro e um prazo definido em cada tarefa reduz em até 80% o atraso em pequenas e médias empresas!`,

  tabela: `A tela de **Tabela** oferece uma visão consolidada estilo planilha de todas as tarefas da organização! 📊

Ela é perfeita para quem precisa de visão rápida, relatórios ou acompanhamento de prazos:
• **Busca Instantânea**: Encontre qualquer atividade digitando palavras do título, cliente, processo ou valores de campos customizados.
• **Filtros Estratégicos**: Filtre tarefas por processo, etapa, situação (*Pendente*, *Concluída* ou *Atrasada*) e prazos (*Vencendo hoje*, *Com prazo*, *Sem prazo*).
• **Colunas Dinâmicas**: Ao filtrar por um processo específico, a tabela exibe automaticamente as colunas dos campos personalizados daquele fluxo.
• **Ordenação por Coluna**: Clique no cabeçalho de qualquer coluna (como *Prazo*, *Tarefa* ou *Etapa*) para ordenar em ordem crescente ou decrescente (↑ / ↓).
• **Exportar para Excel/CSV**: Com um clique no botão **"Exportar CSV"**, você baixa a planilha completa pronta para relatórios de diretoria ou reuniões de alinhamento.

💡 *Dica:* Experimente filtrar pelas tarefas com situação *Atrasada* para resolver rapidamente as prioridades críticas da semana!`,

  usuarios: `A tela de **Usuários** permite gerenciar a equipe e definir quem acessa a plataforma! 👥

Recursos de equipe:
• **Gestão de Colaboradores**: Visualize nome, e-mail e perfil de acesso de todos os membros cadastrados no sistema.
• **Perfis de Acesso**: Suporta perfis como *Administrador* (que gerencia fluxos e configurações) e *Usuário Comum* (focado na execução das tarefas).
• **Atribuição no Kanban**: Todos os colaboradores cadastrados aparecem prontos para serem selecionados como responsáveis pelas tarefas do dia a dia.`,

  camposPersonalizados: `Os **Campos Personalizados** permitem adaptar o Vinculum à realidade única do seu negócio! 🛠️

Você pode criar campos específicos para cada processo:
• 📝 **Texto**: Códigos de pedidos, nomes de clientes ou identificadores.
• 📄 **Área de Texto**: Escopos de serviço, observações detalhadas ou briefings.
• 💰 **Moeda (R$)**: Valores orçados, custos ou ticket de faturamento em Real brasileiro.
• 🔢 **Números**: Horas estimadas, quantidades de produtos ou pontuação.
• 📅 **Datas**: Previsões de entrega, vencimentos ou agendamentos.
• 🏷️ **Seleção (Select)**: Menus suspensos com opções pré-configuradas.
• ☑️ **Caixas de Seleção (Checkbox)**: Confirmações como *"Documentação Validada"*.

💡 Você pode inclusive configurar para que um campo seja obrigatório somente quando a tarefa entrar em uma etapa específica (como exigir a Nota Fiscal ao mover para *Concluído*)!`,

  boasPraticasPME: `Aqui estão 5 práticas essenciais para transformar a gestão de processos na sua empresa: 💡

1. 🎯 **Mantenha Fluxos Curtos (4 a 6 etapas)**:
   Muitas etapas geram burocracia e desatenção. Um fluxo enxuto e eficaz costuma ser: *Entrada ➔ Triagem ➔ Em Andamento ➔ Revisão ➔ Concluído*.

2. 👤 **Um Único Responsável por Tarefa**:
   Sempre defina quem é o dono de cada cartão. Tarefa com múltiplos responsáveis acaba ficando sem dono.

3. ⚠️ **Atenção aos Gargalos Visuais**:
   Se uma coluna começar a acumular cartões, investigue: o gargalo pode ser sobrecarga de alguém, falta de aprovação ou processo mal definido.

4. ⏱️ **Alinhamento Semanal de 15 Minutos**:
   Faça uma reunião rápida em frente ao quadro Kanban para desobstruir tarefas paradas e alinhar prioridades da semana.

5. 📊 **Acompanhamento Ativo de Prazos**:
   Use o filtro de tarefas *Atrasadas* na tela Tabela para agir preventivamente antes que o cliente precise cobrar.`
};

// Busca dados reais do banco filtrando pelos setores do usuário logado
async function obterContextoProcessos(usuario) {
  try {
    const pool = await getPool();
    const isAdmin = usuario?.perfil === 'admin' || usuario?.email === 'admin@vinculum.com';
    const usuarioId = usuario?.id;

    let procQuery = `
      SELECT p.id, p.nome, p.descricao, s.nome AS setor_nome,
             (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS total_etapas,
             (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS total_tarefas
      FROM Processos p
      LEFT JOIN Setores s ON p.setor_id = s.id
    `;

    const reqProc = pool.request();
    if (usuario && !isAdmin) {
      procQuery += ` WHERE p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)`;
      reqProc.input('usuario_id', sql.Int, usuarioId);
    }
    procQuery += ` ORDER BY s.nome, p.nome`;

    const resProcessos = await reqProc.query(procQuery);

    let etapaQuery = `
      SELECT e.id, e.nome, e.ordem, e.processo_id, p.nome AS processo_nome,
             (SELECT COUNT(*) FROM Tarefas t WHERE t.etapa_id = e.id) AS total_tarefas
      FROM Etapas e
      JOIN Processos p ON e.processo_id = p.id
    `;
    const reqEtapas = pool.request();
    if (usuario && !isAdmin) {
      etapaQuery += ` WHERE p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)`;
      reqEtapas.input('usuario_id', sql.Int, usuarioId);
    }
    etapaQuery += ` ORDER BY p.nome, e.ordem`;

    const resEtapas = await reqEtapas.query(etapaQuery);

    const processos = resProcessos.recordset || [];
    const etapas = resEtapas.recordset || [];

    if (processos.length === 0) {
      return 'Nenhum processo cadastrado ou acessível nos seus setores no momento. O usuário pode criar um processo acessando a tela de Processos no menu lateral e clicando em "Novo Processo".';
    }

    let resumo = 'PROCESSOS CADASTRADOS NOS SEUS SETORES:\n';
    processos.forEach(p => {
      const etapasDoProc = etapas.filter(e => e.processo_id === p.id);
      resumo += `\n• Processo: "${p.nome}" (ID ${p.id}${p.setor_nome ? ` | Setor: ${p.setor_nome}` : ''})\n`;
      if (p.descricao) resumo += `  Descrição: ${p.descricao}\n`;
      resumo += `  Total de tarefas: ${p.total_tarefas}\n`;
      if (etapasDoProc.length > 0) {
        resumo += `  Etapas: ${etapasDoProc.map(e => `[${e.ordem}º ${e.nome} (${e.total_tarefas} tarefas)]`).join(' ➔ ')}\n`;
      }
    });

    return resumo;
  } catch (err) {
    return 'Banco de dados temporariamente inacessível para leitura de processos.';
  }
}

// ============================================================================
// PROMPT CLASSIFICADOR DE INTENÇÕES E MAPEAMENTO DE RESPOSTAS
// ============================================================================
const DETECTAR_NICHO_TOPICO = `
VOCÊ É UM CLASSIFICADOR DE INTENÇÕES DA PLATAFORMA VINCULUM.
RETORNE APENAS UMA DAS SEGUINTES PALAVRAS-CHAVE (sem markdown, sem explicação, sem aspas):

- 'dashboard' — pergunta sobre o que é / como usar o DASHBOARD (painel, KPIs, indicadores, resumo gerencial).
- 'processos' — pergunta sobre a tela de PROCESSOS (criar, editar, excluir fluxo, cards, menu lateral).
- 'fluxo' — pergunta sobre o FLUXO / QUADRO KANBAN (arrastar soltar, mover tarefas, reordenar colunas, drag&drop).
- 'tarefa' — pergunta sobre a tela de DETALHE DA TAREFA (editar, prazo, responsável, histórico, movimentação).
- 'tabela' — pergunta sobre a tela TABELA (filtros, ordenação, busca, exportar CSV, planilha).
- 'usuarios' — pergunta sobre a tela USUÁRIOS (cadastrar, perfis, equipe, acesso).
- 'campos' — pergunta sobre CAMPOS PERSONALIZADOS (moeda R$, datas, select, checkbox).
- 'boas_praticas' — pergunta sobre boas práticas, gargalos, produtividade, WIP, número de etapas, PMEs.
- 'sobre' — pergunta "o que é", "como funciona", "o que o site faz" sobre o VINCULUM como um todo.
- 'fluxo_ideal_<NICHO>' — pergunta "sugira um fluxo ideal / melhores etapas / como organizar" para um nicho:
    receba, mercadoria, almoxarifado, estoque, restaurante, cozinha, sopa, confeitaria, padaria,
    marcenaria, moveis, clinica, saude, vendas, comercial, compras, suprimentos, atendimento, suporte,
    oficina, rh, recrutamento, financeiro, contas, ti, software, imobiliaria, pc, hardware,
    celular, estetica_automotiva, salon, barbearia, advocacia, contabilidade, petshop, grafica,
    eventos, construcao, energia_solar, logistica, marketing.
- 'faq_acao_<acao>' — perguntas passo a passo de como FAZER algo: criar, editar, renomear, excluir,
    mover, arrastar, reordenar, adicionar campo, definir prazo, atribuir responsável, filtrar, exportar.
- 'saudacao' — oi, olá, bom dia, quem é você, qual seu nome.

ENTRE NA LÓGICA DE NÚMEROS:
1. Se a mensagem é saudação, retorne 'saudacao'.
2. Se a pergunta é "fluxo ideal", "melhor fluxo", "sugira etapas", "como estruturar", "como organizar o processo"
   → determine o NICHO e retorne 'fluxo_ideal_<NICHO>'.
3. Se a pergunta pede as TAREFAS por etapa do fluxo → retorne 'faqs_tarefas_por_etapa'.
4. Se é sobre tela: retorne a palavra da tela (dashboard/processos/fluxo/tarefa/tabela/usuarios/campos).
5. Se é sobre boas práticas: retorne 'boas_praticas'.
6. Se é sobre como fazer uma ação prática: retorne 'faq_acao_<acao>'.
7. Se é "sobre o Vinculum" em geral: retorne 'sobre'.
8. Caso contrário: retorne 'neutro'.
`;

const FAQ_RESPOSTAS = {
  dashboard: CONHECIMENTO_SISTEMA.dashboard,
  processos: CONHECIMENTO_SISTEMA.processos,
  fluxo: CONHECIMENTO_SISTEMA.fluxo,
  tarefa: CONHECIMENTO_SISTEMA.tarefa,
  tabela: CONHECIMENTO_SISTEMA.tabela,
  usuarios: CONHECIMENTO_SISTEMA.usuarios,
  campos: CONHECIMENTO_SISTEMA.camposPersonalizados,
  boas_praticas: CONHECIMENTO_SISTEMA.boasPraticasPME,
  sobre: CONHECIMENTO_SISTEMA.visaoGeral
};

// ============================================================================
// CLASSIFICADOR DE NICHOS E CONTEXTOS OPERACIONAIS
// ============================================================================
function detectarNichoTopico(texto) {
  const p = (texto || '').toLowerCase();

  // 1. Recebimento de Mercadorias / Almoxarifado / Estoque
  if (
    p.includes('recebimento') ||
    p.includes('mercadoria') ||
    p.includes('mercadorias') ||
    p.includes('almoxarifado') ||
    p.includes('conferência de carga') ||
    p.includes('conferencia de carga') ||
    p.includes('descarga') ||
    p.includes('doca') ||
    p.includes('entrada de nota') ||
    p.includes('entrada de nf') ||
    (p.includes('estoque') && (p.includes('receber') || p.includes('entrada') || p.includes('conferir') || p.includes('armazém')))
  ) {
    return 'recebimento_mercadoria';
  }

  // 2. Restaurante / Cozinha / Sopa / Gastronomia
  if (
    p.includes('sopa') ||
    p.includes('restaurante') ||
    p.includes('cozinha') ||
    p.includes('culinaria') ||
    p.includes('culinária') ||
    p.includes('comida') ||
    p.includes('prato') ||
    p.includes('refeição') ||
    p.includes('refeicao') ||
    p.includes('marmita') ||
    p.includes('buffet') ||
    p.includes('chef')
  ) {
    return 'restaurante_sopa';
  }

  // 3. Confeitaria / Padaria / Bolos / Doces
  if (p.includes('confeitaria') || p.includes('padaria') || p.includes('bolo') || p.includes('doce')) {
    return 'confeitaria_padaria';
  }

  // 4. Marcenaria / Móveis Planejados / Fabricação sob medida
  if (p.includes('marcenaria') || p.includes('móvel') || p.includes('moveis') || p.includes('marceneiro') || p.includes('madeira') || p.includes('mdf')) {
    return 'marcenaria_moveis';
  }

  // 5. Clínica Médica / Consultório / Odonto / Saúde
  if (p.includes('clinica') || p.includes('clínica') || p.includes('médico') || p.includes('medico') || p.includes('consultorio') || p.includes('consultório') || p.includes('paciente') || p.includes('odonto')) {
    return 'clinica_saude';
  }

  // 6. Vendas / Comercial / CRM
  if (p.includes('venda') || p.includes('vendas') || p.includes('comercial') || p.includes('proposta') || p.includes('prospeccao') || p.includes('prospecção') || p.includes('lead')) {
    return 'vendas_comercial';
  }

  // 7. Compras / Suprimentos / Cotação
  if (p.includes('compra') || p.includes('compras') || p.includes('suprimento') || p.includes('suprimentos') || p.includes('cotação') || p.includes('cotacao')) {
    return 'compras_suprimentos';
  }

    // 8. Atendimento / Suporte / SAC / Helpdesk
  if (
    p.includes('atendimento ao cliente') ||
    p.includes('suporte ao cliente') ||
    p.includes('suporte técnico') ||
    p.includes('suporte tecnico') ||
    p.includes('sac') ||
    p.includes('chamado') ||
    p.includes('chamados') ||
    p.includes('helpdesk') ||
    p.includes('ticket') ||
    p.includes('tickets') ||
    (p.includes('atendimento') && !p.includes('médico') && !p.includes('medico') && !p.includes('odontológico')) ||
    (p.includes('suporte') && !p.includes('suporte a ') && !p.includes('suporte de ') && !p.includes('suporte para radiador'))
  ) {
    return 'atendimento_suporte';
  }

// 9. Oficina Mecânica / Reparos / Auto Peças
  if (p.includes('oficina') || p.includes('mecanica') || p.includes('mecânica') || p.includes('reparo') || p.includes('conserto') || p.includes('carro') || p.includes('veículo') || p.includes('veiculo')) {
    return 'oficina_mecanica';
  }

  // 10. RH / Recrutamento e Seleção / Admissão
  if (/\brh\b/i.test(p) || p.includes('recursos humanos') || p.includes('recrutamento') || p.includes('seleção') || p.includes('selecao') || p.includes('vaga') || p.includes('candidato') || p.includes('admissão') || p.includes('admissao') || p.includes('contratação') || p.includes('contratacao') || p.includes('currículo') || p.includes('curriculo')) {
    return 'rh_recrutamento';
  }

  // 11. Financeiro / Contas a Pagar / Receber / Cobrança
  if (p.includes('financeiro') || p.includes('contas a pagar') || p.includes('contas a receber') || p.includes('faturamento') || p.includes('cobrança') || p.includes('cobranca') || p.includes('inadimplência') || p.includes('inadimplencia') || p.includes('tesouraria') || p.includes('fluxo de caixa') || p.includes('boleto')) {
    return 'financeiro_contas';
  }

  // 12. TI / Desenvolvimento de Software / Bugs
  if (p.includes('desenvolvimento') || p.includes('software') || p.includes('programação') || p.includes('programacao') || p.includes('bug') || p.includes('sprint') || p.includes('deploy') || /\bti\b/i.test(p) || p.includes('tecnologia')) {
    return 'ti_software';
  }

  // 13. Imobiliária / Locação de Imóveis / Corretores
  if (p.includes('imobiliaria') || p.includes('imobiliária') || p.includes('imóvel') || p.includes('imovel') || p.includes('imóveis') || p.includes('imoveis') || p.includes('locação') || p.includes('locacao') || p.includes('aluguel') || p.includes('inquilino') || p.includes('corretor')) {
    return 'imobiliaria';
  }

  // 14. Montagem de PC / Hardware / Computadores / Informática
  if (
    p.includes('montar pc') ||
    p.includes('montagem de pc') ||
    p.includes('montagem de computador') ||
    p.includes('montar computador') ||
    p.includes('pc gamer') ||
    (/\bpc\b/i.test(p) && (p.includes('montar') || p.includes('montagem') || p.includes('peça') || p.includes('peca') || p.includes('setup') || p.includes('placa'))) ||
    p.includes('hardware') ||
    p.includes('placa de vídeo') ||
    p.includes('placa de video') ||
    p.includes('processador') ||
    p.includes('gabinete') ||
    p.includes('upgrade de pc') ||
    p.includes('bancada de pc')
  ) {
    return 'montagem_pc_hardware';
  }

  // 15. Manutenção de Celulares / Smartphones / Tablets
  if (p.includes('celular') || p.includes('smartphone') || p.includes('iphone') || p.includes('troca de tela') || p.includes('conserto de celular') || p.includes('bateria de celular')) {
    return 'manutencao_celulares';
  }

  // 16. Estética Automotiva / Lava Rápido / Polimento
  if (p.includes('estetica automotiva') || p.includes('estética automotiva') || p.includes('polimento') || p.includes('vitrificação') || p.includes('vitrificacao') || p.includes('lava rápido') || p.includes('lava rapido') || p.includes('lavagem detalhada')) {
    return 'estetica_automotiva';
  }

  // 17. Salão de Beleza / Barbearia / Estética
  if (p.includes('salão de beleza') || p.includes('salao de beleza') || p.includes('barbearia') || p.includes('barbeiro') || p.includes('cabeleireiro') || p.includes('cabelereiro') || p.includes('corte de cabelo') || p.includes('manicure')) {
    return 'salao_barbearia';
  }

  // 18. Advocacia / Jurídico
  if (p.includes('advocacia') || p.includes('advogado') || p.includes('jurídico') || p.includes('juridico') || p.includes('processo judicial') || p.includes('ação judicial')) {
    return 'advocacia_juridico';
  }


// 19. Contabilidade / Fiscal
  if (p.includes('contabilidade') || p.includes('contador') || p.includes('contábil') || p.includes('contabil') || p.includes('fechamento fiscal') || p.includes('declaração de ir')) {
    return 'contabilidade_fiscal';
  }

  // 20. Pet Shop / Veterinária / Banho e Tosa
  if (p.includes('pet shop') || p.includes('petshop') || p.includes('veterinário') || p.includes('veterinaria') || p.includes('veterinária') || p.includes('banho e tosa')) {
    return 'petshop_veterinaria';
  }

  // 21. Gráfica / Impressão / Comunicação Visual
  if (p.includes('gráfica') || p.includes('grafica') || p.includes('impressão') || p.includes('comunicação visual') || p.includes('banners') || p.includes('brindes')) {
    return 'grafica_impressao';
  }

  // 22. Eventos / Buffet / Cerimonial
  if (p.includes('buffet') || p.includes('cerimonial') || p.includes('casamento') || (p.includes('festa') && p.includes('evento'))) {
    return 'eventos_buffet';
  }

  // 23. Construção Civil / Obras / Reformas
  if (p.includes('obra') || p.includes('reforma') || p.includes('construção civil') || p.includes('construcao civil') || p.includes('pedreiro')) {
    return 'construcao_obras';
  }

  // 24. Energia Solar / Instalação Fotovoltaica
  if (p.includes('energia solar') || p.includes('painel solar') || p.includes('fotovoltaica') || p.includes('inversor')) {
    return 'energia_solar';
  }

  // 25. Logística / Transporte de Cargas / Fretes
  if (p.includes('logística') || p.includes('logistica') || p.includes('transporte de carga') || p.includes('frete') || p.includes('expedição de cargas')) {
    return 'logistica_transporte';
  }

  // 26. Marketing / Agência / Social Media
  if (p.includes('marketing') || p.includes('agência') || p.includes('agencia') || p.includes('tráfego pago') || p.includes('social media') || p.includes('redes sociais')) {
    return 'marketing_agencia';
  }

  return 'generico';
}

// Extrai o nome ou tema da atividade mencionada no texto (ex: "montar PC", "fazer cerveja", "produzir podcast")
function extrairTemaDoTexto(texto) {
  if (!texto) return '';
  const limpo = texto.trim();
  
  const padroes = [
    /(?:fluxo(?: de processos?)? (?:ideal )?(?:para|pra|de) )([^?.!]+)/i,
    /(?:processo (?:para|pra|de) )([^?.!]+)/i,
    /(?:etapas (?:para|pra|de) )([^?.!]+)/i,
    /(?:como (?:estruturar|organizar|fazer) (?:o fluxo de |o processo de )?)([^?.!]+)/i,
    /(?:quero fazer um fluxo (?:de processos? )?(?:para|pra|de) )([^?.!]+)/i
  ];

  for (const regex of padroes) {
    const match = limpo.match(regex);
    if (match && match[1]) {
      let tema = match[1].trim();
      tema = tema.replace(/\b(qual o fluxo ideal|no vinculum|no kanban|da empresa|do meu negócio|da minha empresa)\b/gi, '').trim();
      if (tema.length >= 2) return tema;
    }
  }

  return '';
}

// Extrai o tópico ativo analisando a mensagem atual e o histórico recente
function extrairTopicoAtivo(mensagem, historico) {
  const topicoMensagem = detectarNichoTopico(mensagem);
  if (topicoMensagem !== 'generico') {
    return topicoMensagem;
  }

  if (Array.isArray(historico)) {
    // 1. Prioriza mensagens do usuário no histórico (pois definem o interesse real da conversa)
    for (let i = historico.length - 1; i >= 0; i--) {
      const item = historico[i];
      if (item.autor === 'user' || item.role === 'user') {
        const texto = item.texto || item.content || '';
        const t = detectarNichoTopico(texto);
        if (t !== 'generico') {
          return t;
        }
      }
    }
    // 2. Se não encontrou nas mensagens do usuário, analisa as demais mensagens do histórico
    for (let i = historico.length - 1; i >= 0; i--) {
      const item = historico[i];
      const texto = item.texto || item.content || '';
      const t = detectarNichoTopico(texto);
      if (t !== 'generico') {
        return t;
      }
    }
  }

  return 'generico';
}

// Extrai o tema semântico ativo da conversa
function extrairTemaAtivo(mensagem, historico) {
  const temaMsg = extrairTemaDoTexto(mensagem);
  if (temaMsg) return temaMsg;

  if (Array.isArray(historico)) {
    // 1. Prioriza mensagens do usuário
    for (let i = historico.length - 1; i >= 0; i--) {
      const item = historico[i];
      if (item.autor === 'user' || item.role === 'user') {
        const texto = item.texto || item.content || '';
        const t = extrairTemaDoTexto(texto);
        if (t) return t;
      }
    }
    // 2. Demais mensagens
    for (let i = historico.length - 1; i >= 0; i--) {
      const item = historico[i];
      const texto = item.texto || item.content || '';
      const t = extrairTemaDoTexto(texto);
      if (t) return t;
    }
  }

  return '';
}

// ============================================================================

// CONSULTOR DE PROCESSOS E FLUXOS POR NICHO DE NEGÓCIO

// ============================================================================

function gerarConsultoriaFluxo(topico, pergunta, tema) {
  // 1. Recebimento de Mercadorias / Almoxarifado
  if (topico === 'recebimento_mercadoria') {
    return `Para o **recebimento de mercadorias e conferência de materiais**, o objetivo do fluxo no Vinculum é garantir que **nada entre no estoque com divergência de quantidade, avaria ou erro fiscal**! 📦

Aqui está o fluxo ideal desenhado em **5 etapas sequenciais** para o seu quadro Kanban:

1. 🚚 **1. Chegada do Fornecedor & Triagem**:
   Recepção do veículo na doca, checagem do espelho do Pedido de Compra com a Nota Fiscal (Danfe) e conferência visual da integridade dos volumes e lacres.

2. 📦 **2. Descarregamento & Triagem de Avarias**:
   Descarga física dos materiais, contagem dos volumes brutos e inspeção visual (identificando caixas amassadas, violadas ou molhadas para ressalva imediata no comprovante de entrega).

3. 🔍 **3. Conferência Cega & Controle de Qualidade**:
   Abertura dos volumes e contagem detalhada item por item (conferência física sem olhar a NF), checagem de códigos de produto, prazos de validade e lotes técnicos.

4. 📑 **4. Entrada Fiscal & Validação de Preços**:
   Confronto da contagem física com a Nota Fiscal e com a Ordem de Compra. Lançamento da NF no sistema ERP/financeiro e validação de divergências com o setor de Compras.

5. 🏷️ **5. Etiquetagem & Armazenamento no Estoque**:
   Etiquetagem dos produtos com código interno de rastreio, alocação física nas prateleiras/endereços do estoque e notificação aos setores solicitantes.

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
No menu superior do fluxo, clique em **"Campos da Tarefa"** e cadastre:
• **Número da Nota Fiscal** (*Texto*): chave ou número da Danfe.
• **Fornecedor** (*Texto*): nome da empresa emitente.
• **Número do Pedido de Compra** (*Texto*).
• **Quantidade de Volumes** (*Número*): total de caixas/fardos recebidos.
• **Status da Conferência** (*Select*: 100% Conforme, Divergência de Quantidade, Mercadoria Avariada).
• **Conferência Aprovada?** (*Checkbox* - marque como obrigatório para avançar para a etapa 5!).

💡 *Dica de Gestão:* Cada Nota Fiscal ou caminhão recebido vira um **Cartão** no Kanban. Se houver divergência, o cartão fica estacionado na etapa 3 ou 4 aguardando posicionamento do fornecedor!`;
  }

  // 2. Restaurante / Cozinha / Sopa / Gastronomia
  if (topico === 'restaurante_sopa') {
    return `Para o **preparo de sopas e pratos em um restaurante**, o segredo de um fluxo no Vinculum é garantir **padronização de sabor, controle de higiene e validade, e agilidade no salão**! 🍲

Aqui está o fluxo ideal desenhado em **5 etapas sequenciais** para o seu quadro Kanban:

1. 📋 **Mise en Place (Separação e Higienização)**:
   Higienização e corte dos legumes, pesagem exata dos ingredientes, separação dos temperos e preparação dos caldos base conforme a ficha técnica da receita.

2. 🔥 **Cocção e Fervura**:
   Refogado da base aromática, cozimento dos insumos no tempo controlado e apuração do caldo na temperatura ideal.

3. 🧪 **Controle de Sabor e Qualidade**:
   Degustação pelo chef ou líder de turno para validar o ponto de sal, textura e consistência. Se algo estiver fora do padrão, é corrigido nesta etapa antes da liberação.

4. ❄️ **Porcionamento e Conservação Térmica**:
   Para consumo imediato, transferência para o banho-maria térmico (mantido acima de 65°C); para consumo posterior, resfriamento rápido (blast chiller) e etiquetagem com data, hora e lote.

5. 🍽️ **Pronto para o Salão / Expedição**:
   Montagem final do prato (croutons, azeite, cheiro-verde) e liberação para a mesa do cliente ou embalagem de delivery.

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
No menu superior do fluxo, clique em **"Campos da Tarefa"** e cadastre:
• **Nome da Receita** (*Texto*): ex.: "Creme de Mandioquinha com Carne Seca".
• **Rendimento do Lote** (*Número*): ex.: 15 litros ou 30 porções.
• **Data e Lote de Fabricação** (*Data*): data do preparo e validade na refrigeração.
• **Cozinheiro Responsável** (*Usuário*): colaborador que preparou a panela.
• **Aprovado pelo Chef** (*Checkbox*): marque como obrigatório para avançar da etapa de *Controle de Qualidade*!

💡 *Dica de Gestão:* Cada panela ou lote preparado vira um **Cartão** no Kanban. Assim toda a equipe da cozinha e do salão visualiza em tempo real o que está no fogo e o que já está pronto para servir!`;
  }

  // 3. Confeitaria / Padaria / Bolos / Doces
  if (topico === 'confeitaria_padaria') {
    return `Para a **produção em confeitaria ou padaria**, o fluxo do Vinculum garante **precisão de receitas, frescor dos produtos e pontualidade nas encomendas**! 🎂

Fluxo recomendado em **5 etapas no Kanban**:

1. 📥 **1. Encomenda & Ficha Técnica**: Registro do pedido do cliente (sabor, tema, tamanho, data de entrega) e checagem de ingredientes.
2. 🥣 **2. Pesagem & Batimento (Massa)**: Pesagem exata dos insumos e preparo da massa no forno com controle de tempo.
3. 🍓 **3. Recheio & Montagem**: Preparo dos recheios, caldas e estruturação das camadas do bolo ou doce.
4. 🎨 **4. Confeitaria & Decoração**: Cobertura artística, acabamento em pasta americana/chantilly e refrigeração.
5. 📦 **5. Embalagem & Retirada/Entrega**: Acondicionamento em caixa segura, fotos para o portfólio e entrega ao cliente.

---

🛠️ **Campos Personalizados recomendados:**
• **Nome do Cliente & Contato** (*Texto*).
• **Valor da Encomenda** (*Moeda R$*).
• **Data e Hora da Entrega** (*Data*).
• **Sabor / Tema** (*Texto*).`;
  }

  // 4. Marcenaria / Móveis Planejados / Fabricação
  if (topico === 'marcenaria_moveis') {
    return `Para a **fabricação de móveis sob medida em marcenaria**, o fluxo visual organiza o projeto do corte da chapa até a montagem final na casa do cliente! 🪑

Fluxo recomendado em **5 etapas no Kanban**:

1. 📐 **1. Projeto & Medição**: Validação do desenho 3D, plano de corte e lista de ferragens.
2. 🪵 **2. Corte & Furação**: Corte das chapas de MDF/madeira, colagem de fita de borda e furações técnicas.
3. 🔩 **3. Pré-montagem na Oficina**: Montagem dos módulos na fábrica para conferir esquadro e funcionamento das corrediças.
4. 🚚 **4. Transporte & Embalagem**: Proteção dos módulos com plástico bolha e transporte até o local da obra.
5. 🏠 **5. Montagem Final & Entrega**: Fixação no ambiente do cliente, regulagem de portas e termo de entrega assinado.

---

🛠️ **Campos Personalizados recomendados:**
• **Ambiente** (*Select*: Cozinha, Quarto, Sala, Banheiro).
• **Valor do Contrato** (*Moeda R$*).
• **Marceneiro Responsável** (*Usuário*).
• **Prazo de Montagem** (*Data*).`;
  }

  // 5. Clínica Médica / Consultório / Odonto
  if (topico === 'clinica_saude') {
    return `Para uma **clínica médica ou consultório de saúde**, o fluxo do Vinculum organiza a jornada do paciente com pontualidade e sigilo! 🩺

Fluxo recomendado em **5 etapas no Kanban**:

1. 📅 **1. Agendamento**: Marcação da consulta, cadastro do paciente e envio de lembrete de confirmação via WhatsApp.
2. 🏥 **2. Recepção & Triagem**: Chegada do paciente, checagem de convênio e aferição de sinais vitais quando aplicável.
3. 🩺 **3. Atendimento em Consulta**: Realização da consulta médica, diagnóstico e prescrição de receitas/exames.
4. 📋 **4. Exames & Aguardando Laudo**: Paciente realizando procedimentos ou exames solicitados.
5. 🔄 **5. Retorno / Concluído**: Avaliação dos resultados dos exames, encerramento do plano de cuidado e agendamento de retorno preventivo.

---

🛠️ **Campos Personalizados recomendados:**
• **Especialidade** (*Select*: Clínica Geral, Cardiologia, Odontologia, etc.).
• **Convênio / Particular** (*Select*).
• **Médico Responsável** (*Usuário*).
• **Data da Consulta** (*Data*).`;
  }

  // 6. Vendas / Comercial / CRM
  if (topico === 'vendas_comercial') {
    return `Para estruturar o **processo comercial e de vendas da sua empresa**, o foco é converter contatos em contratos sem perder o ritmo de negociação! 💼

Aqui está o fluxo ideal em **5 etapas no quadro Kanban**:

1. 🎯 **Prospecção / Entrada de Lead**: Registro inicial do contato interessado (vindo de indicação, site ou WhatsApp).
2. 🔍 **Qualificação e Diagnóstico**: Contato para entender a real necessidade do cliente, orçamento disponível e prazo de decisão.
3. 📑 **Proposta Comercial Enviada**: Apresentação da solução e envio formal do orçamento detalhado.
4. 🤝 **Negociação e Alinhamento**: Ajuste de escopo, negociação de valores e condições de pagamento.
5. 🎉 **Fechamento / Contrato Ganho**: Assinatura do contrato e repasse da demanda para a equipe operacional.

---

🛠️ **Campos Personalizados recomendados:**
• **Valor Negociado** (*Moeda R$*): valor total da proposta.
• **Nome do Decisor / Cliente** (*Texto*): responsável pela contratação.
• **Canal de Origem** (*Select*): Indicação, WhatsApp, Google, Instagram.
• **Data de Follow-up** (*Data*): próximo contato combinado com o cliente.

💡 *Dica de Gestão:* Defina um responsável único para cada cartão de venda e acompanhe tarefas atrasadas para nunca esquecer de responder um cliente!`;
  }

  // 7. Compras / Suprimentos
  // 9. Oficina Mecânica / Reparos / Ordem de Serviço (OS)
  if (topico === 'oficina_mecanica') {
    return `Para uma **oficina mecânica ou assistência técnica**, o fluxo visual organiza os serviços do orçamento até a entrega do veículo/equipamento! 🔧

Fluxo recomendado em **5 etapas**:

1. 🚗 **Entrada e Recepção**: Abertura da Ordem de Serviço com os sintomas relatados pelo cliente e fotos do veículo.
2. 🔍 **Diagnóstico e Orçamento**: Avaliação do mecânico, teste das peças e cálculo de custos.
3. 📞 **Aguardando Aprovação do Cliente**: Envio do orçamento e espera pelo aval formal do proprietário.
4. 🔧 **Execução do Serviço**: Substituição de peças e realização do conserto na oficina.
5. 🏁 **Teste de Rodagem e Entrega**: Teste final de segurança, limpeza e entrega com emissão de garantia.

---

🛠️ **Campos Personalizados recomendados:**
• **Placa / Modelo do Veículo** (*Texto*).
• **Valor de Peças** (*Moeda R$*).
• **Valor de Mão de Obra** (*Moeda R$*).
• **Mecânico Responsável** (*Usuário*).`;
  }

  // 10. RH / Recrutamento e Seleção / Admissão
  if (topico === 'rh_recrutamento') {
    return `Para o setor de **Recursos Humanos (RH) e Recrutamento & Seleção**, o fluxo no Vinculum garante que você contrate os melhores talentos sem perder candidatos qualificados no caminho! 👥

Fluxo recomendado em **5 etapas no Kanban**:

1. 📢 **1. Abertura da Vaga & Divulgação**: Mapeamento do perfil desejado com o gestor, definição de salário/benefícios e publicação nas plataformas de vagas.
2. 📄 **2. Triagem de Currículos**: Filtragem inicial dos candidatos que atendem aos requisitos essenciais e primeiro contato via WhatsApp/telefone.
3. 🗣️ **3. Entrevistas & Teste Prático**: Condução de entrevistas comportamentais pelo RH e aplicação de testes técnicos ou estudos de caso.
4. 🤝 **4. Entrevista com Gestor & Proposta**: Conversa final com a liderança da área, alinhamento de expectativas e envio da carta-proposta oficial.
5. 🎉 **5. Admissão & Onboarding**: Coleta de documentos admissionais, agendamento de exame médico (ASO) e integração do novo colaborador na empresa!

---

🛠️ **Campos Personalizados recomendados:**
• **Cargo / Vaga** (*Texto*): ex.: "Analista Comercial" ou "Desenvolvedor".
• **Nome do Candidato** (*Texto*).
• **Pretensão Salarial** (*Moeda R$*).
• **Data Prevista de Início** (*Data*).
• **Canal de Captação** (*Select*: LinkedIn, Indicação, Catho, InfoJobs).

💡 *Dica de Gestão:* Cada candidato vira um **Cartão** no Kanban. Mova os cartões conforme avançam de fase e mantenha notas das entrevistas no histórico!`;
  }

  // 11. Financeiro / Contas a Pagar / Receber / Cobrança
  if (topico === 'financeiro_contas') {
    return `Para a gestão do **Departamento Financeiro e Contas a Pagar/Receber**, o fluxo visual do Vinculum impede multas por atraso e garante previsibilidade de caixa! 💰

Fluxo recomendado em **5 etapas no Kanban**:

1. 📥 **1. Entrada de Documento Fiscal & Boleto**: Recebimento da Nota Fiscal, boleto bancário ou fatura com conferência do CNPJ e valor.
2. 🔍 **2. Validação & Aceite do Setor**: Checagem com o departamento solicitante se a mercadoria ou serviço foi efetivamente entregue.
3. ⚖️ **3. Aprovação Financeira / Diretoria**: Autorização formal de liberação do pagamento conforme a alçada financeira da empresa.
4. 🏦 **4. Agendamento Bancário**: Programação do pagamento no Internet Banking e anexação do comprovante provisório.
5. 🏁 **5. Baixa & Conciliação Bancária**: Confirmação da liquidação do título, baixa no sistema e conciliação com o extrato bancário.

---

🛠️ **Campos Personalizados recomendados:**
• **Valor do Título** (*Moeda R$*).
• **Data de Vencimento** (*Data* - configure alerta de atraso!).
• **Fornecedor / Beneficiário** (*Texto*).
• **Centro de Custo / Categoria** (*Select*: Operacional, TI, Marketing, Pessoal).
• **Número do Boleto / Código de Barras** (*Texto*).

💡 *Dica de Gestão:* Na tela **Tabela**, use o filtro de data para visualizar todos os títulos que vencem na semana corrente!`;
  }

  // 12. TI / Desenvolvimento de Software / Bugs
  if (topico === 'ti_software') {
    return `Para times de **Tecnologia, TI e Desenvolvimento de Software**, o Kanban do Vinculum organiza demandas desde o backlog até a entrega em produção! 💻

Fluxo recomendado em **5 etapas**:

1. 📋 **1. Backlog & Especificação**: Registro da história de usuário, regras de negócio e critérios de aceite.
2. 💻 **2. Em Desenvolvimento**: Codificação da funcionalidade ou correção de bug com branch dedicada.
3. 🔍 **3. Code Review & Testes Internos**: Validação cruzada do código por outro desenvolvedor e execução de testes automatizados.
4. 🧪 **4. Homologação / QA (Staging)**: Teste funcional em ambiente controlado para validação com o cliente ou Product Owner.
5. 🚀 **5. Concluído / Em Produção**: Deploy da funcionalidade em produção e monitoramento pós-lançamento.

---

🛠️ **Campos Personalizados recomendados:**
• **Tipo de Demanda** (*Select*: Nova Feature, Melhoria, Bug Crítico, Débito Técnico).
• **Estimativa de Horas** (*Número*).
• **Desenvolvedor Responsável** (*Usuário*).
• **Versão da Release** (*Texto*).`;
  }

  // 13. Imobiliária / Locação de Imóveis
  if (topico === 'imobiliaria') {
    return `Para uma **imobiliária ou setor de locação e vendas**, o Vinculum ajuda corretores a fechar negócios mais rápido com rastreabilidade! 🏠

Fluxo recomendado em **5 etapas**:

1. 🎯 **1. Lead / Interesse do Cliente**: Registro do interessado e levantamento de perfil (bairro, orçamento, número de quartos).
2. 🔑 **2. Agendamento & Visita**: Apresentação presencial dos imóveis selecionados pelo corretor.
3. 📑 **3. Proposta & Análise Cadastral**: Envio formal da proposta e checagem de score/documentos de fiador ou seguro-fiança.
4. ✍️ **4. Elaboração de Contrato**: Emissão da minuta do contrato de locação/compra e coleta de assinaturas digitais.
5. 🏁 **5. Vistoria & Entrega das Chaves**: Realização do laudo de vistoria de entrada e liberação das chaves ao novo morador.

---

🛠️ **Campos Personalizados recomendados:**
• **Código do Imóvel** (*Texto*).
• **Valor do Aluguel / Venda** (*Moeda R$*).
• **Corretor Responsável** (*Usuário*).
• **Garantia Locatícia** (*Select*: Seguro-Fiança, Fiador, Caução).`;
  }

  // 14. Montagem de PC / Hardware / Computadores
  if (topico === 'montagem_pc_hardware') {
    return `Para a **montagem e upgrade de computadores (PC Gamer / Workstation / Escritório)**, o fluxo no Vinculum garante **compatibilidade total de peças, integridade de componentes caros e testes de estabilidade antes da entrega**! 🖥️

Aqui está o fluxo ideal desenhado em **5 etapas sequenciais** para o seu quadro Kanban:

1. 📋 **1. Análise de Compatibilidade & Orçamento (Hardware Matching)**:
   Conferência de soquete (Intel LGA / AMD AM4/AM5), chipsets, memórias (DDR4 vs DDR5), dimensionamento da fonte (TDP total + folga de 30%) e espaço físico no gabinete (comprimento da placa de vídeo e suporte a radiador).

2. 📦 **2. Separação de Peças & Preparo da Bancada Antiestática**:
   Desembalagem cuidadosa dos componentes, inspeção visual dos pinos do socket na placa-mãe, preparo da bancada com pulseira/manta antiestática e ferramentas imantadas.

3. 🛠️ **3. Montagem Física & Cable Management**:
   Instalação da CPU, aplicação correta de pasta térmica (método grão/X), fixação de cooler/water cooler, memórias em dual-channel (slots 2 e 4), instalação nos espaçadores (standoffs) do gabinete, fonte e organização limpa dos cabos para máxima circulação de ar.

4. 🔌 **4. Primeiro POST, Atualização de BIOS & Teste de Estresse**:
   Primeiro boot em bancada, atualização para a versão mais recente e estável da BIOS, ativação do perfil XMP/EXPO de memórias, instalação limpa do sistema operacional/drivers e execução de testes de estresse térmico (AIDA64 / FurMark / Cinebench).

5. 🏁 **5. Acabamento, Proteção Interna & Entrega ao Cliente**:
   Limpeza interna com ar comprimido, fechamento do vidro temperado, proteção interna com espuma expansível para transporte (se tiver GPU pesada instalada), coleta de todas as caixas originais dos componentes e emissão do termo de garantia com laudo de benchmarks!

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
No topo do fluxo, clique em **"Campos da Tarefa"** e cadastre:
• **Configuração do Setup** (*Área de Texto*): Processador, GPU, Placa-Mãe, RAM, Fonte e SSD.
• **Valor Total das Peças** (*Moeda R$*).
• **Valor da Montagem** (*Moeda R$*).
• **Técnico Montador** (*Usuário*).
• **Perfil XMP/EXPO Ativado?** (*Checkbox*).
• **Teste de Estresse Aprovado?** (*Checkbox* - configure como obrigatório para avançar para a etapa 5!).

💡 *Dica de Gestão:* Cada computador montado vira um **Cartão** no Kanban. Se um componente apresentar defeito no teste de estresse (etapa 4), o cartão é mantido parado até a substituição da peça via RMA!`;
  }

  // 15. Sintetizador Semântico Dinâmico para Qualquer Outra Atividade
  const temaFinal = tema || extrairTemaDoTexto(pergunta);
  return sintetizarFluxoDinamico(temaFinal, pergunta);
}

// Sintetizador Dinâmico Inteligente de Processos
function sintetizarFluxoDinamico(temaOriginal, pergunta) {
  const tema = (temaOriginal || 'este processo').trim();
  const temaCap = tema.charAt(0).toUpperCase() + tema.slice(1);
  const t = tema.toLowerCase();

  // Caso 1: Processos de Produção, Montagem, Fabricação ou Culinária
  if (t.includes('montar') || t.includes('montagem') || t.includes('fabric') || t.includes('produz') || t.includes('prepar') || t.includes('faz') || t.includes('cria') || t.includes('constru')) {
    return `Para estruturar o processo de **${temaCap}**, o objetivo no Vinculum é garantir **padronização técnica, qualidade no produto final e zero desperdício de insumos**! ⚙️

Aqui está o fluxo ideal desenhado em **5 etapas sequenciais** para o seu quadro Kanban:

1. 📋 **1. Especificação & Validação Técnica de ${temaCap}**:
   Levantamento detalhado dos requisitos, conferência da lista de componentes/ingredientes e validação de custos e prazos com o cliente.

2. 📦 **2. Separação de Insumos & Preparação da Bancada de Trabalho**:
   Separação física de peças, matérias-primas e ferramentas necessárias, realizando inspeção prévia de qualidade dos itens.

3. 🛠️ **3. Montagem / Fabricação Ativa de ${temaCap}**:
   Execução técnica da atividade principal seguindo procedimentos operacionais padronizados (POPs) e boas práticas do setor.

4. 🧪 **4. Testes de Funcionamento, Desempenho & Controle de Qualidade**:
   Inspeção minuciosa, testes práticos de tolerância/estresse e checagem de acabamento visual antes de liberar o produto.

5. 🏁 **5. Embalagem, Termo de Garantia & Conclusão**:
   Acondicionamento em embalagem de proteção, emissão do termo de garantia ou nota fiscal e liberação final com baixa no cartão.

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
No menu superior do fluxo, clique em **"Campos da Tarefa"** e cadastre:
• **Especificação / Modelo de ${temaCap}** (*Texto*).
• **Custo Total dos Insumos** (*Moeda R$*).
• **Valor Final Cobrado** (*Moeda R$*).
• **Responsável Técnico** (*Usuário*).
• **Controle de Qualidade Aprovado?** (*Checkbox* - marque como obrigatório para avançar à etapa 5!).

💡 *Dica de Gestão:* Cada ordem ou unidade de **${temaCap}** vira um **Cartão** no Kanban. Se houver falha no teste de qualidade, o cartão fica parado na etapa 4 para retrabalho imediato!`;
  }

  // Caso 2: Processos de Manutenção, Reparo, Instalação ou Assistência
  if (t.includes('manuten') || t.includes('repar') || t.includes('consert') || t.includes('assist') || t.includes('instal') || t.includes('revis') || t.includes('troca')) {
    return `Para o fluxo de **${temaCap}**, o objetivo no Vinculum é garantir **agilidade no atendimento, orçamento transparente e garantia documentada**! 🔧

Aqui está o fluxo ideal desenhado em **5 etapas sequenciais** para o seu quadro Kanban:

1. 📥 **1. Abertura da Ordem de Serviço & Checklist Inicial**:
   Registro dos dados do cliente, identificação do equipamento/ambiente e anotação detalhada dos sintomas relatados.

2. 🔍 **2. Diagnóstico Técnico & Orçamento**:
   Inspeção técnica aprofundada, cotação de peças de reposição necessárias e cálculo do valor de mão de obra.

3. 📞 **3. Aguardando Aprovação do Cliente**:
   Apresentação formal da proposta com prazo de entrega e obtenção de autorização expressa antes de iniciar a execução.

4. ⚙️ **4. Execução do Reparo / Instalação Técnica de ${temaCap}**:
   Substituição de componentes ou instalação técnica seguindo rigorosamente as recomendações do fabricante.

5. 🏁 **5. Teste de Validação Operacional & Entrega com Garantia**:
   Testes práticos de funcionamento, limpeza do item/local, emissão do certificado de garantia e liberação da OS com sucesso.

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
• **Número da OS** (*Texto*).
• **Valor de Peças / Materiais** (*Moeda R$*).
• **Valor de Mão de Obra** (*Moeda R$*).
• **Técnico Responsável** (*Usuário*).
• **Orçamento Autorizado?** (*Checkbox*).`;
  }

  // Caso 3: Processos de Atendimento, Vendas, Serviços e Gestão
  return `Para organizar o fluxo de **${temaCap}** no Vinculum, estruturamos um pipeline visual enxuto em **5 etapas bem definidas**: 🎯

1. 📥 **1. Entrada da Demanda & Triagem de ${temaCap}**:
   Recepção da solicitação, checagem dos requisitos do cliente e definição de prioridade no quadro.

2. 📋 **2. Planejamento de Escopo & Preparo de Recursos**:
   Elaboração do plano de ação, definição dos prazos e alocação do responsável no cartão.

3. 🚀 **3. Execução Técnica & Desenvolvimento**:
   Realização da atividade principal de acordo com as metas combinadas com o cliente.

4. 🔍 **4. Revisão, Ajustes & Controle de Qualidade**:
   Validação interna da entrega, conferência contra erros e aprovação do líder de equipe.

5. 🏁 **5. Entrega Final, Validação & Fechamento**:
   Apresentação ao cliente, emissão de faturamento e arquivamento do histórico com sucesso.

---

🛠️ **Campos Personalizados recomendados no Vinculum:**
• **Cliente / Solicitante** (*Texto*).
• **Valor Total da Demanda** (*Moeda R$*).
• **Prazo de Entrega** (*Data*).
• **Responsável pelo Cartão** (*Usuário*).
• **Entrega Validada?** (*Checkbox*).

💡 *Dica de Gestão:* Cada demanda de **${temaCap}** vira um **Cartão** no Kanban. Mantenha os prazos atualizados para agir preventivamente contra gargalos!`;
}

// ============================================================================
// GERADOR DE CHECKLISTS E TAREFAS POR ETAPA (Responde perguntas de follow-up)
// ============================================================================
function gerarChecklistTarefasPorEtapa(topico, tema) {
// 1. Recebimento de Mercadorias / Almoxarifado
  if (topico === 'recebimento_mercadoria') {
    return `Aqui está o checklist prático de **tarefas e atividades operacionais** para cada etapa do processo de **Recebimento de Mercadorias**: 📦

### 🚚 Etapa 1: Chegada do Fornecedor & Triagem
• **Conferir dados cadastrais na Danfe**: Verificar Razão Social, CNPJ e se a entrega é destinada à sua empresa.
• **Validar o Pedido de Compra**: Checar no sistema se existe ordem de compra autorizada para aquele fornecedor.
• **Inspecionar lacre do caminhão**: Verificar se o lacre está intacto e anotar o horário de chegada na doca.

### 📦 Etapa 2: Descarregamento & Triagem de Avarias
• **Descarregar os volumes**: Retirar pallets e caixas com auxílio de paleteira ou empilhadeira.
• **Contar volumes brutos**: Comparar o total de caixas físicas com a quantidade descrita no Conhecimento de Transporte (CT-e).
• **Inspecionar integridade física externa**: Identificar caixas amassadas, molhadas, rasgadas ou violadas.
• **Registrar ressalva imediata**: Se houver avarias, tirar fotos e colher assinatura do motorista no canhoto/CT-e.

### 🔍 Etapa 3: Conferência Cega & Controle de Qualidade
• **Realizar contagem cega**: Abrir caixas e contar item por item sem olhar a quantidade da nota para evitar vícios.
• **Conferir especificações técnicas**: Checar códigos de barras, modelos, voltagens, cores e medidas.
• **Inspecionar lotes e validades**: Verificar se os prazos de validade atendem à política mínima da empresa (shelf-life).
• **Testar amostras de lote**: Fazer teste de funcionamento ou qualidade em uma amostra aleatória quando aplicável.

### 📑 Etapa 4: Entrada Fiscal & Validação de Preços
• **Importar o XML da NF-e**: Lançar a nota fiscal no ERP ou sistema de gestão financeira.
• **Confrontar preços e impostos**: Garantir que o valor cobrado seja idêntico ao valor orçado no pedido de compras.
• **Tratar divergências**: Caso falte produto ou o preço esteja errado, acionar Compras para emitir nota de devolução ou solicitar carta de correção.

### 🏷️ Etapa 5: Etiquetagem & Armazenamento no Estoque
• **Etiquetar os produtos**: Imprimir e colar etiquetas com código interno de rastreio e endereço de estoque.
• **Guardar nas posições de prateleira**: Alocar fisicamente os itens nos endereços corretos do armazém.
• **Dar baixa no cartão Kanban**: Mover o cartão para "Concluído" e notificar o setor solicitante de que os itens estão liberados!

💡 *Como aplicar no Vinculum:* Cada lote ou Nota Fiscal recebida é um **Cartão** no Kanban. Essas tarefas podem ser incluídas na descrição da tarefa ou usadas como procedimentos operacionais padrão (POPs) da equipe!`;
  }

  // 2. Restaurante / Cozinha / Sopa
  if (topico === 'restaurante_sopa') {
    return `Aqui estão as **tarefas práticas da equipe da cozinha** em cada etapa do preparo de sopas e pratos: 🍲

### 📋 Etapa 1: Mise en Place (Separação e Higienização)
• **Higienizar vegetais**: Lavar e desinfetar legumes e ervas em solução clorada.
• **Cortar e porcionar**: Fazer o corte padrão dos insumos (cubos, julienne ou fatias) conforme a ficha técnica.
• **Pesar insumos**: Pesar carnes, gorduras, farinhas e temperos secos em balança de precisão.
• **Separar panelas e utensílios**: Deixar os caldos base e panelões prontos ao lado do fogão.

### 🔥 Etapa 2: Cocção e Fervura
• **Refogar a base aromática**: Dourar cebola, alho e especiarias no azeite ou manteiga.
• **Adicionar insumos e caldos**: Acrescentar os ingredientes por tempo de cocção (mais duros primeiro).
• **Controlar fogo e tempo**: Manter fogo médio e cronometrar o tempo exato para não desmanchar os legumes.
• **Monitorar textura**: Ajustar redução do caldo ou espessamento (com amido ou purê).

### 🧪 Etapa 3: Controle de Sabor e Qualidade
• **Degustação pelo Chef**: Provar uma amostra para checar o ponto exato de sal e tempero.
• **Teste de consistência**: Verificar se o caldo não está nem muito ralo nem muito pastoso.
• **Aferir temperatura interna**: Garantir que a sopa atingiu no mínimo 74°C no centro da panela.
• **Aprovação do lote**: Chef autoriza a panela para a próxima etapa.

### ❄️ Etapa 4: Porcionamento e Conservação Térmica
• **Para consumo imediato**: Transferir com concha higienizada para a caldeira/banho-maria térmico mantido a 65°C+.
• **Para estoque refrigerado**: Resfriar rapidamente em abatedor térmico (de 60°C para 10°C em menos de 2h).
• **Etiquetar potes**: Colar etiqueta inviolável com nome do prato, data, hora, cozinheiro e prazo de validade.

### 🍽️ Etapa 5: Pronto para o Salão / Expedição
• **Montar prato ou embalagem**: Colocar a porção padrão na cumbuca ou embalagem delivery.
• **Finalização gourmet**: Adicionar croutons crocantes, azeite trufado ou cheiro-verde fresco.
• **Liberar para o garçom / motoboy**: Despachar com rapidez para que chegue fumegante ao cliente!`;
  }

  // 3. Vendas / Comercial / CRM
  if (topico === 'vendas_comercial') {
    return `Aqui estão as **tarefas práticas do vendedor** em cada etapa do processo comercial: 💼

### 🎯 Etapa 1: Prospecção / Entrada de Lead
• Cadastrar nome, telefone, e-mail e empresa do lead no cartão.
• Identificar a origem do contato (WhatsApp, indicação, anúncio).
• Realizar o primeiro contato em menos de 15 minutos.

### 🔍 Etapa 2: Qualificação e Diagnóstico
• Agendar conversa de diagnóstico (ligação ou reunião rápida).
• Levantar dores, desafios e objetivos do cliente.
• Confirmar quem toma a decisão final de compra e qual o orçamento disponível.

### 📑 Etapa 3: Proposta Comercial Enviada
• Montar proposta personalizada com base nas dores levantadas.
• Detalhar escopo, valores, prazos e formas de pagamento.
• Enviar a proposta por WhatsApp/e-mail e agendar apresentação.

### 🤝 Etapa 4: Negociação e Alinhamento
• Realizar reunião de alinhamento e tirar dúvidas sobre a proposta.
• Negociar eventuais ajustes de desconto ou forma de parcelamento.
• Fazer follow-up a cada 48 horas para não deixar o cliente esfriar.

### 🎉 Etapa 5: Fechamento / Contrato Ganho
• Colher assinatura formal do contrato (física ou digital).
• Emitir o primeiro boleto ou comprovar entrada financeira.
• Repassar o cartão com todas as anotações para o setor operacional/onboarding.`;
  }

  // 4. Compras / Suprimentos
  if (topico === 'compras_suprimentos') {
    return `Aqui está o checklist prático de **tarefas e atividades operacionais** para cada etapa do processo de **Compras e Suprimentos**: 🛍️

### 📥 Etapa 1: Solicitação de Compra
• **Conferir requisição do setor**: Validar quantidade, especificação técnica e justificativa do pedido.
• **Checar saldo em estoque**: Confirmar se o item não está disponível no almoxarifado antes de comprar.
• **Aprovação do gestor de área**: Colher autorização da liderança responsável pelo centro de custo.

### 🔍 Etapa 2: Cotação de Preços
• **Disparar solicitação (RFQ)**: Enviar pedidos de orçamento para no mínimo 3 fornecedores homologados.
• **Montar mapa comparativo**: Comparar preços unitários, prazos de entrega, garantias e frete (CIF ou FOB).
• **Negociar condições**: Buscar descontos por volume e melhores prazos de pagamento.

### ⚖️ Etapa 3: Aprovação Financeira
• **Validar limite de orçamento**: Verificar se o valor cabe no fluxo de caixa e no teto orçamentário do mês.
• **Submeter para diretoria**: Obter aprovação formal da gerência/diretoria para a melhor proposta.

### 🚚 Etapa 4: Pedido Emitido ao Fornecedor
• **Gerar Ordem de Compra (PO)**: Enviar formalmente o pedido para o fornecedor com todas as condições acordadas.
• **Confirmar recebimento do pedido**: Exigir confirmação de recebimento e compromisso com o prazo de entrega.
• **Acompanhar status de transporte**: Rastrear a data estimada de chegada na empresa.

### 📦 Etapa 5: Recebimento e Conferência
• **Acompanhar descarga física**: Notificar o almoxarifado sobre a chegada dos volumes.
• **Conferir Nota Fiscal com a Ordem de Compra**: Garantir que preços e itens batem perfeitamente com o combinado.
• **Liberar para pagamento**: Enviar a NF aprovada para o setor financeiro e dar baixa no cartão!`;
  }

  // 5. Atendimento / Suporte / SAC
  if (topico === 'atendimento_suporte') {
    return `Aqui estão as **tarefas práticas do agente de suporte** em cada etapa do atendimento: 🎧

### 📩 Etapa 1: Novo Chamado
• Registrar o chamado com relato detalhado do cliente e anexos (prints, vídeos).
• Classificar a categoria do problema (dúvida, bug, financeiro).
• Enviar mensagem automática com o número de protocolo.

### 🔍 Etapa 2: Triagem e Priorização
• Avaliar a criticidade do chamado (Baixa, Média ou Crítica).
• Verificar se o cliente tem SLA contratual diferenciado.
• Atribuir o cartão ao especialista técnico adequado.

### ⚙️ Etapa 3: Em Análise e Resolução
• Reproduzir o problema em ambiente de teste.
• Executar os procedimentos técnicos de correção.
• Documentar no histórico da tarefa a causa raiz da falha.

### 💬 Etapa 4: Validação com o Cliente
• Enviar mensagem explicando a solução e orientando os passos a seguir.
• Aguardar teste e confirmação do cliente de que tudo foi resolvido.
• Fazer follow-up se o cliente não responder em 24h.

### ✅ Etapa 5: Chamado Concluído
• Confirmar resolução definitiva e alterar status para resolvido.
• Enviar pesquisa de satisfação (NPS / CSAT).
• Arquivar histórico para auditoria futura.`;
  }

  // 6. RH / Recrutamento e Seleção
  if (topico === 'rh_recrutamento') {
    return `Aqui está o checklist prático de **tarefas e atividades operacionais** para cada etapa do processo de **Recursos Humanos e Recrutamento**: 👥

### 📢 Etapa 1: Abertura da Vaga & Alinhamento
• **Briefing com o gestor**: Mapear requisitos técnicos, comportamentais e responsabilidades da vaga.
• **Definir faixa salarial**: Alinhar salário, benefícios, regime de trabalho (CLT/PJ) e modelo (presencial/híbrido/remoto).
• **Publicar anúncio**: Criar post da vaga e divulgar nos canais de captação (LinkedIn, vagas, grupos).

### 📄 Etapa 2: Triagem de Currículos
• **Filtrar por requisitos eliminatórios**: Formação, tempo de experiência e competências essenciais.
• **Pré-contato de alinhamento**: Mensagem rápida via WhatsApp para confirmar pretensão salarial e disponibilidade.
• **Agendar entrevistas**: Enviar convite de calendário com link da videochamada para os aprovados na triagem.

### 🗣️ Etapa 3: Entrevistas & Teste Técnico
• **Entrevista por competências**: Avaliar histórico profissional, soft skills e fit cultural com o time.
• **Aplicar teste técnico**: Enviar teste prático, redação ou estudo de caso com prazo de resolução.
• **Consolidar pontuação**: Registrar notas e observações detalhadas no cartão do candidato.

### 🤝 Etapa 4: Entrevista com Gestor & Proposta
• **Entrevista final**: Apresentar os 2 ou 3 finalistas para entrevista com a liderança da área.
• **Escolha do aprovado**: Alinhar decisão com a diretoria.
• **Envio da proposta formal**: Enviar carta-proposta oficial por escrito e aguardar o aceite do candidato.

### 🎉 Etapa 5: Admissão & Onboarding
• **Coletar documentos**: Solicitar RG, CPF, carteira de trabalho, comprovante de residência e foto.
• **Agendar exame admissional**: Emitir guia para exame clínico (ASO) em clínica do trabalho.
• **Preparar primeiro dia**: Configurar e-mail corporativo, acessos de sistema e kit de boas-vindas da empresa!`;
  }

  // 7. Financeiro / Contas a Pagar / Receber
  if (topico === 'financeiro_contas') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo **Financeiro e Contas a Pagar**: 💰

### 📥 Etapa 1: Entrada de Documento Fiscal & Boleto
• **Recepcionar o documento**: Salvar Danfe (PDF/XML), boleto bancário ou fatura anexada.
• **Conferir dados fiscais**: Validar CNPJ da empresa, data de emissão e data de vencimento.
• **Registrar no contas a pagar**: Lançar previsão de pagamento no fluxo de caixa da empresa.

### 🔍 Etapa 2: Validação & Aceite do Setor
• **Confirmar com solicitante**: Solicitar confirmação por escrito de que o produto ou serviço foi entregue com qualidade.
• **Checar ordem de compra**: Garantir que o valor faturado é idêntico ao valor orçado pelo setor de Compras.
• **Verificar retenções de tributos**: Checar eventuais retenções de impostos (ISS, IRRF, INSS, PIS/Cofins).

### ⚖️ Etapa 3: Aprovação Financeira / Diretoria
• **Submeter para alçada**: Enviar para assinatura digital ou validação do gerente financeiro/diretor.
• **Validar disponibilidade em conta**: Garantir provisão de saldo na conta bancária para a data de liquidação.

### 🏦 Etapa 4: Agendamento Bancário
• **Programar no Internet Banking**: Digitar ou escanear o código de barras no banco para a data exata de vencimento.
• **Salvar comprovante de agendamento**: Anexar o comprovante provisório no cartão da tarefa.
• **Autorizar remessa**: Colher a segunda assinatura eletrônica no banco quando aplicável.

### 🏁 Etapa 5: Baixa & Conciliação Bancária
• **Confirmar débito em conta**: Conferir no extrato bancário se o título foi liquidado com sucesso.
• **Baixar duplicata no sistema**: Dar baixa no contas a pagar e arquivar comprovante definitivo.
• **Mover cartão para Concluído**: Finalizar a demanda com histórico 100% auditável!`;
  }

  // 8. Clínica Médica / Consultório / Odonto
  if (topico === 'clinica_saude') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Atendimento em Clínica / Saúde**: 🩺

### 📅 Etapa 1: Agendamento & Confirmação
• Cadastrar nome, telefone, convênio ou plano particular do paciente.
• Agendar data, horário e especialidade desejada no calendário.
• Enviar mensagem automática de confirmação via WhatsApp 24h antes da consulta.

### 🏥 Etapa 2: Recepção & Triagem
• Recepcionar o paciente na recepção e solicitar documento com foto.
• Validar elegibilidade da carteirinha do convênio ou processar pagamento particular.
• Aferir sinais vitais (pressão arterial, temperatura, saturação) na sala de pré-atendimento.

### 🩺 Etapa 3: Consulta Médica / Procedimento
• Realizar anamnese clínica completa e escuta ativa dos sintomas.
• Executar exame físico ou procedimento odontológico/médico planejado.
• Emitir prescrições, atestados e pedidos de exames complementares no prontuário.

### 📋 Etapa 4: Exames & Aguardando Laudo
• Orientar o paciente sobre os preparos necessários para a realização dos exames.
• Monitorar o recebimento dos laudos laboratoriais ou relatórios de imagem.
• Anexar resultados diretamente na ficha do paciente.

### 🔄 Etapa 5: Retorno / Conclusão
• Realizar consulta de retorno para avaliação dos exames apresentados.
• Prescrever orientações terapêuticas de longo prazo ou encaminhar para alta médica.
• Agendar check-up preventivo futuro e colher avaliação de satisfação do paciente.`;
  }

  // 9. Oficina Mecânica / Reparos
  if (topico === 'oficina_mecanica') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Oficina Mecânica**: 🔧

### 🚗 Etapa 1: Entrada e Recepção
• Fazer checklist de entrada do veículo (quilometragem, nível de combustível, fotos da lataria).
• Registrar detalhadamente os sintomas e barulhos descritos pelo proprietário.
• Proteger volante, banco e alavanca de câmbio com capas plásticas descartáveis.

### 🔍 Etapa 2: Diagnóstico Técnico & Orçamento
• Colocar o veículo no elevador e passar scanner de diagnóstico eletrônico.
• Listar todas as peças danificadas e cotar preços com distribuidores de autopeças.
• Calcular o tempo estimado de mão de obra e redigir o orçamento formal.

### 📞 Etapa 3: Aguardando Aprovação do Cliente
• Enviar orçamento detalhado para o cliente via WhatsApp com fotos e vídeos das peças desgastadas.
• Explicar a urgência de cada item (crítico de segurança vs manutenção preventiva).
• Colher autorização formal por escrito antes de iniciar qualquer serviço.

### 🔧 Etapa 4: Execução do Serviço
• Receber peças novas e conferir aplicação correta para o modelo do carro.
• Executar a substituição mecânica/elétrica aplicando o torque correto com torquímetro.
• Descartar peças velhas e fluidos contaminados de acordo com normas ambientais.

### 🏁 Etapa 5: Teste de Rodagem e Entrega
• Realizar teste de rodagem de segurança com o veículo para atestar o conserto.
• Efetuar lavagem de cortesia e aspirar o interior do veículo.
• Faturar a Ordem de Serviço, emitir certificado de garantia e entregar as chaves ao cliente!`;
  }

  // 10. Marcenaria / Móveis Planejados
  if (topico === 'marcenaria_moveis') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Marcenaria e Móveis Planejados**: 🪑

### 📐 Etapa 1: Projeto & Medição Técnica
• Fazer visita técnica ao imóvel com trena a laser para medição milimétrica das paredes e pontos elétricos/hidráulicos.
• Ajustar projeto 3D no software de marcenaria e colher assinatura de aprovação do cliente.
• Gerar lista de ferragens (corrediças, amortecedores, puxadores) e plano de corte das chapas de MDF.

### 🪵 Etapa 2: Corte & Furação
• Cortar chapas nas seccionadoras respeitando o veio da madeira e a espessura contratada.
• Aplicar fita de borda de PVC nas faces expostas com coladeira de borda industrial.
• Realizar furações para cavilhas, minifix e dobradiças conforme o gabarito.

### 🔩 Etapa 3: Pré-montagem na Oficina
• Montar os caixotes e módulos na oficina para checar esquadro e nivelamento.
• Testar o deslizamento suave das gavetas telescópicas e fechamento de portas com amortecimento.
• Desmontar com identificação de cada peça ou embalar módulos montados.

### 🚚 Etapa 4: Transporte & Embalagem
• Proteger cantos com cantoneiras de papelão e embalar módulos inteiros com plástico bolha e filme stretch.
• Carregar no caminhão com mantas acolchoadas e amarrações para evitar riscos durante o trajeto.
• Descarregar cuidadosamente no local da obra do cliente.

### 🏠 Etapa 5: Montagem Final & Entrega
• Fixar módulos nas paredes com buchas adequadas e travar alinhamento com parafusos de união.
• Regular portas e frentes de gaveta para manter frestas perfeitas.
• Fazer limpeza completa de poeira e cola, colher assinatura no Termo de Entrega e tirar fotos para o portfólio!`;
  }

  // 11. Confeitaria / Padaria
  if (topico === 'confeitaria_padaria') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Confeitaria e Padaria**: 🎂

### 📥 Etapa 1: Encomenda & Ficha Técnica
• Registrar sabor da massa, tipo de recheio, tema decorativo, peso/tamanho e data/hora de entrega.
• Calcular quantidade exata de ingredientes com base na ficha técnica da confeitaria.
• Confirmar recebimento do sinal de 50% para reserva de data na agenda de produção.

### 🥣 Etapa 2: Pesagem & Batimento (Massa)
• Pesar farinha, manteiga, ovos, açúcar e fermento com balança de alta precisão.
• Bater massas na batedeira no tempo exato para obter a textura ideal.
• Assar em forno pré-aquecido com controle de temperatura e fazer teste do palito antes de retirar.

### 🍓 Etapa 3: Recheio & Montagem
• Cozinhar brigadeiros, geleias ou cremes até o ponto de recheio e deixar esfriar totalmente.
• Nivelar fatias de bolo, umedecer com calda na medida certa e aplicar camadas de recheio com aro de contenção.
• Prensá-lo na geladeira por pelo menos 6 horas para garantir estabilidade estrutural.

### 🎨 Etapa 4: Confeitaria & Decoração
• Preparar cobertura (chantininho, buttercream ou ganache) com ponto ideal para espatular.
• Aplicar corantes, texturas, folhas de ouro ou modelagens em pasta americana conforme o tema solicitado.
• Tirar fotos profissionais com iluminação adequada para divulgar nas redes sociais.

### 📦 Etapa 5: Embalagem & Retirada/Entrega
• Acomodar o bolo em base rígida e caixa alta segura com visor transparente.
• Orientar o cliente sobre cuidados de transporte (sempre no assoalho do carro, nunca no banco inclinado!).
• Coletar comprovante de entrega assinado e saldo final do pagamento.`;
  }

  // 12. TI / Desenvolvimento de Software
  if (topico === 'ti_software') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Desenvolvimento de Software**: 💻

### 📋 Etapa 1: Backlog & Especificação
• Redigir história de usuário com critérios de aceite claros e objetivos no cartão.
• Anexar protótipos de tela (Figma/wireframes) e mapear dependências técnicas.
• Estimar esforço (story points ou horas) e aprovar no planejamento do sprint.

### 💻 Etapa 2: Desenvolvimento
• Criar branch técnica a partir da branch principal com padrão de nomenclatura da equipe.
• Desenvolver o código seguindo padrões de arquitetura limpa e boas práticas da linguagem.
• Escrever testes unitários e de integração para cobrir a nova funcionalidade.

### 🔍 Etapa 3: Code Review & Testes
• Abrir Pull Request (PR) com descrição clara das mudanças e prints demonstrativos.
• Realizar revisão cruzada de código por ao menos um desenvolvedor sênior.
• Garantir aprovação de 100% dos testes automatizados e do linter na esteira de CI.

### 🧪 Etapa 4: Homologação / QA
• Efetuar deploy automatizado no ambiente de homologação/staging.
• Testador ou Product Owner valida os cenários de teste e critérios de aceite.
• Reportar eventuais bugs diretamente nos comentários da tarefa para correção rápida.

### 🚀 Etapa 5: Produção & Monitoramento
• Efetuar merge na branch principal e acionar pipeline de deploy em produção.
• Monitorar painel de erros e telemetria nos primeiros 30 minutos pós-lançamento.
• Atualizar documentação de release notes e notificar os usuários impactados!`;
  }

  // 13. Imobiliária / Locação
  if (topico === 'imobiliaria') {
    return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa do fluxo de **Imobiliária e Locação**: 🏠

### 🎯 Etapa 1: Lead / Interesse
• Cadastrar dados do cliente interessado, telefone e canal de origem (portal, site, indicação).
• Mapear preferências (localização, valor máximo de condomínio/aluguel, número de vagas e pets).
• Enviar seleção de 3 a 5 imóveis compatíveis via link direto de WhatsApp.

### 🔑 Etapa 2: Agendamento & Visita
• Agendar dia e horário de visita com o proprietário ou retirar chaves na portaria.
• Acompanhar o cliente no imóvel prestando consultoria sobre o condomínio e a vizinhança.
• Colher feedback pós-visita em até 24 horas.

### 📑 Etapa 3: Proposta & Análise Cadastral
• Formalizar proposta de locação por escrito com valor ofertado e data de início pretendida.
• Solicitar documentos do pretendente (holerites, declaração de IR, certidões negativas).
• Submeter cadastro para análise de crédito e aprovação de seguro-fiança ou fiador.

### ✍️ Etapa 4: Elaboração de Contrato
• Elaborar minuta do contrato de locação com base na Lei do Inquilinato.
• Enviar contrato para assinatura digital das partes envolvidas via plataforma segura.
• Confirmar contratação do seguro contra incêndio obrigatório.

### 🏁 Etapa 5: Vistoria & Entrega das Chaves
• Realizar vistoria de entrada detalhada com fotos em alta resolução de todos os cômodos e aparelhos.
• Coletar assinatura no Termo de Vistoria de Entrada.
• Entregar as chaves ao inquilino e iniciar a gestão mensal de cobrança do aluguel!`;
  }

  // 14. Montagem de PC / Hardware / Computadores
  if (topico === 'montagem_pc_hardware') {
    return `Aqui está o checklist prático de **tarefas e procedimentos técnicos** para cada etapa da **Montagem de PC**: 🖥️

### 📋 Etapa 1: Análise de Compatibilidade & Orçamento
• **Checar soquete e chipset**: Garantir que a placa-mãe suporta nativamente a CPU (ou se precisará de atualização de BIOS via BIOS Flashback).
• **Dimensionar potência da fonte**: Somar TDP da CPU + GPU e adicionar margem mínima de 30% com selo 80 Plus certificado.
• **Verificar folga física no gabinete**: Conferir altura máxima do air cooler e comprimento máximo da placa de vídeo (GPU clearance).
• **Validar frequência e padrão de RAM**: Confirmar compatibilidade com a controladora de memória (DDR4 ou DDR5).

### 📦 Etapa 2: Separação de Peças & Preparo da Bancada
• **Aterrar bancada antiestática**: Conectar pulseira antiestática para evitar descargas eletrostáticas (ESD) nos componentes sensíveis.
• **Inspecionar socket da placa-mãe**: Usar boa iluminação para checar se nenhum pino LGA ou contato está empenado.
• **Separar parafusos e espaçadores**: Deixar prontos os parafusos corretos de placa-mãe, SSD NVMe e fonte de alimentação.
• **Checar lacres de garantia das caixas**: Garantir que todos os componentes são 100% novos e lacrados.

### 🛠️ Etapa 3: Montagem Física & Cable Management
• **Instalar CPU e memórias na placa fora do gabinete**: Colocar o processador sem forçar e travar memórias nos slots recomendados para Dual-Channel (slots 2 e 4).
• **Instalar SSD NVMe**: Parafusar com o dissipador térmico original da placa-mãe (retirando o plástico azul de proteção térmica!).
• **Aplicar pasta térmica**: Aplicar quantidade precisa (grão de ervilha central) e fixar cooler com aperto em cruz.
• **Instalar espaçadores (standoffs) no gabinete**: Nunca parafusar a placa direto no metal do chassi.
• **Fixar fonte e passar cabos principais**: Conectar cabo 24 pinos, cabos EPS de 8 pinos da CPU e cabos PCIe da GPU antes de prender a placa.
• **Organizar cabos (Cable Management)**: Usar abraçadeiras na parte traseira para deixar o fluxo de ar frontal totalmente livre.

### 🔌 Etapa 4: Primeiro POST, Atualização de BIOS & Teste de Estresse
• **Ligar e validar boot inicial (POST)**: Checar se os LEDs de depuração (Debug LEDs) da placa-mãe apagam normalmente e geram vídeo.
• **Atualizar BIOS para versão estável**: Instalar a versão recomendada pelo fabricante via pendrive formatado em FAT32.
• **Ativar XMP (Intel) ou EXPO (AMD)**: Garantir que as memórias rodam na frequência máxima rotulada em vez do padrão de 2133/2666 MHz.
• **Instalar Windows e drivers atualizados**: Instalar drivers oficiais de chipset e placa de vídeo direto do site do fabricante.
• **Rodar teste de estresse térmico**: Executar Cinebench e FurMark por 30 minutos monitorando temperaturas (CPU abaixo de 80°C e GPU abaixo de 75°C).

### 🏁 Etapa 5: Acabamento, Proteção Interna & Entrega
• **Remover plásticos de proteção**: Retirar películas das partes em acrílico, espelhos e vidro temperado.
• **Colocar espuma/bolha interna expansível**: Se o cliente for transportar o PC com GPU pesada, calçar a placa internamente para evitar quebra do slot PCIe.
• **Guardar caixas e cabos extras**: Juntar manuais, antenas Wi-Fi e cabos modulares sobressalentes na caixa da placa-mãe.
• **Emitir laudo de benchmarks e termo de garantia**: Anexar prints de temperatura e entregar a máquina pronta ao cliente! 🎉`;
  }

  // 15. Sintetizador Dinâmico de Tarefas
  return sintetizarTarefasDinamicas(tema);
}

// Sintetizador Dinâmico Inteligente de Tarefas por Etapa
function sintetizarTarefasDinamicas(temaOriginal) {
  const tema = (temaOriginal || 'este processo').trim();
  const temaCap = tema.charAt(0).toUpperCase() + tema.slice(1);
  const t = tema.toLowerCase();

  if (t.includes('montar') || t.includes('montagem') || t.includes('fabric') || t.includes('produz') || t.includes('prepar') || t.includes('faz') || t.includes('cria') || t.includes('constru')) {
    return `Aqui está o checklist prático de **tarefas e procedimentos operacionais** para cada etapa de **${temaCap}**: ⚙️

### 📋 Etapa 1: Especificação & Validação Técnica de ${temaCap}
• Levantar todos os requisitos técnicos, medidas e especificações com o cliente ou solicitante.
• Elaborar a lista detalhada de peças, insumos e ferramentas necessárias.
• Apresentar o orçamento detalhado e validar o prazo de entrega final.

### 📦 Etapa 2: Separação de Insumos & Preparação da Bancada
• Separar fisicamente todas as matérias-primas e componentes em bancada organizada.
• Realizar inspeção visual inicial contra avarias, fissuras ou defeitos prévios de fabricação.
• Calibrar ferramentas e instrumentos de medição necessários para a atividade.

### 🛠️ Etapa 3: Montagem / Fabricação Ativa de ${temaCap}
• Executar a montagem ou fabricação seguindo à risca o procedimento operacional padrão (POP).
• Registrar o tempo de execução e o responsável técnico pelo lote no cartão do Kanban.
• Aplicar técnicas de acabamento e encaixe de alta precisão.

### 🧪 Etapa 4: Testes de Funcionamento & Controle de Qualidade
• Submeter o produto a testes práticos de tolerância, estresse e funcionalidade.
• Inspecionar o acabamento estético final garantindo ausência de marcas ou falhas.
• Colher a aprovação formal do líder de controle de qualidade no cartão.

### 🏁 Etapa 5: Embalagem, Termo de Garantia & Conclusão
• Acondicionar o item em embalagem segura e protegida contra impactos de transporte.
• Emitir o certificado de garantia e a nota fiscal da entrega.
• Mover o cartão para Concluído no Kanban e comemorar a entrega com sucesso! 🎉`;
  }

  return `Aqui está o checklist prático de **tarefas operacionais** para cada etapa de **${temaCap}**: 🎯

### 📥 Etapa 1: Entrada da Demanda & Triagem de ${temaCap}
• Registrar os dados completos do cliente ou solicitante no cartão.
• Checar se todos os documentos e requisitos iniciais foram anexados.
• Definir a prioridade e atribuir o responsável técnico no quadro.

### 📋 Etapa 2: Planejamento de Escopo & Preparo de Recursos
• Separar os recursos, insumos, acessos ou ferramentas de trabalho necessárias.
• Elaborar o cronograma de entrega e definir prazo final no cartão.
• Alinhar com a equipe as diretrizes e metas da demanda.

### 🚀 Etapa 3: Execução Técnica Ativa
• Executar a tarefa principal conforme os procedimentos padrão recomendados.
• Registrar anotações e atualizações de progresso no histórico do cartão.
• Comunicar bloqueios ou impedimentos imediatamente ao líder.

### 🔍 Etapa 4: Revisão, Ajustes & Controle de Qualidade
• Inspecionar o resultado final antes da entrega (conferência minuciosa de erros).
• Testar o funcionamento ou aprovar conformidade técnica dos entregáveis.
• Colher aprovação de um supervisor ou responsável técnico.

### 🏁 Etapa 5: Entrega Final, Validação & Fechamento
• Entregar o produto ou serviço ao cliente/solicitante.
• Emitir notas fiscais, termos de recebimento assinados ou laudos técnicos.
• Mover o cartão para Concluído no Kanban e registrar a finalização com sucesso! 🎉`;
}

// ============================================================================
// MOTOR COGNITIVO DETERMINÍSTICO (Responde com linguagem acolhedora e palatável)
// ============================================================================


function analisarPerguntaCognitiva(pergunta, historico, contextoBanco, usuarioNome) {
  const p = (pergunta || '').toLowerCase().trim();
  const topicoAtivo = extrairTopicoAtivo(pergunta, historico);
  const temaAtivo = extrairTemaAtivo(pergunta, historico);

  // Saudações e Apresentação
  if (
    p.includes('olá') || p.includes('ola') || p.includes('oi') ||
    p.includes('bom dia') || p.includes('boa tarde') || p.includes('boa noite') ||
    p.includes('quem é você') || p.includes('quem e voce') || p.includes('qual seu nome')
  ) {
    return `Olá${usuarioNome && usuarioNome !== 'Usuário' ? `, ${usuarioNome}` : ''}! Sou o **Vinculum IA**, seu assistente de gestão de processos organizacionais. 🤝\n\nEstou aqui para apoiar o dia a dia da sua empresa em:\n• **Conhecer cada tela**: Entenda o que faz o *Dashboard*, *Processos*, *Fluxo Kanban*, *Tarefas*, *Tabela* e *Usuários*.\n• **Executar ações práticas**: Como criar novos processos, cadastrar tarefas, mover cartões e exportar relatórios para CSV.\n• **Melhorar seus fluxos**: Dicas de gestão enxuta, eliminação de gargalos e desenho de fluxos personalizados para o seu ramo de atuação.\n\nComo posso ajudar você agora?`;
  }

  // 1. TAREFAS POR ETAPA / CHECKLISTS
  const querTarefas = !p.includes('atrasad') && !p.includes('vencid') && !p.includes('como criar') && !p.includes('como editar') && !p.includes('como excluir') && !p.includes('como ver') && (
    [
      'atividades', 'checklist', 'o que fazer em cada etapa', 'o que fazer em cada coluna',
      'quais seriam as tarefas', 'quais tarefas', 'tarefas pra cada etapa',
      'tarefas para cada etapa', 'tarefas de cada etapa', 'tarefas em cada etapa', 'tarefas por etapa',
      'atividades de cada etapa', 'atividades pra cada etapa', 'atividades para cada etapa',
      'checklist desse processo', 'checklist de cada etapa', 'quais sao as tarefas', 'quais são as tarefas'
    ].some(k => p.includes(k)) ||
    (p.includes('tarefas') && (p.includes('etapa') || p.includes('coluna') || p.includes('processo') || p.includes('desse') || p.includes('vendas') || p.includes('compras') || p.includes('rh') || p.includes('financeiro') || p.includes('oficina') || p.includes('clínica') || p.includes('clinica')))
  );

  if (querTarefas) {
    return gerarChecklistTarefasPorEtapa(topicoAtivo, temaAtivo);
  }

  // 2. DICAS DE GESTÃO / BOAS PRÁTICAS / GARGALOS PARA PMES
  if (
    p.includes('boas praticas') || p.includes('boas práticas') ||
    p.includes('melhores praticas') || p.includes('melhores práticas') ||
    p.includes('gargalo') || p.includes('gargalos') || p.includes('produtividade')
  ) {
    return CONHECIMENTO_SISTEMA.boasPraticasPME;
  }

  // 3. FLUXO IDEAL POR NICHO — prioridade máxima
  const indicioFluxoIdeal =
    p.includes('fluxo ideal') || p.includes('melhor fluxo') ||
    p.includes('sugestao de fluxo') || p.includes('sugestão de fluxo') ||
    p.includes('sugira um fluxo') || p.includes('sugira etapas') ||
    p.includes('sugerir o fluxo') || p.includes('sugerir fluxo') ||
    p.includes('como estruturar') || p.includes('estruturar o suporte') ||
    p.includes('estruturar o fluxo') || p.includes('estruturar um fluxo') ||
    p.includes('estruturar o processo') || p.includes('estruturar um processo') ||
    p.includes('como organizar o processo') ||
    p.includes('fluxo de processos para') || p.includes('fluxo de processo para') ||
    p.includes('fluxo para') || p.includes('fluxo pra') ||
    p.includes('processo para') || p.includes('processo pra') ||
    p.includes('etapas para') || p.includes('etapas pra') ||
    p.includes('exemplo de fluxo') || p.includes('exemplo de processo') ||
    (p.includes('quero fazer um fluxo') && !p.includes('tela')) ||
    ((p.includes('fluxo') || p.includes('processo')) && (
      p.includes('recebimento') || p.includes('mercadoria') || p.includes('almoxarifado') ||
      p.includes('restaurante') || p.includes('sopa') || p.includes('cozinha') || p.includes('confeitaria') ||
      p.includes('vendas') || p.includes('compras') || p.includes('oficina') || p.includes('atendimento') ||
      p.includes('suporte') || p.includes('clinica') || p.includes('clínica') || p.includes('marcenaria') ||
      p.includes('fabricar') || /\b(rh|ti|pc)\b/i.test(p) || p.includes('recrutamento') ||
      p.includes('financeiro') || p.includes('contas a pagar') || p.includes('software') ||
      p.includes('imobiliaria') || p.includes('imóvel') || p.includes('imovel') || p.includes('computador')
    ));

  if (indicioFluxoIdeal) {
    return gerarConsultoriaFluxo(topicoAtivo, pergunta, temaAtivo);
  }

  // 4. EXPORTAÇÃO
  if (p.includes('exportar') || p.includes('csv') || p.includes('excel') || p.includes('relatorio') || p.includes('relatório') || p.includes('planilha')) {
    return `Para exportar os dados das suas tarefas para o Excel ou Google Sheets: 📑\n\n1. Clique na aba **Tabela** no menu lateral.\n2. (Opcional) Utilize os filtros para escolher um processo, status ou período desejado.\n3. Clique no botão **"Exportar CSV"** no canto superior direito.\n\nO arquivo será baixado imediatamente no seu computador com todas as tarefas, etapas, datas, responsáveis e campos customizados organizados!`;
  }

  // 5. ADICIONAR ETAPA / COLUNA
  if ((p.includes('criar') || p.includes('nova') || p.includes('adicionar') || p.includes('como colocar') || p.includes('adiciona')) && (p.includes('etapa') || p.includes('coluna'))) {
    return `Para adicionar uma nova etapa ou coluna no seu fluxo Kanban: 📋\n\n1. Acesse o menu **Processos** e clique no fluxo desejado para abrir o Kanban.\n2. Na barra de ferramentas no topo do quadro, clique no botão **"Nova Etapa"**.\n3. Digite o **Nome da Etapa** (por exemplo: *Triagem*, *Aguardando Fornecedor* ou *Em Revisão*).\n4. Clique em **Salvar Etapa**.\n\nA nova coluna aparecerá imediatamente à direita do quadro! Você pode arrastar o cabeçalho da coluna para os lados para reordenar a sequência a qualquer momento. 🎉`;
  }

  // 6. RENOMEAR ETAPA
  if ((p.includes('editar') || p.includes('renomear') || p.includes('mudar o nome') || p.includes('alterar o nome')) && (p.includes('etapa') || p.includes('coluna'))) {
    return `Para alterar o nome de uma etapa no quadro Kanban: ✏️\n\n1. Abra o quadro Kanban do processo desejado.\n2. No cabeçalho da coluna correspondente, clique no ícone de lápis (Editar Etapa).\n3. Digite o novo nome e confirme o salvamento.\n\nO nome da coluna é atualizado instantaneamente para toda a equipe!`;
  }

  // 7. EXCLUIR ETAPA
  if ((p.includes('excluir') || p.includes('remover') || p.includes('apagar') || p.includes('deletar')) && (p.includes('etapa') || p.includes('coluna'))) {
    return `Para excluir uma etapa do quadro Kanban: 🗑️\n\n1. No cabeçalho da coluna que deseja remover, clique no ícone de lixeira (Excluir Etapa).\n2. O sistema solicitará sua confirmação de segurança.\n\n💡 *Atenção:* Recomendamos mover as tarefas que estão nessa etapa para outra coluna antes de excluí-la, garantindo que o histórico e as atividades fiquem preservados!`;
  }

  // 8. REORDENAR
  if (p.includes('reordenar') || p.includes('ordem das etapas') || p.includes('trocar etapas') || p.includes('mudar ordem das colunas')) {
    return `Para reorganizar as colunas e etapas no quadro Kanban: 🔄\n\n• **Arrastar Cabeçalhos**: No fluxo do processo, clique e segure no cabeçalho da coluna e arraste horizontalmente para a posição desejada.\n• **Salva Automaticamente**: A nova sequência é salva no banco de dados imediatamente e sincronizada com toda a sua equipe!`;
  }

  // 9. EXCLUIR PROCESSO
  if ((p.includes('excluir') || p.includes('remover') || p.includes('apagar') || p.includes('deletar') || p.includes('o que acontece se excluir')) && p.includes('processo')) {
    return `Para excluir um processo do Vinculum: 🗑️\n\n1. Acesse o menu **Processos** no menu lateral.\n2. Localize o cartão do fluxo que deseja remover.\n3. Clique no ícone de lixeira (Excluir Processo) no cartão e confirme a exclusão.\n\n⚠️ **O que acontece ao excluir um processo? (Exclusão em Cascata)**:\nO Vinculum remove permanentemente o processo, todas as etapas configuradas nele e todas as tarefas e históricos vinculados a esse fluxo. Só execute caso tenha certeza absoluta!`;
  }

  // 10. EDITAR PROCESSO
  if ((p.includes('editar') || p.includes('renomear') || p.includes('alterar')) && p.includes('processo')) {
    return `Para editar o nome ou a descrição de um processo existente: ✏️\n\n1. Acesse o menu **Processos** no menu lateral.\n2. No cartão do processo que deseja modificar, clique no ícone de lápis (Editar Processo).\n3. Atualize o **Nome do Processo** ou a **Descrição**.\n4. Clique em **Salvar Processo**.`;
  }

  // 11. CRIAR PROCESSO
  if ((p.includes('criar') || p.includes('novo') || p.includes('adicionar')) && (p.includes('processo') || p.includes('fluxo'))) {
    return `Criar um novo fluxo no Vinculum é muito fácil e leva menos de um minuto: 🚀\n\n1. No menu lateral, clique na aba **Processos**.\n2. Clique no botão **"Novo Processo"** no canto superior direito.\n3. Escolha um nome claro (como *Atendimento*, *Vendas*, *Compras* ou *Financeiro*) e uma breve descrição.\n4. Clique em **Salvar Processo**.\n\nO Vinculum já inicia automaticamente com as 3 etapas essenciais (*A Fazer*, *Em Andamento*, *Concluído*). A partir daí, você pode adicionar novas tarefas ou criar mais etapas!`;
  }

  // 12. CRIAR TAREFA
  if ((p.includes('criar') || p.includes('nova') || p.includes('adicionar')) && p.includes('tarefa')) {
    return `Para criar uma nova tarefa no Vinculum, siga estes passos simples: ✍️\n\n1. Acesse o menu **Processos** e clique no fluxo desejado para abrir o Kanban.\n2. No canto superior direito, clique no botão **"Nova Tarefa"**.\n3. Digite o **Título da Tarefa** (por exemplo: *"Emitir proposta para Cliente X"*).\n4. Escolha a **Etapa inicial**, o **Responsável** e o **Prazo** de entrega.\n5. Preencha eventuais campos personalizados (como valores ou observações) e clique em **Criar Tarefa**.\n\nO cartão aparecerá imediatamente na coluna selecionada, pronto para ser trabalhado pela equipe! 🎉`;
  }

  // 13. EDITAR TAREFA
  if ((p.includes('editar') || p.includes('alterar') || p.includes('mudar')) && p.includes('tarefa') && !p.includes('etapa') && !p.includes('coluna')) {
    return `Para editar uma tarefa existente: 📝\n\n1. No quadro Kanban ou na tela de Tabela, clique sobre o cartão da tarefa desejada.\n2. A tela ou janela de detalhes se abrirá com todos os dados da atividade.\n3. Você pode alterar o **Título**, **Descrição**, **Responsável**, **Prazo de Entrega** e valores dos **Campos Personalizados**.\n4. As alterações ficam salvas e registradas na linha do tempo de auditoria!`;
  }

  // 14. EXCLUIR TAREFA
  if ((p.includes('excluir') || p.includes('remover') || p.includes('apagar') || p.includes('deletar')) && p.includes('tarefa')) {
    return `Para excluir uma tarefa no Vinculum: 🗑️\n\n1. Clique na tarefa no Kanban ou na Tabela para abrir seus detalhes.\n2. Localize o botão **"Excluir Tarefa"** no rodapé dos detalhes.\n3. Confirme a exclusão na janela de aviso.\n\nA tarefa será removida da coluna e não aparecerá mais nos relatórios ou contadores!`;
  }

  // 15. PRAZO
  if (p.includes('prazo') || p.includes('data de entrega') || p.includes('data de vencimento') || p.includes('vencimento')) {
    return `Para definir ou alterar o prazo de entrega de uma tarefa: 📅\n\n1. Ao criar uma nova tarefa (ou ao clicar em uma tarefa existente para editá-la), localize o campo **"Prazo"**.\n2. Selecione a data desejada no calendário.\n3. Salve a tarefa.\n\n✨ **Alertas de Atraso Automáticos**:\n• No Kanban: Tarefas que ultrapassarem o prazo ganham destaque com alerta visual avermelhado.\n• Na Tabela: Você pode filtrar especificamente por tarefas com situação *Atrasada* para agir preventivamente!`;
  }

  // 16. RESPONSÁVEL
  if (p.includes('responsável') || p.includes('responsavel') || p.includes('atribuir') || p.includes('dono da tarefa') || p.includes('quem vai fazer')) {
    return `Para definir ou mudar o responsável por uma tarefa: 👤\n\n1. Abra o formulário de criação da tarefa (ou clique na tarefa já existente para editar).\n2. No campo **Responsável**, abra a lista suspensa e selecione o colaborador desejado da sua equipe.\n3. Salve a tarefa.\n\nO nome do responsável passa a aparecer diretamente no cartão visual do Kanban e serve como filtro na tela de Tabela!`;
  }

  // 17. MOVER / ARRASTAR
  if (p.includes('arrastar') || p.includes('como mover') || p.includes('mover uma tarefa') || p.includes('mover tarefa')) {
    return `No quadro Kanban do Vinculum, movimentar o trabalho é totalmente visual e intuitivo: 🔄\n\n• **Mover Tarefas**: Clique e segure no cartão da tarefa, arraste até a coluna de destino e solte. O sistema atualiza o status na hora e registra quem moveu no histórico.\n• **Reordenar Etapas**: Clique e segure no cabeçalho da coluna (etapa) e arraste para os lados para reorganizar a ordem do fluxo de trabalho.\n• **Campos Obrigatórios**: Se a etapa de destino exigir algum dado (como o *Número da Nota Fiscal*), uma janela se abrirá para preenchimento antes de concluir a mudança.`;
  }

  // 18. CAMPOS PERSONALIZADOS
  if ((p.includes('adicionar campo') || p.includes('criar campo') || p.includes('campo de valor') || p.includes('campo de dinheiro') || p.includes('campo de moeda') || p.includes('como colocar valor') || p.includes('adicionar valor')) && !indicioFluxoIdeal) {
    return `Para adicionar campos personalizados (como valores em R$, datas ou caixas de seleção) no seu fluxo: 🛠️\n\n1. Acesse o menu **Processos** e abra o Kanban do fluxo desejado.\n2. No menu superior, clique no botão **"Campos da Tarefa"**.\n3. Digite o **Nome do Campo** (por exemplo: *Valor do Orçamento*, *Número da NF* ou *Telefone do Cliente*).\n4. Escolha o **Tipo do Campo**:\n   • 💰 *Moeda (R$)*: para valores financeiros com formatação em Reais.\n   • 📝 *Texto* ou *Área de Texto*: para descrições, códigos e briefings.\n   • 📅 *Data*: para vencimentos e datas de inspeção.\n   • 🔢 *Número*: para quantidades ou pontuações.\n   • 🏷️ *Seleção (Select)*: menu com opções pré-definidas.\n   • ☑️ *Checkbox*: caixas de confirmação.\n5. (Opcional) Defina se o campo é obrigatório apenas ao mover para uma etapa específica.\n6. Clique em **Salvar Campo**!`;
  }

  // 19. TAREFAS ATRASADAS
  if (p.includes('tarefas atrasadas') || p.includes('tarefa atrasada') || p.includes('ver atrasos') || p.includes('tarefas vencidas') || p.includes('vencidas')) {
    return `Você pode monitorar tarefas atrasadas em 3 lugares estratégicos no Vinculum: ⚠️\n\n1. 📊 **No Dashboard**: O indicador **"Tarefas Atrasadas"** mostra o número exato de atividades com prazo estourado em toda a empresa.\n2. 📑 **Na tela Tabela**: No filtro de **Situação**, escolha a opção **"Atrasadas"**. A tabela listará apenas os cartões vencidos, indicando o responsável, o processo e a etapa onde o trabalho está parado!\n3. 📋 **No quadro Kanban**: Os cartões que passaram da data limite exibem um alerta visual destacado em vermelho para ação imediata da equipe.`;
  }

  // 20. FILTROS DA TABELA
  if ((p.includes('filtro') || p.includes('filtrar') || p.includes('filtros')) && p.includes('tabela')) {
    return `A tela de **Tabela** possui filtros combinados para localizar qualquer demanda em segundos: 🔍\n\n• **Busca Livre**: Digite qualquer palavra para buscar em títulos de tarefas, responsáveis ou valores de campos customizados.\n• **Filtro por Processo**: Escolha um departamento específico para ver apenas as tarefas daquele fluxo (inclusive revelando as colunas dos campos personalizados daquele processo).\n• **Filtro por Etapa**: Visualize apenas as tarefas que estão em uma coluna específica do Kanban.\n• **Filtro por Situação**: Alterne entre *Todas*, *Pendentes*, *Concluídas* ou *Atrasadas*.\n• **Filtro por Prazo**: Filtre tarefas vencendo *Hoje*, *Com Prazo* ou *Sem Prazo*.\n\n💡 Após aplicar os filtros, você pode clicar no botão **"Exportar CSV"** para baixar a planilha filtrada!`;
  }

  // 21. WIP
  if (p.includes('wip') || p.includes('work in progress') || p.includes('trabalho em andamento') || p.includes('limite de tarefas')) {
    return `**WIP (Work In Progress)** significa *Trabalho Em Andamento* e é um dos pilares mais importantes da metodologia Kanban! 🚧\n\nPor que limitar o WIP é essencial para PMEs:\n1. 🎯 **Foco e Conclusão**: O lema do Kanban é *"Pare de começar e comece a terminar!"*. Quando a equipe tenta fazer 10 coisas ao mesmo tempo, nenhuma é entregue com qualidade.\n2. ⚠️ **Visibilidade de Gargalos**: Se uma etapa acumular muitos cartões, o fluxo trava. Ao limitar o volume de cartões por etapa, o time é forçado a desobstruir o que está parado antes de puxar trabalho novo.\n3. ⏱️ **Redução do Tempo de Ciclo**: Quanto menos cartões estiverem abertos simultaneamente, mais rápido cada pedido é entregue ao cliente final.`;
  }

  // 22. QUANTAS ETAPAS
  if (p.includes('quantas etapas') || p.includes('tamanho ideal') || p.includes('quantas colunas') || p.includes('numero de etapas') || p.includes('número de etapas')) {
    return `Para Pequenas e Médias Empresas (PMEs), a regra de ouro do Vinculum é manter entre **4 e 6 etapas no quadro Kanban**: 🎯\n\nPor que essa quantidade é ideal?\n• **Menos de 3 etapas**: O fluxo fica muito vago (*A Fazer ➔ Fazendo ➔ Pronto*) e esconde onde estão os gargalos reais da operação.\n• **Mais de 6 etapas**: O quadro se torna burocrático e cansativo para a equipe atualizar, aumentando o risco de desorganização.\n\n💡 *Estrutura padrão recomendada*:\n*1. Entrada/Triagem ➔ 2. Preparo ➔ 3. Execução ➔ 4. Revisão/Qualidade ➔ 5. Concluído/Entrega.*`;
  }

  // 23. USUÁRIOS
  if ((p.includes('cadastrar') || p.includes('criar') || p.includes('adicionar') || p.includes('novo')) && (p.includes('usuario') || p.includes('usuário') || p.includes('colaborador') || p.includes('equipe') || p.includes('membro')) && !p.includes('tarefa') && !p.includes('processo')) {
    return `Para cadastrar novos colaboradores na plataforma Vinculum: 👥\n\n1. Faça login com uma conta com perfil de **Administrador**.\n2. No menu lateral, clique na aba **Usuários**.\n3. Clique no botão **"Novo Usuário"** no canto superior direito.\n4. Preencha o **Nome**, **E-mail**, **Senha** inicial e escolha o **Perfil**:\n   • *Administrador*: Acesso total para criar e editar processos, gerenciar etapas e cadastrar novos usuários.\n   • *Usuário*: Focado no dia a dia operacional, criando e movimentando tarefas nas etapas.\n5. Clique em **Salvar**.\n\nO colaborador já poderá fazer login e aparecerá imediatamente na lista de responsáveis das tarefas! 🎉`;
  }

  // 24. LOGIN / SENHA
  if (p.includes('login') || p.includes('autenticação') || p.includes('autenticacao') || p.includes('entrar') || p.includes('sair') || p.includes('logout') || (p.includes('senha') && !p.includes('etapa'))) {
    return `O sistema de autenticação do **Vinculum** é seguro e baseado em tokens JWT: 🔐\n\n• **Login**: Acesse a tela inicial com seu e-mail e senha cadastrados.\n• **Sessão**: O sistema mantém você autenticado com segurança enquanto navega pelas telas.\n• **Sair (Logout)**: Para encerrar a sessão com segurança, clique no botão **"Sair"** no menu lateral.\n• **Alteração de Senha**: Administradores podem atualizar dados e redefinir senhas na tela de **Usuários**!`;
  }

  // 25. PROCESSOS DO BANCO
  if (p.includes('processos') && (p.includes('quais') || p.includes('listar') || p.includes('meus') || p.includes('cadastrado') || p.includes('tem no banco') || p.includes('tenho'))) {
    return `Aqui está o resumo dos processos registrados no seu sistema: 📂\n\n${contextoBanco}\n\n💡 Você pode clicar em qualquer cartão na aba **Processos** para abrir o Kanban ou clicar em **"Novo Processo"** para criar um novo fluxo!`;
  }

  // 26. SOBRE O VINCULUM
  if (
    p.includes('como funciona') || p.includes('sobre o site') || p.includes('sobre o projeto') ||
    p.includes('o que o site faz') || p.includes('o que o projeto faz') || p.includes('para que serve') ||
    p.includes('pra que serve') || p.includes('o que é o vinculum') || p.includes('o que e o vinculum') ||
    p.includes('visao geral') || p.includes('visão geral')
  ) {
    return `${CONHECIMENTO_SISTEMA.visaoGeral}\n\nComo o sistema é organizado:\n1. 📊 **Dashboard**: Resumo executivo com indicadores de processos, tarefas pendentes e prazos.\n2. 📂 **Processos**: Catálogo para criar e personalizar os fluxos de trabalho de cada departamento.\n3. 📋 **Fluxo (Kanban)**: Quadro visual onde as tarefas avançam de coluna em coluna por arrastar e soltar.\n4. 📝 **Tarefa**: Ficha com todos os detalhes da atividade, prazos, responsável e histórico de auditoria.\n5. 📑 **Tabela**: Visão estilo planilha com filtros múltiplos e exportação para Excel/CSV.\n\n💡 *Dica:* Para começar, acesse a aba **Processos** no menu lateral e crie seu primeiro fluxo de trabalho!`;
  }

  // TELAS DO SISTEMA (Tabela, Fluxo, Tarefa, Processos, Usuários, Campos, Dashboard)
  const querTabela = (p.includes('pagina de tabela') || p.includes('página de tabela') || p.includes('tela de tabela') || p.includes('guia tabela') || p.includes('aba tabela') || (p.includes('o que') && p.includes('tabela')) || p.includes('tabela'));
  const querFluxo = (p.includes('pagina de fluxo') || p.includes('página de fluxo') || p.includes('tela de fluxo') || p.includes('guia fluxo') || p.includes('aba fluxo') || (p.includes('o que') && p.includes('fluxo')) || p.includes('kanban'));
  const querTarefa = (p.includes('pagina de tarefa') || p.includes('página de tarefa') || p.includes('tela de tarefa') || p.includes('tela de tarefas') || p.includes('guia tarefa') || p.includes('aba tarefa') || (p.includes('o que') && (p.includes('tarefa') || p.includes('tarefas'))));
  const querProcessos = (p.includes('pagina processos') || p.includes('página processos') || p.includes('tela de processos') || p.includes('guia processos') || p.includes('aba processos') || (p.includes('o que') && (p.includes('processos') || p.includes('processo'))));
  const querUsuarios = (p.includes('pagina de usuario') || p.includes('página de usuário') || p.includes('tela de usuario') || p.includes('guia usuarios') || p.includes('guia de usuários') || p.includes('aba usuario') || (p.includes('o que') && (p.includes('usuario') || p.includes('usuário'))));
  const querCampos = (p.includes('campo personalizado') || p.includes('campos personalizados') || p.includes('customizado') || (p.includes('o que são') && p.includes('campos')));
  const querDashboard = (p.includes('dashboard') || (p.includes('painel') && (p.includes('tela') || p.includes('página'))));

  if (querTabela || querFluxo || querTarefa || querProcessos || querUsuarios || querCampos || querDashboard) {
    let key = 'dashboard';
    if (querTabela && !querFluxo && !querTarefa && !querProcessos && !querUsuarios && !querCampos) {
      key = 'tabela';
    } else if (querFluxo) {
      key = 'fluxo';
    } else if (querTarefa) {
      key = 'tarefa';
    } else if (querProcessos) {
      key = 'processos';
    } else if (querUsuarios) {
      key = 'usuarios';
    } else if (querCampos) {
      key = 'campos';
    } else if (querDashboard) {
      key = 'dashboard';
    }
    return FAQ_RESPOSTAS[key] || CONHECIMENTO_SISTEMA.visaoGeral;
  }

  return null;
}

// ============================================================================
// MOTOR DE CLASSIFICAÇÃO DE INTENÇÃO (para dar contexto ao LLM)
// ============================================================================
function detectarIntencao(mensagem) {
  const p = (mensagem || '').toLowerCase().trim();
  // saudações
  if (p.match(/olá|ola|oi|bom dia|boa tarde|boa noite|quem é você|qual seu nome/)) return 'saudacao';
  // tarefas por etapa
  if (p.match(/tarefas|atividades|checklist|o que fazer/)) return 'tarefas_por_etapa';
  // boas práticas
  if (p.match(/boas práticas?|gargalo|produtividade|wip|work in progress|limite|quantas etapas|tamanho ideal/)) return 'boas_praticas';
  // fluxo ideal por nicho
  if (p.match(/fluxo ideal|melhor fluxo|sugira|sugestão|sugerir|como estruturar|estruturar|como organizar|organizar o (fluxo|processo)|processo para|fluxo para/)) {
    const nicho = detectarNichoTopico(p);
    return nicho !== 'generico' ? `fluxo_ideal_${nicho}` : 'fluxo_ideal_generico';
  }
  // ação prática
  const acoes = {
    criar_processo: ['criar processo', 'novo processo', 'adicionar fluxo'],
    criar_tarefa: ['criar tarefa', 'nova tarefa', 'adicionar tarefa'],
    editar_tarefa: ['editar tarefa', 'mudar tarefa'],
    excluir_tarefa: ['excluir tarefa', 'remover tarefa', 'apagar tarefa'],
    mover_tarefa: ['mover tarefa', 'arrastar tarefa'],
    definir_prazo: ['prazo', 'data de entrega', 'vencimento'],
    responsavel: ['responsável', 'responsavel', 'atribuir', 'dono da tarefa'],
    campo: ['campo personalizado', 'adicionar campo', 'valor', 'moeda'],
    filtros: ['filtro', 'filtrar'],
    exportar: ['exportar', 'csv', 'excel', 'planilha'],
    excluir_processo: ['excluir processo', 'remover processo'],
    reordenar: ['reordenar', 'mudar ordem', 'trocar ordem'],
    tarefas_atrasadas: ['atrasada', 'vencida', 'atraso'],
    usuarios: ['cadastrar usuário', 'novo usuário', 'colaborador', 'equipe'],
    login: ['login', 'senha', 'autenticação', 'entrar']
  };
  for (const [acao, termos] of Object.entries(acoes)) {
    if (termos.some(t => p.includes(t))) return `acao_${acao}`;
  }
  // sobre o produto
  if (p.match(/como funciona|sobre|o que é|o que faz|para que serve/)) return 'sobre';
  return 'neutro';
}

// ============================================================================
// GUARDRAIL DE VALIDAÇÃO DE RESPOSTA DO LLM
// ============================================================================
const PALAVRAS_CHAVE_DO_VINCULUM = [
  'vinculum', 'kanban', 'tarefa', 'processo', 'dashboard', 'tabela', 'fluxo',
  'etapa', 'responsável', 'prazo', 'etapas', 'cartão', 'arrastar',
  'exportar', 'csv', 'campo', 'usuário', 'banco'
];

function validarRespostaLLM(resposta, mensagemUsuario, intencao) {
  const txt = (resposta || '').toLowerCase();

  // Resposta vazia ou lixo
  if (!txt || !txt.trim() || txt.length < 20) return false;

  // Se o motor cognitivo já tinha intenção de saudação
  if (intencao === 'saudacao') return Boolean(txt.match(/olá|oi|bom dia|boa tarde|boa noite|vinculum ia/));

  const temPalavraChave = PALAVRAS_CHAVE_DO_VINCULUM.some(w => txt.includes(w.toLowerCase()));
  if (!temPalavraChave) return false;

  // Verifica se o LLM não começou a dar conselho genérico de gestão fora do Vinculum
  const frases_fantasma = ['em resumo', 'no geral', 'é importante', 'aconselho que', 'lembre-se de', 'para ter sucesso'];
  if (frases_fantasma.some(f => txt.includes(f)) && !txt.includes('vinculum') && !txt.includes('kanban')) return false;

  return true;
}

// ============================================================================
// CONSULTA LLM COM GUARDRAIL (Pollinations retry + Gemini)
// ============================================================================
async function consultarLLMRapido(mensagens, tentativa = 1) {
  const MAX_TENTATIVAS = 2;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const resp = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({ messages: mensagens, temperature: 0.6 }),
    });
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const texto = data.choices?.[0]?.message?.content;
      if (texto && texto.trim() && texto.trim().length >= 25) return texto.trim();
    }
  } catch (e) {
    // ignora
  }

  // Retry uma vez
  if (tentativa < MAX_TENTATIVAS) {
    console.warn('[chatbot] Pollinations falhou, retestando...');
    return consultarLLMRapido(mensagens, tentativa + 1);
  }
  return null;
}

async function consultarGemini(mensagens) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    const contents = mensagens
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: mensagens.find(m => m.role === 'system')?.content || '' }] },
          contents,
          generationConfig: { temperature: 0.6, maxOutputTokens: 1400 },
        }),
      }
    );
    clearTimeout(timeout);

    if (resp.ok) {
      const data = await resp.json();
      const txt = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txt && txt.trim() && txt.trim().length >= 25) return txt.trim();
    }
  } catch (e) {
    // ignora
  }
  return null;
}

// ============================================================================
// CONTROLLER PRINCIPAL
// ============================================================================
async function conversar(req, res) {
  try {
    const { mensagem, historico } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const usuarioNome = req.usuario?.nome || 'Usuário';
    const contextoProcessos = await obterContextoProcessos(req.usuario);
    const intencao = detectarIntencao(mensagem);

    // 1. Motor cognitivo tem prioridade máxima — responde com 100% de precisão
    const respostaCognitiva = analisarPerguntaCognitiva(mensagem.trim(), historico, contextoProcessos, usuarioNome);
    if (respostaCognitiva) {
      return res.json({
        resposta: respostaCognitiva,
        origem: 'motor-cognitivo-vinculum',
        intencao,
      });
    }

    // 2. Monta histórico limpo para o LLM (últimas 6 mensagens, normalizado)
    const mensagensSistema = [{ role: 'system', content: SYSTEM_PROMPT_VINCULUM(usuarioNome, contextoProcessos, intencao) }];

    if (Array.isArray(historico)) {
      historico.slice(-6).forEach(msg => {
        const texto = (msg.texto || msg.content || '').trim();
        if (!texto) return;
        if (msg.remetente === 'usuario' || msg.role === 'user' || msg.autor === 'user') {
          mensagensSistema.push({ role: 'user', content: texto });
        } else if (msg.remetente === 'ia' || msg.role === 'assistant' || msg.role === 'model' || msg.autor === 'assistant') {
          mensagensSistema.push({ role: 'assistant', content: texto });
        }
      });
    }
    mensagensSistema.push({ role: 'user', content: mensagem.trim() });

    // 3. Gemini (se configurado) — tenta responder
    let resposta = await consultarGemini(mensagensSistema);
    let origemLLM = 'gemini-flash';

    // 4. Falta Gemini? Tenta Pollinations (com retry)
    if (!resposta) {
      resposta = await consultarLLMRapido(mensagensSistema);
      origemLLM = 'llm-gratuito';
    }

    // 5. VALIDA A RESPOSTA DO LLM ANTES DE DEVOLVER
    if (resposta && validarRespostaLLM(resposta, mensagem, intencao)) {
      console.log('[chatbot] resposta LLM validada —', origemLLM);
      return res.json({
        resposta,
        origem: origemLLM,
        intencao,
      });
    }

    // 6. Fallback rico: devolve uma resposta acionável do conhecimento do sistema
    // em vez de sair do personagem ou deixar a pergunta sem resposta.
    const fallbackRico = gerarFallbackRico(intencao, usuarioNome, contextoProcessos);
    return res.json({
      resposta: fallbackRico,
      origem: 'fallback-rico',
      intencao,
    });
  } catch (err) {
    console.error('[chatbot] erro no controller:', err);
    return res.json({
      resposta: `Olá, ${req.usuario?.nome || 'Usuário'}! Sou o Vinculum IA. No momento não estou conseguindo acessar suas respostas, mas posso te ajudar a conhecer o **Dashboard**, **Processos**, **Fluxo Kanban**, **Tarefas**, **Tabela** ou **Usuários**. Por onde vamos começar?`,
      origem: 'recuperacao',
    });
  }
}

function SYSTEM_PROMPT_VINCULUM(usuarioNome, contextoBanco, intencao) {
  return `Você é o VINCULUM IA, assistente oficial e amigável da plataforma "Vinculum" — um sistema de gestão visual de processos com quadro Kanban para Pequenas e Médias Empresas.
Você está conversando com ${usuarioNome}.
SEU NOME É VINCULUM IA. NUNCA SE APRESENTE COMO OUTRO ASSISTENTE, NUNCA DIZ QUE É UM MODELO DE LINGUAGEM, NUNCA RESPONDE FORA DO CONTEXTO DO VINCULUM.

CONHECIMENTO DO SISTEMA:
• Dashboard: painel com KPIs (processos ativos, tarefas pendentes, concluídas no mês, atrasadas), gráficos de produtividade e atalhos para últimas tarefas.
• Processos: aba para criar, editar, renomear e excluir fluxos de trabalho por departamento (Vendas, Compras, Atendimento, Produção...); cria com 3 etapas padrão (A Fazer / Em Andamento / Concluído).
• Fluxo (Kanban): quadro visual com arrastar e soltar de tarefas entre colunas; reordena colunas arrastando cabeçalhos; "Nova Tarefa" cadastra título, responsável e prazo; "Nova Etapa" e "Campos da Tarefa" personalizam o fluxo.
• Tarefa: ficha detalhada com edição instantânea, mudança de etapa com validação, linha do tempo de auditoria (quem moveu, quando, de onde) e exclusão com confirmação.
• Tabela: visão em planilha com busca livre, filtros por processo/etapa/situação/prazo, ordenação por coluna e exportação CSV.
• Usuários: cadastro de colaboradores com perfis Administrador e Usuário Comum.
• Campos personalizados: Texto, Área de Texto, Moeda (R$), Número, Data, Select, Checkbox; campos podem ser obrigatórios por etapa.

DADOS ATUAIS NO BANCO (se houver): ${contextoBanco || 'Nenhum processo cadastrado no momento.'}

INSTRUÇÕES OBRIGATÓRIAS:
1. Responda SEMPRE em Português do Brasil (PT-BR), com tom acolhedor, objetivo e prestativo. Use Markdown leve (listas, negrito, emojis moderados).
2. Toda resposta DEVE fazer referência ao Vinculum: mencione telas, botões, colunas, cartões, processos, tarefas. Se a pergunta do usuário não tem relação com o Vinculum, diga gentilmente que você só responde dúvidas sobre o Vinculum e redirecione para as telas (ex: "Fico feliz em ajudar com o Vinculum! Você está perguntando sobre...").
3. Se o usuário pediu um FLUXO IDEAL por nicho e você não tem o nicho exato na sua base, CRIE UM FLUXO LÓGICO DE 5 ETAPAS baseado na atividade que ele descreveu — não invente dados do banco e não minta funcionalidades.
4. Se o usuário pediu TAREFAS POR ETAPA, desdobre as 5 etapas do fluxo com ações práticas em cada uma.
5. Se você NÃO SABE a resposta (pergunta fora do escopo do Vinculum), diga de forma curta e útil que só auxilia com o Vinculum e liste o que faz — NÃO invente, NÃO fale de outras ferramentas, NÃO dê lições de gestão genéricas sem vincular ao produto.
6. Mantenha as respostas entre 80 e 400 palavras. Nada de textos longos demais.
7. Se a pergunta parece ambígua, faça uma pergunta de esclarecimento curta e específica sobre o Vinculum.
8. Se não houver processo no banco e o usuário perguntar algo sobre os dados dele, explique que ainda não há processos cadastrados e como criar o primeiro.

Comece a resposta direto, sem "Entendi", sem introdução longa. Seja prático e acionável.`;
}

function gerarFallbackRico(intencao, usuarioNome, contextoBanco) {
  switch (intencao) {
    case 'saudacao':
      return `Olá${usuarioNome && usuarioNome !== 'Usuário' ? `, ${usuarioNome}` : ''}! Sou o **Vinculum IA**. 🤝\n\nComo posso ajudar no seu dia a dia? Posso te explicar como funciona cada tela do Vinculum (*Dashboard*, *Processos*, *Fluxo Kanban*, *Tarefas*, *Tabela*, *Usuários*), te ensinar a criar processos e tarefas, ou sugerir fluxos de trabalho para o seu negócio. O que você precisa?`;

    case 'tarefas_por_etapa':
      return `Ainda estou calibrando minhas respostas detalhadas, mas você pode ver todas as tarefas de cada etapa assim: no quadro **Kanban** de cada processo, clique no cartão da tarefa e veja o histórico completo. Para dicas rápidas: cada etapa de um fluxo bem organizado geralmente tem 3 a 5 ações — triagem, execução, validação e fechamento. Quer que eu te ajude a estruturar as etapas do seu processo?`;

    case 'boas_praticas':
      return `Para **boas práticas de gestão de processos** no Vinculum, a regra de ouro é manter **4 a 6 etapas** no quadro Kanban: menos que isso esconde gargalos, mais que isso vira burocracia. 🎯\n\n• Mantenha um **único responsável** por tarefa.\n• Limite o **WIP** (trabalho em andamento) por coluna para desobstruir gargalos.\n• Alinhe com a equipe **15 minutos por semana** em frente ao quadro.\n• Acompanhe as tarefas **Atrasadas** no filtro da tela Tabela.\n\nQuer montar um fluxo personalizado para o seu ramo? É só me dizer o que sua empresa faz!`;

    case 'fluxo_ideal_generico':
      return `Para sugerir o fluxo ideal, eu preciso saber o que sua empresa faz (vendas, oficina, clínica, marcenaria, cozinha...). 🏢\n\nEnquanto isso, aqui está um fluxo base que serve para quase todo negócio:\n\n1. **Entrada/Triagem** — registro e qualificação da demanda.\n2. **Preparo** — alocação de recursos e responsável.\n3. **Execução** — trabalho sendo feito.\n4. **Revisão/Qualidade** — validação da entrega.\n5. **Concluído/Entrega** — finalização com auditoria.\n\nMe diz seu ramo e eu desenho um fluxo sob medida para você!`;

    default:
      const intro = contextoBanco && !contextoBanco.includes('Nenhum processo')
        ? `Com base nos seus processos cadastrados:\n\n${contextoBanco}\n\n`
        : `Olá${usuarioNome && usuarioNome !== 'Usuário' ? `, ${usuarioNome}` : ''}! Sou o **Vinculum IA**. 🤝\n\n`;
      return `${intro}Ainda estou entendendo melhor essa sua pergunta, mas aqui está o que eu sei te ajudar no Vinculum:\n\n• 📊 **O que cada tela faz**: Dashboard, Processos, Fluxo, Tarefa, Tabela e Usuários.\n• 📋 **Como fazer**: criar processos, cadastrar tarefas, mover cartões, definir prazos, atribuir responsáveis e exportar CSV.\n• 💡 **Fluxos sob medida**: me diz seu ramo (vendas, clínica, oficina, marcenaria...) e eu desenho o Kanban ideal.\n• ⚠️ **Gargalos e boas práticas**: como manter o fluxo desobstruído e a equipe produtiva.\n\nEm que eu posso te ajudar agora?`;
  }
}

module.exports = { conversar, analisarPerguntaCognitiva, detectarIntencao, CONHECIMENTO_SISTEMA };