const router = require("express").Router();
const {
  getStats,
  getAdminLoginLogs,
  getUsers,
  updateUser,
  deleteUser,
  getOrders,
  createOrderShipment,
  refreshOrderShipmentTracking,
  updateOrderStatus,
  getPrintJobs,
  updatePrintJob,
  updateAdminLoginLogLocation,
} = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");

router.use(authenticate, requireAdmin);

router.get("/stats", getStats);
router.get("/login-logs", getAdminLoginLogs);
router.put("/login-logs/:id/location", updateAdminLoginLogLocation);

// User management
router.get("/users", getUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Order management
router.get("/orders", getOrders);
router.post("/orders/:id/shiprocket", createOrderShipment);
router.post("/orders/:id/shiprocket/track", refreshOrderShipmentTracking);
router.put("/orders/:id", updateOrderStatus);

// Print Job management
router.get("/print-jobs", getPrintJobs);
router.put("/print-jobs/:id", updatePrintJob);

module.exports = router;
