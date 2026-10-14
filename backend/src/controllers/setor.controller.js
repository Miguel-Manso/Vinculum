const { getPool, sql } = require('../config/db');

async function verificarAdmin(usuario, pool) {
  if (!usuario) return false;
  if (usuario.perfil === 'admin' || usuario.email === 'admin@vinculum.com') return true;
  if (usuario.id) {
    try {
      const r = await pool.request()
        .input('id', sql.Int, usuario.id)
        .query('SELECT perfil, email FROM Usuarios WHERE id = @id');
      const u = r.recordset?.[0];
      if (u && (u.perfil === 'admin' || u.email === 'admin@vinculum.com')) {
        usuario.perfil = 'admin';
        return true;
      }
    } catch {}
  }
  return false;
}

// GET /api/setores
// Admin visualiza todos os setores com contagem de processos e membros.
// Usuário comum visualiza apenas os setores aos quais tem vínculo em UsuarioSetores.
async function listar(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = await verificarAdmin(req.usuario, pool);
    const usuarioId = req.usuario?.id;

    let query = `
      SELECT s.*,
        (SELECT COUNT(*) FROM Processos p WHERE p.setor_id = s.id) AS total_processos,
        (SELECT COUNT(*) FROM UsuarioSetores us WHERE us.setor_id = s.id) AS total_membros
      FROM Setores s
    `;

    if (!isAdmin) {
      query += `
        WHERE s.id IN (SELECT us2.setor_id FROM UsuarioSetores us2 WHERE us2.usuario_id = @usuario_id)
      `;
    }

    query += ` ORDER BY s.nome ASC`;

    const request = pool.request();
    if (!isAdmin) {
      request.input('usuario_id', sql.Int, usuarioId);
    }

    const r = await request.query(query);
    res.json(r.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}


// GET /api/setores/:id
async function buscarPorId(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = await verificarAdmin(req.usuario, pool);
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    const r = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT s.*,
          (SELECT COUNT(*) FROM Processos p WHERE p.setor_id = s.id) AS total_processos,
          (SELECT COUNT(*) FROM UsuarioSetores us WHERE us.setor_id = s.id) AS total_membros
        FROM Setores s
        WHERE s.id = @id
      `);

    const setor = r.recordset[0];
    if (!setor) return res.status(404).json({ error: 'Setor não encontrado' });

    if (!isAdmin) {
      const acesso = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, id)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (acesso.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar este setor' });
      }
    }

    res.json(setor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// POST /api/setores (Restrito a Admin)
async function criar(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = await verificarAdmin(req.usuario, pool);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Apenas administradores podem criar setores' });
    }

    const { nome, descricao, cor = '#2fd9f4', icone = 'folder' } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do setor é obrigatório' });
    }

    const insertRes = await pool.request()
      .input('nome', sql.NVarChar, nome.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('cor', sql.NVarChar, cor || '#2fd9f4')
      .input('icone', sql.NVarChar, icone || 'folder')
      .query('INSERT INTO Setores (nome, descricao, cor, icone) OUTPUT INSERTED.id VALUES (@nome, @descricao, @cor, @icone)');

    const novoId = insertRes.recordset[0]?.id;

    // Vincula o criador/admin atual ao novo setor
    if (novoId && req.usuario?.id) {
      try {
        await pool.request()
          .input('usuario_id', sql.Int, req.usuario.id)
          .input('setor_id', sql.Int, novoId)
          .query('INSERT INTO UsuarioSetores (usuario_id, setor_id) VALUES (@usuario_id, @setor_id)');
      } catch {}
    }

    res.status(201).json({ mensagem: 'Setor criado com sucesso', id: novoId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT /api/setores/:id (Restrito a Admin)
async function editar(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = await verificarAdmin(req.usuario, pool);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Apenas administradores podem editar setores' });
    }

    const { id } = req.params;
    const { nome, descricao, cor, icone } = req.body;

    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do setor é obrigatório' });
    }

    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar, nome.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('cor', sql.NVarChar, cor || '#2fd9f4')
      .input('icone', sql.NVarChar, icone || 'folder')
      .query('UPDATE Setores SET nome = @nome, descricao = @descricao, cor = @cor, icone = @icone WHERE id = @id');

    if (r.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }

    res.json({ mensagem: 'Setor atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// DELETE /api/setores/:id (Restrito a Admin)
async function excluir(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = await verificarAdmin(req.usuario, pool);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Apenas administradores podem excluir setores' });
    }

    const { id } = req.params;

    // Verifica se é o único setor restante no sistema
    const totalSetores = await pool.request().query('SELECT COUNT(*) AS total FROM Setores');
    if (parseInt(totalSetores.recordset[0]?.total, 10) <= 1) {
      return res.status(400).json({ error: 'Não é possível excluir o único setor restante da empresa' });
    }

    // Desvincula processos deste setor (setor_id = NULL)
    await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE Processos SET setor_id = NULL WHERE setor_id = @id');

    // Remove registros da tabela associativa UsuarioSetores
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM UsuarioSetores WHERE setor_id = @id');

    const r = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Setores WHERE id = @id');

    if (r.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Setor não encontrado' });
    }

    res.json({ mensagem: 'Setor excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, editar, excluir };
