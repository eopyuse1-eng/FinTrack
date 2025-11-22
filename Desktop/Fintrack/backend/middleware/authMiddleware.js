const jwt = require('jsonwebtoken');
const { User, ROLES } = require('../models/User');

/**
 * authMiddleware - Verifies JWT token and attaches user to request
 * Used on all protected routes
 * Frontend: Include token in Authorization header: "Authorization: Bearer <token>"
 * Token is stored in localStorage after login
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please login first.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Fetch user from database to ensure they still exist and are active
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive. Please login again.' });
    }

    // Attach user to request object for use in route handlers
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please login again.' });
    }
    res.status(500).json({ message: 'Authentication error' });
  }
};

/**
 * roleMiddleware - Restricts access based on user role (RBAC)
 * Usage: roleMiddleware([ROLES.ADMIN, ROLES.HR_HEAD])
 * Frontend: Display/hide UI elements based on user.role from token
 */
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware,
};
