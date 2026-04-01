/**
 * Role-Based Access Control middleware factory.
 * Usage: requireRole('ADMIN') or requireRole('USER', 'ADMIN')
 */
const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(", ")}`,
      });
    }
    next();
  };

const requireAdmin = requireRole("ADMIN");
const requireUser = requireRole("USER", "ADMIN");

module.exports = { requireRole, requireAdmin, requireUser };
