const jwt = require('jsonwebtoken');
const env = require('../config/env');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.replace('Bearer ', '').trim()
    : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const checkRole = (roles = []) => (req, res, next) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!req.user || (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role))) {
    return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
  }
  return next();
};

module.exports = {
  verifyToken,
  checkRole,
};
