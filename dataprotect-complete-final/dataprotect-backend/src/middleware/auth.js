const jwt = require('jsonwebtoken');

function authenticateOptional(req, _res, next) {
  const h = req.headers['authorization'] || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      req.user = { id: String(payload.sub), role: payload.role || 'user' };
      return next();
    } catch {}
  }
  const id = req.headers['x-user-id'];
  const role = req.headers['x-user-role'] || 'user';
  if (id) req.user = { id: String(id), role: String(role) };
  return next();
}

function requireAuth(req, res, next) {
  authenticateOptional(req, res, () => {
    if (!req.user?.id) return res.status(401).json({ error: 'Unauthorized' });
    next();
  });
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    next();
  });
}

module.exports = { authenticateOptional, requireAuth, requireAdmin };
