import jwt from 'jsonwebtoken';

// Middleware 1: check the user is logged in.
// Frontend sends: Authorization: Bearer <token>
// If token is valid, we attach req.user = { id, role } and call next().
export function requireLogin(req, res, next) {
  const header = req.headers.authorization || '';

  // Header must look like "Bearer eyJhbGciOi..."
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, please log in' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    // decoded is what we signed at login: { id, role }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token is invalid or expired' });
  }
}

// Middleware 2: check the user is a manager.
// Use AFTER requireLogin: requireLogin -> requireManager
export function requireManager(req, res, next) {
  if (req.user?.role !== 'manager') {
    return res.status(403).json({ message: 'Managers only' });
  }
  next();
}
