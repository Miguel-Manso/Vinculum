const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');

async function listar(req, res) {
  try {
    const pool = await getPool();
    let result;
    try {
      result = await pool.request().query('SELECT id, nome, email, perfil, criado_em FROM Usuarios ORDER BY nome ASC');
    } catch (colErr) {
      result = await pool.request().query('SELECT id, nome, email, criado_em FROM Usuarios ORDER BY nome ASC');
      result.recordset = result.recordset.map(u => ({
        ...u,
        perfil: u.email === 'admin@vinculum.com' ? 'admin' : 'usuario'
      }));
    }

    const usuarios = result.recordset || [];

    // Busca os setores vinculados a cada usuário
    try {
      const setoresRes = await pool.request().query(`
        SELECT us.usuario_id, s.id, s.nome, s.cor, s.icone
        FROM UsuarioSetores us
        JOIN Setores s ON us.setor_id = s.id
        ORDER BY s.nome ASC
      `);

      const setoresPorUsuario = {};
      (setoresRes.recordset || []).forEach(row => {
        if (!setoresPorUsuario[row.usuario_id]) {
          setoresPorUsuario[row.usuario_id] = [];
        }
        setoresPorUsuario[row.usuario_id].push({
          id: row.id,
          nome: row.nome,
          cor: row.cor,
          icone: row.icone
        });
      });

      const usuariosComSetores = usuarios.map(u => ({
        ...u,
        setores: setoresPorUsuario[u.id] || []
      }));

      return res.json(usuariosComSetores);
    } catch (relErr) {
      console.error('Aviso ao carregar setores dos usuários:', relErr.message);
      return res.json(usuarios.map(u => ({ ...u, setores: [] })));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function criar(req, res) {
  try {
    const perfilLogado = req.usuario?.perfil || (req.usuario?.email === 'admin@vinculum.com' ? 'admin' : 'usuario');
    if (perfilLogado !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores podem criar novos usuários' });
    }

    const { nome, email, senha, perfil = 'usuario', setores_ids } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    }

    const pool = await getPool();
    const existe = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM Usuarios WHERE email = @email');

    if (existe.recordset.length > 0) {
      return res.status(409).json({ error: 'Email já cadastrado no sistema' });
    }

    const senha_hash = await bcrypt.hash(senha, 10);
    const perfilValido = perfil === 'admin' ? 'admin' : 'usuario';
    let novoUsuarioId = null;

    try {
      const insRes = await pool.request()
        .input('nome', sql.NVarChar, nome)
        .input('email', sql.NVarChar, email)
        .input('senha_hash', sql.NVarChar, senha_hash)
        .input('perfil', sql.NVarChar, perfilValido)
        .query('INSERT INTO Usuarios (nome, email, senha_hash, perfil) OUTPUT INSERTED.id VALUES (@nome, @email, @senha_hash, @perfil)');

      novoUsuarioId = insRes.recordset[0]?.id;
    } catch (insertErr) {
      const insRes = await pool.request()
        .input('nome', sql.NVarChar, nome)
        .input('email', sql.NVarChar, email)
        .input('senha_hash', sql.NVarChar, senha_hash)
        .query('INSERT INTO Usuarios (nome, email, senha_hash) OUTPUT INSERTED.id VALUES (@nome, @email, @senha_hash)');
      novoUsuarioId = insRes.recordset[0]?.id;
    }

    if (!novoUsuarioId) {
      const buscaId = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT id FROM Usuarios WHERE email = @email');
      novoUsuarioId = buscaId.recordset[0]?.id;
    }

    // Sincroniza setores do novo usuário
    if (novoUsuarioId) {
      let idsParaVincular = Array.isArray(setores_ids) ? setores_ids : [];

      // Se nenhum setor for enviado, vincula ao primeiro setor padrão disponível
      if (idsParaVincular.length === 0) {
        const setorPadrao = await pool.request().query('SELECT id FROM Setores ORDER BY id ASC');
        if (setorPadrao.recordset.length > 0) {
          idsParaVincular = [setorPadrao.recordset[0].id];
        }
      }

      for (const sId of idsParaVincular) {
        try {
          await pool.request()
            .input('usuario_id', sql.Int, novoUsuarioId)
            .input('setor_id', sql.Int, sId)
            .query('INSERT INTO UsuarioSetores (usuario_id, setor_id) VALUES (@usuario_id, @setor_id)');
        } catch {}
      }
    }

    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso', id: novoUsuarioId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function editar(req, res) {
  try {
    const perfilLogado = req.usuario?.perfil || (req.usuario?.email === 'admin@vinculum.com' ? 'admin' : 'usuario');
    if (perfilLogado !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores podem editar usuários' });
    }

    const { id } = req.params;
    const { nome, email, senha, perfil, setores_ids } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    }

    const pool = await getPool();

    // Verifica se o usuário existe
    const usuarioAtual = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id, email FROM Usuarios WHERE id = @id');

    if (usuarioAtual.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const targetUser = usuarioAtual.recordset[0];

    // Se for o admin inicial e tentar trocar perfil, impede lockout
    if (targetUser.email === 'admin@vinculum.com' && perfil && perfil !== 'admin') {
      return res.status(400).json({ error: 'O administrador principal (admin@vinculum.com) deve permanecer com perfil de admin' });
    }

    // Verifica se o email já está em uso por outro usuário
    const emailEmUso = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('id', sql.Int, id)
      .query('SELECT id FROM Usuarios WHERE email = @email AND id <> @id');

    if (emailEmUso.recordset.length > 0) {
      return res.status(409).json({ error: 'Este email já está sendo utilizado por outro usuário' });
    }

    const perfilValido = perfil === 'admin' ? 'admin' : 'usuario';

    // Atualiza dados cadastrais
    if (senha && senha.trim().length > 0) {
      const senha_hash = await bcrypt.hash(senha, 10);
      try {
        await pool.request()
          .input('id', sql.Int, id)
          .input('nome', sql.NVarChar, nome)
          .input('email', sql.NVarChar, email)
          .input('senha_hash', sql.NVarChar, senha_hash)
          .input('perfil', sql.NVarChar, perfilValido)
          .query('UPDATE Usuarios SET nome = @nome, email = @email, senha_hash = @senha_hash, perfil = @perfil WHERE id = @id');
      } catch (colErr) {
        await pool.request()
          .input('id', sql.Int, id)
          .input('nome', sql.NVarChar, nome)
          .input('email', sql.NVarChar, email)
          .input('senha_hash', sql.NVarChar, senha_hash)
          .query('UPDATE Usuarios SET nome = @nome, email = @email, senha_hash = @senha_hash WHERE id = @id');
      }
    } else {
      try {
        await pool.request()
          .input('id', sql.Int, id)
          .input('nome', sql.NVarChar, nome)
          .input('email', sql.NVarChar, email)
          .input('perfil', sql.NVarChar, perfilValido)
          .query('UPDATE Usuarios SET nome = @nome, email = @email, perfil = @perfil WHERE id = @id');
      } catch (colErr) {
        await pool.request()
          .input('id', sql.Int, id)
          .input('nome', sql.NVarChar, nome)
          .input('email', sql.NVarChar, email)
          .query('UPDATE Usuarios SET nome = @nome, email = @email WHERE id = @id');
      }
    }

    // Sincroniza setores se fornecido
    if (Array.isArray(setores_ids)) {
      await pool.request()
        .input('usuario_id', sql.Int, id)
        .query('DELETE FROM UsuarioSetores WHERE usuario_id = @usuario_id');

      for (const sId of setores_ids) {
        try {
          await pool.request()
            .input('usuario_id', sql.Int, id)
            .input('setor_id', sql.Int, sId)
            .query('INSERT INTO UsuarioSetores (usuario_id, setor_id) VALUES (@usuario_id, @setor_id)');
        } catch {}
      }
    }

    res.json({ mensagem: 'Usuário atualizado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function excluir(req, res) {
  try {
    const perfilLogado = req.usuario?.perfil || (req.usuario?.email === 'admin@vinculum.com' ? 'admin' : 'usuario');
    if (perfilLogado !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado: apenas administradores podem excluir usuários' });
    }

    const { id } = req.params;
    const idNum = parseInt(id, 10);

    if (idNum === req.usuario?.id) {
      return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário logado' });
    }

    const pool = await getPool();

    const usuarioAtual = await pool.request()
      .input('id', sql.Int, idNum)
      .query('SELECT id, email FROM Usuarios WHERE id = @id');

    if (usuarioAtual.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (usuarioAtual.recordset[0].email === 'admin@vinculum.com') {
      return res.status(400).json({ error: 'O administrador principal (admin@vinculum.com) não pode ser excluído' });
    }

    // Desvincula dependências em tarefas, histórico, setores e processos
    await pool.request().input('id', sql.Int, idNum).query(`
      UPDATE Tarefas SET responsavel_id = NULL WHERE responsavel_id = @id;
      UPDATE Historico SET usuario_id = NULL WHERE usuario_id = @id;
      UPDATE Processos SET criado_por = NULL WHERE criado_por = @id;
      DELETE FROM UsuarioSetores WHERE usuario_id = @id;
      DELETE FROM Usuarios WHERE id = @id;
    `);

    res.json({ mensagem: 'Usuário excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { listar, criar, editar, excluir };
