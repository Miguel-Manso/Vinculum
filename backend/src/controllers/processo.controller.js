const { getPool, sql } = require('../config/db');
async function listar(req, res) {
  try {
    const pool = await getPool();
    const r = await pool.request().query(`
      SELECT p.*, u.nome AS criado_por_nome,
        (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS etapas,
        (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS tarefas
      FROM Processos p
      LEFT JOIN Usuarios u ON p.criado_por = u.id
      ORDER BY p.criado_em DESC
    `);
    res.json(r.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function buscarPorId(req, res) {
  try {
    const pool = await getPool();
    const r = await pool.request().input('id', sql.Int, req.params.id).query(`
      SELECT p.*, u.nome AS criado_por_nome,
        (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS etapas,
        (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS tarefas
      FROM Processos p
      LEFT JOIN Usuarios u ON p.criado_por = u.id
      WHERE p.id = @id
    `);
    if (!r.recordset[0]) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json(r.recordset[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function criar(req, res) {
  try {
    const { nome, descricao, criarEtapasPadrao = true } = req.body;
    if (!nome) return res.status(400).json({ error: 'O nome do processo é obrigatório' });
    const pool = await getPool();
    const insertRes = await pool.request()
      .input('nome', sql.NVarChar, nome)
      .input('descricao', sql.NVarChar, descricao || null)
      .input('criado_por', sql.Int, req.usuario.id)
      .query('INSERT INTO Processos (nome, descricao, criado_por) OUTPUT INSERTED.id VALUES (@nome, @descricao, @criado_por)');
    
    const novoId = insertRes.recordset[0]?.id;
    if (criarEtapasPadrao && novoId) {
      const padroes = ['Em Andamento', 'Finalização'];
      for (let i = 0; i < padroes.length; i++) {
        await pool.request()
          .input('nome', sql.NVarChar, padroes[i])
          .input('ordem', sql.Int, i + 1)
          .input('processo_id', sql.Int, novoId)
          .query('INSERT INTO Etapas (nome, ordem, processo_id) VALUES (@nome, @ordem, @processo_id)');
      }
    }
    res.status(201).json({ mensagem: 'Processo criado com sucesso', id: novoId });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function editar(req, res) {
  try {
    const { nome, descricao } = req.body;
    if (!nome) return res.status(400).json({ error: 'O nome do processo é obrigatório' });
    const pool = await getPool();
    const r = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('nome', sql.NVarChar, nome)
      .input('descricao', sql.NVarChar, descricao || null)
      .query('UPDATE Processos SET nome=@nome, descricao=@descricao WHERE id=@id');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo atualizado com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function excluir(req, res) {
  try {
    const pool = await getPool();
    const id = req.params.id;
    // Exclui tarefas vinculadas às etapas do processo antes (para evitar erro de FK no SQL Server)
    await pool.request().input('id', sql.Int, id).query(`
      DELETE t FROM Tarefas t
      JOIN Etapas e ON t.etapa_id = e.id
      WHERE e.processo_id = @id
    `);
    const r = await pool.request().input('id', sql.Int, id).query('DELETE FROM Processos WHERE id=@id');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo excluído com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
module.exports = { listar, buscarPorId, criar, editar, excluir };
