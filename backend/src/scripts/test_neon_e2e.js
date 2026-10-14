const { getPool, sql } = require('../config/db');

async function testE2E() {
  console.log('🧪 Iniciando Teste End-to-End de Integração com o Neon PostgreSQL...');

  try {
    const pool = await getPool();
    console.log('1. Pool obtido com sucesso!');

    // 1. Testa autenticação/usuário
    console.log('2. Testando consulta de usuários...');
    const usersRes = await pool.request().query('SELECT id, nome, email, perfil FROM Usuarios WHERE email = @email');
    // Note: sem input ele deve retornar vazio ou com input testar
    const userAdminRes = await pool.request()
      .input('email', sql.NVarChar, 'admin@vinculum.com')
      .query('SELECT id, nome, email, perfil FROM Usuarios WHERE email = @email');

    if (!userAdminRes.recordset || userAdminRes.recordset.length === 0) {
      throw new Error('Usuário admin não encontrado');
    }
    const admin = userAdminRes.recordset[0];
    console.log(`   ✅ Usuário verificado: ${admin.nome} (${admin.email}) [ID: ${admin.id}]`);

    // 2. Testa criação de processo com OUTPUT INSERTED.id
    console.log('3. Testando criação de processo com OUTPUT INSERTED.id -> RETURNING id...');
    const procInsert = await pool.request()
      .input('nome', sql.NVarChar, 'Processo Teste Neon E2E')
      .input('descricao', sql.NVarChar, 'Teste automático de integração')
      .input('criado_por', sql.Int, admin.id)
      .query('INSERT INTO Processos (nome, descricao, criado_por) OUTPUT INSERTED.id VALUES (@nome, @descricao, @criado_por)');

    const procId = procInsert.recordset[0]?.id;
    if (!procId) throw new Error('Falha ao obter ID do processo inserido');
    console.log(`   ✅ Processo criado com sucesso! [ID: ${procId}]`);

    // 3. Testa criação de etapa
    console.log('4. Testando criação de etapas associadas...');
    const etapaInsert = await pool.request()
      .input('nome', sql.NVarChar, 'Etapa Inicial')
      .input('ordem', sql.Int, 1)
      .input('processo_id', sql.Int, procId)
      .query('INSERT INTO Etapas (nome, ordem, processo_id) OUTPUT INSERTED.id VALUES (@nome, @ordem, @processo_id)');
    
    const etapaId = etapaInsert.recordset[0]?.id;
    console.log(`   ✅ Etapa criada com sucesso! [ID: ${etapaId}]`);

    // 4. Testa criação de tarefa
    console.log('5. Testando criação de tarefa...');
    await pool.request()
      .input('titulo', sql.NVarChar, 'Tarefa de Teste Neon')
      .input('descricao', sql.NVarChar, 'Validando persistência no banco em nuvem')
      .input('etapa_id', sql.Int, etapaId)
      .input('responsavel_id', sql.Int, admin.id)
      .input('prazo', sql.Date, '2026-12-31')
      .input('campos_personalizados', sql.NVarChar, JSON.stringify({ prioridade: 'Alta', cliente: 'Neon Test' }))
      .input('urgente', sql.Bit, 1)
      .query('INSERT INTO Tarefas (titulo, descricao, etapa_id, responsavel_id, prazo, campos_personalizados, urgente) VALUES (@titulo, @descricao, @etapa_id, @responsavel_id, @prazo, @campos_personalizados, @urgente)');

    console.log('   ✅ Tarefa criada com sucesso!');

    // 5. Testa listagem completa com JOINs e Subqueries
    console.log('6. Testando consulta complexa (JOIN + COUNT)...');
    const procDetails = await pool.request()
      .input('id', sql.Int, procId)
      .query(`
        SELECT p.*, u.nome AS criado_por_nome,
          (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS etapas,
          (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS tarefas
        FROM Processos p
        LEFT JOIN Usuarios u ON p.criado_por = u.id
        WHERE p.id = @id
      `);

    const p = procDetails.recordset[0];
    console.log(`   ✅ Consulta retornou com sucesso: "${p.nome}" | Etapas: ${p.etapas} | Tarefas: ${p.tarefas}`);

    // 6. Limpeza do registro de teste
    console.log('7. Limpando dados de teste (CASCADE)...');
    await pool.request()
      .input('id', sql.Int, procId)
      .query('DELETE FROM Processos WHERE id = @id');
    console.log('   ✅ Registro de teste removido com sucesso!');

    console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! A aplicação está 100% conectada e funcional com o Neon PostgreSQL!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ERRO NO TESTE E2E:', err);
    process.exit(1);
  }
}

testE2E();
