const express = require("express");
const router = express.Router();
const { authenticate, requireAdmin } = require("../middleware/auth");
const {
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");

// Public route - validate coupon
router.post("/validate", validateCoupon);

// Admin routes
router.get("/", authenticate, requireAdmin, getCoupons);
router.get("/:id", authenticate, requireAdmin, getCoupon);
router.post("/", authenticate, requireAdmin, createCoupon);
router.put("/:id", authenticate, requireAdmin, updateCoupon);
router.delete("/:id", authenticate, requireAdmin, deleteCoupon);

module.exports = router;
