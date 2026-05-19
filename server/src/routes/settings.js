const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");
const {
  getAdminSettings,
  getPublicSettings,
  updateAdminSettings,
} = require("../controllers/settingsController");

router.get("/public", getPublicSettings);
router.get("/admin", authenticate, requireAdmin, getAdminSettings);
router.put("/admin", authenticate, requireAdmin, updateAdminSettings);

module.exports = router;
