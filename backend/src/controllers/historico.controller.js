const { getPool, sql } = require('../config/db');

async function listarPorTarefa(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('tarefa_id', sql.Int, req.params.tarefa_id)
      .query(`SELECT h.*, u.nome AS usuario_nome
              FROM Historico h
              LEFT JOIN Usuarios u ON h.usuario_id = u.id
              WHERE h.tarefa_id = @tarefa_id
              ORDER BY h.criado_em DESC`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function registrar(req, res) {
  try {
    const { tarefa_id, descricao } = req.body;
    if (!tarefa_id || !descricao) return res.status(400).json({ error: 'tarefa_id e descricao são obrigatórios' });
    const pool = await getPool();
    await pool.request()
      .input('tarefa_id', sql.Int, tarefa_id)
      .input('usuario_id', sql.Int, req.usuario.id)
      .input('descricao', sql.NVarChar, descricao)
      .query('INSERT INTO Historico (tarefa_id, usuario_id, descricao) VALUES (@tarefa_id, @usuario_id, @descricao)');
    res.status(201).json({ mensagem: 'Histórico registrado com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listarPorTarefa, registrar };
