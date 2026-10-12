const { getPool, sql } = require('../config/db');

async function listarPorProcesso(req, res) {
  try {
    const processo_id = req.params.processo_id || req.params.id;
    const pool = await getPool();
    const result = await pool.request()
      .input('processo_id', sql.Int, processo_id)
      .query(`
        SELECT c.*, e.nome AS etapa_obrigatoria_nome
        FROM CamposProcesso c
        LEFT JOIN Etapas e ON c.etapa_obrigatoria_id = e.id
        WHERE c.processo_id = @processo_id
        ORDER BY c.ordem ASC, c.id ASC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listarTodos(req, res) {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT c.*, e.nome AS etapa_obrigatoria_nome, p.nome AS processo_nome
      FROM CamposProcesso c
      LEFT JOIN Etapas e ON c.etapa_obrigatoria_id = e.id
      JOIN Processos p ON c.processo_id = p.id
      ORDER BY p.nome, c.ordem ASC, c.id ASC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  try {
    const processo_id = req.params.processo_id || req.body.processo_id;
    const { nome, tipo, obrigatorio = false, etapa_obrigatoria_id = null, opcoes = null, ordem } = req.body;

    if (!processo_id) {
      return res.status(400).json({ error: 'O ID do processo é obrigatório' });
    }
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do campo é obrigatório' });
    }
    if (!tipo) {
      return res.status(400).json({ error: 'O tipo do campo é obrigatório' });
    }

    const pool = await getPool();

    let ordemDefinida = ordem;
    if (ordemDefinida === undefined || ordemDefinida === null) {
      const maxRes = await pool.request()
        .input('processo_id', sql.Int, processo_id)
        .query('SELECT ISNULL(MAX(ordem), 0) + 1 AS proximaOrdem FROM CamposProcesso WHERE processo_id = @processo_id');
      ordemDefinida = maxRes.recordset[0]?.proximaOrdem || 1;
    }

    const insertRes = await pool.request()
      .input('processo_id', sql.Int, processo_id)
      .input('nome', sql.NVarChar, nome.trim())
      .input('tipo', sql.NVarChar, tipo)
      .input('obrigatorio', sql.Bit, obrigatorio ? 1 : 0)
      .input('etapa_obrigatoria_id', sql.Int, etapa_obrigatoria_id ? parseInt(etapa_obrigatoria_id) : null)
      .input('opcoes', sql.NVarChar, opcoes ? (typeof opcoes === 'string' ? opcoes : JSON.stringify(opcoes)) : null)
      .input('ordem', sql.Int, ordemDefinida)
      .query(`
        INSERT INTO CamposProcesso (processo_id, nome, tipo, obrigatorio, etapa_obrigatoria_id, opcoes, ordem)
        OUTPUT INSERTED.*
        VALUES (@processo_id, @nome, @tipo, @obrigatorio, @etapa_obrigatoria_id, @opcoes, @ordem)
      `);

    res.status(201).json(insertRes.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function editar(req, res) {
  try {
    const { id } = req.params;
    const { nome, tipo, obrigatorio, etapa_obrigatoria_id, opcoes, ordem } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do campo é obrigatório' });
    }
    if (!tipo) {
      return res.status(400).json({ error: 'O tipo do campo é obrigatório' });
    }

    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar, nome.trim())
      .input('tipo', sql.NVarChar, tipo)
      .input('obrigatorio', sql.Bit, obrigatorio ? 1 : 0)
      .input('etapa_obrigatoria_id', sql.Int, etapa_obrigatoria_id ? parseInt(etapa_obrigatoria_id) : null)
      .input('opcoes', sql.NVarChar, opcoes ? (typeof opcoes === 'string' ? opcoes : JSON.stringify(opcoes)) : null)
      .input('ordem', sql.Int, ordem || 1)
      .query(`
        UPDATE CamposProcesso
        SET nome = @nome, tipo = @tipo, obrigatorio = @obrigatorio,
            etapa_obrigatoria_id = @etapa_obrigatoria_id, opcoes = @opcoes, ordem = @ordem
        OUTPUT INSERTED.*
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Campo personalizado não encontrado' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM CamposProcesso WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Campo não encontrado' });
    }

    res.json({ mensagem: 'Campo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listarPorProcesso, listarTodos, criar, editar, excluir };
