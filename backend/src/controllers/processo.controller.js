const { getPool, sql } = require('../config/db');

async function listar(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { setor_id } = req.query;

    let query = `
      SELECT p.*, 
        u.nome AS criado_por_nome,
        s.nome AS setor_nome,
        s.cor  AS setor_cor,
        s.icone AS setor_icone,
        (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS etapas,
        (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS tarefas
      FROM Processos p
      LEFT JOIN Usuarios u ON p.criado_por = u.id
      LEFT JOIN Setores  s ON p.setor_id = s.id
    `;

    const whereClauses = [];
    const request = pool.request();

    if (!isAdmin) {
      whereClauses.push(`p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)`);
      request.input('usuario_id', sql.Int, usuarioId);
    }

    if (setor_id) {
      whereClauses.push(`p.setor_id = @setor_id`);
      request.input('setor_id', sql.Int, parseInt(setor_id, 10));
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += ` ORDER BY p.criado_em DESC`;

    const r = await request.query(query);
    res.json(r.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function buscarPorId(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    const r = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT p.*, 
          u.nome AS criado_por_nome,
          s.nome AS setor_nome,
          s.cor  AS setor_cor,
          s.icone AS setor_icone,
          (SELECT COUNT(*) FROM Etapas e WHERE e.processo_id = p.id) AS etapas,
          (SELECT COUNT(*) FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE e.processo_id = p.id) AS tarefas
        FROM Processos p
        LEFT JOIN Usuarios u ON p.criado_por = u.id
        LEFT JOIN Setores  s ON p.setor_id = s.id
        WHERE p.id = @id
      `);

    const processo = r.recordset[0];
    if (!processo) return res.status(404).json({ error: 'Processo não encontrado' });

    // Se o usuário não for admin, valida acesso ao setor do processo
    if (!isAdmin) {
      if (!processo.setor_id) {
        return res.status(403).json({ error: 'Processo sem setor definido e restrito a administradores' });
      }

      const permissao = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, processo.setor_id)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (permissao.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar processos deste setor' });
      }
    }

    res.json(processo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  try {
    const { nome, descricao, setor_id, icone, criarEtapasPadrao = true } = req.body;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do processo é obrigatório' });
    }
    if (!setor_id) {
      return res.status(400).json({ error: 'O setor é obrigatório para cadastrar um processo' });
    }

    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const setorIdNum = parseInt(setor_id, 10);

    // Valida permissão do usuário no setor
    if (!isAdmin) {
      const temPermissao = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, setorIdNum)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (temPermissao.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para criar processos neste setor' });
      }
    }

    const insertRes = await pool.request()
      .input('nome', sql.NVarChar, nome.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('setor_id', sql.Int, setorIdNum)
      .input('criado_por', sql.Int, usuarioId)
      .input('icone', sql.NVarChar, icone?.trim() || null)
      .query('INSERT INTO Processos (nome, descricao, setor_id, criado_por, icone) OUTPUT INSERTED.id VALUES (@nome, @descricao, @setor_id, @criado_por, @icone)');
    
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function editar(req, res) {
  try {
    const { nome, descricao, setor_id, icone } = req.body;
    const { id } = req.params;
    if (!nome || !nome.trim()) {
      return res.status(400).json({ error: 'O nome do processo é obrigatório' });
    }

    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;

    // Busca processo atual para checagem de permissão
    const procAtual = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, setor_id FROM Processos WHERE id = @id');

    if (procAtual.recordset.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const processo = procAtual.recordset[0];

    if (!isAdmin) {
      // Valida se o usuário tem acesso ao setor original
      const permOrigem = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, processo.setor_id)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (permOrigem.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para editar processos deste setor' });
      }

      // Se mudou de setor, valida acesso ao novo setor
      if (setor_id && parseInt(setor_id, 10) !== processo.setor_id) {
        const permDestino = await pool.request()
          .input('usuario_id', sql.Int, usuarioId)
          .input('setor_id', sql.Int, parseInt(setor_id, 10))
          .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

        if (permDestino.recordset.length === 0) {
          return res.status(403).json({ error: 'Você não tem permissão para mover o processo para este novo setor' });
        }
      }
    }

    const finalSetorId = setor_id !== undefined ? (setor_id ? parseInt(setor_id, 10) : null) : processo.setor_id;

    const r = await pool.request()
      .input('id', sql.Int, id)
      .input('nome', sql.NVarChar, nome.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('setor_id', sql.Int, finalSetorId)
      .input('icone', sql.NVarChar, icone !== undefined ? (icone?.trim() || null) : null)
      .query('UPDATE Processos SET nome=@nome, descricao=@descricao, setor_id=@setor_id, icone=COALESCE(@icone, icone) WHERE id=@id');

    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const pool = await getPool();
    const id = req.params.id;
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;

    // Busca processo atual para verificar permissão
    const procAtual = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, setor_id FROM Processos WHERE id = @id');

    if (procAtual.recordset.length === 0) {
      return res.status(404).json({ error: 'Processo não encontrado' });
    }

    const processo = procAtual.recordset[0];

    if (!isAdmin) {
      const perm = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, processo.setor_id)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (perm.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir processos deste setor' });
      }
    }

    // Exclui tarefas vinculadas às etapas do processo antes
    await pool.request().input('id', sql.Int, id).query(`
      DELETE FROM Tarefas WHERE etapa_id IN (SELECT id FROM Etapas WHERE processo_id = @id)
    `);
    const r = await pool.request().input('id', sql.Int, id).query('DELETE FROM Processos WHERE id=@id');
    if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'Processo não encontrado' });
    res.json({ mensagem: 'Processo excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, buscarPorId, criar, editar, excluir };
