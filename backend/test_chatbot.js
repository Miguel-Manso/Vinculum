// Teste automatizado abrangente de perguntas comuns para o Chatbot com IA do Vinculum
const fetch = globalThis.fetch;

const PERGUNTAS_TESTE = [
  // --- TELAS DO SISTEMA ---
  {
    pergunta: 'O que a página de tabela faz?',
    esperado: ['tabela', 'csv', 'filtro'],
    descricao: 'Pergunta sobre a página Tabela'
  },
  {
    pergunta: 'O que a guia processos faz?',
    esperado: ['processo', 'etapa', 'kanban'],
    descricao: 'Pergunta sobre a página de Processos'
  },
  {
    pergunta: 'O que a página de fluxo faz?',
    esperado: ['fluxo', 'kanban', 'coluna', 'arrastar'],
    descricao: 'Pergunta sobre a página de Fluxo (Kanban)'
  },
  {
    pergunta: 'O que a página de dashboard faz?',
    esperado: ['dashboard', 'indicador', 'kpi', 'tarefa'],
    descricao: 'Pergunta sobre o Dashboard'
  },
  {
    pergunta: 'O que a tela de tarefas faz?',
    esperado: ['tarefa', 'histórico', 'prazo', 'responsável'],
    descricao: 'Pergunta sobre a tela de Tarefa'
  },
  {
    pergunta: 'O que tem na guia de usuários?',
    esperado: ['usuário', 'perfil', 'administrador', 'responsável'],
    descricao: 'Pergunta sobre a página de Usuários'
  },
  {
    pergunta: 'Como funciona o site/projeto?',
    esperado: ['vinculum', 'processo', 'pme', 'kanban'],
    descricao: 'Pergunta sobre o funcionamento geral do sistema'
  },
  {
    pergunta: 'Para que serve o Vinculum?',
    esperado: ['processo', 'gestão', 'pme'],
    descricao: 'Pergunta sobre o objetivo do sistema'
  },
  {
    pergunta: 'Olá, quem é você e como pode me ajudar?',
    esperado: ['vinculum', 'assistente', 'ajudar'],
    descricao: 'Saudação e apresentação'
  },

  // --- OPERAÇÕES NO SISTEMA ---
  {
    pergunta: 'Como criar uma nova etapa no Kanban?',
    esperado: ['etapa', 'nova etapa', 'salvar'],
    descricao: 'Operacional: criar nova etapa/coluna'
  },
  {
    pergunta: 'Como adicionar uma coluna no fluxo?',
    esperado: ['etapa', 'nova etapa', 'coluna'],
    descricao: 'Operacional: adicionar coluna'
  },
  {
    pergunta: 'Como editar o nome de uma etapa?',
    esperado: ['etapa', 'lápis', 'salvar'],
    descricao: 'Operacional: renomear etapa'
  },
  {
    pergunta: 'Como excluir uma etapa?',
    esperado: ['excluir', 'etapa', 'lixeira'],
    descricao: 'Operacional: excluir etapa'
  },
  {
    pergunta: 'Como reordenar as colunas do fluxo?',
    esperado: ['reordenar', 'arrastar', 'cabeçalho'],
    descricao: 'Operacional: reordenar etapas'
  },
  {
    pergunta: 'Como criar um processo novo?',
    esperado: ['novo processo', 'processos', 'nome', 'salvar'],
    descricao: 'Operacional: criar processo'
  },
  {
    pergunta: 'Como editar um processo?',
    esperado: ['processos', 'lápis', 'editar', 'salvar'],
    descricao: 'Operacional: editar processo'
  },
  {
    pergunta: 'Como excluir um processo?',
    esperado: ['excluir', 'processo', 'cascata'],
    descricao: 'Operacional: excluir processo'
  },
  {
    pergunta: 'O que acontece se eu excluir um processo?',
    esperado: ['cascata', 'tarefas', 'etapas'],
    descricao: 'Operacional: impacto da exclusão em cascata'
  },
  {
    pergunta: 'Como criar uma nova tarefa?',
    esperado: ['nova tarefa', 'processo', 'título', 'etapa'],
    descricao: 'Operacional: como criar tarefa'
  },
  {
    pergunta: 'Como editar uma tarefa?',
    esperado: ['tarefa', 'detalhes', 'título', 'salvas'],
    descricao: 'Operacional: editar tarefa'
  },
  {
    pergunta: 'Como excluir uma tarefa?',
    esperado: ['excluir', 'tarefa', 'confirme'],
    descricao: 'Operacional: excluir tarefa'
  },
  {
    pergunta: 'Como mover uma tarefa no Kanban?',
    esperado: ['arrastar', 'soltar', 'coluna', 'etapa'],
    descricao: 'Operacional: como mover tarefa'
  },
  {
    pergunta: 'Como definir prazo ou data de entrega na tarefa?',
    esperado: ['prazo', 'calendário', 'atrasada'],
    descricao: 'Operacional: definir prazo'
  },
  {
    pergunta: 'Como atribuir um responsável para a tarefa?',
    esperado: ['responsável', 'colaborador', 'tarefa'],
    descricao: 'Operacional: atribuir responsável'
  },
  {
    pergunta: 'Como ver tarefas atrasadas?',
    esperado: ['dashboard', 'tabela', 'atrasadas'],
    descricao: 'Operacional: localizar tarefas atrasadas'
  },
  {
    pergunta: 'Como exportar os dados para CSV?',
    esperado: ['exportar', 'csv', 'tabela'],
    descricao: 'Operacional: exportação CSV'
  },
  {
    pergunta: 'Como usar os filtros da tabela?',
    esperado: ['filtro', 'processo', 'etapa', 'situação', 'tabela'],
    descricao: 'Operacional: filtros da tabela'
  },
  {
    pergunta: 'O que são campos personalizados?',
    esperado: ['campo', 'personalizado', 'moeda', 'texto', 'data'],
    descricao: 'Operacional: campos customizados'
  },
  {
    pergunta: 'Como adicionar um campo de valor em dinheiro?',
    esperado: ['campos da tarefa', 'moeda', 'r$'],
    descricao: 'Operacional: campo tipo moeda'
  },
  {
    pergunta: 'Como cadastrar um usuário na equipe?',
    esperado: ['usuários', 'novo usuário', 'administrador', 'perfil'],
    descricao: 'Operacional: cadastro de usuários'
  },
  {
    pergunta: 'Como funciona o login e autenticação?',
    esperado: ['login', 'jwt', 'senha', 'logout'],
    descricao: 'Operacional: login e autenticação'
  },

  // --- CONSULTORIA METODOLÓGICA & BOAS PRÁTICAS ---
  {
    pergunta: 'Quais são as melhores práticas para PMEs organizarem processos?',
    esperado: ['etapa', 'responsável', 'gargalo', 'pme'],
    descricao: 'Consultoria: boas práticas'
  },
  {
    pergunta: 'Como resolver gargalos na minha empresa?',
    esperado: ['gargalo', 'coluna', 'tarefa'],
    descricao: 'Consultoria: resolução de gargalos'
  },
  {
    pergunta: 'O que é limite de WIP no Kanban?',
    esperado: ['wip', 'work in progress', 'gargalo'],
    descricao: 'Consultoria: conceito de WIP'
  },
  {
    pergunta: 'Quantas etapas um fluxo deve ter no máximo?',
    esperado: ['4 e 6', 'etapas', 'kanban'],
    descricao: 'Consultoria: quantidade recomendada de etapas'
  },

  // --- CONSULTORIA DE FLUXOS POR NICHO (CASOS CRÍTICOS DO USUÁRIO) ---
  {
    pergunta: 'quero fazer um fluxo de processos para o recebimento de mercadoria. Qual o fluxo ideal',
    esperado: ['recebimento de mercadoria', 'doca', 'conferência', 'fiscal', 'estoque'],
    invalidoSeContiver: 'A tela de Fluxo é o coração visual',
    descricao: 'Caso do usuário: recebimento de mercadorias'
  },
  {
    pergunta: 'E quais seriam as tarefas pra cada etapa desse processo?',
    historico: [
      { remetente: 'usuario', texto: 'quero fazer um fluxo de processos para o recebimento de mercadoria. Qual o fluxo ideal' },
      { remetente: 'ia', texto: 'Para o recebimento de mercadorias...' }
    ],
    esperado: ['recebimento de mercadorias', 'danfe', 'volumes', 'conferência cega', 'etiquetagem'],
    descricao: 'Caso do usuário (Follow-up com histórico): tarefas de recebimento'
  },
  {
    pergunta: 'Vamos dizer que eu tenha um restaurante e quero fazer um fluxo de processos para o preparo de uma sopa. Qual o fluxo ideal',
    esperado: ['sopa', 'restaurante', 'mise en place', 'cocção', 'qualidade'],
    invalidoSeContiver: 'A tela de Fluxo é o coração visual',
    descricao: 'Caso de restaurante: preparo de sopa'
  },
  {
    pergunta: 'E quais seriam as tarefas pra cada etapa desse processo?',
    historico: [
      { remetente: 'usuario', texto: 'Vamos dizer que eu tenha um restaurante e quero fazer um fluxo de processos para o preparo de uma sopa. Qual o fluxo ideal' },
      { remetente: 'ia', texto: 'Para o preparo de sopas e pratos em um restaurante...' }
    ],
    esperado: ['mise en place', 'cocção', 'degustação', 'banho-maria', 'salão'],
    descricao: 'Follow-up de restaurante com histórico: tarefas da sopa'
  },
  {
    pergunta: 'Qual o fluxo ideal para o processo de vendas da empresa?',
    esperado: ['vendas', 'lead', 'proposta', 'negociação', 'fechamento'],
    invalidoSeContiver: 'A tela de Fluxo é o coração visual',
    descricao: 'Consultoria de processo: funil de vendas'
  },
  {
    pergunta: 'E quais as tarefas para cada etapa de vendas?',
    esperado: ['prospecção', 'diagnóstico', 'proposta', 'follow-up', 'contrato'],
    descricao: 'Tarefas por etapa: processo de vendas'
  },
  {
    pergunta: 'Como estruturar o fluxo de compras e suprimentos?',
    esperado: ['compras', 'cotação', 'fornecedor', 'aprovação'],
    invalidoSeContiver: 'A tela de Fluxo é o coração visual',
    descricao: 'Consultoria de processo: compras e suprimentos'
  },
  {
    pergunta: 'E quais tarefas para cada etapa de compras?',
    esperado: ['solicitação', 'cotação', 'fornecedor', 'aprovação financeira'],
    descricao: 'Tarefas por etapa: compras'
  },
  {
    pergunta: 'Qual o fluxo ideal para RH e recrutamento?',
    esperado: ['recrutamento', 'vaga', 'currículo', 'entrevista', 'admissão'],
    descricao: 'Consultoria de processo: RH'
  },
  {
    pergunta: 'E quais tarefas para cada etapa de RH?',
    esperado: ['briefing', 'triagem', 'entrevistas', 'proposta', 'onboarding'],
    descricao: 'Tarefas por etapa: RH'
  },
  {
    pergunta: 'Qual o fluxo ideal para contas a pagar e financeiro?',
    esperado: ['financeiro', 'documento fiscal', 'aprovação', 'bancário', 'conciliação'],
    descricao: 'Consultoria de processo: financeiro'
  },
  {
    pergunta: 'E quais tarefas para cada etapa do financeiro?',
    esperado: ['danfe', 'ordem de compra', 'alçada', 'internet banking', 'baixa'],
    descricao: 'Tarefas por etapa: financeiro'
  },
  {
    pergunta: 'Qual o fluxo ideal para uma oficina mecânica?',
    esperado: ['oficina', 'ordem de serviço', 'diagnóstico', 'peças', 'rodagem'],
    descricao: 'Consultoria de processo: oficina mecânica'
  },
  {
    pergunta: 'E quais tarefas para cada etapa da oficina?',
    esperado: ['checklist', 'scanner', 'orçamento', 'reparo', 'rodagem'],
    descricao: 'Tarefas por etapa: oficina mecânica'
  },
  {
    pergunta: 'Qual o fluxo ideal para clínica ou consultório de saúde?',
    esperado: ['clínica', 'agendamento', 'triagem', 'consulta', 'retorno'],
    descricao: 'Consultoria de processo: clínica de saúde'
  },
  {
    pergunta: 'E quais tarefas para cada etapa da clínica?',
    esperado: ['anamnese', 'sinais vitais', 'prontuário', 'laudo', 'retorno'],
    descricao: 'Tarefas por etapa: clínica de saúde'
  },
  {
    pergunta: 'Qual o fluxo ideal para marcenaria e móveis?',
    esperado: ['marcenaria', 'projeto', 'corte', 'módulos', 'montagem'],
    descricao: 'Consultoria de processo: marcenaria'
  },
  {
    pergunta: 'Qual o fluxo ideal para confeitaria e padaria?',
    esperado: ['confeitaria', 'encomenda', 'massa', 'recheio', 'decoração'],
    descricao: 'Consultoria de processo: confeitaria'
  },
  {
    pergunta: 'Qual o fluxo ideal para desenvolvimento de software e TI?',
    esperado: ['backlog', 'desenvolvimento', 'code review', 'qa', 'produção'],
    descricao: 'Consultoria de processo: TI e software'
  },
  {
    pergunta: 'Qual o fluxo ideal para imobiliária e locação?',
    esperado: ['imobiliária', 'visita', 'proposta', 'contrato', 'chaves'],
    descricao: 'Consultoria de processo: imobiliária'
  },
  {
    pergunta: 'Qual o fluxo ideal pra montar PC',
    esperado: ['computador', 'compatibilidade', 'bancada', 'post', 'estresse'],
    descricao: 'Caso do usuário: montagem de PC gamer / hardware'
  },
  {
    pergunta: 'E quais seriam as tarefas pra cada etapa desse processo?',
    historico: [
      { autor: 'user', texto: 'Qual o fluxo ideal pra montar PC' },
      { autor: 'assistant', texto: 'Para a montagem e upgrade de computadores...' }
    ],
    esperado: ['soquete', 'antiestática', 'pasta térmica', 'bios', 'benchmarks'],
    descricao: 'Follow-up de montagem de PC: tarefas técnicas'
  },
  {
    pergunta: 'Qual o fluxo ideal para fabricação de pranchas de surf',
    esperado: ['pranchas de surf', 'especificação', 'insumos', 'montagem', 'qualidade'],
    descricao: 'Síntese Dinâmica: nicho não cadastrado (pranchas de surf)'
  },
  {
    pergunta: 'Qual o fluxo ideal para manutenção de celulares e smartphones',
    esperado: ['celular', 'ordem de serviço', 'bancada', 'reparo', 'testes'],
    descricao: 'Consultoria de processo: manutenção de celulares'
  }
];

async function executarTestes() {
  console.log('===============================================================');
  console.log('🧪 INICIANDO SUÍTE COMPLETA: CHATBOT IA DO VINCULUM');
  console.log('===============================================================\n');

  let sucessos = 0;
  let falhas = 0;

  for (let i = 0; i < PERGUNTAS_TESTE.length; i++) {
    const item = PERGUNTAS_TESTE[i];
    const inicio = Date.now();

    try {
      const resp = await fetch('http://localhost:3000/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensagem: item.pergunta,
          historico: item.historico || []
        }),
      });

      const duracao = Date.now() - inicio;
      const data = await resp.json();
      const texto = data.resposta || '';

      // Validações
      const temStatusOk = resp.status === 200;
      const temTamanhoAdequado = texto.length >= 100;
      const palavrasEncontradas = item.esperado.filter(p => texto.toLowerCase().includes(p.toLowerCase()));
      const atendePalavras = palavrasEncontradas.length >= 1;

      // Verifica se caiu em resposta genérica ou colidiu indevidamente com tela de fluxo
      const eRespostaGenerica = texto.includes('Com base nos processos registrados no seu sistema Vinculum:\n\nAtualmente não há processos cadastrados');
      const eFallbackOrientativo = data.origem === 'fallback-orientativo';
      const contemTextoInvalido = item.invalidoSeContiver && texto.includes(item.invalidoSeContiver);

      if (temStatusOk && temTamanhoAdequado && atendePalavras && !eRespostaGenerica && !eFallbackOrientativo && !contemTextoInvalido) {
        console.log(`✅ [${i + 1}/${PERGUNTAS_TESTE.length}] PASSOU (${duracao}ms) - ${item.descricao}`);
        console.log(`   Pergunta: "${item.pergunta}"`);
        console.log(`   Origem: ${data.origem} | Tamanho: ${texto.length} caracteres`);
        console.log(`   Trecho: ${texto.slice(0, 100).replace(/\n/g, ' ')}...\n`);
        sucessos++;
      } else {
        console.error(`❌ [${i + 1}/${PERGUNTAS_TESTE.length}] FALHOU (${duracao}ms) - ${item.descricao}`);
        console.error(`   Pergunta: "${item.pergunta}"`);
        console.error(`   Resposta recebida: "${texto.slice(0, 150)}..."`);
        console.error(`   Motivo: Status=${resp.status}, Tamanho=${texto.length}, Palavras=${palavrasEncontradas.length}/${item.esperado.length}, ÉGenérica=${eRespostaGenerica}, ÉFallback=${eFallbackOrientativo}, ContémInválido=${contemTextoInvalido}\n`);
        falhas++;
      }
    } catch (err) {
      console.error(`❌ [${i + 1}/${PERGUNTAS_TESTE.length}] ERRO DE REDE:`, err.message);
      falhas++;
    }
  }

  console.log('===============================================================');
  console.log(`RELATÓRIO FINAL: ${sucessos} aprovados, ${falhas} falhas de um total de ${PERGUNTAS_TESTE.length} testes.`);
  console.log('===============================================================');

  if (falhas > 0) {
    process.exit(1);
  } else {
    console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO! A IA responde com precisão e riqueza!');
    process.exit(0);
  }
}

executarTestes();
