import jwt from 'jsonwebtoken';

// Middleware 1: check the user is logged in.
// Frontend sends: Authorization: Bearer <token>
// If valid, we attach req.user = { id, role } and call next().
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

// Middleware 2: allow only certain roles.
// Example: requireRole('manager', 'admin')
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Not allowed for your role' });
    }
    next();
  };
}

// Managers AND admins (admin can do everything a manager can).
export function requireManager(req, res, next) {
  if (req.user?.role !== 'manager' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Managers only' });
  }
  next();
}

// Admins only (e.g. deleting a category).
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admins only' });
  }
  next();
}
