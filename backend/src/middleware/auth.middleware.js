const jwt = require('jsonwebtoken');
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });
  try { req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'vinculum_default_secret_key'); next(); }
  catch { res.status(403).json({ error: 'Token inválido ou expirado' }); }
}
module.exports = authMiddleware;
