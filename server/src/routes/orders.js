const router = require("express").Router();
const { createOrder, getOrder } = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");
const { requireUser } = require("../middleware/rbac");

router.use(authenticate, requireUser);

router.post("/", createOrder);
router.get("/:id", getOrder);

module.exports = router;
