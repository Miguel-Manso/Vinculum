const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

async function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vinculum_default_secret_key');
    req.usuario = decoded;

    // Se o token antigo não tiver 'perfil', resolve a partir do banco para compatibilidade contínua
    if (!req.usuario.perfil && req.usuario.id) {
      try {
        const pool = await getPool();
        const r = await pool.request()
          .input('id', sql.Int, req.usuario.id)
          .query('SELECT perfil, email FROM Usuarios WHERE id = @id');
        if (r.recordset && r.recordset[0]) {
          req.usuario.perfil = r.recordset[0].perfil || (r.recordset[0].email === 'admin@vinculum.com' ? 'admin' : 'usuario');
        }
      } catch (errDb) {
        if (req.usuario.email === 'admin@vinculum.com') {
          req.usuario.perfil = 'admin';
        }
      }
    }

    next();
  } catch {
    res.status(403).json({ error: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;

