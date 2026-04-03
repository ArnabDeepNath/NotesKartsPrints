const router = require("express").Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { authenticate } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/rbac");

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Protected Admin routes
router.use(authenticate, requireAdmin);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
