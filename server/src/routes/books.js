const router = require("express").Router();
const {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  createReview,
  getGenres,
} = require("../controllers/bookController");
const { authenticate, optionalAuth } = require("../middleware/auth");
const { requireAdmin, requireUser } = require("../middleware/rbac");

// Public
router.get("/", getBooks);
router.get("/genres", getGenres);
router.get("/:id", optionalAuth, getBook);

// User
router.post("/:id/reviews", authenticate, requireUser, createReview);

// Admin only
router.post("/", authenticate, requireAdmin, createBook);
router.put("/:id", authenticate, requireAdmin, updateBook);
router.delete("/:id", authenticate, requireAdmin, deleteBook);

module.exports = router;
