const { getPool, sql } = require('../config/db');

async function listarPorEtapa(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const etapaId = parseInt(req.params.etapa_id, 10);

    // Se não for admin, valida se o processo desta etapa pertence aos setores do usuário
    if (!isAdmin) {
      const permRes = await pool.request()
        .input('etapa_id', sql.Int, etapaId)
        .input('usuario_id', sql.Int, usuarioId)
        .query(`
          SELECT 1 
          FROM Etapas e 
          JOIN Processos p ON e.processo_id = p.id 
          WHERE e.id = @etapa_id 
            AND p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)
        `);

      if (permRes.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para visualizar tarefas desta etapa/setor' });
      }
    }

    const result = await pool.request()
      .input('etapa_id', sql.Int, etapaId)
      .query(`SELECT t.*, u.nome AS responsavel_nome,
                     CASE WHEN LOWER(e.nome) IN ('finalizado', 'finalizada', 'concluído', 'concluida') THEN 1 ELSE 0 END AS concluida
              FROM Tarefas t
              JOIN Etapas e ON t.etapa_id = e.id
              LEFT JOIN Usuarios u ON t.responsavel_id = u.id
              WHERE t.etapa_id = @etapa_id
              ORDER BY t.criado_em`);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function buscarPorId(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`SELECT t.*, u.nome AS responsavel_nome, e.nome AS etapa_nome, e.processo_id, 
                     p.nome AS processo_nome, p.setor_id, s.nome AS setor_nome, s.cor AS setor_cor,
                     CASE WHEN LOWER(e.nome) IN ('finalizado', 'finalizada', 'concluído', 'concluida') THEN 1 ELSE 0 END AS concluida
              FROM Tarefas t
              LEFT JOIN Usuarios u ON t.responsavel_id = u.id
              LEFT JOIN Etapas e ON t.etapa_id = e.id
              LEFT JOIN Processos p ON e.processo_id = p.id
              LEFT JOIN Setores s ON p.setor_id = s.id
              WHERE t.id = @id`);

    const tarefa = result.recordset[0];
    if (!tarefa) return res.status(404).json({ error: 'Tarefa não encontrada' });

    if (!isAdmin && tarefa.setor_id) {
      const perm = await pool.request()
        .input('usuario_id', sql.Int, usuarioId)
        .input('setor_id', sql.Int, tarefa.setor_id)
        .query('SELECT 1 FROM UsuarioSetores WHERE usuario_id = @usuario_id AND setor_id = @setor_id');

      if (perm.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para acessar tarefas deste setor' });
      }
    }

    res.json(tarefa);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function criar(req, res) {
  try {
    const { titulo, descricao, etapa_id, responsavel_id, prazo, campos_personalizados, urgente } = req.body;
    if (!titulo || !etapa_id) return res.status(400).json({ error: 'Título e etapa_id são obrigatórios' });
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const etapaIdNum = parseInt(etapa_id, 10);

    // Valida permissão do usuário no processo da etapa
    if (!isAdmin) {
      const permRes = await pool.request()
        .input('etapa_id', sql.Int, etapaIdNum)
        .input('usuario_id', sql.Int, usuarioId)
        .query(`
          SELECT 1 
          FROM Etapas e 
          JOIN Processos p ON e.processo_id = p.id 
          WHERE e.id = @etapa_id 
            AND p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)
        `);

      if (permRes.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para criar tarefas neste setor/processo' });
      }
    }

    const camposStr = campos_personalizados !== undefined && campos_personalizados !== null
      ? (typeof campos_personalizados === 'string' ? campos_personalizados : JSON.stringify(campos_personalizados))
      : null;
    const isUrgente = urgente === true || urgente === 1 || urgente === '1' || urgente === 'true';

    await pool.request()
      .input('titulo', sql.NVarChar, titulo.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('etapa_id', sql.Int, etapaIdNum)
      .input('responsavel_id', sql.Int, responsavel_id || null)
      .input('prazo', sql.Date, prazo || null)
      .input('campos_personalizados', sql.NVarChar, camposStr)
      .input('urgente', sql.Bit, isUrgente ? 1 : 0)
      .query('INSERT INTO Tarefas (titulo, descricao, etapa_id, responsavel_id, prazo, campos_personalizados, urgente) VALUES (@titulo, @descricao, @etapa_id, @responsavel_id, @prazo, @campos_personalizados, @urgente)');
    res.status(201).json({ mensagem: 'Tarefa criada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function editar(req, res) {
  try {
    const { titulo, descricao, responsavel_id, prazo, campos_personalizados, urgente } = req.body;
    if (!titulo || !titulo.trim()) return res.status(400).json({ error: 'Título é obrigatório' });
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    // Se não for admin, valida acesso à tarefa
    if (!isAdmin) {
      const permRes = await pool.request()
        .input('id', sql.Int, id)
        .input('usuario_id', sql.Int, usuarioId)
        .query(`
          SELECT 1 
          FROM Tarefas t
          JOIN Etapas e ON t.etapa_id = e.id
          JOIN Processos p ON e.processo_id = p.id
          WHERE t.id = @id
            AND p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)
        `);

      if (permRes.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para editar tarefas deste setor' });
      }
    }

    const camposStr = campos_personalizados !== undefined && campos_personalizados !== null
      ? (typeof campos_personalizados === 'string' ? campos_personalizados : JSON.stringify(campos_personalizados))
      : null;
    const isUrgente = urgente === true || urgente === 1 || urgente === '1' || urgente === 'true';

    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('titulo', sql.NVarChar, titulo.trim())
      .input('descricao', sql.NVarChar, descricao?.trim() || null)
      .input('responsavel_id', sql.Int, responsavel_id || null)
      .input('prazo', sql.Date, prazo || null)
      .input('campos_personalizados', sql.NVarChar, camposStr)
      .input('urgente', sql.Bit, isUrgente ? 1 : 0)
      .query('UPDATE Tarefas SET titulo=@titulo, descricao=@descricao, responsavel_id=@responsavel_id, prazo=@prazo, campos_personalizados=@campos_personalizados, urgente=@urgente WHERE id=@id');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json({ mensagem: 'Tarefa atualizada com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function moverEtapa(req, res) {
  try {
    const { etapa_id } = req.body;
    if (!etapa_id) return res.status(400).json({ error: 'etapa_id é obrigatório' });
    const pool = await getPool();

    // Busca etapa atual antes de mover (para registrar no histórico)
    const tarefaAtual = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query('SELECT t.etapa_id, e.nome AS etapa_nome FROM Tarefas t JOIN Etapas e ON t.etapa_id = e.id WHERE t.id = @id');

    if (!tarefaAtual.recordset[0]) return res.status(404).json({ error: 'Tarefa não encontrada' });

    // Se já estiver na mesma etapa, não altera e não cria histórico
    if (Number(tarefaAtual.recordset[0].etapa_id) === Number(etapa_id)) {
      return res.json({ mensagem: 'A tarefa já está nesta etapa', alterado: false });
    }

    const novaEtapa = await pool.request()
      .input('etapa_id', sql.Int, etapa_id)
      .query('SELECT nome FROM Etapas WHERE id = @etapa_id');

    if (!novaEtapa.recordset[0]) return res.status(404).json({ error: 'Etapa de destino não encontrada' });

    await pool.request()
      .input('id', sql.Int, req.params.id)
      .input('etapa_id', sql.Int, etapa_id)
      .query('UPDATE Tarefas SET etapa_id = @etapa_id WHERE id = @id');

    // Registra no histórico automaticamente apenas quando houver mudança de etapa
    const descricao = `Movida de "${tarefaAtual.recordset[0].etapa_nome}" para "${novaEtapa.recordset[0].nome}"`;
    await pool.request()
      .input('tarefa_id', sql.Int, req.params.id)
      .input('usuario_id', sql.Int, req.usuario.id)
      .input('descricao', sql.NVarChar, descricao)
      .query('INSERT INTO Historico (tarefa_id, usuario_id, descricao) VALUES (@tarefa_id, @usuario_id, @descricao)');

    res.json({ mensagem: 'Tarefa movida com sucesso', alterado: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function excluir(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { id } = req.params;

    if (!isAdmin) {
      const permRes = await pool.request()
        .input('id', sql.Int, id)
        .input('usuario_id', sql.Int, usuarioId)
        .query(`
          SELECT 1 
          FROM Tarefas t
          JOIN Etapas e ON t.etapa_id = e.id
          JOIN Processos p ON e.processo_id = p.id
          WHERE t.id = @id
            AND p.setor_id IN (SELECT us.setor_id FROM UsuarioSetores us WHERE us.usuario_id = @usuario_id)
        `);

      if (permRes.recordset.length === 0) {
        return res.status(403).json({ error: 'Você não tem permissão para excluir tarefas deste setor' });
      }
    }

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM Tarefas WHERE id = @id');
    if (result.rowsAffected[0] === 0) return res.status(404).json({ error: 'Tarefa não encontrada' });
    res.json({ mensagem: 'Tarefa excluída com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}

async function listarTodas(req, res) {
  try {
    const pool = await getPool();
    const isAdmin = req.usuario?.perfil === 'admin' || req.usuario?.email === 'admin@vinculum.com';
    const usuarioId = req.usuario?.id;
    const { setor_id } = req.query;

    let query = `
      SELECT t.*, e.nome AS etapa_nome, p.nome AS processo_nome, p.id AS processo_id,
             p.setor_id, s.nome AS setor_nome, s.cor AS setor_cor, s.icone AS setor_icone,
             u.nome AS responsavel_nome,
             CASE WHEN LOWER(e.nome) IN ('finalizado', 'finalizada', 'concluído', 'concluida') THEN 1 ELSE 0 END AS concluida
      FROM Tarefas t
      JOIN Etapas e ON t.etapa_id = e.id
      JOIN Processos p ON e.processo_id = p.id
      LEFT JOIN Setores s ON p.setor_id = s.id
      LEFT JOIN Usuarios u ON t.responsavel_id = u.id
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

    query += ` ORDER BY p.nome, e.ordem, t.criado_em`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) { res.status(500).json({ error: err.message }); }
}

module.exports = { listarPorEtapa, buscarPorId, criar, editar, moverEtapa, excluir, listarTodas };
