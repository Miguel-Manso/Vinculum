const { getPool, sql } = require('../config/db');
const { gerarResposta } = require('../services/ia.service');
const mssql = sql || require('mssql');

// ============================================================================
// Vinculum IA
// - Com ANTHROPIC_API_KEY ou GEMINI_API_KEY no backend/.env: responde com um
//   modelo de linguagem, usando os dados reais do usuário como contexto.
// - Sem chave (ou se o provedor falhar): "modo básico", o motor de regras
//   abaixo (seções 4–6), que entende só perguntas previstas.
// ============================================================================

// ============================================================================
// 0. UTILITÁRIOS DE NORMALIZAÇÃO E SANITIZAÇÃO
// ============================================================================

function normalizarTexto(texto) {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function sanitizarRespostaMarkdown(texto) {
  if (!texto) return '';
  return texto
    .replace(/^```(?:markdown|md|text)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ============================================================================
// 1. BASE DE CONHECIMENTO ESTRUTURADA DO VINCULUM
// ============================================================================

const CONHECIMENTO_SISTEMA = {
  visaoGeral: `O **Vinculum** é uma plataforma visual de gestão de processos projetada para Pequenas e Médias Empresas (PMEs). Substitui o descontrole de planilhas avulsas e mensagens soltas de WhatsApp por fluxos de trabalho transparentes, auditáveis e com responsabilidade clara.`,
  dashboard: `O **Dashboard** é o painel de controle executivo do Vinculum. Apresenta indicadores em tempo real: processos ativos, tarefas pendentes, demandas concluídas, taxa de conclusão e alertas de tarefas atrasadas.`,
  processos: `A aba **Processos** é a central onde os fluxos departamentais são criados e gerenciados. Por padrão, um novo processo já vem com as etapas *Em Andamento* e *Finalização*.`,
  fluxo: `A tela de **Fluxo** é o quadro Kanban interativo do Vinculum com Drag & Drop de cartões, reordenação de colunas, criação de etapas e configuração de campos personalizados obrigatórios.`,
  tarefa: `O modal de **Detalhes da Tarefa** reúne edição em tempo real de título, responsável, prazo, campos personalizados e linha do tempo de auditoria.`,
  tabela: `A tela de **Tabela** fornece uma visão consolidada em planilha com busca global, filtros por Processo, Etapa, Situação e Prazo, ordenação por colunas e exportação CSV.`,
  usuarios: `A tela de **Usuários** gerencia o acesso da equipe (perfis Administrador e Usuário Comum) e o vínculo com os setores da empresa.`,
  camposPersonalizados: `Os **Campos Personalizados** suportam Texto, Área de Texto, Moeda (R$), Número, Data, Seleção (Select) e Checkbox, podendo ser obrigatórios por etapa.`,
  boasPraticasPME: `Boas práticas essenciais de Kanban: mantenha entre 4 e 6 etapas, defina um único responsável por cartão, limite o WIP (trabalho em andamento) e acompanhe tarefas atrasadas diariamente.`
};

// ============================================================================
// 2. BASE DE NICHOS ESPECIALIZADOS
// ============================================================================

const BASE_NICHOS = {
  montagem_automotiva: {
    nome: 'Montagem e Linha de Produção Automotiva (Carros / Veículos)',
    etapas: [
      '📐 **1. Planejamento & Separação de Chassi/Peças**: Conferência da ordem de montagem, separação de chassi, motor, transmissão e kit de componentes.',
      '🔩 **2. Estruturação de Carroceria & Pintura**: Montagem estrutural da carroceria, tratamento anticorrosivo, pintura em cabine e secagem.',
      '⚙️ **3. Powertrain & Mecânica Pesada**: Instalação do conjunto motor, câmbio, suspensão, freios, direção e sistema de exaustão.',
      '🔌 **4. Elétrica, Painel & Acabamento Interno**: Passagem do chicote elétrico, instalação de painel, bancos, vidros, multimídia e módulos eletrônicos.',
      '🏁 **5. Inspeção de Qualidade & Teste de Pista**: Alinhamento, balanceamento, diagnóstico via scanner, teste dinâmico de rodagem e liberação final.'
    ],
    campos: ['Chassi / VIN (Texto)', 'Modelo / Versão (Texto)', 'Responsável Técnico (Usuário)', 'Inspeção de Segurança OK (Checkbox)', 'Prazo de Entrega (Data)'],
    dica: 'Trave a passagem para a etapa 5 exigindo o preenchimento do checkbox de *Inspeção de Segurança OK*.'
  },
  oficina_mecanica: {
    nome: 'Oficina Mecânica e Serviços Automotivos',
    etapas: [
      '🚗 **1. Recepção & Check-in**: Abertura da Ordem de Serviço com checklist de entrada e relato do cliente.',
      '🔍 **2. Diagnóstico & Orçamento**: Avaliação no elevador/scanner, levantamento de peças e cálculo de mão de obra.',
      '📞 **3. Aguardando Aprovação**: Envio do orçamento ao proprietário e espera pela autorização formal.',
      '🔧 **4. Execução dos Serviços**: Substituição de peças, reparos mecânicos e regulagens técnicas.',
      '🏁 **5. Teste de Rodagem & Entrega**: Teste prático de segurança, limpeza e entrega com termo de garantia.'
    ],
    campos: ['Placa do Veículo (Texto)', 'Modelo/Ano (Texto)', 'Valor de Peças (Moeda R$)', 'Valor de Mão de Obra (Moeda R$)', 'Mecânico Responsável (Usuário)'],
    dica: 'Cada veículo vira um cartão no Kanban. A coluna *Aguardando Aprovação* mostra na hora quais carros estão ocupando box sem gerar receita.'
  },
  recebimento_mercadoria: {
    nome: 'Recebimento de Mercadorias e Almoxarifado',
    etapas: [
      '🚚 **1. Chegada & Triagem**: Conferência inicial da Danfe com o Pedido de Compra e checagem de lacres.',
      '📦 **2. Descarregamento & Avarias**: Descarga física, contagem bruta de volumes e inspeção de danos externos.',
      '🔍 **3. Conferência Cega & Qualidade**: Abertura de caixas, contagem item a item e checagem de validades e lotes.',
      '📑 **4. Entrada Fiscal & Preços**: Importação de XML, validação de preços/impostos e tratamento de divergências.',
      '🏷️ **5. Etiquetagem & Estocagem**: Aplicação de etiquetas internas, alocação em prateleira e encerramento.'
    ],
    campos: ['Número da NF (Texto)', 'Fornecedor (Texto)', 'Quantidade de Volumes (Número)', 'Conferência Aprovada (Checkbox)'],
    dica: 'Transforme cada Nota Fiscal recebida em um cartão Kanban e trave na etapa 3 caso haja divergência física.'
  },
  restaurante_sopa: {
    nome: 'Restaurante, Cozinha e Gastronomia',
    etapas: [
      '📋 **1. Mise en Place**: Higienização, corte técnico e pesagem precisa dos ingredientes conforme a ficha técnica.',
      '🔥 **2. Cocção & Preparo**: Cozimento dos insumos em tempo controlado e apuração de caldos e molhos.',
      '🧪 **3. Controle de Qualidade & Sabor**: Degustação do chef para aprovação de tempero, textura e temperatura.',
      '❄️ **4. Porcionamento & Conservação**: Manutenção térmica acima de 65°C ou resfriamento rápido com etiqueta de validade.',
      '🍽️ **5. Expedição & Salão**: Montagem final do prato ou embalagem delivery e liberação para entrega.'
    ],
    campos: ['Receita/Prato (Texto)', 'Rendimento de Porções (Número)', 'Cozinheiro Responsável (Usuário)', 'Aprovado pelo Chef (Checkbox)'],
    dica: 'Cada lote ou pedido preparado vira um cartão para alinhar a cozinha e o salão em tempo real.'
  },
  confeitaria_padaria: {
    nome: 'Confeitaria e Padaria',
    etapas: [
      '📥 **1. Encomenda & Ficha Técnica**: Registro do pedido (sabor, peso, decoração, data de entrega) e checagem de insumos.',
      '🥣 **2. Pesagem & Batimento (Massa)**: Pesagem de precisão dos ingredientes e forneamento controlado.',
      '🍓 **3. Recheio & Prensagem**: Preparo de recheios, montagem estrutural em aro e descanso refrigerado.',
      '🎨 **4. Confeitaria & Decoração**: Cobertura artística, acabamento fino e registro fotográfico.',
      '📦 **5. Embalagem & Entrega**: Acondicionamento seguro em caixa rígida e entrega ao cliente.'
    ],
    campos: ['Cliente e Contato (Texto)', 'Sabor / Tema (Texto)', 'Valor da Encomenda (Moeda R$)', 'Data da Entrega (Data)'],
    dica: 'Ordene a tela Tabela pela *Data da Entrega* para organizar a produção diária sem atrasos.'
  },
  vendas_comercial: {
    nome: 'Vendas, Comercial e CRM',
    etapas: [
      '🎯 **1. Prospecção & Entrada de Lead**: Registro imediato de novos contatos vindos de WhatsApp, indicação ou site.',
      '🔍 **2. Diagnóstico & Qualificação**: Contato ativo para mapear necessidades, orçamento e decisor.',
      '📑 **3. Proposta Enviada**: Apresentação formal do orçamento com escopo, prazos e condições comerciais.',
      '🤝 **4. Negociação & Follow-up**: Superação de objeções, ajustes de proposta e alinhamento de pagamento.',
      '🏁 **5. Fechamento & Contrato**: Assinatura contratual, faturamento e repasse para a operação.'
    ],
    campos: ['Valor da Proposta (Moeda R$)', 'Nome do Cliente (Texto)', 'Canal de Origem (Select)', 'Data de Follow-up (Data)'],
    dica: 'Torne o campo *Data de Follow-up* obrigatório na etapa de Proposta para nenhum vendedor esquecer de cobrar retorno.'
  },
  compras_suprimentos: {
    nome: 'Compras e Suprimentos',
    etapas: [
      '📝 **1. Requisição & Triagem**: Solicitação interna de compra com validação de estoque e especificações.',
      '📊 **2. Cotação com Fornecedores**: Obtenção de 3 orçamentos comparando preços, prazos e fretes.',
      '⚖️ **3. Aprovação Financeira**: Validação do mapa de cotação com a gerência ou diretoria.',
      '📦 **4. Pedido Emitido**: Envio da Ordem de Compra ao fornecedor e acompanhamento de trânsito.',
      '🏁 **5. Recebimento & Baixa**: Conferência física com a NF e envio para o Contas a Pagar.'
    ],
    campos: ['Valor Orçado (Moeda R$)', 'Fornecedor Escolhido (Texto)', 'Prazo de Entrega (Data)', 'Aprovado por (Usuário)'],
    dica: 'Exija o preenchimento do valor orçado antes de permitir o avanço do cartão para aprovação financeira.'
  },
  atendimento_suporte: {
    nome: 'Atendimento ao Cliente e Helpdesk',
    etapas: [
      '📥 **1. Novo Chamado**: Registro da solicitação do cliente, prints e classificação de prioridade.',
      '🔍 **2. Triagem & Diagnóstico**: Análise inicial pela equipe N1 e reprodução do problema.',
      '⚙️ **3. Em Resolução Técnica**: Execução do reparo, ajuste ou atendimento especializado.',
      '🧪 **4. Validação com Cliente**: Confirmação com o solicitante de que a demanda foi solucionada.',
      '🏁 **5. Chamado Concluído**: Encerramento do ticket com pesquisa de satisfação.'
    ],
    campos: ['Cliente/Empresa (Texto)', 'Prioridade (Select: Baixa, Média, Crítica)', 'Prazo SLA (Data)'],
    dica: 'Monitore o filtro de tarefas *Atrasadas* na Tabela para impedir estouros de SLA.'
  },
  rh_recrutamento: {
    nome: 'RH, Recrutamento e Seleção',
    etapas: [
      '📢 **1. Abertura & Divulgação da Vaga**: Alinhamento do perfil com o gestor e publicação da vaga.',
      '📄 **2. Triagem de Currículos**: Seleção de perfis aderentes e pré-contato via WhatsApp.',
      '🗣️ **3. Entrevistas & Teste Técnico**: Avaliação comportamental pelo RH e aplicação de teste prático.',
      '🤝 **4. Entrevista com Gestor & Proposta**: Escolha do finalista pela liderança e envio da carta-proposta.',
      '🎉 **5. Admissão & Onboarding**: Coleta de documentos, exame admissional e integração do colaborador.'
    ],
    campos: ['Cargo da Vaga (Texto)', 'Nome do Candidato (Texto)', 'Pretensão Salarial (Moeda R$)', 'Data de Início (Data)'],
    dica: 'Cada candidato avaliado vira um cartão no Kanban com seu histórico centralizado na descrição.'
  },
  financeiro_contas: {
    nome: 'Financeiro e Contas a Pagar / Receber',
    etapas: [
      '📥 **1. Entrada de NF / Boleto**: Recebimento da fatura e conferência dos dados fiscais.',
      '🔍 **2. Conferência de Entrega**: Confirmação com o setor solicitante se o serviço/produto foi entregue.',
      '⚖️ **3. Aprovação da Diretoria**: Autorização de pagamento conforme alçada e fluxo de caixa.',
      '🏦 **4. Agendamento Bancário**: Inclusão no banco e anexação do comprovante de agendamento.',
      '🏁 **5. Baixa & Conciliação**: Confirmação do débito no extrato e arquivamento do comprovante.'
    ],
    campos: ['Valor do Título (Moeda R$)', 'Data de Vencimento (Data)', 'Beneficiário (Texto)', 'Centro de Custo (Select)'],
    dica: 'Ordene a tela Tabela pela coluna *Prazo* toda segunda-feira para planejar o desembolso da semana.'
  },
  ti_software: {
    nome: 'TI e Desenvolvimento de Software',
    etapas: [
      '📋 **1. Backlog & Especificação**: Detalhamento da história de usuário e critérios de aceite.',
      '💻 **2. Em Desenvolvimento**: Codificação da feature ou correção de bug em branch dedicada.',
      '🔍 **3. Code Review & Testes**: Revisão de código por pares e bateria de testes automatizados.',
      '🧪 **4. Homologação (QA / Staging)**: Validação funcional em ambiente de testes pelo Product Owner.',
      '🚀 **5. Deploy em Produção**: Publicação oficial e monitoramento de estabilidade.'
    ],
    campos: ['Tipo (Select: Feature, Bug, Melhoria)', 'Estimativa em Horas (Número)', 'Desenvolvedor (Usuário)', 'Release (Texto)'],
    dica: 'Limite o WIP na coluna de *Code Review* para evitar acúmulo de Pull Requests parados.'
  },
  marcenaria_moveis: {
    nome: 'Marcenaria e Móveis Planejados',
    etapas: [
      '📐 **1. Projeto 3D & Medição Final**: Medição fina no local, aprovação do projeto 3D e plano de corte.',
      '🪵 **2. Corte & Fita de Borda**: Corte das chapas de MDF, colagem de bordas e furação técnica.',
      '🔩 **3. Pré-montagem na Oficina**: Montagem dos módulos na bancada para checar esquadro e ferragens.',
      '🚚 **4. Embalagem & Transporte**: Proteção com plástico bolha/cantoneiras e envio para a obra.',
      '🏠 **5. Instalação Final & Entrega**: Fixação no cliente, regulagem fina de portas e termo de aceite.'
    ],
    campos: ['Ambiente (Select: Cozinha, Quarto, Sala)', 'Valor do Projeto (Moeda R$)', 'Marceneiro Responsável (Usuário)'],
    dica: 'Nunca avance um cartão para *Transporte* sem concluir a checagem de ferragens na *Pré-montagem*.'
  },
  clinica_saude: {
    nome: 'Clínica Médica e Consultório',
    etapas: [
      '📅 **1. Agendamento & Confirmação**: Marcação da consulta e confirmação via WhatsApp 24h antes.',
      '🏥 **2. Recepção & Triagem**: Chegada do paciente, autorização de guia/convênio e pré-consulta.',
      '🩺 **3. Atendimento Clínico**: Anamnese, exame físico, diagnóstico e prescrição no prontuário.',
      '📋 **4. Exames & Aguardando Laudo**: Paciente realizando exames complementares solicitados.',
      '🔄 **5. Retorno & Conclusão**: Avaliação dos resultados, definição de conduta e alta.'
    ],
    campos: ['Nome do Paciente (Texto)', 'Especialidade (Select)', 'Convênio/Particular (Select)', 'Data do Retorno (Data)'],
    dica: 'Use a coluna *Exames & Aguardando Laudo* para fazer busca ativa dos pacientes que ainda não agendaram retorno.'
  },
  montagem_pc_hardware: {
    nome: 'Montagem e Manutenção de Computadores (PC / Hardware)',
    etapas: [
      '📋 **1. Compatibilidade & Orçamento**: Checagem de socket, RAM, dimensionamento de fonte e gabinete.',
      '📦 **2. Separação & Bancada Antiestática**: Conferência de lacres, inspeção de pinos e preparo da bancada.',
      '🔧 **3. Montagem Física & Cable Management**: Instalação de CPU, cooler, pasta térmica, GPU e organização de cabos.',
      '⚡ **4. Atualização de BIOS, Drivers & Stress Test**: Ativação de XMP/EXPO, instalação do SO e teste térmico em carga máxima.',
      '🏁 **5. Acabamento & Entrega com Laudo**: Proteção interna para transporte e entrega com relatório de temperaturas.'
    ],
    campos: ['Configuração do Setup (Área de Texto)', 'Valor Total (Moeda R$)', 'Técnico Montador (Usuário)', 'Stress Test Aprovado (Checkbox)'],
    dica: 'Torne o checkbox *Stress Test Aprovado* obrigatório antes de mover o PC para a coluna de entrega.'
  }
};

// ============================================================================
// 3. CONSULTA COMPLETA DE DADOS DO BANCO (SETORES, PROCESSOS, KPIS, RESPONSÁVEIS)
// ============================================================================

const FUSO_HORARIO = process.env.APP_TZ || 'America/Sao_Paulo';
const DIA_MS = 86400000;

/** Mesma regra das telas (Fluxo/Kanban): etapa final = "Finaliz…", "Conclu…", "Entregue", "Pronto". */
function isEtapaFinal(nome) {
  const n = normalizarTexto(nome);
  return n.startsWith('finaliz') || n.startsWith('conclu') || n === 'entregue' || n === 'pronto' || n === 'done';
}

/** 'YYYY-MM-DD' de uma coluna de data (Date do mssql/pg ou string), ou null. */
function dataISO(valor) {
  if (!valor) return null;
  if (valor instanceof Date) return isNaN(valor.getTime()) ? null : valor.toISOString().slice(0, 10);
  const s = String(valor);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : null;
}

/** Hoje no fuso da empresa, em 'YYYY-MM-DD'. */
function hojeISO() {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: FUSO_HORARIO }).format(new Date());
}

function diasEntre(isoA, isoB) {
  return Math.round((Date.parse(`${isoB}T00:00:00Z`) - Date.parse(`${isoA}T00:00:00Z`)) / DIA_MS);
}

function formatarDataBR(iso) {
  if (!iso) return '—';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

const DADOS_VAZIOS = () => ({
  disponivel: false,
  setores: [],
  processos: [],
  etapas: [],
  tarefas: [],
  responsaveis: [],
  metricas: { totalSetores: 0, totalProcessos: 0, totalTarefas: 0, totalConcluidas: 0, totalPendentes: 0, totalAtrasadas: 0, taxaConclusao: 0, venceHoje: 0, proximos7: 0, urgentesAbertas: 0, semResponsavel: 0 },
  textoResumo: '',
});

/**
 * Lê setores, processos, etapas e tarefas visíveis para o usuário e calcula
 * as métricas em JavaScript (funciona igual no SQL Server e no PostgreSQL).
 * Sem usuário autenticado não lê nada: o chat não expõe dados sem login.
 */
async function obterDadosCompletosBanco(usuario) {
  if (!usuario?.id) return DADOS_VAZIOS();

  try {
    const pool = await getPool();
    const isAdmin = usuario.perfil === 'admin' || usuario.email === 'admin@vinculum.com';
    const usuarioId = parseInt(usuario.id, 10);
    const filtroSetor = isAdmin ? '' : 'IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)';

    const consulta = (texto) => {
      const req = pool.request();
      if (!isAdmin) req.input('usuario_id', mssql.Int, usuarioId);
      return req.query(texto).then(r => r.recordset || []);
    };

    const [setores, processosRaw, etapasRaw, tarefasRaw] = await Promise.all([
      consulta(`SELECT s.id, s.nome FROM Setores s ${filtroSetor ? `WHERE s.id ${filtroSetor}` : ''}`),
      consulta(`SELECT p.id, p.nome, p.descricao, p.setor_id, s.nome AS setor_nome
                FROM Processos p LEFT JOIN Setores s ON p.setor_id = s.id
                ${filtroSetor ? `WHERE p.setor_id ${filtroSetor}` : ''}`),
      consulta(`SELECT e.id, e.nome, e.ordem, e.processo_id
                FROM Etapas e JOIN Processos p ON e.processo_id = p.id
                ${filtroSetor ? `WHERE p.setor_id ${filtroSetor}` : ''}`),
      consulta(`SELECT t.id, t.titulo, t.prazo, t.urgente, t.criado_em, t.etapa_id, t.responsavel_id,
                       u.nome AS responsavel_nome
                FROM Tarefas t
                JOIN Etapas e ON t.etapa_id = e.id
                JOIN Processos p ON e.processo_id = p.id
                LEFT JOIN Usuarios u ON t.responsavel_id = u.id
                ${filtroSetor ? `WHERE p.setor_id ${filtroSetor}` : ''}`),
    ]);

    const hoje = hojeISO();
    const etapaPorId = new Map(etapasRaw.map(e => [Number(e.id), e]));
    const processoPorId = new Map(processosRaw.map(p => [Number(p.id), p]));

    // Tarefas enriquecidas
    const tarefas = tarefasRaw.map(t => {
      const etapa = etapaPorId.get(Number(t.etapa_id));
      const processo = etapa ? processoPorId.get(Number(etapa.processo_id)) : null;
      const prazo = dataISO(t.prazo);
      const concluida = etapa ? isEtapaFinal(etapa.nome) : false;
      const dias = prazo ? diasEntre(hoje, prazo) : null; // negativo = atrasada
      return {
        id: t.id,
        titulo: t.titulo,
        prazo,
        criado_em: dataISO(t.criado_em),
        urgente: t.urgente === 1 || t.urgente === true,
        responsavel_nome: t.responsavel_nome || null,
        etapa_nome: etapa?.nome || '—',
        etapa_id: Number(t.etapa_id),
        processo_id: processo ? Number(processo.id) : null,
        processo_nome: processo?.nome || '—',
        setor_nome: processo?.setor_nome || null,
        concluida,
        dias,
        atrasada: !concluida && dias !== null && dias < 0,
        venceHoje: !concluida && dias === 0,
        proximos7: !concluida && dias !== null && dias > 0 && dias <= 7,
      };
    });
    const abertas = tarefas.filter(t => !t.concluida);

    // Etapas com contagem (ordenadas)
    const etapas = etapasRaw
      .map(e => ({
        id: Number(e.id),
        nome: e.nome,
        ordem: Number(e.ordem) || 0,
        processo_id: Number(e.processo_id),
        final: isEtapaFinal(e.nome),
        total_tarefas: tarefas.filter(t => t.etapa_id === Number(e.id)).length,
      }))
      .sort((a, b) => a.processo_id - b.processo_id || a.ordem - b.ordem);

    // Processos com métricas (mesmos nomes de campo usados pelo motor de regras)
    const processos = processosRaw
      .map(p => {
        const doProc = tarefas.filter(t => t.processo_id === Number(p.id));
        return {
          id: Number(p.id),
          nome: p.nome,
          descricao: p.descricao,
          setor_id: p.setor_id,
          setor_nome: p.setor_nome,
          total_etapas: etapas.filter(e => e.processo_id === Number(p.id)).length,
          total_tarefas: doProc.length,
          tarefas_concluidas: doProc.filter(t => t.concluida).length,
          tarefas_pendentes: doProc.filter(t => !t.concluida).length,
          tarefas_atrasadas: doProc.filter(t => t.atrasada).length,
        };
      })
      .sort((a, b) => (a.setor_nome || '').localeCompare(b.setor_nome || '', 'pt-BR') || a.nome.localeCompare(b.nome, 'pt-BR'));

    const setoresComTotal = setores
      .map(s => ({ id: s.id, nome: s.nome, total_processos: processos.filter(p => String(p.setor_id) === String(s.id)).length }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    // Carga por responsável (só tarefas visíveis)
    const porResp = new Map();
    for (const t of tarefas) {
      if (!t.responsavel_nome) continue;
      const r = porResp.get(t.responsavel_nome) || { nome: t.responsavel_nome, total_atribuidas: 0, pendentes: 0, atrasadas: 0 };
      r.total_atribuidas++;
      if (!t.concluida) r.pendentes++;
      if (t.atrasada) r.atrasadas++;
      porResp.set(t.responsavel_nome, r);
    }
    const responsaveis = [...porResp.values()].sort((a, b) => b.atrasadas - a.atrasadas || b.pendentes - a.pendentes);

    const totalConcluidas = tarefas.filter(t => t.concluida).length;
    const metricas = {
      totalSetores: setoresComTotal.length,
      totalProcessos: processos.length,
      totalTarefas: tarefas.length,
      totalConcluidas,
      totalPendentes: abertas.length,
      totalAtrasadas: abertas.filter(t => t.atrasada).length,
      taxaConclusao: tarefas.length > 0 ? Math.round((totalConcluidas / tarefas.length) * 100) : 0,
      venceHoje: abertas.filter(t => t.venceHoje).length,
      proximos7: abertas.filter(t => t.proximos7).length,
      urgentesAbertas: abertas.filter(t => t.urgente).length,
      semResponsavel: abertas.filter(t => !t.responsavel_nome).length,
    };

    return {
      disponivel: true,
      hoje,
      setores: setoresComTotal,
      processos,
      etapas,
      tarefas,
      responsaveis,
      metricas,
      textoResumo: `Processos: ${metricas.totalProcessos} | Tarefas: ${metricas.totalTarefas} | Abertas: ${metricas.totalPendentes} | Atrasadas: ${metricas.totalAtrasadas}`,
    };
  } catch (err) {
    console.error('[chatbot] Erro ao ler dados do banco:', err.message);
    return { ...DADOS_VAZIOS(), erroBanco: true };
  }
}

// ============================================================================
// 3b. CONTEXTO PARA O MODELO DE LINGUAGEM
// ============================================================================

const DIAS_SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

function linhaTarefa(t) {
  const partes = [`#${t.id} "${t.titulo}"`, `${t.processo_nome} › ${t.etapa_nome}`];
  partes.push(`resp.: ${t.responsavel_nome || 'sem responsável'}`);
  if (t.prazo) {
    let rel = '';
    if (t.dias < 0) rel = ` (${Math.abs(t.dias)} dia(s) de atraso)`;
    else if (t.dias === 0) rel = ' (vence hoje)';
    else rel = ` (em ${t.dias} dia(s))`;
    partes.push(`prazo ${formatarDataBR(t.prazo)}${rel}`);
  } else {
    partes.push('sem prazo');
  }
  if (t.urgente) partes.push('URGENTE');
  return `- ${partes.join(' | ')}`;
}

/** Texto compacto com os dados reais que o modelo pode usar para responder. */
function montarContextoDados(dados) {
  if (!dados.disponivel) {
    return dados.erroBanco
      ? 'DADOS DA EMPRESA: indisponíveis no momento (falha ao consultar o banco). Não invente números.'
      : 'DADOS DA EMPRESA: o usuário não está autenticado, então você NÃO tem acesso a processos, tarefas ou números da empresa. Responda só dúvidas gerais e de uso da plataforma.';
  }

  const m = dados.metricas;
  const linhas = [];
  linhas.push(`RESUMO: ${m.totalSetores} setor(es), ${m.totalProcessos} processo(s), ${m.totalTarefas} tarefa(s) — ${m.totalConcluidas} concluída(s) (${m.taxaConclusao}%), ${m.totalPendentes} em aberto, ${m.totalAtrasadas} atrasada(s), ${m.venceHoje} vencem hoje, ${m.proximos7} vencem nos próximos 7 dias, ${m.urgentesAbertas} urgente(s) em aberto, ${m.semResponsavel} aberta(s) sem responsável.`);

  linhas.push('\nSETORES:');
  linhas.push(dados.setores.length ? dados.setores.map(s => `- ${s.nome} (${s.total_processos} processo(s))`).join('\n') : '- nenhum');

  linhas.push('\nPROCESSOS (etapas em ordem, com nº de tarefas em cada uma):');
  if (dados.processos.length === 0) linhas.push('- nenhum');
  dados.processos.slice(0, 40).forEach(p => {
    const etapas = dados.etapas.filter(e => e.processo_id === p.id).map(e => `${e.nome} (${e.total_tarefas})`).join(' → ') || 'sem etapas';
    linhas.push(`- ${p.nome}${p.setor_nome ? ` [setor: ${p.setor_nome}]` : ''}: ${p.total_tarefas} tarefa(s), ${p.tarefas_pendentes} aberta(s), ${p.tarefas_atrasadas} atrasada(s), ${p.tarefas_concluidas} concluída(s). Etapas: ${etapas}${p.descricao ? `. Descrição: ${String(p.descricao).slice(0, 140)}` : ''}`);
  });
  if (dados.processos.length > 40) linhas.push(`- (+${dados.processos.length - 40} processos não listados)`);

  linhas.push('\nCARGA POR RESPONSÁVEL (tarefas em aberto / atrasadas):');
  linhas.push(dados.responsaveis.length ? dados.responsaveis.map(r => `- ${r.nome}: ${r.pendentes} aberta(s), ${r.atrasadas} atrasada(s)`).join('\n') : '- nenhuma tarefa atribuída');

  const abertas = dados.tarefas.filter(t => !t.concluida);
  const atrasadas = abertas.filter(t => t.atrasada).sort((a, b) => a.dias - b.dias);
  const proximas = abertas.filter(t => t.venceHoje || t.proximos7).sort((a, b) => a.dias - b.dias);
  const listadas = new Set([...atrasadas, ...proximas].map(t => t.id));
  const urgentes = abertas.filter(t => t.urgente && !listadas.has(t.id));
  urgentes.forEach(t => listadas.add(t.id));
  const semResp = abertas.filter(t => !t.responsavel_nome && !listadas.has(t.id));
  semResp.forEach(t => listadas.add(t.id));
  const demais = abertas
    .filter(t => !listadas.has(t.id))
    .sort((a, b) => (b.criado_em || '').localeCompare(a.criado_em || ''));

  const bloco = (titulo, lista, limite) => {
    linhas.push(`\n${titulo}${lista.length > limite ? ` — mostrando ${limite} de ${lista.length}` : ''}:`);
    linhas.push(lista.length ? lista.slice(0, limite).map(linhaTarefa).join('\n') : '- nenhuma');
  };
  bloco('TAREFAS ATRASADAS (mais antigas primeiro)', atrasadas, 30);
  bloco('VENCEM HOJE OU NOS PRÓXIMOS 7 DIAS', proximas, 25);
  bloco('OUTRAS URGENTES EM ABERTO', urgentes, 15);
  bloco('OUTRAS EM ABERTO SEM RESPONSÁVEL', semResp, 15);
  bloco('DEMAIS TAREFAS EM ABERTO (mais recentes primeiro)', demais, 25);

  return linhas.join('\n');
}

const GUIA_PLATAFORMA = `
COMO A PLATAFORMA FUNCIONA (use para dúvidas de uso; cite os nomes exatos dos botões):
- Menu lateral: Dashboard, Processos, Tabela Geral e, para administradores, Equipe / Usuários e Gerenciar Setores. No topo do menu há um seletor de setor ("Todos os Setores" ou um setor específico) que filtra o que aparece.
- Dashboard: cards com Processos ativos, Tarefas em aberto, Atrasadas e Concluídas (%); lista de Tarefas com abas Pendentes, Atrasadas, Vencem em breve e Urgentes, e busca; lista de Processos com barra de progresso. Botões "Tabela" e "Novo processo".
- Processos: grade de cards (um por processo) com setor, nº de etapas e tarefas. Botão "Novo processo" (nome, setor, ícone, descrição). Um processo novo já vem com as etapas "Em Andamento" e "Finalização". Editar = ícone de lápis no card; excluir = ícone de lixeira (apaga também etapas, tarefas e histórico — não tem volta). Busca, abas de setor e botão "Filtros" (setor, tipo, volume de tarefas, nº de etapas, ordenação).
- Quadro Kanban do processo (clique no card do processo): uma coluna por etapa. Botões no topo: "Campos" (campos personalizados), "Etapa" (nova etapa), "Tabela" e "Nova tarefa". Arraste os cards entre colunas para mudar de etapa (no celular: toque longo; no teclado: Espaço pega, ← → troca de etapa, Espaço solta). Arraste o cabeçalho de uma coluna para reordenar as etapas; o lápis no cabeçalho edita/exclui a etapa. Há busca e "Filtros" (responsável, prazo, urgência, situação, período de criação e campos do tipo lista).
- Tarefa: título, descrição, etapa, responsável, prazo, marcação de urgente e campos personalizados. Clicar no card abre a página da tarefa, com edição e histórico (linha do tempo de mudanças). O lápis no card abre a edição rápida.
- Campos personalizados (botão "Campos" no quadro): tipos Texto Curto, Texto Longo, Número, Valor Monetário (R$), Data, Seleção (Dropdown, com opções separadas por vírgula) e Caixa de Seleção (Sim/Não). Cada campo pode ser "Opcional em todas as etapas", "Obrigatório na Criação" ou "Obrigatório na etapa X" — nesse caso, ao mover a tarefa para a etapa X, o sistema pede o preenchimento.
- Uma tarefa é considerada concluída quando está numa etapa final (nome começando com "Finaliz…" ou "Conclu…", ou "Entregue"/"Pronto"). Atrasada = prazo anterior a hoje e ainda não concluída.
- Tabela Geral: todas as tarefas em linhas, com busca, visões rápidas (Todas, Minhas, Em aberto, Atrasadas, Concluídas), filtros por Setor, Processo, Responsável e Prazo, ordenação por coluna, paginação e botão "Exportar" (CSV).
- Equipe e Acessos (admin): cadastrar, editar e remover colaboradores (nome, e-mail, senha, perfil Administrador ou Colaborador, e setores de acesso). Colaboradores só veem processos dos setores a que têm acesso; administradores veem tudo.
- Gerenciar Setores (admin, no menu): criar, editar e excluir setores, com nome, descrição e cor.
- Este assistente (Vinculum IA) fica no botão redondo no canto inferior direito.`;

function montarPromptSistema(dados, usuario) {
  const hoje = dados.hoje || hojeISO();
  const diaSemana = DIAS_SEMANA[new Date(`${hoje}T12:00:00Z`).getUTCDay()];
  const quem = usuario
    ? `${usuario.nome || 'usuário'} (${usuario.perfil === 'admin' ? 'administrador' : 'colaborador'})`
    : 'visitante não autenticado';

  return `Você é o **Vinculum IA**, assistente do Vinculum — uma plataforma de gestão visual de processos (quadros Kanban por setor) para pequenas e médias empresas brasileiras.

Hoje é ${diaSemana}, ${formatarDataBR(hoje)}. Você está conversando com ${quem}.

O QUE VOCÊ FAZ
1. Responde perguntas sobre os DADOS REAIS da empresa (abaixo): o que está atrasado, quem está sobrecarregado, como está um processo, onde há gargalo, o que priorizar.
2. Explica como usar a plataforma, com os nomes exatos de telas e botões.
3. Atua como consultor de processos: desenha fluxos (etapas, campos personalizados sugeridos e regras de obrigatoriedade) para qualquer ramo, e dá recomendações práticas de Kanban (limite de WIP, gargalos, responsável único, prazos).

REGRAS
- Responda sempre em português do Brasil, de forma direta: comece pela resposta, sem preâmbulo e sem repetir a pergunta.
- Use SOMENTE os dados fornecidos abaixo para números, nomes de pessoas, processos e tarefas. Nunca invente tarefas, pessoas ou valores. Se a informação não estiver nos dados, diga que não tem esse dado e, se possível, onde o usuário encontra (ex.: Tabela Geral).
- Quando citar tarefas, use o formato "#id Título" e inclua o que importa (processo, responsável, prazo).
- Leve em conta o histórico da conversa: perguntas de continuação ("e dessas, quais são urgentes?", "e as tarefas de cada etapa?") se referem ao assunto anterior.
- Para dúvidas de uso, dê passos numerados curtos com os nomes reais dos botões. Não descreva recursos que não existem na plataforma.
- Ao sugerir um fluxo, entregue: etapas numeradas (4 a 6, nome curto + o que acontece), campos personalizados recomendados com o tipo de campo da plataforma e quais devem ser obrigatórios em qual etapa. Se o usuário pedir as tarefas de cada etapa, liste-as por etapa.
- Seja conciso: até ~150 palavras em respostas simples; fluxos e análises podem ser maiores, mas sem enrolação.
- Se a pergunta não tiver nada a ver com gestão, processos, trabalho ou a plataforma, responda em uma frase que você é focado nisso e ofereça ajuda relacionada.

FORMATAÇÃO (o chat só renderiza isto)
- **negrito**, *itálico*, \`código\`, listas com "- " e listas numeradas "1. ".
- Parágrafos separados por linha em branco. Um título curto com "### " só se a resposta for longa.
- NÃO use tabelas, links, imagens nem blocos de código.
- Se houver uma recomendação final, coloque-a num parágrafo próprio começando com "💡 **Dica:**". No máximo uma dica por resposta, e só quando agregar.
${GUIA_PLATAFORMA}

DADOS ATUAIS DA EMPRESA (visíveis para este usuário)
${montarContextoDados(dados)}`;
}

/** Converte o histórico do frontend ({remetente, texto}) para mensagens do modelo. */
function montarMensagens(historico, mensagemAtual) {
  const lista = Array.isArray(historico) ? historico : [];
  const msgs = lista
    .map(h => {
      const autor = h.remetente || h.autor || h.role;
      const role = ['usuario', 'user'].includes(autor) ? 'user' : 'assistant';
      const content = String(h.texto ?? h.content ?? '').slice(0, 4000);
      return { role, content };
    })
    // mensagens de erro exibidas no chat não são contexto útil
    .filter(m => m.content && !m.content.startsWith('⚠️'))
    .slice(-12);

  const ultima = msgs[msgs.length - 1];
  if (!ultima || ultima.role !== 'user' || ultima.content.trim() !== mensagemAtual.trim()) {
    msgs.push({ role: 'user', content: mensagemAtual });
  }
  return msgs;
}

async function obterContextoProcessos(usuario) {
  const dados = await obterDadosCompletosBanco(usuario);
  return dados.textoResumo;
}

// ============================================================================
// 4. DETECTORES DE NICHOS E FLUXOS LIVRES
// ============================================================================

function detectarNichoTopico(texto) {
  const p = normalizarTexto(texto);

  if (/\b(montagem de carro|montagem de carros|montar carro|montar carros|montadora de veiculos|linha de montagem automotiva|fabricacao de carros|fabricar carros)\b/i.test(p)) {
    return 'montagem_automotiva';
  }

  const regras = [
    { nicho: 'montagem_pc_hardware', regex: /\b(montagem de pc|montar pc|computador|computadores|pc gamer|hardware|placa de video|processador)\b/i },
    { nicho: 'recebimento_mercadoria', regex: /\b(recebimento de mercadoria|recebimento de mercadorias|almoxarifado|doca|conferencia de carga|entrada de nf|entrada de nota)\b/i },
    { nicho: 'restaurante_sopa', regex: /\b(restaurante|sopa|sopas|cozinha|culinaria|marmita|prato|gastronomia|mise en place)\b/i },
    { nicho: 'confeitaria_padaria', regex: /\b(confeitaria|padaria|bolo|bolos|doce|doces|torta|tortas|confeiteiro)\b/i },
    { nicho: 'marcenaria_moveis', regex: /\b(marcenaria|marceneiro|moveis planejados|movel planejado|mdf)\b/i },
    { nicho: 'clinica_saude', regex: /\b(clinica|medico|consultorio|paciente|odonto|odontologia)\b/i },
    { nicho: 'vendas_comercial', regex: /\b(vendas|comercial|crm|prospeccao|lead|leads|funil de vendas)\b/i },
    { nicho: 'compras_suprimentos', regex: /\b(compras|suprimento|suprimentos|cotacao de precos|ordem de compra)\b/i },
    { nicho: 'atendimento_suporte', regex: /\b(atendimento ao cliente|suporte tecnico|sac|helpdesk|chamado|chamados|ticket|tickets)\b/i },
    { nicho: 'oficina_mecanica', regex: /\b(oficina|mecanica|mecanico|conserto de carro|reparo automotivo|autocenter)\b/i },
    { nicho: 'rh_recrutamento', regex: /\b(rh|recursos humanos|recrutamento|selecao|admissao|vaga|candidato|onboarding)\b/i },
    { nicho: 'financeiro_contas', regex: /\b(financeiro|contas a pagar|contas a receber|faturamento|fluxo de caixa|conciliacao bancaria)\b/i },
    { nicho: 'ti_software', regex: /\b(desenvolvimento de software|software|programacao|bug|bugs|sprint|deploy|code review)\b/i },
    { nicho: 'imobiliaria', regex: /\b(imobiliaria|locacao de imoveis|aluguel de imovel|corretor de imoveis|inquilino)\b/i }
  ];

  for (const item of regras) {
    if (item.regex.test(p)) return item.nicho;
  }

  return 'generico';
}

function extrairTemaLivreFluxo(texto) {
  if (!texto) return '';
  const limpo = texto.trim().replace(/[?!.]+$/, '');

  const padroes = [
    /(?:fluxo|processo|etapas|kanban)\s+(?:ideal\s+|de\s+processos?\s+|de\s+trabalho\s+)?(?:para|pra|de)\s+(.+)$/i,
    /(?:como\s+(?:criar|estruturar|organizar|montar|fazer)\s+(?:um\s+)?(?:fluxo|processo|kanban)\s+(?:para|pra|de)\s+)(.+)$/i,
    /(?:me\s+ensine\s+a\s+criar\s+um\s+fluxo\s+(?:para|pra|de)\s+)(.+)$/i,
    /(?:sugira\s+um\s+fluxo\s+(?:para|pra|de)\s+)(.+)$/i
  ];

  for (const regex of padroes) {
    const match = limpo.match(regex);
    if (match && match[1]) {
      const tema = match[1].replace(/\b(no vinculum|na plataforma|no sistema|na minha empresa)\b/gi, '').trim();
      if (tema.length >= 2) return tema;
    }
  }
  return '';
}

function gerarFluxoDinamicoSobMedida(temaBruto) {
  const tema = (temaBruto || 'sua operação').trim();
  const temaCap = tema.charAt(0).toUpperCase() + tema.slice(1);
  const t = normalizarTexto(tema);

  if (/\b(montagem|montar|fabricacao|fabricar|producao|produzir|construcao|construir|usinagem|confeccao)\b/.test(t)) {
    return `O fluxo ideal para **${temaCap}** no Vinculum organiza a linha de produção em **5 etapas sequenciais** para garantir padronização técnica e controle de qualidade.

1. 📋 **1. Ordem de Produção & Separação de Componentes**: Abertura da ordem de serviço, conferência do projeto técnico e separação de todas as peças e matérias-primas.
2. ⚙️ **2. Preparação de Base & Estrutura Principal**: Preparo da bancada/linha e montagem da estrutura base do produto seguindo o Procedimento Operacional Padrão (POP).
3. 🔧 **3. Montagem de Sistemas & Subconjuntos**: Integração dos componentes principais, acoplamento mecânico/elétrico e ajustes técnicos de precisão.
4. 🧪 **4. Inspeção de Qualidade & Testes de Funcionamento**: Bateria rigorosa de testes práticos de segurança, desempenho e acabamento visual antes da liberação.
5. 🏁 **5. Acabamento Final, Documentação & Expedição**: Limpeza técnica, emissão do termo de garantia/laudo de qualidade e entrega final.

💡 **Dica Prática:** Acesse o botão **"Campos"** no topo do fluxo e crie os campos *Código/Lote de Produção (Texto)*, *Responsável Técnico (Usuário)* e *Qualidade Aprovada (Checkbox obrigatório na etapa 5)*.`;
  }

  if (/\b(manutencao|conserto|reparo|assistencia|instalacao|instalar|revisao)\b/.test(t)) {
    return `O fluxo ideal para **${temaCap}** no Vinculum estrutura o atendimento em **5 etapas claras** para garantir transparência de orçamento e cumprimento de prazos.

1. 📥 **1. Recepção & Checklist de Entrada**: Registro da demanda, identificação do item/cliente e anotação detalhada dos sintomas ou requisitos.
2. 🔍 **2. Diagnóstico Técnico & Orçamento**: Avaliação minuciosa pela equipe técnica, levantamento de materiais necessários e cálculo de custos.
3. 📞 **3. Aguardando Aprovação do Cliente**: Envio formal da proposta e espera pelo aceite do cliente antes de iniciar a execução.
4. 🛠️ **4. Execução Técnica de ${temaCap}**: Realização do serviço seguindo o padrão de qualidade e registro das peças/materiais aplicados.
5. 🏁 **5. Teste Final & Entrega com Garantia**: Validação prática de funcionamento, limpeza e encerramento do cartão com emissão de garantia.

💡 **Dica Prática:** Crie os campos personalizados *Número da OS (Texto)*, *Valor do Orçamento (Moeda R$)* e *Orçamento Aprovado (Checkbox)* no seu quadro Kanban.`;
  }

  return `Para estruturar o fluxo de **${temaCap}** no Vinculum com alta produtividade, organize seu quadro Kanban nestas **5 etapas enxutas**:

1. 📥 **1. Entrada & Triagem de Demandas**: Recepção da solicitação, validação das informações iniciais e definição de prioridade.
2. 📋 **2. Planejamento & Alocação**: Definição do escopo de trabalho, separação de recursos, prazo de entrega e atribuição do responsável.
3. 🚀 **3. Em Execução Operacional**: Realização ativa do trabalho de **${temaCap}** pela equipe responsável com registro de progresso no cartão.
4. 🔍 **4. Revisão & Controle de Qualidade**: Conferência técnica da entrega para corrigir desvios antes de apresentar ao cliente.
5. 🏁 **5. Concluído & Entregue**: Finalização formal da atividade, faturamento e registro no histórico de auditoria.

💡 **Dica Prática:** Para criar esse fluxo agora, acesse **Processos** no menu lateral, clique em **"Novo Processo"**, nomeie como *${temaCap}* e adicione essas 5 etapas no quadro Kanban!`;
}

// ============================================================================
// 5. MOTOR ANALÍTICO E DETERMINÍSTICO PRECISO (< 20ms)
// ============================================================================

function analisarPerguntaCognitiva(pergunta, historico, dadosBanco, usuarioNome) {
  const p = normalizarTexto(pergunta);
  const m = dadosBanco?.metricas || {};
  const setores = dadosBanco?.setores || [];
  const processos = dadosBanco?.processos || [];
  const responsaveis = dadosBanco?.responsaveis || [];

  // A1. Taxa de Conclusão / Produtividade
  if (/\b(taxa de conclusao|porcentagem de conclusao|percentual de conclusao|quantas tarefas concluidas|tarefas concluidas|produtividade atual|taxa de entrega)\b/i.test(p)) {
    if (m.totalTarefas === 0) {
      return `Atualmente a sua **taxa de conclusão é de 0%**, pois ainda não há tarefas cadastradas nos processos ativos.

- 📊 **Processos Ativos**: ${m.totalProcessos} processo(s) registrado(s).
- 📝 **Tarefas Totais**: 0 tarefas cadastradas até o momento.
- ✅ **Como começar**: Abra qualquer processo na aba **Processos** e clique em **"Nova Tarefa"**.`;
    }

    const listaPorProcesso = processos.slice(0, 5).map(proc => {
      const tot = Number(proc.total_tarefas) || 0;
      const conc = Number(proc.tarefas_concluidas) || 0;
      const pend = Number(proc.tarefas_pendentes) || 0;
      const taxa = tot > 0 ? Math.round((conc / tot) * 100) : 0;
      return `📊 **${proc.nome}**: **${taxa}% concluído** (${conc} de ${tot} tarefas finalizadas | ${pend} pendentes).`;
    });

    return `A **taxa de conclusão geral** da sua operação no Vinculum é de **${m.taxaConclusao}%** (${m.totalConcluidas} concluídas de ${m.totalTarefas} tarefas totais).

- ✅ **Tarefas Concluídas**: **${m.totalConcluidas}** atividade(s) finalizada(s).
- ⏳ **Tarefas Pendentes**: **${m.totalPendentes}** em andamento (${m.totalAtrasadas} atrasadas).
${listaPorProcesso.map(item => `- ${item}`).join('\n')}

💡 **Dica Prática:** Filtre as **${m.totalPendentes} tarefas pendentes** na tela **Tabela** para priorizar o fechamento da semana.`;
  }

  // A2. Quem tem mais tarefas / Responsável sobrecarregado
  if (/\b(quem tem mais tarefas|quem tem mais pendencias|usuario com mais tarefas|responsavel com mais tarefas|quem tem mais atrasos|usuario com mais atrasos|carga de trabalho|desempenho da equipe|colaborador com mais)\b/i.test(p)) {
    if (responsaveis.length === 0) {
      return `Ainda não há colaboradores com tarefas atribuídas registradas no banco de dados.

- 👥 **Equipe**: Nenhum vínculo de responsável encontrado nas tarefas atuais.
- 🛠️ **Como atribuir**: Abra qualquer cartão de tarefa no Kanban e selecione o colaborador no campo **Responsável**.`;
    }

    const maisAtrasadas = [...responsaveis].sort((a, b) => (b.atrasadas || 0) - (a.atrasadas || 0))[0];
    const maisPendentes = [...responsaveis].sort((a, b) => (b.pendentes || 0) - (a.pendentes || 0))[0];

    return `Panorama de **carga de trabalho e gargalos por colaborador** na equipe:

- ⚠️ **Usuário com Mais Tarefas Atrasadas**: **${maisAtrasadas?.nome || 'Nenhum'}** (${maisAtrasadas?.atrasadas || 0} tarefa(s) vencida(s)).
- ⏳ **Usuário com Mais Tarefas Pendentes**: **${maisPendentes?.nome || 'Nenhum'}** (${maisPendentes?.pendentes || 0} em andamento).

${responsaveis.map(r => `- 👤 **${r.nome}**: **${r.pendentes || 0} pendente(s)** (${r.atrasadas || 0} atrasada(s)).`).join('\n')}

💡 **Dica Prática:** Utilize a tela **Tabela** aplicando o filtro por colaborador para alinhar com quem possui maior volume acumulado.`;
  }

  // A3. Quantos Setores / Quais Setores
  if (/\b(quantos setores|quais setores|setores cadastrados|setores existem|listar setores|lista de setores|meus setores|setores temos)\b/i.test(p) || (/\b(setor|setores)\b/i.test(p) && /\b(quantos|quais|cadastrados|temos|existem|listar)\b/i.test(p))) {
    if (setores.length === 0) {
      return `No momento **não há setores cadastrados** ou vinculados ao seu perfil no sistema.

- 🏢 **Total de Setores**: 0 setores encontrados.
- 📂 **Processos Ativos**: ${m.totalProcessos} processo(s) no sistema.`;
    }

    return `Atualmente existem **${setores.length} setor(es) cadastrado(s)** na sua estrutura organizacional:

${setores.map(s => `- 🏢 **${s.nome}**: possui **${s.total_processos}** processo(s) vinculado(s).`).join('\n')}

💡 **Dica Prática:** Na tela de **Usuários**, vincule cada colaborador aos seus setores para segmentar o acesso aos quadros.`;
  }

  // A4. Quantos Processos / Quais Processos
  if (/\b(quais processos|quantos processos|listar processos|meus processos|processos cadastrados|processos temos|processos ativos|resumo dos processos)\b/i.test(p)) {
    if (processos.length === 0) {
      return `Atualmente **não há processos cadastrados** nos seus setores no Vinculum.

1. 📂 **Acesse Processos**: Clique na aba **Processos** no menu lateral.
2. ➕ **Novo Processo**: Clique no botão no canto superior direito para criar o primeiro fluxo.`;
    }

    return `Você possui atualmente **${m.totalProcessos} processo(s) ativo(s)** totalizando **${m.totalTarefas} tarefa(s)** (${m.taxaConclusao}% concluídas):

${processos.map(proc => {
      const tot = Number(proc.total_tarefas) || 0;
      const pend = Number(proc.tarefas_pendentes) || 0;
      const atras = Number(proc.tarefas_atrasadas) || 0;
      return `- 📂 **${proc.nome}**${proc.setor_nome ? ` (*${proc.setor_nome}*)` : ''}: **${tot} tarefas** (${pend} pendentes, ${atras} atrasadas) em **${proc.total_etapas} etapas**.`;
    }).join('\n')}

💡 **Dica Prática:** Clique em qualquer um desses processos na aba **Processos** para abrir o quadro Kanban interativo.`;
  }

  // A5. Tarefas atrasadas / pendentes
  if (/\b(quantas tarefas|tarefas atrasadas|tarefas vencidas|tarefas pendentes|resumo de tarefas|temos atrasos)\b/i.test(p)) {
    return `Panorama atual de atividades da sua empresa (**${m.totalTarefas} tarefas totais**):

- ⚠️ **Tarefas Atrasadas (Gargalos)**: **${m.totalAtrasadas}** tarefa(s) com prazo vencido.
- ⏳ **Tarefas Pendentes (Em Aberto)**: **${m.totalPendentes}** tarefa(s) em andamento.
- ✅ **Tarefas Concluídas**: **${m.totalConcluidas}** tarefa(s) finalizada(s) (**${m.taxaConclusao}%**).

💡 **Dica Prática:** Acesse a tela **Tabela** e filtre pela situação **Atrasada** para listar todos os gargalos imediatamente.`;
  }

  // B. PEDIDO DE FLUXO / ETAPAS POR NICHO OU TEMA LIVRE
  const pediuFluxoExplicitamente =
    /\b(fluxo ideal|melhor fluxo|criar um fluxo|fazer um fluxo|montar um fluxo|sugira um fluxo|sugestao de fluxo|como estruturar|estruturar um fluxo|fluxo para|fluxo pra|fluxo de|processo para|processo pra|etapas para|etapas pra)\b/i.test(p);

  const nichoDaMensagemAtual = detectarNichoTopico(pergunta);

  if (pediuFluxoExplicitamente || nichoDaMensagemAtual !== 'generico') {
    if (nichoDaMensagemAtual !== 'generico' && BASE_NICHOS[nichoDaMensagemAtual]) {
      const nicho = BASE_NICHOS[nichoDaMensagemAtual];
      return `O fluxo ideal para **${nicho.nome}** no Vinculum organiza o trabalho em **5 etapas sequenciais**:

${nicho.etapas.map((e, idx) => `${idx + 1}. ${e.replace(/^\d+\.\s*/, '')}`).join('\n')}

💡 **Dica Prática:** No topo do Kanban, clique em **"Campos"** e cadastre: *${nicho.campos.slice(0, 3).join('*, *')}*. ${nicho.dica}`;
    }

    const temaExtraido = extrairTemaLivreFluxo(pergunta);
    if (temaExtraido) {
      return gerarFluxoDinamicoSobMedida(temaExtraido);
    }
  }

  // C. TUTORIAIS E AÇÕES PRÁTICAS DO SISTEMA
  if (/^(oi|ola|bom dia|boa tarde|boa noite|opa|fala|e ai)\b/i.test(p) || /\b(quem e voce|qual seu nome)\b/i.test(p)) {
    return `Olá${usuarioNome && usuarioNome !== 'Usuário' ? `, ${usuarioNome}` : ''}! Sou o **Vinculum IA**, seu consultor de processos e analista operacional.

- 📊 **Métricas ao Vivo**: Consulte sua taxa de conclusão (**${m.taxaConclusao}%**), setores (**${m.totalSetores}**), processos (**${m.totalProcessos}**) e atrasos (**${m.totalAtrasadas}**).
- 📋 **Desenho de Fluxos Kanban**: Peça um fluxo para qualquer área (ex: *"Fluxo para montagem de carros"*, *"Fluxo para vendas"*).
- 🛠️ **Ajuda do Sistema**: Tire dúvidas sobre tarefas, etapas, campos personalizados e relatórios CSV.

💡 **Dica Prática:** Pergunte sobre os indicadores do seu banco ou peça para desenharmos um fluxo novo agora!`;
  }

  if (/\b(exportar|csv|excel|planilha|baixar dados|relatorio)\b/i.test(p)) {
    return `Para extrair suas informações operacionais em planilha, utilize o recurso de **exportação CSV na tela Tabela**.

1. 📊 **Acesse a Tela Tabela**: Clique em **Tabela** no menu lateral esquerdo.
2. 🔍 **Aplique os Filtros**: Refine por processo, etapa ou situação (*Atrasada*, *Pendente*).
3. 📥 **Baixe o Arquivo**: Clique em **"Exportar"** no canto superior direito.

💡 **Dica Prática:** Filtre pelas tarefas *Atrasadas* antes de exportar para gerar um relatório executivo para a diretoria.`;
  }

  if (/\b(criar etapa|nova etapa|adicionar etapa|adicionar coluna|nova coluna)\b/i.test(p)) {
    return `Para adicionar uma nova coluna no seu quadro Kanban:

1. 📂 **Abra o Processo**: Acesse o fluxo na aba **Processos** ou **Fluxo**.
2. ➕ **Clique em "Etapa"**: Localize o botão na barra superior do quadro.
3. 🏷️ **Salve o Nome**: Digite o nome da fase e confirme em **Salvar Etapa**.

💡 **Dica Prática:** Arraste o cabeçalho da nova coluna horizontalmente para ajustar sua posição na sequência.`;
  }

  if (/\b(reordenar|mudar ordem|trocar ordem|reorganizar)\b/i.test(p) && /\b(etapa|etapas|coluna|colunas)\b/i.test(p)) {
    return `Para reorganizar a sequência das colunas no Kanban:

1. 🔄 **Clique e Segure**: Mantenha pressionado o cabeçalho da coluna que deseja mover.
2. ↔️ **Arraste para os Lados**: Posicione na ordem desejada.
3. 💾 **Salvamento Automático**: A nova sequência é gravada no banco imediatamente.

💡 **Dica Prática:** Mantenha entre 4 e 6 etapas organizadas da esquerda para a direita.`;
  }

  if (/\b(criar processo|novo processo|adicionar processo|criar um processo)\b/i.test(p)) {
    return `Para estruturar um novo fluxo de trabalho no Vinculum:

1. 📂 **Acesse Processos**: Clique na aba **Processos** no menu lateral.
2. ➕ **Novo Processo**: Clique no botão no canto superior direito.
3. 📝 **Identificação**: Informe o nome, selecione o setor e salve. O sistema cria automaticamente as etapas *Em Andamento* e *Finalização*.

💡 **Dica Prática:** Personalize as etapas e adicione os **"Campos"** logo após criar o fluxo.`;
  }

  if (/\b(excluir processo|remover processo|apagar processo|deletar processo|cascata)\b/i.test(p)) {
    return `A exclusão de um processo no Vinculum opera em **exclusão em cascata definitiva**:

1. 📂 **Localize o Processo**: Acesse a aba **Processos**.
2. 🗑️ **Clique na Lixeira**: No cartão correspondente, confirme a exclusão.
3. ⚠️ **Atenção**: Remove permanentemente o fluxo, etapas, tarefas e histórico.

💡 **Dica Prática:** Exporte um relatório CSV na tela **Tabela** antes de apagar um processo antigo.`;
  }

  if (/\b(criar tarefa|nova tarefa|adicionar tarefa|cadastrar tarefa)\b/i.test(p)) {
    return `Para cadastrar uma nova atividade no Kanban:

1. 📂 **Abra o Processo**: Entre no quadro correspondente.
2. ➕ **Clique em "Nova Tarefa"**: Localize o botão azul no canto superior direito.
3. 📝 **Preencha os Campos**: Digite o título, atribua o responsável e defina o **Prazo**.
4. 💾 **Confirme**: Clique em **Criar Tarefa**.

💡 **Dica Prática:** Use verbos de ação no título (ex: *"Emitir NF 402"*).`;
  }

  if (/\b(mover|arrastar|avancar|mudar de etapa|trocar de coluna)\b/i.test(p) && /\b(tarefa|tarefas|cartao|cartoes|card|kanban)\b/i.test(p)) {
    return `Para movimentar tarefas entre as colunas do Kanban:

1. 🔄 **Drag & Drop**: Clique, segure e arraste o cartão até a coluna de destino.
2. 📑 **Validação**: Preencha eventuais campos obrigatórios exigidos pela etapa.
3. 🔒 **Auditoria**: O sistema registra data, hora e responsável pela movimentação.

💡 **Dica Prática:** Você também pode alterar a etapa abrindo os detalhes do cartão.`;
  }

  if (/\b(campo personalizado|campos personalizados|campos da tarefa|adicionar campo|campo de moeda)\b/i.test(p)) {
    return `Para configurar campos personalizados em um processo:

1. 🛠️ **Abra o Quadro**: Acesse o fluxo desejado.
2. ⚙️ **Clique em "Campos"**: No menu superior do quadro.
3. ➕ **Configure**: Defina nome, tipo (*Texto*, *Moeda R$*, *Data*, etc.) e obrigatoriedade por etapa.

💡 **Dica Prática:** Os campos personalizados criados viram colunas dinâmicas automáticas na tela **Tabela**!`;
  }

  if (/\b(dashboard|painel|kpi|kpis)\b/i.test(p)) {
    return `O **Dashboard** é o seu painel executivo em tempo real:

- 📈 **Indicadores**: Exibe **${m.totalProcessos} processos**, **${m.totalPendentes} pendentes**, **${m.totalConcluidas} concluídas (${m.taxaConclusao}%)** e **${m.totalAtrasadas} atrasadas**.
- ⚡ **Produtividade**: Acompanhe o ritmo de entregas da equipe.

💡 **Dica Prática:** Monitore o indicador de *Tarefas Atrasadas* logo cedo para agir preventivamente.`;
  }

  if (/\b(boas praticas|gargalo|gargalos|wip|work in progress|limite de tarefas)\b/i.test(p)) {
    return `Princípios essenciais de Kanban para PMEs no Vinculum:

- 🎯 **Fluxos Enxutos**: Mantenha entre 4 e 6 etapas.
- 🚧 **Limite de WIP**: Restrinja o número de tarefas simultâneas para focar em concluir.
- 👤 **Responsável Único**: Cada cartão deve ter apenas um dono.
- ⏱️ **Alinhamento de 15 Minutos**: Reúna o time semanalmente em frente ao quadro.

💡 **Dica Prática:** Use a tela **Tabela** para combater diariamente as **${m.totalAtrasadas} tarefas atrasadas** da sua empresa.`;
  }

  return null;
}

// ============================================================================
// 6. SINTETIZADOR CONTEXTUAL DE BANCO (RESPOSTAS RICAS SEM DEPENDER DE LLM)
// ============================================================================

function gerarRespostaContextualizadaBanco(pergunta, dadosBanco, usuarioNome) {
  const p = normalizarTexto(pergunta);
  const m = dadosBanco?.metricas || {};
  const processos = dadosBanco?.processos || [];
  const setores = dadosBanco?.setores || [];

  for (const proc of processos) {
    const nomeProcNorm = normalizarTexto(proc.nome);
    if (nomeProcNorm && nomeProcNorm.length >= 3 && p.includes(nomeProcNorm)) {
      const tot = Number(proc.total_tarefas) || 0;
      const conc = Number(proc.tarefas_concluidas) || 0;
      const pend = Number(proc.tarefas_pendentes) || 0;
      const atras = Number(proc.tarefas_atrasadas) || 0;
      const taxa = tot > 0 ? Math.round((conc / tot) * 100) : 0;
      const etapasProc = (dadosBanco.etapas || []).filter(e => e.processo_id === proc.id);

      return `O processo **${proc.nome}**${proc.setor_nome ? ` (Setor: *${proc.setor_nome}*)` : ''} possui atualmente **${tot} tarefa(s)** e **${taxa}% de conclusão**.

- ✅ **Concluídas**: **${conc}** tarefa(s) finalizada(s).
- ⏳ **Pendentes**: **${pend}** em andamento (**${atras}** atrasada(s)).
- 📋 **Etapas (${etapasProc.length})**: ${etapasProc.length > 0 ? etapasProc.map(e => `*${e.nome}* (${e.total_tarefas})`).join(' ➔ ') : 'Nenhuma etapa'}.

💡 **Dica Prática:** Acesse o quadro Kanban de **${proc.nome}** na aba **Processos** para gerenciar os cartões.`;
    }
  }

  const temaLivre = extrairTemaLivreFluxo(pergunta);
  if (temaLivre) {
    return gerarFluxoDinamicoSobMedida(temaLivre);
  }

  return `Panorama atual da sua conta no **Vinculum**:

- 🏢 **Estrutura**: **${m.totalSetores} setor(es)** (${setores.map(s => `*${s.nome}*`).join(', ') || 'nenhum'}) e **${m.totalProcessos} processo(s) ativo(s)**.
- 📈 **Taxa de Conclusão**: **${m.taxaConclusao}%** (**${m.totalConcluidas}** concluídas de **${m.totalTarefas}** tarefas).
- ⚠️ **Atenção**: **${m.totalPendentes}** tarefas pendentes, sendo **${m.totalAtrasadas}** com prazo vencido.

💡 **Dica Prática:** Peça **"Crie um fluxo para [sua área]"** (ex: *montagem de carros, vendas, clínica*) ou consulte o desempenho da equipe!`;
}

// ============================================================================
// 7. CONTROLLER PRINCIPAL (EXPRESS HANDLER)
// ============================================================================

async function conversar(req, res) {
  try {
    const { mensagem, historico } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ error: 'A mensagem é obrigatória.' });
    }

    const mensagemLimpa = mensagem.trim().slice(0, 4000);
    const usuarioNome = req.usuario?.nome || 'Usuário';

    // 1. Dados reais visíveis para o usuário (vazio se não estiver logado)
    const dadosBanco = await obterDadosCompletosBanco(req.usuario);

    // 2. Modelo de linguagem (Claude ou Gemini), quando houver chave configurada
    try {
      const ia = await gerarResposta({
        system: montarPromptSistema(dadosBanco, req.usuario),
        mensagens: montarMensagens(historico, mensagemLimpa),
      });
      if (ia?.texto) {
        return res.json({
          resposta: sanitizarRespostaMarkdown(ia.texto),
          origem: `llm-${ia.provedor}`,
          modelo: ia.modelo,
          modo: 'ia',
        });
      }
    } catch (errIA) {
      // Falha do provedor (chave inválida, cota, rede…): segue no motor de regras
      console.error('[chatbot] Falha no modelo de linguagem, usando modo básico:', errIA.message);
    }

    // 3. Modo básico: motor de regras + respostas montadas com os dados do banco
    const respostaDeterministica = analisarPerguntaCognitiva(mensagemLimpa, historico, dadosBanco, usuarioNome);
    if (respostaDeterministica) {
      return res.json({
        resposta: respostaDeterministica,
        origem: 'motor-analitico-instantaneo',
        modo: 'basico',
      });
    }

    const respostaContextual = gerarRespostaContextualizadaBanco(mensagemLimpa, dadosBanco, usuarioNome);
    return res.json({
      resposta: respostaContextual,
      origem: 'sintetizador-dados-reais',
      modo: 'basico',
    });
  } catch (err) {
    console.error('[chatbot] Erro no controller:', err);
    return res.status(200).json({
      resposta: `Olá, ${req.usuario?.nome || 'Usuário'}! Sou o **Vinculum IA**, seu consultor de processos.

Ocorreu uma instabilidade pontual, mas seus quadros nas abas **Processos**, **Fluxo Kanban** e **Tabela** seguem operando normalmente.

💡 **Dica Prática:** Envie sua pergunta novamente em instantes.`,
      origem: 'recuperacao-erro'
    });
  }
}

function detectarIntencao(mensagem) {
  return 'analitico';
}

function recuperarContextoRAG(mensagem) {
  return CONHECIMENTO_SISTEMA.visaoGeral;
}

module.exports = {
  conversar,
  montarPromptSistema,
  montarMensagens,
  obterDadosCompletosBanco,
  isEtapaFinal,
  analisarPerguntaCognitiva,
  detectarIntencao,
  CONHECIMENTO_SISTEMA,
  obterContextoProcessos,
  recuperarContextoRAG
};