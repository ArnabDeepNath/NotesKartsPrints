const router = require("express").Router();
const {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getOrders,
  updateOrderStatus,
} = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");

router.use(authenticate, requireAdmin);

router.get("/stats", getStats);

// User management
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Order management
router.get("/orders", getOrders);
router.put("/orders/:id", updateOrderStatus);

module.exports = router;
