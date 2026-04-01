const router = require("express").Router();
const {
  getProfile,
  updateProfile,
  getUserOrders,
  getLibrary,
  getWishlist,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const { requireUser } = require("../middleware/rbac");

router.use(authenticate, requireUser);

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/orders", getUserOrders);
router.get("/library", getLibrary);
router.get("/wishlist", getWishlist);

module.exports = router;
