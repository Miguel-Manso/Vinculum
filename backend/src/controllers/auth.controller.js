const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');
async function cadastrar(req, res) {
  try {
    const { nome, email, senha } = req.body;
    if (!nome||!email||!senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
    const pool = await getPool();
    const existe = await pool.request().input('email', sql.NVarChar, email).query('SELECT id FROM Usuarios WHERE email = @email');
    if (existe.recordset.length > 0) return res.status(409).json({ error: 'Email já cadastrado' });
    const senha_hash = await bcrypt.hash(senha, 10);
    await pool.request().input('nome', sql.NVarChar, nome).input('email', sql.NVarChar, email).input('senha_hash', sql.NVarChar, senha_hash).query('INSERT INTO Usuarios (nome, email, senha_hash) VALUES (@nome, @email, @senha_hash)');
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso' });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
async function login(req, res) {
  try {
    const { email, senha } = req.body;
    if (!email||!senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    const pool = await getPool();
    const result = await pool.request().input('email', sql.NVarChar, email).query('SELECT * FROM Usuarios WHERE email = @email');
    const usuario = result.recordset[0];
    if (!usuario) return res.status(401).json({ error: 'Email ou senha incorretos' });
    const ok = await bcrypt.compare(senha, usuario.senha_hash);
    if (!ok) return res.status(401).json({ error: 'Email ou senha incorretos' });
    const perfil = usuario.perfil || (usuario.email === 'admin@vinculum.com' ? 'admin' : 'usuario');
    
    // Busca os setores vinculados a este usuário
    let setores = [];
    try {
      const setoresRes = await pool.request()
        .input('usuario_id', sql.Int, usuario.id)
        .query(`
          SELECT s.id, s.nome, s.cor, s.icone 
          FROM Setores s 
          JOIN UsuarioSetores us ON s.id = us.setor_id 
          WHERE us.usuario_id = @usuario_id 
          ORDER BY s.nome ASC
        `);
      setores = setoresRes.recordset || [];

      // Se for admin e ainda não tiver setores associados, busca todos os setores ativos
      if (setores.length === 0 && perfil === 'admin') {
        const todosSetores = await pool.request().query('SELECT id, nome, cor, icone FROM Setores ORDER BY nome ASC');
        setores = todosSetores.recordset || [];
      }
    } catch (setorErr) {
      console.error('Aviso: falha ao buscar setores no login:', setorErr.message);
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil },
      process.env.JWT_SECRET || 'vinculum_default_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil,
        setores
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
}
module.exports = { cadastrar, login };
