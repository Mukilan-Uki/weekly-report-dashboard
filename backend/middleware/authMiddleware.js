import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  try {
    // Get token from header
    let token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;
