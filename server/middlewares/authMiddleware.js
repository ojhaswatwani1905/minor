import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'STSMS_SUPER_SECRET_KEY_2026';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;

      const role = (decoded.role || '').toLowerCase();
      const isAdmin = role.includes('admin') || role.includes('officer') || role.includes('coordinator') || role === 'super admin';
      if (isAdmin) {
        req.admin = decoded;
      } else {
        req.admin = null;
      }
      return next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};
