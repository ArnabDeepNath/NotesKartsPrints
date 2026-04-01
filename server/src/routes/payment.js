const router = require("express").Router();
const {
  createCheckoutSession,
  stripeWebhook,
  verifyPayment,
} = require("../controllers/paymentController");
const { authenticate } = require("../middleware/auth");
const { requireUser } = require("../middleware/rbac");

// Webhook must be BEFORE authenticate (uses raw body, no auth)
router.post("/webhook", stripeWebhook);

router.use(authenticate, requireUser);
router.post("/create-checkout-session", createCheckoutSession);
router.get("/verify/:sessionId", verifyPayment);

module.exports = router;
