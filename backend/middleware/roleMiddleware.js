export const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}, but user has role: ${req.user.role}`,
      });
    }

    next();
  };
};

export default roleMiddleware;
