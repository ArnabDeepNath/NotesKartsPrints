const router = require("express").Router();
const {
  createRazorpayOrder,
  razorpayWebhook,
  verifyPayment,
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");
const { requireUser } = require("../middleware/rbac");

// Webhook must be BEFORE authenticate
router.post("/webhook", razorpayWebhook);

router.use(authenticate, requireUser);
router.post("/create-razorpay-order", createRazorpayOrder);
router.post("/verify", verifyPayment);

module.exports = router;
