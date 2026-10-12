const { getPool, sql } = require('../config/db');

async function listarPorProcesso(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('processo_id', sql.Int, req.params.processo_id)
      .query('SELECT * FROM Etapas WHERE processo_id = @processo_id ORDER BY ordem');
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function criar(req, res) {
  try {
    const { nome, ordem, processo_id } = req.body;
    if (!nome || !processo_id) return res.status(400).json({ error: 'Nome e processo_id são obrigatórios' });
    const pool = await getPool();
    await pool.request()
      .input('nome', sql.NVarChar, nome)
      .input('ordem', sql.Int, ordem || 1)
      .input('processo_id', sql.Int, processo_id)
      .query('INSERT INTO Etapas (nome, ordem, processo_id) VALUES (@nome, @ordem, @processo_id)');
    res.status(201).json({ mensagem: 'Etapa criada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function reordenar(req, res) {
  try {
    const { etapas } = req.body; // [{ id, ordem }]
    if (!Array.isArray(etapas)) return res.status(400).json({ error: 'Array etapas é obrigatório' });
    const pool = await getPool();
    for (const e of etapas) {
      await pool.request()
        .input('id', sql.Int, e.id)
        .input('ordem', sql.Int, e.ordem)
        .query('UPDATE Etapas SET ordem = @ordem WHERE id = @id');
    }
    res.json({ mensagem: 'Etapas reordenadas com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function editar(req, res) {
  try {
    const { nome, ordem } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const pool = await getPool();
    const r = await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('nome', sql.NVarChar, nome)
      .input('ordem', sql.Int, ordem || 1)
      .query('UPDATE Etapas SET nome = @nome, ordem = @ordem WHERE id = @id');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Etapa não encontrada' });
    res.json({ mensagem: 'Etapa atualizada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function excluir(req, res) {
  try {
    const pool = await getPool();
    const id = req.params.id;
    // Exclui tarefas vinculadas à etapa primeiro
    await pool.request().input('id', sql.Int, id).query('DELETE FROM Tarefas WHERE etapa_id = @id');
    const r = await pool.request().input('id', sql.Int, id).query('DELETE FROM Etapas WHERE id = @id');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Etapa não encontrada' });
    res.json({ mensagem: 'Etapa excluída com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listarPorProcesso, criar, reordenar, editar, excluir };
