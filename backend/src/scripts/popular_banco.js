const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

async function popularBanco() {
  console.log('🚀 Iniciando script de população de dados ricos para demonstração...');
  const pool = await getPool();

  try {
    // 1. Senha padrão para todos os usuários de teste: '123'
    const senhaHashPadrao = await bcrypt.hash('123', 10);

    // 2. Criar ou Atualizar Usuários de diferentes áreas
    const listaUsuarios = [
      { nome: 'Admin Geral', email: 'admin@vinculum.com', perfil: 'admin' },
      { nome: 'Miguel Manso', email: 'miguelfilipemanso13@gmail.com', perfil: 'admin' },
      { nome: 'Beatriz Lima', email: 'beatriz.rh@vinculum.com', perfil: 'usuario' },
      { nome: 'Fernanda Souza', email: 'fernanda.dev@vinculum.com', perfil: 'usuario' },
      { nome: 'Carlos Eduardo', email: 'carlos.fin@vinculum.com', perfil: 'usuario' },
      { nome: 'Rodrigo Alves', email: 'rodrigo.ops@vinculum.com', perfil: 'usuario' },
      { nome: 'Larissa Mendes', email: 'larissa.jur@vinculum.com', perfil: 'usuario' },
    ];

    const usuariosMap = {}; // email -> id

    for (const u of listaUsuarios) {
      const existe = await pool.request()
        .input('email', sql.NVarChar, u.email)
        .query('SELECT id, perfil FROM Usuarios WHERE email = @email');

      if (existe.recordset.length > 0) {
        const id = existe.recordset[0].id;
        usuariosMap[u.email] = id;
        // Garante que o perfil esteja atualizado
        await pool.request()
          .input('id', sql.Int, id)
          .input('perfil', sql.NVarChar, u.perfil)
          .query('UPDATE Usuarios SET perfil = @perfil WHERE id = @id');
      } else {
        const ins = await pool.request()
          .input('nome', sql.NVarChar, u.nome)
          .input('email', sql.NVarChar, u.email)
          .input('senha_hash', sql.NVarChar, senhaHashPadrao)
          .input('perfil', sql.NVarChar, u.perfil)
          .query('INSERT INTO Usuarios (nome, email, senha_hash, perfil) OUTPUT INSERTED.id VALUES (@nome, @email, @senha_hash, @perfil)');
        usuariosMap[u.email] = ins.recordset[0]?.id;
      }
    }
    console.log('✅ Usuários verificados/criados:', Object.keys(usuariosMap).length);

    // 3. Criar ou Atualizar Setores
    const listaSetores = [
      { nome: 'Geral / Administrativo', cor: '#2fd9f4', icone: 'folder', descricao: 'Processos corporativos centrais e governança geral' },
      { nome: 'Recursos Humanos (RH)', cor: '#ec4899', icone: 'users', descricao: 'Admissão, gestão de talentos, recrutamento e treinamento' },
      { nome: 'Tecnologia & TI', cor: '#3b82f6', icone: 'code', descricao: 'Engenharia de software, infraestrutura de nuvem e segurança' },
      { nome: 'Financeiro & Compras', cor: '#10b981', icone: 'dollar-sign', descricao: 'Contas a pagar/receber, orçamentos, reembolsos e aquisições' },
      { nome: 'Logística & Operações', cor: '#f59e0b', icone: 'truck', descricao: 'Expedição, estoque físico, transportadoras e suprimentos' },
      { nome: 'Jurídico & Compliance', cor: '#8b5cf6', icone: 'file-text', descricao: 'Revisão de contratos, adequação à LGPD e auditoria interna' },
    ];

    const setoresMap = {}; // nome -> id

    for (const s of listaSetores) {
      const existe = await pool.request()
        .input('nome', sql.NVarChar, s.nome)
        .query('SELECT id FROM Setores WHERE nome = @nome');

      if (existe.recordset.length > 0) {
        const id = existe.recordset[0].id;
        setoresMap[s.nome] = id;
        await pool.request()
          .input('id', sql.Int, id)
          .input('cor', sql.NVarChar, s.cor)
          .input('icone', sql.NVarChar, s.icone)
          .input('descricao', sql.NVarChar, s.descricao)
          .query('UPDATE Setores SET cor = @cor, icone = @icone, descricao = @descricao WHERE id = @id');
      } else {
        const ins = await pool.request()
          .input('nome', sql.NVarChar, s.nome)
          .input('descricao', sql.NVarChar, s.descricao)
          .input('cor', sql.NVarChar, s.cor)
          .input('icone', sql.NVarChar, s.icone)
          .query('INSERT INTO Setores (nome, descricao, cor, icone) OUTPUT INSERTED.id VALUES (@nome, @descricao, @cor, @icone)');
        setoresMap[s.nome] = ins.recordset[0]?.id;
      }
    }
    console.log('✅ Setores verificados/criados:', Object.keys(setoresMap).length);

    // 4. Vincular Usuários aos Setores (UsuarioSetores)
    const vinculos = [
      // Admins têm acesso a todos os setores
      { email: 'admin@vinculum.com', setores: Object.keys(setoresMap) },
      { email: 'miguelfilipemanso13@gmail.com', setores: Object.keys(setoresMap) },
      // Usuários departamentais
      { email: 'beatriz.rh@vinculum.com', setores: ['Recursos Humanos (RH)', 'Geral / Administrativo'] },
      { email: 'fernanda.dev@vinculum.com', setores: ['Tecnologia & TI', 'Geral / Administrativo'] },
      { email: 'carlos.fin@vinculum.com', setores: ['Financeiro & Compras', 'Geral / Administrativo'] },
      { email: 'rodrigo.ops@vinculum.com', setores: ['Logística & Operações', 'Geral / Administrativo'] },
      { email: 'larissa.jur@vinculum.com', setores: ['Jurídico & Compliance', 'Geral / Administrativo'] },
    ];

    for (const v of vinculos) {
      const uId = usuariosMap[v.email];
      if (!uId) continue;
      for (const sNome of v.setores) {
        const sId = setoresMap[sNome];
        if (!sId) continue;
        try {
          await pool.request()
            .input('u_id', sql.Int, uId)
            .input('s_id', sql.Int, sId)
            .query(`
              INSERT INTO UsuarioSetores (usuario_id, setor_id)
              SELECT @u_id, @s_id
              WHERE NOT EXISTS (
                SELECT 1 FROM UsuarioSetores WHERE usuario_id = @u_id AND setor_id = @s_id
              )
            `);
        } catch {}
      }
    }
    console.log('✅ Vínculos organizacionais de usuários e setores sincronizados.');

    // Função utilitária para datas
    const hoje = new Date();
    const dataEmDias = (dias) => {
      const d = new Date(hoje);
      d.setDate(d.getDate() + dias);
      return d.toISOString().split('T')[0];
    };

    // 5. Definição de Processos, Etapas, Campos e Tarefas para Demonstração
    const definicaoProcessos = [
      // ==========================================
      // RH 1: Onboarding de Novos Colaboradores
      // ==========================================
      {
        nome: 'Onboarding de Novos Colaboradores',
        setor: 'Recursos Humanos (RH)',
        descricao: 'Fluxo oficial de admissão, integração e entrega de recursos para novos membros da equipe.',
        etapas: [
          '1. Documentação & Contrato',
          '2. Setup de TI & Acessos',
          '3. Integração Cultural',
          '4. Concluído'
        ],
        campos: [
          { nome: 'Colaborador', tipo: 'texto', obrigatorio: 1, ordem: 1 },
          { nome: 'Cargo / Função', tipo: 'texto', obrigatorio: 1, ordem: 2 },
          { nome: 'Data de Início', tipo: 'data', obrigatorio: 1, ordem: 3 },
          { nome: 'Equipamento', tipo: 'select', opcoes: 'MacBook Pro,Dell XPS 15,ThinkPad T14', ordem: 4 },
        ],
        tarefas: [
          {
            titulo: 'Admissão: Lucas Ribeiro (Dev Front-end)',
            descricao: 'Coletar carteira de trabalho, exames médicos admissionais e assinatura digital do contrato.',
            etapaIdx: 0,
            responsavelEmail: 'beatriz.rh@vinculum.com',
            prazo: dataEmDias(-1), // Atrasada de propósito para mostrar badge
            urgente: 1,
            campos: { 'Colaborador': 'Lucas Ribeiro', 'Cargo / Função': 'Engenheiro de Software Jr', 'Data de Início': dataEmDias(5), 'Equipamento': 'MacBook Pro' }
          },
          {
            titulo: 'Setup de TI: Juliana Martins (UX Designer)',
            descricao: 'Criar contas no Google Workspace, Figma Enterprise, Slack e provisionar notebook.',
            etapaIdx: 1,
            responsavelEmail: 'fernanda.dev@vinculum.com',
            prazo: dataEmDias(1),
            urgente: 0,
            campos: { 'Colaborador': 'Juliana Martins', 'Cargo / Função': 'Product Designer Pleno', 'Data de Início': dataEmDias(2), 'Equipamento': 'MacBook Pro' }
          },
          {
            titulo: 'Boas-vindas: Rafael Duarte (Data Analyst)',
            descricao: 'Apresentação com a liderança, tour pelos departamentos e alinhamento de metas dos primeiros 30 dias.',
            etapaIdx: 2,
            responsavelEmail: 'beatriz.rh@vinculum.com',
            prazo: dataEmDias(4),
            urgente: 0,
            campos: { 'Colaborador': 'Rafael Duarte', 'Cargo / Função': 'Analista de BI Sênior', 'Data de Início': dataEmDias(0), 'Equipamento': 'Dell XPS 15' }
          },
          {
            titulo: 'Onboarding Concluído: Amanda Costa (Tech Lead)',
            descricao: 'Todos os acessos entregues, período de adaptação de 90 dias concluído com avaliação 5 estrelas.',
            etapaIdx: 3, // Concluído
            responsavelEmail: 'beatriz.rh@vinculum.com',
            prazo: dataEmDias(-10),
            urgente: 0,
            campos: { 'Colaborador': 'Amanda Costa', 'Cargo / Função': 'Tech Lead', 'Data de Início': dataEmDias(-30), 'Equipamento': 'ThinkPad T14' }
          }
        ]
      },

      // ==========================================
      // TI 1: Ciclo de Desenvolvimento (Sprints / Features)
      // ==========================================
      {
        nome: 'Ciclo de Desenvolvimento (Sprint)',
        setor: 'Tecnologia & TI',
        descricao: 'Pipeline ágil de desenvolvimento de software, revisão de código e homologação.',
        etapas: [
          '1. Backlog & Especificação',
          '2. Em Desenvolvimento',
          '3. Code Review & QA',
          '4. Finalizado / Em Produção'
        ],
        campos: [
          { nome: 'Módulo / Épico', tipo: 'texto', obrigatorio: 1, ordem: 1 },
          { nome: 'Complexidade', tipo: 'select', opcoes: 'Baixa,Média,Alta,Crítica', ordem: 2 },
          { nome: 'Branch GitHub', tipo: 'texto', ordem: 3 },
        ],
        tarefas: [
          {
            titulo: 'Integração com Webhooks de Notificação',
            descricao: 'Disparar alertas no Slack quando uma tarefa urgente for criada em qualquer processo.',
            etapaIdx: 0,
            responsavelEmail: 'fernanda.dev@vinculum.com',
            prazo: dataEmDias(7),
            urgente: 0,
            campos: { 'Módulo / Épico': 'Notificações', 'Complexidade': 'Média', 'Branch GitHub': 'feat/webhooks-slack' }
          },
          {
            titulo: 'Refatoração da Conexão Neon PostgreSQL',
            descricao: 'Implementar pooler resiliente e caching de permissões para reduzir latência em consultas pesadas.',
            etapaIdx: 1,
            responsavelEmail: 'miguelfilipemanso13@gmail.com',
            prazo: dataEmDias(2),
            urgente: 1,
            campos: { 'Módulo / Épico': 'Core Backend', 'Complexidade': 'Alta', 'Branch GitHub': 'perf/neon-pool-cache' }
          },
          {
            titulo: 'Testes E2E dos Filtros Multidimensionais',
            descricao: 'Validar persistência do seletor de setor entre as páginas Dashboard, Processos e Tabela.',
            etapaIdx: 2,
            responsavelEmail: 'fernanda.dev@vinculum.com',
            prazo: dataEmDias(1),
            urgente: 0,
            campos: { 'Módulo / Épico': 'Frontend UX', 'Complexidade': 'Média', 'Branch GitHub': 'test/sector-filters-e2e' }
          },
          {
            titulo: 'Deploy do Módulo de Exportação Excel/PDF',
            descricao: 'Relatórios analíticos disponíveis para download com suporte a filtros de setor em produção.',
            etapaIdx: 3, // Finalizado
            responsavelEmail: 'fernanda.dev@vinculum.com',
            prazo: dataEmDias(-3),
            urgente: 0,
            campos: { 'Módulo / Épico': 'Relatórios & Export', 'Complexidade': 'Baixa', 'Branch GitHub': 'feat/export-engine' }
          }
        ]
      },

      // ==========================================
      // Financeiro 1: Aprovação de Reembolsos & Despesas
      // ==========================================
      {
        nome: 'Aprovação de Reembolsos & Despesas',
        setor: 'Financeiro & Compras',
        descricao: 'Auditoria de comprovantes, validação de políticas de viagens e liquidação bancária.',
        etapas: [
          '1. Solicitação Enviada',
          '2. Conferência Fiscal',
          '3. Aprovação da Diretoria',
          '4. Liquidado / Pago'
        ],
        campos: [
          { nome: 'Valor (R$)', tipo: 'moeda', obrigatorio: 1, ordem: 1 },
          { nome: 'Categoria', tipo: 'select', opcoes: 'Alimentação,Hospedagem,Transporte,Cursos/Eventos', ordem: 2 },
          { nome: 'Número da NF', tipo: 'texto', ordem: 3 },
        ],
        tarefas: [
          {
            titulo: 'Reembolso: Viagem Tech Conference SP (Miguel)',
            descricao: 'Passagens aéreas, hotel 3 diárias e translado para conferência anual de computação.',
            etapaIdx: 1,
            responsavelEmail: 'carlos.fin@vinculum.com',
            prazo: dataEmDias(3),
            urgente: 1,
            campos: { 'Valor (R$)': 'R$ 2.450,80', 'Categoria': 'Cursos/Eventos', 'Número da NF': 'NF-2026-9812' }
          },
          {
            titulo: 'Almoço de Alinhamento com Clientes Enterprise',
            descricao: 'Reunião comercial para assinatura do contrato anual de prestação de serviços.',
            etapaIdx: 0,
            responsavelEmail: 'carlos.fin@vinculum.com',
            prazo: dataEmDias(5),
            urgente: 0,
            campos: { 'Valor (R$)': 'R$ 380,00', 'Categoria': 'Alimentação', 'Número da NF': 'NFC-84721' }
          },
          {
            titulo: 'Assinatura Anual AWS Cloud & Neon Database',
            descricao: 'Fatura de serviços em nuvem aprovada pela gerência técnica para renovação antecipada.',
            etapaIdx: 2,
            responsavelEmail: 'admin@vinculum.com',
            prazo: dataEmDias(1),
            urgente: 1,
            campos: { 'Valor (R$)': 'R$ 8.920,00', 'Categoria': 'Transporte', 'Número da NF': 'INV-US-8921' }
          },
          {
            titulo: 'Aquisição de Licenças JetBrains & GitHub Copilot',
            descricao: 'Pagamento processado e comprovante enviado ao time de engenharia.',
            etapaIdx: 3, // Liquidado
            responsavelEmail: 'carlos.fin@vinculum.com',
            prazo: dataEmDias(-7),
            urgente: 0,
            campos: { 'Valor (R$)': 'R$ 1.840,00', 'Categoria': 'Cursos/Eventos', 'Número da NF': 'NF-JB-4190' }
          }
        ]
      },

      // ==========================================
      // Logística 1: Expedição & Rastreamento de Pedidos
      // ==========================================
      {
        nome: 'Expedição & Rastreamento de Pedidos',
        setor: 'Logística & Operações',
        descricao: 'Gestão de ordens de remessa, separação em estoque e monitoramento de entregas.',
        etapas: [
          '1. Separação no Estoque',
          '2. Embalagem & Nota Fiscal',
          '3. Em Trânsito (Transportadora)',
          '4. Entrega Concluída'
        ],
        campos: [
          { nome: 'Código de Rastreio', tipo: 'texto', ordem: 1 },
          { nome: 'Transportadora', tipo: 'select', opcoes: 'Jadlog,Total Express,Azul Cargo,Correios Sedex', ordem: 2 },
          { nome: 'Volume / Peso (kg)', tipo: 'numero', ordem: 3 },
        ],
        tarefas: [
          {
            titulo: 'Remessa #4810: Lote de 20 Monitores 4K',
            descricao: 'Separação de periféricos e docking stations para o hub regional de Campinas.',
            etapaIdx: 0,
            responsavelEmail: 'rodrigo.ops@vinculum.com',
            prazo: dataEmDias(2),
            urgente: 0,
            campos: { 'Código de Rastreio': 'BR-CAMP-4810', 'Transportadora': 'Azul Cargo', 'Volume / Peso (kg)': '85' }
          },
          {
            titulo: 'Remessa #4805: Servidor Rack 2U Dell PowerEdge',
            descricao: 'Equipamento lacrado com sensor de choque. Aguardando emissão do manifesto de carga.',
            etapaIdx: 1,
            responsavelEmail: 'rodrigo.ops@vinculum.com',
            prazo: dataEmDias(0), // Vence hoje
            urgente: 1,
            campos: { 'Código de Rastreio': 'SRV-DL-4805', 'Transportadora': 'Jadlog', 'Volume / Peso (kg)': '32' }
          },
          {
            titulo: 'Remessa #4792: 50 Kits de Boas-Vindas & Brindes',
            descricao: 'Carga despachada via transportadora com destino a São Paulo capital.',
            etapaIdx: 2,
            responsavelEmail: 'rodrigo.ops@vinculum.com',
            prazo: dataEmDias(3),
            urgente: 0,
            campos: { 'Código de Rastreio': 'JAD-SP-99381', 'Transportadora': 'Jadlog', 'Volume / Peso (kg)': '40' }
          },
          {
            titulo: 'Remessa #4760: Cadeiras Ergonômicas Herman Miller',
            descricao: 'Recebimento assinado na recepção sem nenhuma avaria relatada.',
            etapaIdx: 3, // Concluída
            responsavelEmail: 'rodrigo.ops@vinculum.com',
            prazo: dataEmDias(-5),
            urgente: 0,
            campos: { 'Código de Rastreio': 'SEDEX-8472910', 'Transportadora': 'Correios Sedex', 'Volume / Peso (kg)': '120' }
          }
        ]
      },

      // ==========================================
      // Jurídico 1: Revisão e Assinatura de Contratos
      // ==========================================
      {
        nome: 'Revisão e Assinatura de Contratos',
        setor: 'Jurídico & Compliance',
        descricao: 'Análise de minutas, conformidade com a LGPD e fluxo de assinaturas digitais.',
        etapas: [
          '1. Minuta Recebida',
          '2. Análise de Riscos & Cláusulas',
          '3. Negociação com Contraparte',
          '4. Assinado & Arquivado'
        ],
        campos: [
          { nome: 'Contraparte / Cliente', tipo: 'texto', obrigatorio: 1, ordem: 1 },
          { nome: 'Vigência (Meses)', tipo: 'numero', ordem: 2 },
          { nome: 'Nível de Risco', tipo: 'select', opcoes: 'Baixo,Moderado,Alto', ordem: 3 },
        ],
        tarefas: [
          {
            titulo: 'Contrato SaaS Enterprise: Petrobras Soluções',
            descricao: 'Revisão das cláusulas de SLA (99.9%), indenização por indisponibilidade e auditoria SOC2.',
            etapaIdx: 1,
            responsavelEmail: 'larissa.jur@vinculum.com',
            prazo: dataEmDias(4),
            urgente: 1,
            campos: { 'Contraparte / Cliente': 'Petrobras Soluções', 'Vigência (Meses)': '24', 'Nível de Risco': 'Moderado' }
          },
          {
            titulo: 'Acordo de Não-Divulgação (NDA): Startup Parceira',
            descricao: 'Proteção mútua de propriedade intelectual sobre a arquitetura de sincronização do Vinculum.',
            etapaIdx: 0,
            responsavelEmail: 'larissa.jur@vinculum.com',
            prazo: dataEmDias(6),
            urgente: 0,
            campos: { 'Contraparte / Cliente': 'Apex AI Labs', 'Vigência (Meses)': '36', 'Nível de Risco': 'Baixo' }
          },
          {
            titulo: 'Renovação do Contrato de Locação Sede SP',
            descricao: 'Negociação do índice de reajuste (IPCA vs IGP-M) com o administrador do edifício.',
            etapaIdx: 2,
            responsavelEmail: 'larissa.jur@vinculum.com',
            prazo: dataEmDias(1),
            urgente: 0,
            campos: { 'Contraparte / Cliente': 'Imobiliária Paulista', 'Vigência (Meses)': '12', 'Nível de Risco': 'Moderado' }
          },
          {
            titulo: 'Contrato de Auditoria Externa Ernst & Young',
            descricao: 'Firmado com assinaturas eletrônicas DocuSign e registrado no arquivo digital.',
            etapaIdx: 3, // Concluído
            responsavelEmail: 'larissa.jur@vinculum.com',
            prazo: dataEmDias(-15),
            urgente: 0,
            campos: { 'Contraparte / Cliente': 'Ernst & Young Brasil', 'Vigência (Meses)': '12', 'Nível de Risco': 'Baixo' }
          }
        ]
      }
    ];

    // 6. Inserir Processos, Etapas e Tarefas
    for (const procDef of definicaoProcessos) {
      const setorId = setoresMap[procDef.setor];
      if (!setorId) continue;

      // Verifica se o processo já existe
      let procId;
      const existeProc = await pool.request()
        .input('nome', sql.NVarChar, procDef.nome)
        .input('setor_id', sql.Int, setorId)
        .query('SELECT id FROM Processos WHERE nome = @nome AND setor_id = @setor_id');

      if (existeProc.recordset.length > 0) {
        procId = existeProc.recordset[0].id;
        console.log(`ℹ️ Processo "${procDef.nome}" já existente (ID: ${procId}).`);
      } else {
        const insProc = await pool.request()
          .input('nome', sql.NVarChar, procDef.nome)
          .input('descricao', sql.NVarChar, procDef.descricao)
          .input('setor_id', sql.Int, setorId)
          .input('criado_por', sql.Int, usuariosMap['miguelfilipemanso13@gmail.com'] || usuariosMap['admin@vinculum.com'])
          .query('INSERT INTO Processos (nome, descricao, setor_id, criado_por) OUTPUT INSERTED.id VALUES (@nome, @descricao, @setor_id, @criado_por)');
        procId = insProc.recordset[0]?.id;
        console.log(`✨ Processo "${procDef.nome}" criado (ID: ${procId}) no setor "${procDef.setor}".`);
      }

      // Cria ou busca as Etapas em ordem
      const etapasIds = [];
      for (let i = 0; i < procDef.etapas.length; i++) {
        const etapaNome = procDef.etapas[i];
        const ordem = i + 1;

        const existeEtapa = await pool.request()
          .input('processo_id', sql.Int, procId)
          .input('nome', sql.NVarChar, etapaNome)
          .query('SELECT id FROM Etapas WHERE processo_id = @processo_id AND nome = @nome');

        if (existeEtapa.recordset.length > 0) {
          etapasIds.push(existeEtapa.recordset[0].id);
        } else {
          const insEtapa = await pool.request()
            .input('processo_id', sql.Int, procId)
            .input('nome', sql.NVarChar, etapaNome)
            .input('ordem', sql.Int, ordem)
            .query('INSERT INTO Etapas (processo_id, nome, ordem) OUTPUT INSERTED.id VALUES (@processo_id, @nome, @ordem)');
          etapasIds.push(insEtapa.recordset[0]?.id);
        }
      }

      // Cria os Campos Personalizados (CamposProcesso) se houver
      if (procDef.campos && procDef.campos.length > 0) {
        for (const c of procDef.campos) {
          const existeCampo = await pool.request()
            .input('processo_id', sql.Int, procId)
            .input('nome', sql.NVarChar, c.nome)
            .query('SELECT id FROM CamposProcesso WHERE processo_id = @processo_id AND nome = @nome');

          if (existeCampo.recordset.length === 0) {
            await pool.request()
              .input('processo_id', sql.Int, procId)
              .input('nome', sql.NVarChar, c.nome)
              .input('tipo', sql.NVarChar, c.tipo)
              .input('obrigatorio', sql.SmallInt, c.obrigatorio || 0)
              .input('opcoes', sql.NVarChar, c.opcoes || null)
              .input('ordem', sql.Int, c.ordem || 1)
              .query('INSERT INTO CamposProcesso (processo_id, nome, tipo, obrigatorio, opcoes, ordem) VALUES (@processo_id, @nome, @tipo, @obrigatorio, @opcoes, @ordem)');
          }
        }
      }

      // Cria as Tarefas se a etapa ainda não possuir tarefas com o mesmo título
      for (const t of procDef.tarefas) {
        const etapaIdAlvo = etapasIds[t.etapaIdx] || etapasIds[0];
        const respId = usuariosMap[t.responsavelEmail] || usuariosMap['miguelfilipemanso13@gmail.com'];

        const existeTarefa = await pool.request()
          .input('titulo', sql.NVarChar, t.titulo)
          .input('etapa_id', sql.Int, etapaIdAlvo)
          .query('SELECT id FROM Tarefas WHERE titulo = @titulo AND etapa_id = @etapa_id');

        if (existeTarefa.recordset.length === 0) {
          const insTar = await pool.request()
            .input('titulo', sql.NVarChar, t.titulo)
            .input('descricao', sql.NVarChar, t.descricao)
            .input('etapa_id', sql.Int, etapaIdAlvo)
            .input('responsavel_id', sql.Int, respId)
            .input('prazo', sql.NVarChar, t.prazo)
            .input('urgente', sql.SmallInt, t.urgente ? 1 : 0)
            .input('campos_personalizados', sql.NVarChar, JSON.stringify(t.campos || {}))
            .query('INSERT INTO Tarefas (titulo, descricao, etapa_id, responsavel_id, prazo, urgente, campos_personalizados) OUTPUT INSERTED.id VALUES (@titulo, @descricao, @etapa_id, @responsavel_id, @prazo, @urgente, @campos_personalizados)');

          const tarId = insTar.recordset[0]?.id;

          // Histórico inicial da tarefa
          if (tarId) {
            await pool.request()
              .input('tarefa_id', sql.Int, tarId)
              .input('usuario_id', sql.Int, respId)
              .input('descricao', sql.NVarChar, `Tarefa criada e atribuída a ${t.responsavelEmail.split('@')[0]}.`)
              .query('INSERT INTO Historico (tarefa_id, usuario_id, descricao) VALUES (@tarefa_id, @usuario_id, @descricao)');
          }
        }
      }
    }

    console.log('🎉 Banco de dados populado com sucesso com dados realistas para demonstração!');
    return true;
  } catch (err) {
    console.error('❌ Erro ao popular banco de dados:', err);
    throw err;
  }
}

if (require.main === module) {
  popularBanco()
    .then(() => {
      console.log('Finalizado com sucesso.');
      process.exit(0);
    })
    .catch(() => process.exit(1));
}

module.exports = { popularBanco };
