// middleware/auth.js
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
};

const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user?.role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
};

module.exports = { requireAuth, requireAdmin };