const Razorpay = require("razorpay");
const crypto = require("crypto");
const prisma = require("../config/prisma");
const { AppError } = require("../middleware/errorHandler");

let razorpay;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/payment/create-razorpay-order
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!razorpay) {
      throw new AppError("Razorpay keys not configured", 500);
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        user: true,
      },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (order.userId !== req.user.id) throw new AppError("Access denied", 403);
    if (order.status !== "PENDING")
      throw new AppError("Order already processed", 400);

    const amountInPaise = Math.round(Number(order.total) * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: order.id,
      notes: { userId: req.user.id },
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Store Razorpay order ID
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: razorpayOrder.id },
      });
    } catch (err) {
      if (err.code === "P2022") {
        console.warn("[createRazorpayOrder] Schema missing, skipping razorpayOrderId update");
      } else throw err;
    }

    res.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID,
      user_name: order.user.name,
      user_email: order.user.email,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/verify
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    let order;
    try {
      order = await prisma.order.findFirst({
        where: { razorpayOrderId: razorpay_order_id },
      });
    } catch (err) {
      if (err.code === "P2022") {
        console.warn("[verifyPayment] Schema missing, fetching order from Razorpay API...");
        const rzpOrder = await razorpay.orders.fetch(razorpay_order_id);
        if (!rzpOrder || !rzpOrder.receipt) throw new AppError("Invalid Razorpay Order", 400);
        order = await prisma.order.findUnique({
          where: { id: rzpOrder.receipt },
        });
      } else {
        throw err;
      }
    }

    if (!order) throw new AppError("Order not found", 404);

    // Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      throw new AppError("Invalid payment signature", 400);
    }

    // Payment is valid
    try {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: "PAID",
          paymentId: razorpay_payment_id,
          paymentMethod: "razorpay",
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
        },
      });
    } catch (err) {
      if (err.code === "P2022") {
         console.warn("[verifyPayment] Schema missing, saving stripped payment payload");
         await prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
         });
      } else throw err;
    }

    res.json({ success: true, orderId: order.id, status: "PAID" });
  } catch (err) {
    next(err);
  }
};

// POST /api/payment/webhook (Optional: For server-side callback)
const razorpayWebhook = async (req, res, next) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(200).send("Webhook ignored (No secret)");

    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const paymentEntity = payload.payment.entity;
      const rzpOrderId = paymentEntity.order_id;
      
      if (rzpOrderId) {
        try {
          await prisma.order.updateMany({
            where: { razorpayOrderId: rzpOrderId, status: "PENDING" },
            data: {
              status: "PAID",
              paymentId: paymentEntity.id,
              paymentMethod: "razorpay",
              razorpayPaymentId: paymentEntity.id,
            },
          });
        } catch (err) {
          if (err.code === "P2022") {
             const receipt = payload.payment.entity.notes?.receipt || payload.order?.entity?.receipt;
             if (receipt) {
               await prisma.order.updateMany({
                 where: { id: receipt, status: "PENDING" },
                 data: { status: "PAID" },
               });
             }
          } else throw err;
        }
      }
    }

    // handle other events like payment.failed here if necessary...

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(500).json({ error: "Webhook Error" });
  }
};

module.exports = { createRazorpayOrder, verifyPayment, razorpayWebhook };
